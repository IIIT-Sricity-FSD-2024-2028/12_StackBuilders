const DEFAULT_API_BASE_URL = "http://127.0.0.1:3000";
const HR_ROLE = "HR";
const LOCAL_EMPLOYEE_KEY = "stackbuilders.hr.employees";
const LOCAL_EXPERT_KEY = "stackbuilders.hr.experts";
const LOCAL_PAYMENT_KEY = "stackbuilders.payments.v1";

function getApiBaseUrl() {
  return (import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/+$/, "");
}

async function request(path, options = {}) {
  const headers = new Headers(options.headers || {});
  headers.set("role", HR_ROLE);

  if (Object.prototype.hasOwnProperty.call(options, "json")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...options,
    headers,
    body: Object.prototype.hasOwnProperty.call(options, "json")
      ? JSON.stringify(options.json)
      : options.body,
  });
  const text = await response.text();
  let payload = null;

  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = text;
  }

  if (!response.ok) {
    const message = getErrorMessage(payload, response.status);
    throw new Error(message);
  }

  return payload;
}

const get = (path) => request(path);
const post = (path, json) => request(path, { method: "POST", json });
const put = (path, json) => request(path, { method: "PUT", json });
const remove = (path) => request(path, { method: "DELETE" });

const hrApi = {
  getEmployees: (context) => getDirectory("/employees", context, LOCAL_EMPLOYEE_KEY),
  getExperts: (context) => getDirectory("/experts", context, LOCAL_EXPERT_KEY),
  getChallenges: (context) => getCompanyScopedCollection("/challenges", context),
  getRewards: (context) => getCompanyScopedCollection("/rewards", context),
  getLiveSessions: (context) => getCompanyScopedCollection("/live-sessions", context),
  getVideos: (context) => getCompanyScopedCollection("/videos", context),
  // Subscription eligibility must come from the API; cached plans must never
  // authorize HR directory changes after the in-memory server has been reset.
  getSubscriptions: () => get("/subscriptions"),
  getPayments: () => getCollection("/subscriptions/payments", LOCAL_PAYMENT_KEY),
  createEmployee: (payload) => createDirectoryRecord("/employees", payload, LOCAL_EMPLOYEE_KEY),
  createExpert: (payload) => createDirectoryRecord("/experts", payload, LOCAL_EXPERT_KEY),
  createChallenge: (payload) => post("/challenges", payload),
  createReward: (payload) => post("/rewards", payload),
  saveSubscriptions: (payload) => put("/subscriptions/bulk", payload),
  savePayments: (payload) => saveCollection("/subscriptions/payments/bulk", payload, LOCAL_PAYMENT_KEY),
  deleteEmployee: (id) => deleteDirectoryRecord(`/employees/${encodeURIComponent(id)}`, id, LOCAL_EMPLOYEE_KEY),
  deleteExpert: (id) => deleteDirectoryRecord(`/experts/${encodeURIComponent(id)}`, id, LOCAL_EXPERT_KEY),
  deleteChallenge: (id) => remove(`/challenges/${encodeURIComponent(id)}`),
  deleteReward: (id) => remove(`/rewards/${encodeURIComponent(id)}`),
};

function buildCompanyQuery(context) {
  const params = new URLSearchParams();
  if (context?.companyId) params.set("companyId", context.companyId);
  if (context?.companyName) params.set("companyName", context.companyName);
  const query = params.toString();
  return query ? `?${query}` : "";
}

function getCompanyScopedCollection(path, context) {
  if (!context?.companyId && !context?.companyName) {
    return Promise.reject(new Error("Your HR account is not linked to a company. Ask an administrator to assign one before viewing company data."));
  }
  return get(`${path}${buildCompanyQuery(context)}`);
}

function getErrorMessage(payload, status) {
  const rawMessage = payload?.message;
  if (Array.isArray(rawMessage)) return rawMessage.join(" ");
  if (rawMessage && typeof rawMessage === "object") {
    return rawMessage.message || rawMessage.error || `Request failed with status ${status}.`;
  }
  return rawMessage || payload?.error || `Request failed with status ${status}.`;
}

function readLocalCollection(key) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocalCollection(key, records) {
  try {
    localStorage.setItem(key, JSON.stringify(Array.isArray(records) ? records : []));
  } catch {
    // The backend remains the source of truth when browser storage is unavailable.
  }
}

async function getDirectory(path, context, localKey) {
  const remoteRecords = await getCompanyScopedCollection(path, context);
  if (!Array.isArray(remoteRecords)) {
    throw new Error("The server returned an invalid directory response.");
  }

  // The server's in-memory records are authoritative. Replace the cached list
  // even when the server returns [], so records from an older session cannot
  // reappear in the HR dashboard.
  writeLocalCollection(localKey, remoteRecords);
  return remoteRecords;
}

async function getCollection(path, localKey) {
  const localRecords = readLocalCollection(localKey);
  try {
    const remoteRecords = await get(path);
    return Array.isArray(remoteRecords) && remoteRecords.length ? remoteRecords : localRecords;
  } catch {
    return localRecords;
  }
}

async function createDirectoryRecord(path, payload, localKey) {
  const created = await post(path, payload);
  if (created) {
    upsertLocalRecord(localKey, created);
  }
  return created;
}

async function deleteDirectoryRecord(path, id, localKey) {
  try {
    await remove(path);
  } catch (error) {
    if (!readLocalCollection(localKey).some((record) => record.id === id)) throw error;
  }
  writeLocalCollection(localKey, readLocalCollection(localKey).filter((record) => record.id !== id));
}

async function saveCollection(path, records, localKey) {
  writeLocalCollection(localKey, records);
  try {
    return await put(path, records);
  } catch {
    return records;
  }
}

function upsertLocalRecord(key, record) {
  if (!record) return;
  const records = readLocalCollection(key).filter((item) => item.id !== record.id);
  writeLocalCollection(key, [record, ...records]);
}

export default hrApi;
