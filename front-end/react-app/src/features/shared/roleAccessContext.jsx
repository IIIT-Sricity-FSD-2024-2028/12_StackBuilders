import { createContext, useCallback, useContext, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchRolePermissions, permissionsCached, readCachedPermissions } from "./roleAccessSlice.js";
import { ROLE_ACCESS_ACTIONS, ROLE_ACCESS_RESOURCES } from "./roleAccessConfig.js";

const CACHE_PREFIX = "stack-builders-permissions-";
const CHANGE_EVENT = "stackbuilders:role-permissions-changed";
const RoleGroupContext = createContext(null);

export function RolePermissionsProvider({ group, role = "Admin", children }) {
  const dispatch = useDispatch();
  const entry = useSelector((state) => state.roleAccess.groups[group]);

  const refresh = useCallback((showLoading = false) => dispatch(fetchRolePermissions({ group, role, showLoading })), [dispatch, group, role]);

  useEffect(() => {
    let active = true;
    const refreshIfActive = () => { if (active) void refresh(); };
    dispatch(permissionsCached({ group, permissions: readCachedPermissions(group) }));
    void refresh(true);
    const intervalId = window.setInterval(() => {
      if (document.visibilityState !== "hidden") refreshIfActive();
    }, 60_000);
    const onStorage = (event) => {
      if (event.key !== `${CACHE_PREFIX}${group}`) return;
      dispatch(permissionsCached({ group, permissions: readCachedPermissions(group) }));
      refreshIfActive();
    };
    const onPermissionChange = (event) => {
      if (event.detail?.group === group) dispatch(permissionsCached({ group, permissions: event.detail.permissions || readCachedPermissions(group) }));
    };
    const onVisibility = () => { if (document.visibilityState !== "hidden") refreshIfActive(); };
    window.addEventListener("focus", refreshIfActive);
    window.addEventListener("storage", onStorage);
    window.addEventListener(CHANGE_EVENT, onPermissionChange);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      active = false;
      window.clearInterval(intervalId);
      window.removeEventListener("focus", refreshIfActive);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(CHANGE_EVENT, onPermissionChange);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [dispatch, group, refresh]);

  return <RoleGroupContext.Provider value={{ group, role }}>{children}</RoleGroupContext.Provider>;
}

export function useRoleAccess(explicitGroup) {
  const dispatch = useDispatch();
  const context = useContext(RoleGroupContext);
  const group = explicitGroup || context?.group;
  const role = context?.role || "Admin";
  if (!group) throw new Error("useRoleAccess must be used inside RolePermissionsProvider.");
  const entry = useSelector((state) => state.roleAccess.groups[group]);
  const permissions = entry?.permissions || readCachedPermissions(group);
  const hasPermission = useCallback((key) => Object.prototype.hasOwnProperty.call(permissions, key) ? Boolean(permissions[key]) : true, [permissions]);
  const hasAnyPermission = useCallback((keys) => keys.some((key) => Object.prototype.hasOwnProperty.call(permissions, key) ? Boolean(permissions[key]) : true), [permissions]);
  const refresh = useCallback(() => dispatch(fetchRolePermissions({ group, role, showLoading: true })), [dispatch, group, role]);
  return { permissions, loading: entry?.status === "loading" || !entry, error: entry?.error || "", hasPermission, hasAnyPermission, refresh };
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
  return [...new Set((ROLE_ACCESS_RESOURCES[group] || []).flatMap(([, prefix]) => ROLE_ACCESS_ACTIONS.map((action) => `${prefix}-${action.toLowerCase()}`)))];
}
