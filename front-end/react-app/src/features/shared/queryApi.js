const DEFAULT_API_BASE_URL = "http://127.0.0.1:3000";
const QUERY_STORAGE_KEY = "stackbuilders.queries.v1";

function getApiBaseUrl() {
  return (import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/+$/, "");
}

function readLocalQueries() {
  try {
    const parsed = JSON.parse(localStorage.getItem(QUERY_STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocalQueries(queries) {
  try {
    localStorage.setItem(QUERY_STORAGE_KEY, JSON.stringify(queries));
  } catch {
    // The API result remains usable even if browser storage is unavailable.
  }
}

function saveLocalQuery(payload) {
  const query = {
    ...payload,
    id: `Q-${Date.now()}`,
    createdAt: Date.now(),
  };
  writeLocalQueries([query, ...readLocalQueries()]);
  return query;
}

async function create(payload) {
  const role = payload.userType || "Employee";
  try {
    const response = await fetch(`${getApiBaseUrl()}/queries`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        role,
      },
      body: JSON.stringify(payload),
    });
    const text = await response.text();
    let result = null;
    try {
      result = text ? JSON.parse(text) : null;
    } catch {
      result = text;
    }
    if (!response.ok) {
      const message = getResponseMessage(result, response.status);
      const requestError = new Error(message);
      requestError.status = response.status;
      throw requestError;
    }
    const saved = result || { ...payload, id: `Q-${Date.now()}`, createdAt: Date.now() };
    const localQueries = readLocalQueries().filter((query) => query.id !== saved.id);
    writeLocalQueries([saved, ...localQueries]);
    return saved;
  } catch (error) {
    // Keep the workflow usable when the backend is unavailable; the existing
    // supervisor query sync can upload the local record when the API is back.
    if (error instanceof TypeError || error.status === 429 || error.status >= 500 || error.message?.includes("Failed to fetch")) {
      return saveLocalQuery(payload);
    }
    throw error;
  }
}

function matchesUser(query, user) {
  const ids = [user?.id, user?.employeeId, user?.expertId, user?.hrId]
    .map((value) => String(value || "").trim())
    .filter(Boolean);
  const emails = [user?.email, user?.username]
    .map((value) => String(value || "").trim().toLowerCase())
    .filter(Boolean);
  return (query.userId && ids.includes(String(query.userId).trim()))
    || (query.userEmail && emails.includes(String(query.userEmail).trim().toLowerCase()));
}

async function getForUser(user, userType) {
  const localQueries = readLocalQueries();
  try {
    const response = await fetch(`${getApiBaseUrl()}/queries`, {
      headers: { role: userType || "Employee" },
    });
    if (!response.ok) throw new Error(`Request failed with status ${response.status}.`);
    const payload = await response.json();
    const remoteQueries = Array.isArray(payload) ? payload : [];
    const byId = new Map();
    [...localQueries, ...remoteQueries].forEach((query) => {
      if (query?.id) byId.set(query.id, { ...byId.get(query.id), ...query });
    });
    return [...byId.values()].filter((query) => matchesUser(query, user));
  } catch {
    return localQueries.filter((query) => matchesUser(query, user));
  }
}

async function markRead(id, userType) {
  const updateLocal = () => {
    const updated = readLocalQueries().map((query) => query.id === id
      ? { ...query, readBySender: true }
      : query);
    writeLocalQueries(updated);
  };
  try {
    const response = await fetch(`${getApiBaseUrl()}/queries/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", role: userType || "Employee" },
      body: JSON.stringify({ readBySender: true }),
    });
    const text = await response.text();
    const payload = text ? JSON.parse(text) : null;
    if (!response.ok) throw new Error(getResponseMessage(payload, response.status));
    updateLocal();
    return payload;
  } catch (error) {
    if (error instanceof TypeError || error.status === 429 || error.status >= 500 || error.message?.includes("Failed to fetch")) {
      updateLocal();
      return null;
    }
    throw error;
  }
}

function getResponseMessage(result, status) {
  const rawMessage = result?.message;
  if (Array.isArray(rawMessage)) return rawMessage.join(" ");
  if (rawMessage && typeof rawMessage === "object") {
    if (Array.isArray(rawMessage.message)) return rawMessage.message.join(" ");
    if (typeof rawMessage.message === "string") return rawMessage.message;
    if (typeof rawMessage.error === "string") return rawMessage.error;
  }
  if (typeof rawMessage === "string") return rawMessage;
  if (typeof result?.error === "string") return result.error;
  return `Request failed with status ${status}.`;
}

const queryApi = { create, getForUser, markRead };
export default queryApi;
