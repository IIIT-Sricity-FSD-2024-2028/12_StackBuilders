import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import adminApi from "./adminApi.js";

const mapUsers = ({ employees = [], experts = [], hrProfiles = [] }) => [
  ...employees.map((user) => ({
    ...user,
    role: "Employee",
    source: "employee",
    company: user.companyName || "—",
  })),
  ...experts.map((user) => ({
    ...user,
    role: "Wellness Expert",
    source: "expert",
    company: user.companyName || "—",
  })),
  ...hrProfiles.map((user) => ({
    ...user,
    role: "HR",
    source: "hr",
    company: user.companyName || "—",
  })),
];

export const loadAdminUsers = createAsyncThunk("admin/users/load", async () => {
  const [employees, experts, hrProfiles] = await Promise.all([
    adminApi.getUsers(),
    adminApi.getExperts(),
    adminApi.getHrProfiles(),
  ]);
  return mapUsers({ employees, experts, hrProfiles });
});

export const createAdminUser = createAsyncThunk(
  "admin/users/create",
  async ({ role, ...payload }) => {
    if (role === "employee")
      return {
        ...(await adminApi.createEmployee(payload)),
        role: "Employee",
        source: "employee",
        company: payload.companyName || "—",
      };
    if (role === "expert")
      return {
        ...(await adminApi.createExpert(payload)),
        role: "Wellness Expert",
        source: "expert",
        company: payload.companyName || "—",
      };
    return {
      ...(await adminApi.createHrProfile(payload)),
      role: "HR",
      source: "hr",
      company: payload.companyName || "—",
    };
  },
);

export const removeAdminUser = createAsyncThunk(
  "admin/users/remove",
  async ({ id, source }) => {
    if (source === "employee") await adminApi.deleteEmployee(id);
    else if (source === "expert") await adminApi.deleteExpert(id);
    else await adminApi.deleteHrProfile(id);
    return id;
  },
);

const usersSlice = createSlice({
  name: "adminUsers",
  initialState: {
    items: [],
    loading: false,
    creating: false,
    deletingId: null,
    error: "",
  },
  reducers: {
    clearAdminUsersError(state) {
      state.error = "";
    },
    addAdminUser(state, action) {
      state.items.unshift(action.payload);
    },
    removeAdminUsersForCompany(state, action) {
      const company = action.payload;
      state.items = state.items.filter(
        (user) =>
          !(
            String(user.companyId || "") === String(company.id || "") ||
            String(user.companyName || user.company || "").toLowerCase() ===
              String(company.name || "").toLowerCase()
          ),
      );
    },
  },
  extraReducers(builder) {
    builder
      .addCase(loadAdminUsers.pending, (state) => {
        state.loading = true;
        state.error = "";
      })
      .addCase(loadAdminUsers.fulfilled, (state, action) => {
        state.items = action.payload;
        state.loading = false;
      })
      .addCase(loadAdminUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Could not load users.";
      })
      .addCase(createAdminUser.pending, (state) => {
        state.creating = true;
        state.error = "";
      })
      .addCase(createAdminUser.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
        state.creating = false;
      })
      .addCase(createAdminUser.rejected, (state, action) => {
        state.creating = false;
        state.error = action.error.message || "The user could not be created.";
      })
      .addCase(removeAdminUser.pending, (state, action) => {
        state.deletingId = action.meta.arg.id;
        state.error = "";
      })
      .addCase(removeAdminUser.fulfilled, (state, action) => {
        state.items = state.items.filter((user) => user.id !== action.payload);
        state.deletingId = null;
      })
      .addCase(removeAdminUser.rejected, (state, action) => {
        state.deletingId = null;
        state.error = action.error.message || "The user could not be removed.";
      });
  },
});

export const {
  clearAdminUsersError,
  addAdminUser,
  removeAdminUsersForCompany,
} = usersSlice.actions;
export default usersSlice.reducer;
