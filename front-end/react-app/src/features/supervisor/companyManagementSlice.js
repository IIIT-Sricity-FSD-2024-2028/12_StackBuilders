import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import supervisorApi from "./supervisorApi.js";

function normalizeRequests(requests = []) { return requests.map((request) => ({ ...request, status: request.status ? request.status[0].toUpperCase() + request.status.slice(1) : "Pending", createdAt: request.createdAt ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(request.createdAt)) : "—" })); }

export const loadSupervisorCompanies = createAsyncThunk("supervisor/companies/load", async () => {
  const [companies, requests] = await Promise.all([supervisorApi.getCompanies(), supervisorApi.getRequests()]);
  return { companies: companies || [], requests: normalizeRequests(requests) };
});
export const createSupervisorCompany = createAsyncThunk("supervisor/companies/create", (payload) => supervisorApi.createCompanyWithHr({ companyName: payload.name, companyPhone: payload.phone, companyAddress: payload.address, companyEmail: payload.email, hrName: payload.hrName, hrPhoneNumber: payload.hrPhoneNumber, hrEmail: payload.hrEmail, hrPassword: payload.hrPassword }));
export const approveSupervisorRequest = createAsyncThunk("supervisor/companies/approveRequest", async (id) => { await supervisorApi.approveRequest(id); return id; });
export const rejectSupervisorRequest = createAsyncThunk("supervisor/companies/rejectRequest", async (id) => { await supervisorApi.rejectRequest(id); return id; });

const companyManagementSlice = createSlice({
  name: "supervisorCompanyManagement",
  initialState: { companies: [], requests: [], loading: false, saving: false, processingRequest: false, error: "" },
  reducers: {},
  extraReducers(builder) {
    builder
      .addCase(loadSupervisorCompanies.pending, (state) => { state.loading = true; state.error = ""; })
      .addCase(loadSupervisorCompanies.fulfilled, (state, action) => { state.companies = action.payload.companies; state.requests = action.payload.requests; state.loading = false; })
      .addCase(loadSupervisorCompanies.rejected, (state, action) => { state.loading = false; state.error = action.error.message || "Could not load companies."; })
      .addCase(createSupervisorCompany.pending, (state) => { state.saving = true; state.error = ""; })
      .addCase(createSupervisorCompany.fulfilled, (state, action) => { if (action.payload?.company) state.companies.unshift(action.payload.company); state.saving = false; })
      .addCase(createSupervisorCompany.rejected, (state, action) => { state.saving = false; state.error = action.error.message || "The company and HR account could not be created."; })
      .addCase(approveSupervisorRequest.pending, (state) => { state.processingRequest = true; state.error = ""; })
      .addCase(approveSupervisorRequest.fulfilled, (state, action) => { state.requests = state.requests.filter((request) => request.id !== action.payload); state.processingRequest = false; })
      .addCase(approveSupervisorRequest.rejected, (state, action) => { state.processingRequest = false; state.error = action.error.message || "The company request could not be approved."; })
      .addCase(rejectSupervisorRequest.pending, (state) => { state.processingRequest = true; state.error = ""; })
      .addCase(rejectSupervisorRequest.fulfilled, (state, action) => { state.requests = state.requests.filter((request) => request.id !== action.payload); state.processingRequest = false; })
      .addCase(rejectSupervisorRequest.rejected, (state, action) => { state.processingRequest = false; state.error = action.error.message || "The company request could not be rejected."; });
  },
});

export default companyManagementSlice.reducer;
