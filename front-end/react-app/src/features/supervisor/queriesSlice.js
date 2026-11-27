import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import supervisorApi from "./supervisorApi.js";

function normalizeQueries(queries = []) { return queries.map((query) => ({ ...query, user: query.userName || query.userEmail || "Unknown user", email: query.userEmail || "—", description: query.description || "No description", createdAt: query.createdAt ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(query.createdAt)) : "—", status: query.status || "Open" })); }
export const loadSupervisorQueries = createAsyncThunk("supervisor/queries/load", async () => normalizeQueries(await supervisorApi.getQueries()));
export const replyToSupervisorQuery = createAsyncThunk("supervisor/queries/reply", async ({ id, reply }) => supervisorApi.updateQuery(id, { reply, status: "Replied", readBySender: false, repliedAt: Date.now() }));

const queriesSlice = createSlice({
  name: "supervisorQueries",
  initialState: { items: [], loading: false, saving: false, error: "" },
  reducers: {},
  extraReducers(builder) {
    builder
      .addCase(loadSupervisorQueries.pending, (state) => { state.loading = true; state.error = ""; })
      .addCase(loadSupervisorQueries.fulfilled, (state, action) => { state.items = action.payload; state.loading = false; })
      .addCase(loadSupervisorQueries.rejected, (state, action) => { state.loading = false; state.error = action.error.message || "Could not load queries."; })
      .addCase(replyToSupervisorQuery.pending, (state) => { state.saving = true; state.error = ""; })
      .addCase(replyToSupervisorQuery.fulfilled, (state, action) => { state.items = state.items.map((query) => query.id === action.payload?.id ? { ...query, ...action.payload, status: "Replied", reply: action.payload.reply, readBySender: false } : query); state.saving = false; })
      .addCase(replyToSupervisorQuery.rejected, (state, action) => { state.saving = false; state.error = action.error.message || "The query response could not be saved."; });
  },
});

export default queriesSlice.reducer;
