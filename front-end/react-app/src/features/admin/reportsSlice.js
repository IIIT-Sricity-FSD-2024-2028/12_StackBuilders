import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import adminApi from "./adminApi.js";

function monthlyCounts(records) {
  const now = new Date();
  const months = Array.from(
    { length: 6 },
    (_, index) => new Date(now.getFullYear(), now.getMonth() - (5 - index), 1),
  );
  return {
    labels: months.map((month) =>
      new Intl.DateTimeFormat(undefined, { month: "short" }).format(month),
    ),
    values: months.map(
      (month) =>
        records.filter((record) => {
          const date = new Date(record.createdAt || record.updatedAt || "");
          return (
            !Number.isNaN(date.valueOf()) &&
            date.getFullYear() === month.getFullYear() &&
            date.getMonth() === month.getMonth()
          );
        }).length,
    ),
  };
}

export const loadAdminReports = createAsyncThunk(
  "admin/reports/load",
  async () => {
    const [
      companies,
      consultations,
      sessions,
      videos,
      employees,
      experts,
      hrProfiles,
      challenges,
      rewards,
    ] = await Promise.all([
      adminApi.getCompanies(),
      adminApi.getConsultations(),
      adminApi.getLiveSessions(),
      adminApi.getVideos(),
      adminApi.getUsers(),
      adminApi.getExperts(),
      adminApi.getHrProfiles(),
      adminApi.getChallenges(),
      adminApi.getRewards(),
    ]);
    const users = [
      ...(employees || []),
      ...(experts || []),
      ...(hrProfiles || []),
    ];
    const consultRecords = consultations || [];
    const sessionRecords = sessions || [];
    const videoRecords = videos || [];
    const challengeRecords = challenges || [];
    const rewardRecords = rewards || [];
    return {
      monthlyUsers: monthlyCounts(users),
      roleDistribution: [
        (employees || []).length,
        (hrProfiles || []).length,
        (experts || []).length,
      ],
      weeklyActivity: [
        consultRecords.length,
        sessionRecords.length,
        videoRecords.length,
        challengeRecords.length,
        rewardRecords.length,
      ],
      stats: [
        {
          label: "Total Companies",
          value: (companies || []).length,
          detail: "Managed company workspaces",
        },
        {
          label: "Consultations",
          value: consultRecords.length,
          detail: "Recorded employee requests",
        },
        {
          label: "Scheduled Live Sessions",
          value: sessionRecords.length,
          detail: "Expert-led company sessions",
        },
        {
          label: "Video Library Items",
          value: videoRecords.length,
          detail: "Wellness videos in the library",
        },
      ],
    };
  },
);

const reportsSlice = createSlice({
  name: "adminReports",
  initialState: { report: null, loading: false, error: "" },
  reducers: {},
  extraReducers(builder) {
    builder
      .addCase(loadAdminReports.pending, (state) => {
        state.loading = true;
        state.error = "";
      })
      .addCase(loadAdminReports.fulfilled, (state, action) => {
        state.report = action.payload;
        state.loading = false;
      })
      .addCase(loadAdminReports.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Could not load report data.";
      });
  },
});

export default reportsSlice.reducer;
