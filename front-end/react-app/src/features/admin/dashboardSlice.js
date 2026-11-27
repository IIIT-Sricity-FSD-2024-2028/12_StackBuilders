import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import adminApi from "./adminApi.js";
import { buildRecentActivityEntries } from "../../utils/recentActivity.js";

export const loadAdminDashboard = createAsyncThunk("admin/dashboard/load", async () => {
  const [employees, experts, hrProfiles, companies, consultations, liveSessions, videos, challenges, rewards] = await Promise.all([
    adminApi.getUsers(), adminApi.getExperts(), adminApi.getHrProfiles(), adminApi.getCompanies(), adminApi.getConsultations(), adminApi.getLiveSessions(), adminApi.getVideos(), adminApi.getChallenges(), adminApi.getRewards(),
  ]);
  const users = [
    ...(employees || []).map((user) => ({ ...user, role: "Employee" })),
    ...(experts || []).map((user) => ({ ...user, role: "Wellness Expert" })),
    ...(hrProfiles || []).map((user) => ({ ...user, role: "HR" })),
  ];
  const activity = buildRecentActivityEntries({ users, companies, consultations, liveSessions, videos, challenges, rewards });
  return { stats: [
    { label: "Total Users", value: String(users.length), detail: "Synced from employee, expert, and HR accounts", icon: "users", id: "dashboardTotalUsers" },
    { label: "Active Users", value: String(users.filter((user) => (user.status || "Active") === "Active").length), detail: "Live enabled accounts across the workspace", icon: "user", id: "dashboardActiveUsers" },
    { label: "System Activity", value: String((consultations || []).length + (liveSessions || []).length + (videos || []).length + (challenges || []).length + (rewards || []).length), detail: "Consultations, sessions, videos, challenges, and rewards", icon: "heartbeat", id: "dashboardActivityVolume" },
  ], activity };
});

const dashboardSlice = createSlice({
  name: "adminDashboard",
  initialState: { stats: [], activity: [], loading: false, error: "" },
  reducers: {},
  extraReducers(builder) {
    builder
      .addCase(loadAdminDashboard.pending, (state) => { state.loading = true; state.error = ""; })
      .addCase(loadAdminDashboard.fulfilled, (state, action) => { state.stats = action.payload.stats; state.activity = action.payload.activity; state.loading = false; })
      .addCase(loadAdminDashboard.rejected, (state, action) => { state.loading = false; state.error = action.error.message || "Could not load dashboard data."; });
  },
});

export default dashboardSlice.reducer;
