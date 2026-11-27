import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { loadHrSubscriptions } from "./subscriptionsSlice.js";

export const loadHrPricing = createAsyncThunk("hr/pricing/load", async (_, { dispatch }) => { await dispatch(loadHrSubscriptions()).unwrap(); });

const pricingSlice = createSlice({
  name: "hrPricing",
  initialState: { loading: false, error: "" },
  reducers: {},
  extraReducers(builder) {
    builder
      .addCase(loadHrPricing.pending, (state) => { state.loading = true; state.error = ""; })
      .addCase(loadHrPricing.fulfilled, (state) => { state.loading = false; })
      .addCase(loadHrPricing.rejected, (state, action) => { state.loading = false; state.error = action.error.message || "Could not load subscription."; });
  },
});

export default pricingSlice.reducer;
