import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import hrApi from "./hrApi.js";

export const loadHrLiveSessions = createAsyncThunk("hr/liveSessions/load", (context) => hrApi.getLiveSessions(context));

const liveSessionsSlice = createSlice({
  name: "hrLiveSessions",
  initialState: { items: [], loading: false, error: "" },
  reducers: {},
  extraReducers(builder) {
    builder
      .addCase(loadHrLiveSessions.pending, (state) => { state.loading = true; })
      .addCase(loadHrLiveSessions.fulfilled, (state, action) => { state.items = action.payload || []; state.loading = false; })
      .addCase(loadHrLiveSessions.rejected, (state, action) => { state.loading = false; state.error = action.error.message || "Could not load live sessions."; });
  },
});

export default liveSessionsSlice.reducer;
