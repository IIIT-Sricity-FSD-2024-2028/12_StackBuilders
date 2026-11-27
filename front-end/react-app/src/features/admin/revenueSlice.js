import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import adminApi from "./adminApi.js";

export const loadAdminRevenue = createAsyncThunk("admin/revenue/load", async () => {
  const [payments, subscriptions] = await Promise.all([adminApi.getPayments(), adminApi.getSubscriptions()]);
  return { payments: payments || [], subscriptions: subscriptions || [] };
});

const revenueSlice = createSlice({
  name: "adminRevenue",
  initialState: { payments: [], subscriptions: [], loading: false, error: "" },
  reducers: {},
  extraReducers(builder) {
    builder
      .addCase(loadAdminRevenue.pending, (state) => { state.loading = true; state.error = ""; })
      .addCase(loadAdminRevenue.fulfilled, (state, action) => { state.payments = action.payload.payments; state.subscriptions = action.payload.subscriptions; state.loading = false; })
      .addCase(loadAdminRevenue.rejected, (state, action) => { state.loading = false; state.error = action.error.message || "Could not load revenue data."; });
  },
});

export default revenueSlice.reducer;
