import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { employeeApi } from "./services/employeeApi.js";

export const loadEmployeeCheckins = createAsyncThunk("employee/wellnessCheckins/load", async ({ employee, company, checkinType }) => {
  const [items, responses] = await Promise.all([
    employeeApi.getCheckins(employee, company, checkinType),
    employeeApi.getCheckinResponses(company, undefined, employee?.id),
  ]);
  return { items: items || [], responses: responses || [] };
});
export const submitEmployeeCheckin = createAsyncThunk("employee/wellnessCheckins/create", (payload) => employeeApi.createCheckin(payload));

const wellnessCheckinsSlice = createSlice({
  name: "employeeWellnessCheckins",
  initialState: { items: [], responses: [], loading: false, submitting: false, error: "" },
  reducers: {},
  extraReducers(builder) {
    builder
      .addCase(loadEmployeeCheckins.pending, (state) => { state.loading = true; state.error = ""; })
      .addCase(loadEmployeeCheckins.fulfilled, (state, action) => { state.items = action.payload.items; state.responses = action.payload.responses; state.loading = false; })
      .addCase(loadEmployeeCheckins.rejected, (state, action) => { state.loading = false; state.error = action.error.message || "Could not load wellness check-ins."; })
      .addCase(submitEmployeeCheckin.pending, (state) => { state.submitting = true; state.error = ""; })
      .addCase(submitEmployeeCheckin.fulfilled, (state, action) => { if (action.payload) state.items.unshift(action.payload); state.submitting = false; })
      .addCase(submitEmployeeCheckin.rejected, (state, action) => { state.submitting = false; state.error = action.error.message || "Could not submit this check-in."; });
  },
});

export default wellnessCheckinsSlice.reducer;
