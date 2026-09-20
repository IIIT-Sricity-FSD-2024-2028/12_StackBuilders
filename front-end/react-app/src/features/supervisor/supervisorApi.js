const DEFAULT_API_BASE_URL = "http://127.0.0.1:3000";
const ADMIN_ROLE = "Admin";

function getApiBaseUrl() {
  return (import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/+$/, "");
}

async function request(path, options = {}) {
  const headers = new Headers(options.headers || {});
  headers.set("role", ADMIN_ROLE);
  if (Object.prototype.hasOwnProperty.call(options, "json")) headers.set("Content-Type", "application/json");
  const response = await fetch(`${getApiBaseUrl()}${path}`, { ...options, headers, body: Object.prototype.hasOwnProperty.call(options, "json") ? JSON.stringify(options.json) : options.body });
  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;
  if (!response.ok) throw new Error(payload?.message || payload?.error || `Request failed with status ${response.status}.`);
  return payload;
}

const get = (path) => request(path);
const post = (path, json) => request(path, { method: "POST", json });
const patch = (path, json) => request(path, { method: "PATCH", json });

const supervisorApi = {
  async loadWorkspace() {
    const [companies, employees, experts, hrProfiles, requests, queries, subscriptions, payments, consultations, liveSessions, videos, challenges, rewards] = await Promise.all([
      get("/companies"), get("/employees"), get("/experts"), get("/hr-profiles"), get("/company-onboarding-requests"), get("/queries"), get("/subscriptions"), get("/subscriptions/payments"), get("/consultations"), get("/live-sessions"), get("/videos"), get("/challenges"), get("/rewards"),
    ]);
    return { companies, employees, experts, hrProfiles, requests, queries, subscriptions, payments, consultations, liveSessions, videos, challenges, rewards };
  },
  createCompany: (payload) => post("/companies", payload),
  approveRequest: (id) => post(`/company-onboarding-requests/${encodeURIComponent(id)}/approve`),
  createEmployee: (payload) => post("/employees", payload),
  createExpert: (payload) => post("/experts", payload),
  createHrProfile: (payload) => post("/hr-profiles", payload),
  updateQuery: (id, payload) => patch(`/queries/${encodeURIComponent(id)}`, payload),
  getPermissions: (group) => get(`/role-permissions/${encodeURIComponent(group)}`),
  updatePermissions: (group, permissions) => request(`/role-permissions/${encodeURIComponent(group)}`, { method: "PUT", json: { permissions } }),
};

export default supervisorApi;
