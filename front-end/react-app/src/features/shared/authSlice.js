import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { authenticate, completePasswordReset, getAuthSession, logout, persistUpdatedAuthSession, requestPasswordReset, updateAccountProfile as updateAccountProfileService, verifyServerAccount } from "../homepage/authService.js";
import { updateCurrentEmployee } from "../employee/services/employeeAuth.js";

export const signIn = createAsyncThunk("auth/signIn", async (credentials, { rejectWithValue }) => {
  const result = await authenticate(credentials.username, credentials.password);
  return result.ok ? result.session : rejectWithValue(result.error);
});

export const validateSession = createAsyncThunk("auth/validateSession", async (_, { getState }) => {
  const session = getState().auth.session;
  if (!session) return { valid: false };
  const exists = await verifyServerAccount(session);
  if (exists === false) logout();
  return { valid: exists !== false, session: exists === false ? null : session };
});

export const signOut = createAsyncThunk("auth/signOut", async () => {
  logout();
});

export const requestAuthPasswordReset = createAsyncThunk("auth/requestPasswordReset", async (email) => requestPasswordReset(email));
export const completeAuthPasswordReset = createAsyncThunk("auth/completePasswordReset", async ({ email, code, password }) => completePasswordReset(email, code, password));
export const updateSignedInProfile = createAsyncThunk("auth/updateProfile", async (changes, { getState }) => {
  const session = getState().auth.session;
  const profile = await updateAccountProfileService(session, changes);
  const nextSession = { ...session, profile, username: profile.email || session.username };
  persistUpdatedAuthSession(nextSession);
  if (session.role === "Employee") updateCurrentEmployee(profile);
  return nextSession;
});

const authSlice = createSlice({
  name: "auth",
  initialState: {
    session: getAuthSession(),
    status: getAuthSession() ? "authenticated" : "anonymous",
    error: "",
    recoveryStatus: "idle",
    recoveryError: "",
    profileSaving: false,
    profileError: "",
  },
  reducers: {
    sessionUpdated(state, action) {
      state.session = action.payload;
      state.status = action.payload ? "authenticated" : "anonymous";
      state.error = "";
    },
    clearAuthRecoveryError(state) { state.recoveryError = ""; },
    clearProfileError(state) { state.profileError = ""; },
  },
  extraReducers(builder) {
    builder
      .addCase(signIn.pending, (state) => { state.status = "signingIn"; state.error = ""; })
      .addCase(signIn.fulfilled, (state, action) => { state.session = action.payload; state.status = "authenticated"; })
      .addCase(signIn.rejected, (state, action) => { state.status = "anonymous"; state.error = action.payload || action.error.message || "Sign in failed."; })
      .addCase(validateSession.pending, (state) => { if (state.session) state.status = "checking"; })
      .addCase(validateSession.fulfilled, (state, action) => { state.session = action.payload.session; state.status = action.payload.valid ? "authenticated" : "anonymous"; })
      .addCase(validateSession.rejected, (state) => { if (state.session) state.status = "authenticated"; })
      .addCase(signOut.pending, (state) => { state.status = "signingOut"; state.error = ""; })
      .addCase(signOut.fulfilled, (state) => { state.session = null; state.status = "anonymous"; state.error = ""; })
      .addCase(signOut.rejected, (state, action) => { state.status = state.session ? "authenticated" : "anonymous"; state.error = action.error.message || "Could not sign out."; });
    builder
      .addCase(requestAuthPasswordReset.pending, (state) => { state.recoveryStatus = "requesting"; state.recoveryError = ""; })
      .addCase(requestAuthPasswordReset.fulfilled, (state) => { state.recoveryStatus = "codeSent"; })
      .addCase(requestAuthPasswordReset.rejected, (state, action) => { state.recoveryStatus = "failed"; state.recoveryError = action.error.message || "We could not send a verification code. Please try again."; })
      .addCase(completeAuthPasswordReset.pending, (state) => { state.recoveryStatus = "resetting"; state.recoveryError = ""; })
      .addCase(completeAuthPasswordReset.fulfilled, (state) => { state.recoveryStatus = "reset"; })
      .addCase(completeAuthPasswordReset.rejected, (state, action) => { state.recoveryStatus = "failed"; state.recoveryError = action.error.message || "We could not reset your password. Check the code and try again."; });
    builder
      .addCase(updateSignedInProfile.pending, (state) => { state.profileSaving = true; state.profileError = ""; })
      .addCase(updateSignedInProfile.fulfilled, (state, action) => { state.session = action.payload; state.profileSaving = false; })
      .addCase(updateSignedInProfile.rejected, (state, action) => { state.profileSaving = false; state.profileError = action.error.message || "Your profile could not be saved."; });
  },
});

export const { sessionUpdated, clearAuthRecoveryError, clearProfileError } = authSlice.actions;
export default authSlice.reducer;
