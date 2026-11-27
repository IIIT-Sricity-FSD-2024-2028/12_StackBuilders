import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import hrApi from "./hrApi.js";

export const loadHrChallenges = createAsyncThunk("hr/challenges/load", async (context) => {
  const [challenges, rewards] = await Promise.all([hrApi.getChallenges(context), hrApi.getRewards(context)]);
  return { challenges: challenges || [], rewards: rewards || [] };
});
export const createHrChallenge = createAsyncThunk("hr/challenges/create", (payload) => hrApi.createChallenge(payload));
export const createHrReward = createAsyncThunk("hr/challenges/createReward", (payload) => hrApi.createReward(payload));
export const removeHrChallenge = createAsyncThunk("hr/challenges/remove", async (id) => { await hrApi.deleteChallenge(id); return id; });
export const removeHrReward = createAsyncThunk("hr/challenges/removeReward", async (id) => { await hrApi.deleteReward(id); return id; });

const challengesSlice = createSlice({
  name: "hrChallenges",
  initialState: { challenges: [], rewards: [], loading: false, saving: false, removingChallenge: false, removingReward: false, error: "" },
  reducers: { clearHrChallengeError(state) { state.error = ""; } },
  extraReducers(builder) {
    builder
      .addCase(loadHrChallenges.pending, (state) => { state.loading = true; state.error = ""; })
      .addCase(loadHrChallenges.fulfilled, (state, action) => { state.challenges = action.payload.challenges; state.rewards = action.payload.rewards; state.loading = false; })
      .addCase(loadHrChallenges.rejected, (state, action) => { state.loading = false; state.error = action.error.message || "Could not load challenges and rewards."; })
      .addCase(createHrChallenge.pending, (state) => { state.saving = true; state.error = ""; })
      .addCase(createHrChallenge.fulfilled, (state, action) => { if (action.payload) state.challenges.unshift(action.payload); state.saving = false; })
      .addCase(createHrChallenge.rejected, (state, action) => { state.saving = false; state.error = action.error.message || "Could not save this challenge."; })
      .addCase(createHrReward.pending, (state) => { state.saving = true; state.error = ""; })
      .addCase(createHrReward.fulfilled, (state, action) => { if (action.payload) state.rewards.unshift(action.payload); state.saving = false; })
      .addCase(createHrReward.rejected, (state, action) => { state.saving = false; state.error = action.error.message || "Could not save this reward."; })
      .addCase(removeHrChallenge.pending, (state) => { state.removingChallenge = true; state.error = ""; })
      .addCase(removeHrChallenge.fulfilled, (state, action) => { state.challenges = state.challenges.filter((item) => item.id !== action.payload); state.removingChallenge = false; })
      .addCase(removeHrChallenge.rejected, (state, action) => { state.removingChallenge = false; state.error = action.error.message || "Could not delete this challenge."; })
      .addCase(removeHrReward.pending, (state) => { state.removingReward = true; state.error = ""; })
      .addCase(removeHrReward.fulfilled, (state, action) => { state.rewards = state.rewards.filter((item) => item.id !== action.payload); state.removingReward = false; })
      .addCase(removeHrReward.rejected, (state, action) => { state.removingReward = false; state.error = action.error.message || "Could not delete this reward."; });
  },
});

export const { clearHrChallengeError } = challengesSlice.actions;
export default challengesSlice.reducer;
