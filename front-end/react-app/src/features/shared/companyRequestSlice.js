import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { submitCompanyRequest } from "../homepage/authService.js";

export const requestCompanyApproval = createAsyncThunk("companyRequest/submit", async (payload, { rejectWithValue }) => {
  const result = await submitCompanyRequest(payload);
  return result.ok ? result.request : rejectWithValue(result.error || "The request could not be submitted.");
});

const companyRequestSlice = createSlice({
  name: "companyRequest",
  initialState: { submitting: false, submitted: false, error: "" },
  reducers: { clearCompanyRequestStatus(state) { state.submitted = false; state.error = ""; } },
  extraReducers(builder) {
    builder
      .addCase(requestCompanyApproval.pending, (state) => { state.submitting = true; state.submitted = false; state.error = ""; })
      .addCase(requestCompanyApproval.fulfilled, (state) => { state.submitting = false; state.submitted = true; })
      .addCase(requestCompanyApproval.rejected, (state, action) => { state.submitting = false; state.error = action.payload || action.error.message || "The request could not be submitted."; });
  },
});

export const { clearCompanyRequestStatus } = companyRequestSlice.actions;
export default companyRequestSlice.reducer;
