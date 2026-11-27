import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import expertApi from "./expertApi.js";
import { loadExpertWorkspaceData } from "./expertData.js";
import { mapExpertConsultations } from "./expertMappers.js";

export const loadExpertConsultations = createAsyncThunk(
  "expert/consultations/load",
  async (expert) => {
    const [consultations, profile] = await Promise.all([
      expertApi.getConsultations(expert),
      expertApi.getExpert(expert.id).catch(() => null),
    ]);
    return {
      consultations: mapExpertConsultations(consultations || []),
      profile: profile || {},
    };
  },
);
export const updateExpertConsultation = createAsyncThunk(
  "expert/consultations/update",
  async ({ id, changes }) => {
    const record = await expertApi.updateConsultation(id, changes);
    return record;
  },
);
export const createExpertFollowUp = createAsyncThunk(
  "expert/consultations/createFollowUp",
  async ({ checkin, expert }) =>
    expertApi.createFollowUpConsultation({
      employeeId: checkin.employeeId,
      employeeName: checkin.employeeName || checkin.employee,
      expertId: expert?.id,
      expertName: expert?.name,
      purpose: `Follow-up for ${checkin.checkinType} wellness check-in: ${checkin.reason}`,
      sourceCheckinId: checkin.id,
      followUpPriority: checkin.priority,
    }),
);
export const saveExpertAvailability = createAsyncThunk(
  "expert/consultations/saveAvailability",
  async ({ expertId, availableSlots }) => ({
    profile: await expertApi.updateExpert(expertId, { availableSlots }),
    availableSlots,
  }),
);

const seed = loadExpertWorkspaceData();
const consultationsSlice = createSlice({
  name: "expertConsultations",
  initialState: {
    items: mapExpertConsultations(seed.consultations),
    profile: seed.expert,
    availability: seed.availability,
    loading: false,
    saving: false,
    error: "",
  },
  reducers: {},
  extraReducers(builder) {
    builder
      .addCase(loadExpertConsultations.pending, (state) => {
        state.loading = true;
        state.error = "";
      })
      .addCase(loadExpertConsultations.fulfilled, (state, action) => {
        state.items = action.payload.consultations;
        const profile = action.payload.profile || {};
        state.profile = {
          ...state.profile,
          ...profile,
          track: profile.specialization || state.profile.track,
        };
        state.availability = Array.isArray(profile.availableSlots)
          ? profile.availableSlots
          : state.availability;
        state.loading = false;
      })
      .addCase(loadExpertConsultations.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.error.message || "Unable to load expert consultations.";
      })
      .addCase(updateExpertConsultation.pending, (state) => {
        state.saving = true;
        state.error = "";
      })
      .addCase(updateExpertConsultation.fulfilled, (state, action) => {
        const updated = action.payload || {};
        state.items = state.items.map((record) =>
          record.id === updated.id
            ? {
                ...record,
                ...updated,
                employee: updated.employeeName || record.employee,
                requestedAt: updated.requestedOn || record.requestedAt,
                date: updated.sessionDate || record.date,
                time: updated.sessionTime || record.time,
                completed:
                  String(updated.status || "").toLowerCase() === "completed",
              }
            : record,
        );
        state.saving = false;
      })
      .addCase(updateExpertConsultation.rejected, (state, action) => {
        state.saving = false;
        state.error =
          action.error.message || "The consultation could not be updated.";
      })
      .addCase(createExpertFollowUp.pending, (state) => {
        state.saving = true;
        state.error = "";
      })
      .addCase(createExpertFollowUp.fulfilled, (state, action) => {
        const record = action.payload?.consultation;
        if (record) {
          const mapped = {
            ...record,
            employee: record.employeeName || "Employee",
            requestedAt: record.requestedOn || record.createdAt,
            completed:
              String(record.status || "").toLowerCase() === "completed",
          };
          state.items.unshift(mapped);
        }
        state.saving = false;
      })
      .addCase(createExpertFollowUp.rejected, (state, action) => {
        state.saving = false;
        state.error =
          action.error.message ||
          "The follow-up consultation could not be created.";
      })
      .addCase(saveExpertAvailability.pending, (state) => {
        state.saving = true;
        state.error = "";
      })
      .addCase(saveExpertAvailability.fulfilled, (state, action) => {
        state.availability = Array.isArray(
          action.payload?.profile?.availableSlots,
        )
          ? action.payload.profile.availableSlots
          : action.payload.availableSlots;
        state.profile = { ...state.profile, ...action.payload.profile };
        state.saving = false;
      })
      .addCase(saveExpertAvailability.rejected, (state, action) => {
        state.saving = false;
        state.error =
          action.error.message || "Availability could not be saved.";
      });
  },
});

export default consultationsSlice.reducer;
