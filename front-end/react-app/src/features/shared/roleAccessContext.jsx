import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  makeDefaultRolePermissions,
  ROLE_ACCESS_ACTIONS,
  ROLE_ACCESS_RESOURCES,
} from "./roleAccessConfig.js";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:3000").replace(/\/+$/, "");
const CACHE_PREFIX = "stack-builders-permissions-";
const CHANGE_EVENT = "stackbuilders:role-permissions-changed";
const RoleAccessContext = createContext(null);

function readCachedPermissions(group) {
  try {
    const stored = JSON.parse(window.localStorage.getItem(`${CACHE_PREFIX}${group}`) || "{}");
    return { ...makeDefaultRolePermissions(), ...(stored && typeof stored === "object" ? stored : {}) };
  } catch {
    return makeDefaultRolePermissions();
  }
}

export function cacheRolePermissions(group, permissions) {
  const normalized = { ...makeDefaultRolePermissions(), ...(permissions || {}) };
  try {
    const key = `${CACHE_PREFIX}${group}`;
    const serialized = JSON.stringify(normalized);
    if (window.localStorage.getItem(key) !== serialized) window.localStorage.setItem(key, serialized);
  } catch {
    // The server remains the source of truth if browser storage is unavailable.
  }
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: { group, permissions: normalized } }));
  return normalized;
}

async function fetchPermissions(group, role) {
  const response = await fetch(`${API_BASE_URL}/role-permissions/${encodeURIComponent(group)}`, {
    headers: { role },
  });
  const text = await response.text();
  let payload = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = null;
  }
  if (!response.ok) {
    const message = payload?.message;
    throw new Error(typeof message === "string" ? message : message?.message || `Could not load permissions (${response.status}).`);
  }
  return payload?.permissions && typeof payload.permissions === "object"
    ? payload.permissions
    : makeDefaultRolePermissions();
}

export function RolePermissionsProvider({ group, role, children }) {
  const mountedRef = useRef(false);
  const [permissions, setPermissions] = useState(() => readCachedPermissions(group));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const result = await fetchPermissions(group, role);
      if (!mountedRef.current) return;
      const next = cacheRolePermissions(group, result);
      setPermissions(next);
      setError("");
    } catch (requestError) {
      if (!mountedRef.current) return;
      setError(requestError.message || "Could not refresh role permissions.");
      setPermissions(readCachedPermissions(group));
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [group, role]);

  useEffect(() => {
    let active = true;
    mountedRef.current = true;
    const refreshIfActive = (showLoading = false) => {
      if (!active) return Promise.resolve();
      return refresh(showLoading);
    };
    void refreshIfActive(true);

    const intervalId = window.setInterval(() => {
      if (document.visibilityState !== "hidden") void refreshIfActive();
    }, 15_000);
    const onFocus = () => void refreshIfActive();
    const onStorage = (event) => {
      if (event.key !== `${CACHE_PREFIX}${group}`) return;
      setPermissions(readCachedPermissions(group));
      void refreshIfActive();
    };
    const onPermissionChange = (event) => {
      if (event.detail?.group !== group) return;
      setPermissions(event.detail.permissions || readCachedPermissions(group));
    };
    const onVisibility = () => {
      if (document.visibilityState !== "hidden") void refreshIfActive();
    };

    window.addEventListener("focus", onFocus);
    window.addEventListener("storage", onStorage);
    window.addEventListener(CHANGE_EVENT, onPermissionChange);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      active = false;
      mountedRef.current = false;
      window.clearInterval(intervalId);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(CHANGE_EVENT, onPermissionChange);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [group, refresh]);

  const value = useMemo(() => ({
    permissions,
    loading,
    error,
    refresh: () => refresh(true),
    hasPermission: (key) => Object.prototype.hasOwnProperty.call(permissions, key) ? Boolean(permissions[key]) : true,
    hasAnyPermission: (keys) => keys.some((key) => Object.prototype.hasOwnProperty.call(permissions, key) ? Boolean(permissions[key]) : true),
  }), [permissions, loading, error, refresh]);

  return <RoleAccessContext.Provider value={value}>{children}</RoleAccessContext.Provider>;
}

export function useRoleAccess() {
  const context = useContext(RoleAccessContext);
  if (!context) throw new Error("useRoleAccess must be used inside RolePermissionsProvider.");
  return context;
}

export function RolePermissionGate({ permission, anyOf, children }) {
  const { hasPermission, hasAnyPermission, loading, refresh } = useRoleAccess();
  const allowed = permission ? hasPermission(permission) : Array.isArray(anyOf) ? hasAnyPermission(anyOf) : true;
  if (loading) return <main className="role-access-state" role="status">Loading access settings…</main>;
  if (!allowed) {
    return (
      <main className="role-access-state" role="alert">
        <span className="role-access-lock"><i className="fa-solid fa-lock" aria-hidden="true" /></span>
        <h1>Access Restricted</h1>
        <p>This page is currently unavailable for your role.</p>
        <button type="button" onClick={refresh}>Refresh access</button>
      </main>
    );
  }
  return children;
}

export function getRoleAccessDefaultKeys(group) {
  return [...new Set(
    (ROLE_ACCESS_RESOURCES[group] || []).flatMap(([, prefix]) =>
      ROLE_ACCESS_ACTIONS.map((action) => `${prefix}-${action.toLowerCase()}`),
    ),
  )];
}
