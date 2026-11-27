import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import hrApi from "./hrApi.js";

export const loadHrVideos = createAsyncThunk("hr/videos/load", (context) => hrApi.getVideos(context));

const videosSlice = createSlice({
  name: "hrVideos",
  initialState: { items: [], loading: false, error: "" },
  reducers: {},
  extraReducers(builder) {
    builder
      .addCase(loadHrVideos.pending, (state) => { state.loading = true; state.error = ""; })
      .addCase(loadHrVideos.fulfilled, (state, action) => { state.items = action.payload || []; state.loading = false; })
      .addCase(loadHrVideos.rejected, (state, action) => { state.loading = false; state.error = action.error.message || "Could not load the video library."; });
  },
});

export default videosSlice.reducer;
