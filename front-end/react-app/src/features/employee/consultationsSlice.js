import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { employeeApi } from "./services/employeeApi.js";

export const loadEmployeeConsultations = createAsyncThunk(
  "employee/consultations/load",
  async ({ employee, company }) => {
    const [consultations, experts] = await Promise.all([
      employeeApi.getConsultations(employee, company),
      employeeApi.getExperts(company),
    ]);
    return { consultations: consultations || [], experts: experts || [] };
  },
);
export const submitEmployeeConsultation = createAsyncThunk(
  "employee/consultations/create",
  async ({ payload, slotTime }) =>
    slotTime
      ? employeeApi.bookConsultationSlot({ ...payload, slotTime })
      : employeeApi.createConsultation(payload),
);
export const requestEmployeeReschedule = createAsyncThunk(
  "employee/consultations/reschedule",
  ({ id, payload }) => employeeApi.requestConsultationReschedule(id, payload),
);

const consultationsSlice = createSlice({
  name: "employeeConsultations",
  initialState: {
    items: [],
    experts: [],
    loading: false,
    submitting: false,
    rescheduling: false,
    error: "",
  },
  reducers: {},
  extraReducers(builder) {
    builder
      .addCase(loadEmployeeConsultations.pending, (state) => {
        state.loading = true;
        state.error = "";
      })
      .addCase(loadEmployeeConsultations.fulfilled, (state, action) => {
        state.items = action.payload.consultations;
        state.experts = action.payload.experts;
        state.loading = false;
      })
      .addCase(loadEmployeeConsultations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Could not load consultations.";
      })
      .addCase(submitEmployeeConsultation.pending, (state) => {
        state.submitting = true;
        state.error = "";
      })
      .addCase(submitEmployeeConsultation.fulfilled, (state) => {
        state.submitting = false;
      })
      .addCase(submitEmployeeConsultation.rejected, (state, action) => {
        state.submitting = false;
        state.error =
          action.error.message || "Could not submit the consultation request.";
      })
      .addCase(requestEmployeeReschedule.pending, (state) => {
        state.rescheduling = true;
        state.error = "";
      })
      .addCase(requestEmployeeReschedule.fulfilled, (state, action) => {
        state.items = state.items.map((item) =>
          item.id === action.payload?.id ? action.payload : item,
        );
        state.rescheduling = false;
      })
      .addCase(requestEmployeeReschedule.rejected, (state, action) => {
        state.rescheduling = false;
        state.error =
          action.error.message ||
          "Your message could not be sent to the expert.";
      });
  },
});

export default consultationsSlice.reducer;
