import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { loadHrEmployees } from "./employeesSlice.js";
import { loadHrExperts } from "./expertsSlice.js";
import { loadHrChallenges } from "./challengesSlice.js";
import { loadHrLiveSessions } from "./liveSessionsSlice.js";

export const loadHrDashboard = createAsyncThunk("hr/dashboard/load", async (context, { dispatch }) => {
  await Promise.all([
    dispatch(loadHrEmployees(context)).unwrap(),
    dispatch(loadHrExperts(context)).unwrap(),
    dispatch(loadHrChallenges(context)).unwrap(),
    dispatch(loadHrLiveSessions(context)).unwrap(),
  ]);
});

const dashboardSlice = createSlice({
  name: "hrDashboard",
  initialState: { loading: false, error: "" },
  reducers: {},
  extraReducers(builder) {
    builder
      .addCase(loadHrDashboard.pending, (state) => { state.loading = true; state.error = ""; })
      .addCase(loadHrDashboard.fulfilled, (state) => { state.loading = false; })
      .addCase(loadHrDashboard.rejected, (state, action) => { state.loading = false; state.error = action.error.message || "Could not load HR dashboard data."; });
  },
});

export default dashboardSlice.reducer;
