import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { updateDemoPassword } from "../homepage/authService.js";

function readProfile() {
  try { return JSON.parse(localStorage.getItem("stack-builders-supervisor-profile") || "{}"); } catch { return {}; }
}
export const saveSupervisorProfile = createAsyncThunk("supervisor/settings/saveProfile", async (profile) => {
  try { localStorage.setItem("stack-builders-supervisor-profile", JSON.stringify(profile)); } catch { /* Keep the profile in this Redux session. */ }
  return profile;
});
export const updateSupervisorPassword = createAsyncThunk("supervisor/settings/updatePassword", async (payload) => updateDemoPassword(payload.email, payload.currentPassword, payload.newPassword));

const settingsSlice = createSlice({
  name: "supervisorSettings",
  initialState: { profile: readProfile(), saving: false, passwordSaving: false, error: "" },
  reducers: {},
  extraReducers(builder) {
    builder
      .addCase(saveSupervisorProfile.pending, (state) => { state.saving = true; state.error = ""; })
      .addCase(saveSupervisorProfile.fulfilled, (state, action) => { state.profile = action.payload; state.saving = false; })
      .addCase(saveSupervisorProfile.rejected, (state, action) => { state.saving = false; state.error = action.error.message || "Could not save settings."; })
      .addCase(updateSupervisorPassword.pending, (state) => { state.passwordSaving = true; state.error = ""; })
      .addCase(updateSupervisorPassword.fulfilled, (state) => { state.passwordSaving = false; })
      .addCase(updateSupervisorPassword.rejected, (state, action) => { state.passwordSaving = false; state.error = action.error.message || "Password could not be updated."; });
  },
});

export default settingsSlice.reducer;
