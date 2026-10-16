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
    throw new Error(payload?.message || payload?.error || `Request failed with status ${response.status}.`);
  }

  return payload;
}

const adminApi = {
  request,
  getUsers: () => request("/employees"),
  getCompanies: () => request("/companies"),
  getPermissions: (group) => request(`/role-permissions/${encodeURIComponent(group)}`),
};

export default adminApi;
