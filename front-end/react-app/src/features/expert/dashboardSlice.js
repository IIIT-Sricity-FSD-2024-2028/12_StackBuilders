import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { loadExpertConsultations } from "./consultationsSlice.js";
import { loadExpertLiveSessions } from "./liveSessionsSlice.js";
import { loadExpertCheckins } from "./checkinsSlice.js";
import { loadExpertVideos } from "./videosSlice.js";

export const loadExpertDashboard = createAsyncThunk(
  "expert/dashboard/load",
  async (expert, { dispatch }) => {
    await Promise.all([
      dispatch(loadExpertConsultations(expert)).unwrap(),
      dispatch(loadExpertLiveSessions(expert)).unwrap(),
      dispatch(loadExpertCheckins(expert)).unwrap(),
      dispatch(loadExpertVideos(expert)).unwrap(),
    ]);
  },
);

const dashboardSlice = createSlice({
  name: "expertDashboard",
  initialState: { loading: false, error: "" },
  reducers: {},
  extraReducers(builder) {
    builder
      .addCase(loadExpertDashboard.pending, (state) => {
        state.loading = true;
        state.error = "";
      })
      .addCase(loadExpertDashboard.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(loadExpertDashboard.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.error.message || "Could not load the expert workspace.";
      });
  },
});

export default dashboardSlice.reducer;
