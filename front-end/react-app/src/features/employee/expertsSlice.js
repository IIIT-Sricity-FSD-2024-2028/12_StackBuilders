import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { employeeApi } from "./services/employeeApi.js";

export const loadEmployeeExperts = createAsyncThunk("employee/experts/load", (company) => employeeApi.getExperts(company));

const expertsSlice = createSlice({
  name: "employeeExperts",
  initialState: { items: [], loading: false, error: "" },
  reducers: {},
  extraReducers(builder) {
    builder
      .addCase(loadEmployeeExperts.pending, (state) => { state.loading = true; state.error = ""; })
      .addCase(loadEmployeeExperts.fulfilled, (state, action) => { state.items = Array.isArray(action.payload) ? action.payload : []; state.loading = false; })
      .addCase(loadEmployeeExperts.rejected, (state, action) => { state.items = []; state.loading = false; state.error = action.error.message || "Could not load experts."; });
  },
});

export default expertsSlice.reducer;
