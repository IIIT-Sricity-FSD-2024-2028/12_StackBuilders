import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import roleAccessApi from "./roleAccessApi.js";
import { makeDefaultRolePermissions } from "./roleAccessConfig.js";

const CACHE_PREFIX = "stack-builders-permissions-";

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
  } catch { /* The API remains the source of truth when browser storage is unavailable. */ }
  window.dispatchEvent(new CustomEvent("stackbuilders:role-permissions-changed", { detail: { group, permissions: normalized } }));
  return normalized;
}

export const fetchRolePermissions = createAsyncThunk("roleAccess/fetch", async ({ group, role = "Admin" }, { rejectWithValue }) => {
  try {
    const result = await roleAccessApi.get(group, role);
    return { group, permissions: result?.permissions || makeDefaultRolePermissions() };
  } catch (error) { return rejectWithValue({ group, message: error.message }); }
});

export const saveRolePermissions = createAsyncThunk("roleAccess/save", async ({ group, role = "Admin", permissions }, { rejectWithValue }) => {
  try {
    const result = await roleAccessApi.update(group, role, permissions);
    const saved = result?.permissions || permissions;
    cacheRolePermissions(group, saved);
    return { group, permissions: saved };
  } catch (error) { return rejectWithValue({ group, message: error.message }); }
});

export const resetRolePermissions = createAsyncThunk("roleAccess/reset", async ({ group, role = "Admin" }, { rejectWithValue }) => {
  try {
    const result = await roleAccessApi.reset(group, role);
    const permissions = result?.permissions || makeDefaultRolePermissions();
    cacheRolePermissions(group, permissions);
    return { group, permissions };
  } catch (error) { return rejectWithValue({ group, message: error.message }); }
});

const roleAccessSlice = createSlice({
  name: "roleAccess",
  initialState: { groups: {} },
  reducers: {
    permissionsCached(state, action) {
      const { group, permissions } = action.payload;
      state.groups[group] = { permissions, status: "succeeded", error: "" };
    },
  },
  extraReducers(builder) {
    builder
      .addCase(fetchRolePermissions.pending, (state, action) => {
        const { group, showLoading = true } = action.meta.arg;
        // A background permission check must keep the current workspace mounted.
        if (!showLoading && state.groups[group]) return;
        state.groups[group] = { ...state.groups[group], permissions: state.groups[group]?.permissions || readCachedPermissions(group), status: "loading", error: "" };
      })
      .addCase(fetchRolePermissions.fulfilled, (state, action) => {
        const { group, permissions } = action.payload;
        state.groups[group] = { permissions, status: "succeeded", error: "" };
      })
      .addCase(fetchRolePermissions.rejected, (state, action) => {
        const { group, message } = action.payload || {};
        if (group) state.groups[group] = { permissions: state.groups[group]?.permissions || readCachedPermissions(group), status: "failed", error: message || action.error.message };
      })
      .addCase(saveRolePermissions.pending, (state, action) => { state.groups[action.meta.arg.group] = { ...state.groups[action.meta.arg.group], status: "saving", error: "" }; })
      .addCase(saveRolePermissions.fulfilled, (state, action) => { state.groups[action.payload.group] = { permissions: action.payload.permissions, status: "succeeded", error: "" }; })
      .addCase(saveRolePermissions.rejected, (state, action) => {
        const { group, message } = action.payload || {};
        if (group) state.groups[group] = { ...state.groups[group], status: "failed", error: message || action.error.message };
      })
      .addCase(resetRolePermissions.pending, (state, action) => { state.groups[action.meta.arg.group] = { ...state.groups[action.meta.arg.group], status: "saving", error: "" }; })
      .addCase(resetRolePermissions.fulfilled, (state, action) => { state.groups[action.payload.group] = { permissions: action.payload.permissions, status: "succeeded", error: "" }; })
      .addCase(resetRolePermissions.rejected, (state, action) => {
        const { group, message } = action.payload || {};
        if (group) state.groups[group] = { ...state.groups[group], status: "failed", error: message || action.error.message };
      });
  },
});

export const { permissionsCached } = roleAccessSlice.actions;
export { readCachedPermissions };
export default roleAccessSlice.reducer;
