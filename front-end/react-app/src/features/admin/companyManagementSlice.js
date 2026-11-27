import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import adminApi from "./adminApi.js";

export const loadAdminCompanies = createAsyncThunk("admin/companies/load", () =>
  adminApi.getCompanies(),
);
export const createAdminCompany = createAsyncThunk(
  "admin/companies/create",
  (payload) => adminApi.createCompanyWithHr(payload),
);
export const removeAdminCompany = createAsyncThunk(
  "admin/companies/remove",
  async (id) => {
    await adminApi.deleteCompany(id);
    return id;
  },
);

const companyManagementSlice = createSlice({
  name: "adminCompanyManagement",
  initialState: {
    items: [],
    loading: false,
    saving: false,
    removing: false,
    error: "",
  },
  reducers: {
    clearAdminCompanyError(state) {
      state.error = "";
    },
    replaceAdminCompanies(state, action) {
      state.items = action.payload || [];
      state.loading = false;
      state.error = "";
    },
  },
  extraReducers(builder) {
    builder
      .addCase(loadAdminCompanies.pending, (state) => {
        state.loading = true;
        state.error = "";
      })
      .addCase(loadAdminCompanies.fulfilled, (state, action) => {
        state.items = action.payload || [];
        state.loading = false;
      })
      .addCase(loadAdminCompanies.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Could not load companies.";
      })
      .addCase(createAdminCompany.pending, (state) => {
        state.saving = true;
        state.error = "";
      })
      .addCase(createAdminCompany.fulfilled, (state, action) => {
        if (action.payload?.company)
          state.items.unshift(action.payload.company);
        state.saving = false;
      })
      .addCase(createAdminCompany.rejected, (state, action) => {
        state.saving = false;
        state.error =
          action.error.message ||
          "Could not create the company and HR account.";
      })
      .addCase(removeAdminCompany.pending, (state) => {
        state.removing = true;
        state.error = "";
      })
      .addCase(removeAdminCompany.fulfilled, (state, action) => {
        state.items = state.items.filter(
          (company) => company.id !== action.payload,
        );
        state.removing = false;
      })
      .addCase(removeAdminCompany.rejected, (state, action) => {
        state.removing = false;
        state.error = action.error.message || "Could not remove the company.";
      });
  },
});

export const { clearAdminCompanyError, replaceAdminCompanies } =
  companyManagementSlice.actions;
export default companyManagementSlice.reducer;
