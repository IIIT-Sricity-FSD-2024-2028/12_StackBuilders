import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import hrApi from "./hrApi.js";
import { getCapacityForPlan } from "./companyCapacity.js";
import { submitHrPayment } from "./paymentsSlice.js";

export const loadHrSubscriptions = createAsyncThunk("hr/subscriptions/load", () => hrApi.getSubscriptions());
export const checkHrCapacity = createAsyncThunk("hr/subscriptions/checkCapacity", async ({ kind, company, currentCount }) => {
  const subscriptions = await hrApi.getSubscriptions();
  return getCapacityForPlan(kind, company, currentCount, subscriptions);
});

const subscriptionsSlice = createSlice({
  name: "hrSubscriptions",
  initialState: { items: [], loading: false, error: "", capacityChecking: false },
  reducers: { replaceHrSubscriptions(state, action) { state.items = action.payload || []; } },
  extraReducers(builder) {
    builder
      .addCase(loadHrSubscriptions.pending, (state) => { state.loading = true; state.error = ""; })
      .addCase(loadHrSubscriptions.fulfilled, (state, action) => { state.items = action.payload || []; state.loading = false; })
      .addCase(loadHrSubscriptions.rejected, (state, action) => { state.loading = false; state.error = action.error.message || "Could not load subscriptions."; });
    builder
      .addCase(checkHrCapacity.pending, (state) => { state.capacityChecking = true; })
      .addCase(checkHrCapacity.fulfilled, (state) => { state.capacityChecking = false; })
      .addCase(checkHrCapacity.rejected, (state, action) => { state.capacityChecking = false; state.error = action.error.message || "Could not verify the active subscription."; })
      .addCase(submitHrPayment.fulfilled, (state, action) => { state.items = action.payload.subscriptions; });
  },
});

export const { replaceHrSubscriptions } = subscriptionsSlice.actions;
export default subscriptionsSlice.reducer;
