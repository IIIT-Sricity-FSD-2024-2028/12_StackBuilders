import adminApi from "../admin/adminApi.js";
import supervisorApi from "../supervisor/supervisorApi.js";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:3000").replace(/\/+$/, "");

function actorApi(role) {
  if (role === "Admin") return adminApi;
  if (role === "Supervisor") return supervisorApi;
  return null;
}

async function request(group, role, options = {}) {
  const response = await fetch(`${API_BASE_URL}/role-permissions/${encodeURIComponent(group)}`, {
    ...options,
    headers: { ...(options.headers || {}), role, ...(options.json ? { "Content-Type": "application/json" } : {}) },
    ...(options.json ? { body: JSON.stringify(options.json) } : {}),
  });
  const text = await response.text();
  let payload = null;
  try { payload = text ? JSON.parse(text) : null; } catch { payload = null; }
  if (!response.ok) {
    const detail = payload?.message;
    throw new Error(typeof detail === "string" ? detail : detail?.message || `Could not load permissions (${response.status}).`);
  }
  return payload;
}

const roleAccessApi = {
  get: (group, role) => actorApi(role)?.getPermissions(group) || request(group, role),
  update: (group, role, permissions) => actorApi(role)?.updatePermissions(group, permissions) || request(group, role, { method: "PUT", json: { permissions } }),
  reset: (group, role) => actorApi(role)?.resetPermissions(group) || request(group, role, { method: "DELETE" }),
};

export default roleAccessApi;
