import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { loadSupervisorUsers } from "./usersSlice.js";
import { loadSupervisorCompanies } from "./companyManagementSlice.js";
import { loadSupervisorRevenue } from "./revenueSlice.js";
import { loadSupervisorActivity } from "./activitySlice.js";

export const loadSupervisorReports = createAsyncThunk("supervisor/reports/load", async (_, { dispatch }) => {
  await Promise.all([
    dispatch(loadSupervisorUsers()).unwrap(),
    dispatch(loadSupervisorCompanies()).unwrap(),
    dispatch(loadSupervisorRevenue()).unwrap(),
    dispatch(loadSupervisorActivity()).unwrap(),
  ]);
});

const reportsSlice = createSlice({
  name: "supervisorReports",
  initialState: { loading: false, error: "" },
  reducers: {},
  extraReducers(builder) {
    builder
      .addCase(loadSupervisorReports.pending, (state) => { state.loading = true; state.error = ""; })
      .addCase(loadSupervisorReports.fulfilled, (state) => { state.loading = false; })
      .addCase(loadSupervisorReports.rejected, (state, action) => { state.loading = false; state.error = action.error.message || "Could not load report data."; });
  },
});

export default reportsSlice.reducer;
