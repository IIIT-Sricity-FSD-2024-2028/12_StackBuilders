import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { employeeApi } from "./services/employeeApi.js";

export const loadEmployeeLiveSessions = createAsyncThunk("employee/liveSessions/load", (company) => employeeApi.getLiveSessions(company));

const liveSessionsSlice = createSlice({
  name: "employeeLiveSessions",
  initialState: { items: [], loading: false, error: "" },
  reducers: {},
  extraReducers(builder) {
    builder
      .addCase(loadEmployeeLiveSessions.pending, (state) => { state.loading = true; state.error = ""; })
      .addCase(loadEmployeeLiveSessions.fulfilled, (state, action) => { state.items = action.payload || []; state.loading = false; })
      .addCase(loadEmployeeLiveSessions.rejected, (state, action) => { state.loading = false; state.error = action.error.message || "Could not load live sessions."; });
  },
});

export default liveSessionsSlice.reducer;
