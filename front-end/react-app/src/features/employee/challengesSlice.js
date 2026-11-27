import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { employeeApi } from "./services/employeeApi.js";
import { updateCurrentEmployee } from "./services/employeeAuth.js";
import { sessionUpdated } from "../shared/authSlice.js";

export const loadEmployeeChallenges = createAsyncThunk(
  "employee/challenges/load",
  async (company) => {
    const [challenges, rewards] = await Promise.all([
      employeeApi.getChallenges(company),
      employeeApi.getRewards(company),
    ]);
    return { challenges: challenges || [], rewards: rewards || [] };
  },
);
export const claimEmployeeReward = createAsyncThunk(
  "employee/challenges/claim",
  async ({ rewardId, employeeId }, { dispatch, getState }) => {
    const result = await employeeApi.claimReward(rewardId, employeeId);
    if (result?.employee) {
      updateCurrentEmployee(result.employee);
      const session = getState().auth.session;
      if (session)
        dispatch(
          sessionUpdated({
            ...session,
            profile: result.employee,
            username: result.employee.email || session.username,
          }),
        );
    }
    return result;
  },
);

const challengesSlice = createSlice({
  name: "employeeChallenges",
  initialState: {
    challenges: [],
    rewards: [],
    loading: false,
    claiming: false,
    error: "",
  },
  reducers: {},
  extraReducers(builder) {
    builder
      .addCase(loadEmployeeChallenges.pending, (state) => {
        state.loading = true;
        state.error = "";
      })
      .addCase(loadEmployeeChallenges.fulfilled, (state, action) => {
        state.challenges = action.payload.challenges;
        state.rewards = action.payload.rewards;
        state.loading = false;
      })
      .addCase(loadEmployeeChallenges.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.error.message || "Could not load the employee dashboard.";
      })
      .addCase(claimEmployeeReward.pending, (state) => {
        state.claiming = true;
        state.error = "";
      })
      .addCase(claimEmployeeReward.fulfilled, (state, action) => {
        if (action.payload?.reward)
          state.rewards = state.rewards.map((reward) =>
            reward.id === action.payload.reward.id
              ? action.payload.reward
              : reward,
          );
        state.claiming = false;
      })
      .addCase(claimEmployeeReward.rejected, (state, action) => {
        state.claiming = false;
        state.error =
          action.error.message || "The reward could not be claimed right now.";
      });
  },
});

export default challengesSlice.reducer;
