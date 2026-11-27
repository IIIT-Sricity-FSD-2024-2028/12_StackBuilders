import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import queryApi from "./queryApi.js";

export function getQueryUserKey(user, userType) {
  const identity = user?.id || user?.employeeId || user?.expertId || user?.hrId || user?.email || user?.username || "anonymous";
  return String(userType || user?.role || "User") + ":" + String(identity).toLowerCase();
}

export const loadUserQueries = createAsyncThunk("queries/loadUser", async ({ user, userType }) => ({
  key: getQueryUserKey(user, userType),
  records: await queryApi.getForUser(user, userType),
}));
export const submitUserQuery = createAsyncThunk("queries/create", (payload) => queryApi.create(payload));
export const markUserQueryRead = createAsyncThunk("queries/markRead", async ({ id, user, userType }) => {
  await queryApi.markRead(id, userType);
  return { id, key: getQueryUserKey(user, userType) };
});

const querySlice = createSlice({
  name: "queries",
  initialState: { byUser: {}, loadStatus: {}, submitting: false, marking: {}, error: "" },
  reducers: { clearQueryError(state) { state.error = ""; } },
  extraReducers(builder) {
    builder
      .addCase(loadUserQueries.pending, (state, action) => { state.loadStatus[getQueryUserKey(action.meta.arg.user, action.meta.arg.userType)] = "loading"; })
      .addCase(loadUserQueries.fulfilled, (state, action) => { state.byUser[action.payload.key] = action.payload.records || []; state.loadStatus[action.payload.key] = "succeeded"; })
      .addCase(loadUserQueries.rejected, (state, action) => { const key = getQueryUserKey(action.meta.arg.user, action.meta.arg.userType); state.loadStatus[key] = "failed"; state.error = action.error.message || "Could not load notifications."; })
      .addCase(submitUserQuery.pending, (state) => { state.submitting = true; state.error = ""; })
      .addCase(submitUserQuery.fulfilled, (state) => { state.submitting = false; })
      .addCase(submitUserQuery.rejected, (state, action) => { state.submitting = false; state.error = action.error.message || "The query could not be submitted. Please try again."; })
      .addCase(markUserQueryRead.pending, (state, action) => { state.marking[action.meta.arg.id] = true; state.error = ""; })
      .addCase(markUserQueryRead.fulfilled, (state, action) => { const { key, id } = action.payload; state.byUser[key] = (state.byUser[key] || []).map((query) => query.id === id ? { ...query, readBySender: true } : query); delete state.marking[id]; })
      .addCase(markUserQueryRead.rejected, (state, action) => { delete state.marking[action.meta.arg.id]; state.error = action.error.message || "Could not mark this reply as read."; });
  },
});

export const { clearQueryError } = querySlice.actions;
export default querySlice.reducer;
