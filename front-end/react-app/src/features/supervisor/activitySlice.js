import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import supervisorApi from "./supervisorApi.js";

export const loadSupervisorActivity = createAsyncThunk("supervisor/activity/load", () => supervisorApi.loadActivity());

const activitySlice = createSlice({
  name: "supervisorActivity",
  initialState: { consultations: [], liveSessions: [], videos: [], challenges: [], rewards: [], loading: false, error: "" },
  reducers: {},
  extraReducers(builder) {
    builder
      .addCase(loadSupervisorActivity.pending, (state) => { state.loading = true; state.error = ""; })
      .addCase(loadSupervisorActivity.fulfilled, (state, action) => { Object.assign(state, action.payload); state.loading = false; })
      .addCase(loadSupervisorActivity.rejected, (state, action) => { state.loading = false; state.error = action.error.message || "Could not load activity data."; });
  },
});

export default activitySlice.reducer;
