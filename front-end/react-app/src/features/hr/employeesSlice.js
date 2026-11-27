import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import hrApi from "./hrApi.js";

export const loadHrEmployees = createAsyncThunk("hr/employees/load", (context) => hrApi.getEmployees(context));
export const createHrEmployee = createAsyncThunk("hr/employees/create", (payload) => hrApi.createEmployee(payload));
export const removeHrEmployee = createAsyncThunk("hr/employees/remove", async (id) => { await hrApi.deleteEmployee(id); return id; });

const employeesSlice = createSlice({
  name: "hrEmployees",
  initialState: { items: [], loading: false, saving: false, removing: false, error: "" },
  reducers: {},
  extraReducers(builder) {
    builder
      .addCase(loadHrEmployees.pending, (state) => { state.loading = true; state.error = ""; })
      .addCase(loadHrEmployees.fulfilled, (state, action) => { state.items = action.payload || []; state.loading = false; })
      .addCase(loadHrEmployees.rejected, (state, action) => { state.loading = false; state.error = action.error.message || "Could not load employees."; })
      .addCase(createHrEmployee.pending, (state) => { state.saving = true; state.error = ""; })
      .addCase(createHrEmployee.fulfilled, (state, action) => { if (action.payload) state.items.unshift(action.payload); state.saving = false; })
      .addCase(createHrEmployee.rejected, (state, action) => { state.saving = false; state.error = action.error.message || "Could not create employee."; })
      .addCase(removeHrEmployee.pending, (state) => { state.removing = true; state.error = ""; })
      .addCase(removeHrEmployee.fulfilled, (state, action) => { state.items = state.items.filter((item) => item.id !== action.payload); state.removing = false; })
      .addCase(removeHrEmployee.rejected, (state, action) => { state.removing = false; state.error = action.error.message || "Could not remove employee."; });
  },
});

export default employeesSlice.reducer;
