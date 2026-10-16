import {
  readChallenges,
  readLiveSessions,
  readRewards,
  readVideos,
} from "./storageServices.js";

const DEFAULT_API_BASE_URL = "http://127.0.0.1:3000";
const EMPLOYEE_ROLE = "Employee";

function getApiBaseUrl() {
  return (import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/+$/, "");
}

function withQuery(path, params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      search.set(key, String(value));
    }
  });
  const query = search.toString();
  return query ? `${path}?${query}` : path;
}

function getErrorMessage(value) {
  if (typeof value === "string" && value.trim()) return value;
  if (Array.isArray(value)) {
    const messages = value.map(getErrorMessage).filter(Boolean);
    return messages.length ? messages.join(" ") : "";
  }
  if (value && typeof value === "object") {
    return getErrorMessage(value.message) || getErrorMessage(value.error) || getErrorMessage(value.detail);
  }
  return "";
}

async function request(path, options = {}) {
  const headers = new Headers(options.headers || {});
  headers.set("role", EMPLOYEE_ROLE);

  const hasJsonBody = Object.prototype.hasOwnProperty.call(options, "json");
  if (hasJsonBody) headers.set("Content-Type", "application/json");

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...options,
    headers,
    body: hasJsonBody ? JSON.stringify(options.json) : options.body,
  });

  const text = await response.text();
  let payload = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  if (!response.ok) {
    const message = getErrorMessage(payload) || `Request failed with status ${response.status}.`;
    const error = new Error(message);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

const get = (path, params) => request(withQuery(path, params));
const post = (path, json) => request(path, { method: "POST", json });
const getWithLocalFallback = (path, company, fallbackReader) =>
  get(path, company).catch(() => fallbackReader(company || {}));

export const employeeApi = {
  getExperts: (company) => get("/experts", company),
  getChallenges: (company) => getWithLocalFallback("/challenges", company, readChallenges),
  getRewards: (company) => getWithLocalFallback("/rewards", company, readRewards),
  getLiveSessions: (company) => getWithLocalFallback("/live-sessions", company, readLiveSessions),
  getVideos: (company) => getWithLocalFallback("/videos", company, readVideos),
  getConsultations: (employee, company) =>
    get("/consultations", { ...company, employeeId: employee?.id }),
  createConsultation: (payload) => post("/consultations", payload),
  bookConsultationSlot: (payload) => post("/consultations/book-slot", payload),
  claimReward: (rewardId, employeeId) =>
    post(`/rewards/${encodeURIComponent(rewardId)}/claim`, { employeeId }),
  getCheckins: (employee, company, checkinType) =>
    get("/wellness-checkins", {
      ...company,
      employeeId: employee?.id,
      checkinType,
    }),
  createCheckin: (payload) => post("/wellness-checkins", payload),
  getCheckinResponses: (company, checkinId, employeeId) =>
    get("/checkin-responses", { ...company, checkinId, employeeId }),
};

export default employeeApi;
