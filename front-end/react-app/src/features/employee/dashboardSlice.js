import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { loadEmployeeChallenges } from "./challengesSlice.js";
import { loadEmployeeLiveSessions } from "./liveSessionsSlice.js";
import { loadEmployeeVideos } from "./videosSlice.js";
import { loadEmployeeExperts } from "./expertsSlice.js";

export const loadEmployeeDashboard = createAsyncThunk(
  "employee/dashboard/load",
  async (company, { dispatch }) => {
    await Promise.all([
      dispatch(loadEmployeeChallenges(company)).unwrap(),
      dispatch(loadEmployeeLiveSessions(company)).unwrap(),
      dispatch(loadEmployeeVideos(company)).unwrap(),
      dispatch(loadEmployeeExperts(company))
        .unwrap()
        .catch(() => []),
    ]);
  },
);

const dashboardSlice = createSlice({
  name: "employeeDashboard",
  initialState: { loading: false, error: "" },
  reducers: {},
  extraReducers(builder) {
    builder
      .addCase(loadEmployeeDashboard.pending, (state) => {
        state.loading = true;
        state.error = "";
      })
      .addCase(loadEmployeeDashboard.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(loadEmployeeDashboard.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.error.message || "Could not load the employee dashboard.";
      });
  },
});

export default dashboardSlice.reducer;
