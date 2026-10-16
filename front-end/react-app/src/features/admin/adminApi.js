const DEFAULT_API_BASE_URL = "http://127.0.0.1:3000";
const ADMIN_ROLE = "Admin";

function getApiBaseUrl() {
  return (import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/+$/, "");
}

async function request(path, options = {}) {
  const headers = new Headers(options.headers || {});
  headers.set("role", ADMIN_ROLE);

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
  const payload = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const detail = payload?.message ?? payload?.error;
    const message = Array.isArray(detail)
      ? detail.map((item) => typeof item === "string" ? item : item?.message).filter(Boolean).join(" ")
      : typeof detail === "string" ? detail
        : detail?.message || `Request failed with status ${response.status}.`;
    throw new Error(message);
  }

  return payload;
}

const adminApi = {
  request,
  getUsers: () => request("/employees"),
  createEmployee: (payload) => request("/employees", { method: "POST", json: payload }),
  deleteEmployee: (id) => request(`/employees/${encodeURIComponent(id)}`, { method: "DELETE" }),
  getCompanies: () => request("/companies"),
  createCompany: (payload) => request("/companies", { method: "POST", json: payload }),
  createCompanyWithHr: (payload) => request("/companies/with-hr", { method: "POST", json: payload }),
  deleteCompany: (id) => request(`/companies/${encodeURIComponent(id)}`, { method: "DELETE" }),
  getExperts: () => request("/experts"),
  createExpert: (payload) => request("/experts", { method: "POST", json: payload }),
  deleteExpert: (id) => request(`/experts/${encodeURIComponent(id)}`, { method: "DELETE" }),
  getHrProfiles: () => request("/hr-profiles"),
  createHrProfile: (payload) => request("/hr-profiles", { method: "POST", json: payload }),
  deleteHrProfile: (id) => request(`/hr-profiles/${encodeURIComponent(id)}`, { method: "DELETE" }),
  getChallenges: () => request("/challenges"),
  getRewards: () => request("/rewards"),
  getConsultations: () => request("/consultations"),
  getCheckins: () => request("/wellness-checkins"),
  getLiveSessions: () => request("/live-sessions"),
  getVideos: () => request("/videos"),
  getSubscriptions: () => request("/subscriptions"),
  getPayments: () => request("/subscriptions/payments"),
  getPermissions: (group) => request(`/role-permissions/${encodeURIComponent(group)}`),
  updatePermissions: (group, permissions) => request(`/role-permissions/${encodeURIComponent(group)}`, { method: "PUT", json: { permissions } }),
  resetPermissions: (group) => request(`/role-permissions/${encodeURIComponent(group)}`, { method: "DELETE" }),
};

export default adminApi;
