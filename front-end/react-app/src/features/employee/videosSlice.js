import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { employeeApi } from "./services/employeeApi.js";

export const loadEmployeeVideos = createAsyncThunk("employee/videos/load", (company) => employeeApi.getVideos(company));

const videosSlice = createSlice({
  name: "employeeVideos",
  initialState: { items: [], loading: false, error: "" },
  reducers: {},
  extraReducers(builder) {
    builder
      .addCase(loadEmployeeVideos.pending, (state) => { state.loading = true; state.error = ""; })
      .addCase(loadEmployeeVideos.fulfilled, (state, action) => { state.items = action.payload || []; state.loading = false; })
      .addCase(loadEmployeeVideos.rejected, (state, action) => { state.loading = false; state.error = action.error.message || "Could not load the video library."; });
  },
});

export default videosSlice.reducer;
