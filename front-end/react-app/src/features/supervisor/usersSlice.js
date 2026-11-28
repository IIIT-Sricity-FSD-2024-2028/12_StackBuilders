import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import supervisorApi from "./supervisorApi.js";

const formatRelativeDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? "—" : new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(date);
};
export function normalizeUsers({ employees = [], experts = [], hrProfiles = [] }) {
  const mapUser = (record, role) => ({ id: record.id, name: record.name || record.email || "Unnamed user", email: record.email || "—", role, company: record.companyName || "—", companyName: record.companyName || "—", companyId: record.companyId || "", isSeededDefault: Boolean(record.isSeededDefault), status: record.status || "Unknown", lastActive: formatRelativeDate(record.updatedAt || record.createdAt), createdAt: record.createdAt || record.updatedAt });
  return [...employees.map((record) => mapUser(record, "Employee")), ...experts.map((record) => mapUser(record, "Wellness Expert")), ...hrProfiles.map((record) => mapUser(record, "HR"))];
}

export const loadSupervisorUsers = createAsyncThunk("supervisor/users/load", async () => normalizeUsers(await supervisorApi.loadUsers()));
export const createSupervisorUser = createAsyncThunk("supervisor/users/create", async ({ user, company }) => {
  const common = { name: user.name, email: user.email, password: user.password, companyId: user.companyId, companyName: company?.name, phoneNumber: user.phone, status: "Active" };
  const result = user.role === "Employee" ? await supervisorApi.createEmployee({ ...common, department: user.department })
    : user.role === "HR" ? await supervisorApi.createHrProfile(common)
      : await supervisorApi.createExpert({ ...common, specialization: user.specialization, experience: user.experience });
  const record = result.hrProfile || result;
  return normalizeUsers({ employees: user.role === "Employee" ? [record] : [], experts: user.role === "Wellness Expert" ? [record] : [], hrProfiles: user.role === "HR" ? [record] : [] })[0];
});

const usersSlice = createSlice({
  name: "supervisorUsers",
  initialState: { items: [], loading: false, saving: false, error: "" },
  reducers: { addSupervisorUser(state, action) { state.items.unshift(action.payload); } },
  extraReducers(builder) {
    builder
      .addCase(loadSupervisorUsers.pending, (state) => { state.loading = true; state.error = ""; })
      .addCase(loadSupervisorUsers.fulfilled, (state, action) => { state.items = action.payload; state.loading = false; })
      .addCase(loadSupervisorUsers.rejected, (state, action) => { state.loading = false; state.error = action.error.message || "Could not load supervisor users."; })
      .addCase(createSupervisorUser.pending, (state) => { state.saving = true; state.error = ""; })
      .addCase(createSupervisorUser.fulfilled, (state, action) => { state.items.push(action.payload); state.saving = false; })
      .addCase(createSupervisorUser.rejected, (state, action) => { state.saving = false; state.error = action.error.message || "The user could not be created."; });
  },
});

export const { addSupervisorUser } = usersSlice.actions;
export default usersSlice.reducer;
