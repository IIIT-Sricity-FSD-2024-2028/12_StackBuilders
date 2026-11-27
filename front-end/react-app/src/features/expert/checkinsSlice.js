import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import expertApi from "./expertApi.js";
import { loadExpertWorkspaceData } from "./expertData.js";
import { mapExpertCheckins } from "./expertMappers.js";

export const loadExpertCheckins = createAsyncThunk(
  "expert/checkins/load",
  async (expert) => {
    const [checkins, responses] = await Promise.all([
      expertApi.getCheckins(expert),
      expertApi.getCheckinResponses(expert),
    ]);
    return mapExpertCheckins(
      checkins || [],
      responses || [],
      expert?.specialization,
    );
  },
);
export const sendExpertCheckinResponse = createAsyncThunk(
  "expert/checkins/respond",
  async ({ checkin, message, expert }) => ({
    checkinId: checkin.id,
    response: await expertApi.createCheckinResponse({
      checkinId: checkin.id,
      checkinType: checkin.checkinType,
      employeeId: checkin.employeeId,
      employeeName: checkin.employeeName || checkin.employee,
      expertId: expert?.id,
      expertName: expert?.name,
      companyId: checkin.companyId || expert?.companyId,
      companyName: checkin.companyName || expert?.companyName,
      message,
    }),
  }),
);

const checkinsSlice = createSlice({
  name: "expertCheckins",
  initialState: {
    items: loadExpertWorkspaceData().checkins,
    loading: false,
    saving: false,
    error: "",
  },
  reducers: {},
  extraReducers(builder) {
    builder
      .addCase(loadExpertCheckins.pending, (state) => {
        state.loading = true;
        state.error = "";
      })
      .addCase(loadExpertCheckins.fulfilled, (state, action) => {
        state.items = action.payload;
        state.loading = false;
      })
      .addCase(loadExpertCheckins.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.error.message || "Unable to load employee check-ins.";
      })
      .addCase(sendExpertCheckinResponse.pending, (state) => {
        state.saving = true;
        state.error = "";
      })
      .addCase(sendExpertCheckinResponse.fulfilled, (state, action) => {
        const { checkinId, response } = action.payload;
        state.items = state.items.map((record) =>
          record.id === checkinId
            ? {
                ...record,
                responses: [
                  ...(record.responses || []),
                  {
                    text: response.message,
                    createdAt: response.createdAt,
                    expertId: response.expertId,
                    expertName: response.expertName,
                  },
                ],
                followUpStatus: "Suggestion sent",
              }
            : record,
        );
        state.saving = false;
      })
      .addCase(sendExpertCheckinResponse.rejected, (state, action) => {
        state.saving = false;
        state.error =
          action.error.message || "The suggestion could not be sent.";
      });
  },
});

export default checkinsSlice.reducer;
