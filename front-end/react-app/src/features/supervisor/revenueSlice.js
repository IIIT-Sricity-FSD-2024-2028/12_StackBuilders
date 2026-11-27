import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import supervisorApi from "./supervisorApi.js";

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? "—" : new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date);
}
function normalizePayments(payments = []) { return payments.map((payment) => ({ ...payment, company: payment.companyName || payment.company || "—", plan: payment.planName || payment.planId || "—", amount: Number(payment.amount) || 0, date: formatDate(payment.paidAt || payment.createdAt), status: payment.status || "Unknown" })); }
export const loadSupervisorRevenue = createAsyncThunk("supervisor/revenue/load", async () => {
  const result = await supervisorApi.loadRevenue();
  return { subscriptions: result.subscriptions || [], payments: normalizePayments(result.payments) };
});

const revenueSlice = createSlice({
  name: "supervisorRevenue",
  initialState: { subscriptions: [], payments: [], loading: false, error: "" },
  reducers: {},
  extraReducers(builder) {
    builder
      .addCase(loadSupervisorRevenue.pending, (state) => { state.loading = true; state.error = ""; })
      .addCase(loadSupervisorRevenue.fulfilled, (state, action) => { state.subscriptions = action.payload.subscriptions; state.payments = action.payload.payments; state.loading = false; })
      .addCase(loadSupervisorRevenue.rejected, (state, action) => { state.loading = false; state.error = action.error.message || "Could not load revenue data."; });
  },
});

export default revenueSlice.reducer;
