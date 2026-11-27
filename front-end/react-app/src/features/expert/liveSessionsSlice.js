import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import expertApi from "./expertApi.js";
import { loadExpertWorkspaceData } from "./expertData.js";

export const loadExpertLiveSessions = createAsyncThunk("expert/liveSessions/load", (expert) => expertApi.getLiveSessions(expert));
export const createExpertLiveSession = createAsyncThunk("expert/liveSessions/create", async ({ session, expert }) => expertApi.createLiveSession({ title: session.title, category: session.category, sessionType: session.sessionType, date: session.date, startTime: session.startTime, duration: session.duration, maxParticipants: String(session.maxParticipants), meetingLink: session.meetingLink, description: session.description, expertId: expert?.id, hostName: expert?.name, companyId: expert?.companyId, companyName: expert?.companyName }));
export const updateExpertLiveSession = createAsyncThunk("expert/liveSessions/update", async ({ id, session }) => expertApi.updateLiveSession(id, { title: session.title, category: session.category, sessionType: session.sessionType, date: session.date, startTime: session.startTime, duration: session.duration, maxParticipants: String(session.maxParticipants), meetingLink: session.meetingLink, description: session.description }));

const liveSessionsSlice = createSlice({
  name: "expertLiveSessions",
  initialState: { items: loadExpertWorkspaceData().sessions, loading: false, saving: false, error: "" },
  reducers: {},
  extraReducers(builder) {
    builder
      .addCase(loadExpertLiveSessions.pending, (state) => { state.loading = true; state.error = ""; })
      .addCase(loadExpertLiveSessions.fulfilled, (state, action) => { state.items = action.payload || []; state.loading = false; })
      .addCase(loadExpertLiveSessions.rejected, (state, action) => { state.loading = false; state.error = action.error.message || "Unable to load expert live sessions."; })
      .addCase(createExpertLiveSession.pending, (state) => { state.saving = true; state.error = ""; })
      .addCase(createExpertLiveSession.fulfilled, (state, action) => { if (action.payload) state.items.unshift(action.payload); state.saving = false; })
      .addCase(createExpertLiveSession.rejected, (state, action) => { state.saving = false; state.error = action.error.message || "The live session could not be created."; })
      .addCase(updateExpertLiveSession.pending, (state) => { state.saving = true; state.error = ""; })
      .addCase(updateExpertLiveSession.fulfilled, (state, action) => { state.items = state.items.map((item) => item.id === action.payload?.id ? action.payload : item); state.saving = false; })
      .addCase(updateExpertLiveSession.rejected, (state, action) => { state.saving = false; state.error = action.error.message || "The live session could not be updated."; });
  },
});

export default liveSessionsSlice.reducer;
