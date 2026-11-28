import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { updateDemoPassword } from "../homepage/authService.js";

const PROFILE_KEY = "stack-builders-profile-settings";
function readProfile() {
  try {
    return JSON.parse(localStorage.getItem(PROFILE_KEY) || "{}");
  } catch {
    return {};
  }
}

export const saveAdminProfile = createAsyncThunk(
  "admin/settings/saveProfile",
  async (profile) => {
    const normalized = { ...profile };
    try {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(normalized));
    } catch {
      /* Keep the profile in the current Redux session. */
    }
    return normalized;
  },
);

export const updateAdminPassword = createAsyncThunk(
  "admin/settings/updatePassword",
  async (payload) =>
    updateDemoPassword(
      payload.email,
      payload.currentPassword,
      payload.newPassword,
    ),
);

const settingsSlice = createSlice({
  name: "adminSettings",
  initialState: {
    profile: readProfile(),
    saving: false,
    passwordSaving: false,
    error: "",
  },
  reducers: {},
  extraReducers(builder) {
    builder
      .addCase(saveAdminProfile.pending, (state) => {
        state.saving = true;
        state.error = "";
      })
      .addCase(saveAdminProfile.fulfilled, (state, action) => {
        state.profile = action.payload;
        state.saving = false;
      })
      .addCase(saveAdminProfile.rejected, (state, action) => {
        state.saving = false;
        state.error =
          action.error.message || "Could not save profile settings.";
      })
      .addCase(updateAdminPassword.pending, (state) => {
        state.passwordSaving = true;
        state.error = "";
      })
      .addCase(updateAdminPassword.fulfilled, (state) => {
        state.passwordSaving = false;
      })
      .addCase(updateAdminPassword.rejected, (state, action) => {
        state.passwordSaving = false;
        state.error = action.error.message || "Password could not be updated.";
      });
  },
});

export default settingsSlice.reducer;
