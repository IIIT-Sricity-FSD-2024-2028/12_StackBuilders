import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { loadSupervisorUsers } from "./usersSlice.js";
import { loadSupervisorCompanies } from "./companyManagementSlice.js";
import { loadSupervisorQueries } from "./queriesSlice.js";
import { loadSupervisorRevenue } from "./revenueSlice.js";
import { loadSupervisorActivity } from "./activitySlice.js";

export const loadSupervisorDashboard = createAsyncThunk("supervisor/dashboard/load", async (_, { dispatch }) => {
  await Promise.all([
    dispatch(loadSupervisorUsers()).unwrap(),
    dispatch(loadSupervisorCompanies()).unwrap(),
    dispatch(loadSupervisorQueries()).unwrap(),
    dispatch(loadSupervisorRevenue()).unwrap(),
    dispatch(loadSupervisorActivity()).unwrap(),
  ]);
});

const dashboardSlice = createSlice({
  name: "supervisorDashboard",
  initialState: { loading: false, error: "" },
  reducers: {},
  extraReducers(builder) {
    builder
      .addCase(loadSupervisorDashboard.pending, (state) => { state.loading = true; state.error = ""; })
      .addCase(loadSupervisorDashboard.fulfilled, (state) => { state.loading = false; })
      .addCase(loadSupervisorDashboard.rejected, (state, action) => { state.loading = false; state.error = action.error.message || "Could not load supervisor data."; });
  },
});

export default dashboardSlice.reducer;
