import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import hrApi from "./hrApi.js";

export const submitHrPayment = createAsyncThunk("hr/payments/submit", async ({ company, planId, plan }) => {
  const [subscriptions, payments] = await Promise.all([hrApi.getSubscriptions(), hrApi.getPayments()]);
  const now = Date.now();
  const subscription = { id: `SUB-${now}`, companyId: company.companyId, companyName: company.companyName, planId, planName: plan.name, price: plan.price, employeeLimit: plan.employeeLimit, expertLimit: plan.expertLimit, status: "active", subscribedAt: now };
  const sameCompany = (item) => (company.companyId && String(item.companyId || "").trim() === company.companyId) || String(item.companyName || "").trim().toLowerCase() === company.companyName.toLowerCase();
  const nextSubscriptions = (subscriptions || []).filter((item) => !sameCompany(item)).concat(subscription);
  const payment = { id: `PAY-${now}`, companyId: company.companyId, companyName: company.companyName, planId, planName: plan.name, amount: plan.price, status: "completed", paidAt: now };
  const nextPayments = [...(payments || []), payment];
  await Promise.all([hrApi.saveSubscriptions(nextSubscriptions), hrApi.savePayments(nextPayments)]);
  return { subscriptions: nextSubscriptions, payment };
});

const paymentsSlice = createSlice({
  name: "hrPayments",
  initialState: { items: [], processing: false, error: "" },
  reducers: {},
  extraReducers(builder) {
    builder
      .addCase(submitHrPayment.pending, (state) => { state.processing = true; state.error = ""; })
      .addCase(submitHrPayment.fulfilled, (state, action) => { state.items.push(action.payload.payment); state.processing = false; })
      .addCase(submitHrPayment.rejected, (state, action) => { state.processing = false; state.error = action.error.message || "An error occurred during payment processing. Please try again."; });
  },
});

export default paymentsSlice.reducer;
