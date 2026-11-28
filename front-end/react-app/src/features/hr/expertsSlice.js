import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import hrApi from "./hrApi.js";

export const loadHrExperts = createAsyncThunk("hr/experts/load", (context) => hrApi.getExperts(context));
export const createHrExpert = createAsyncThunk("hr/experts/create", (payload) => hrApi.createExpert(payload));
export const removeHrExpert = createAsyncThunk("hr/experts/remove", async (id) => { await hrApi.deleteExpert(id); return id; });

const expertsSlice = createSlice({
  name: "hrExperts",
  initialState: { items: [], loading: false, saving: false, removing: false, error: "" },
  reducers: {
    clearHrExpertsError(state) { state.error = ""; },
  },
  extraReducers(builder) {
    builder
      .addCase(loadHrExperts.pending, (state) => { state.loading = true; state.error = ""; })
      .addCase(loadHrExperts.fulfilled, (state, action) => { state.items = action.payload || []; state.loading = false; })
      .addCase(loadHrExperts.rejected, (state, action) => { state.loading = false; state.error = action.error.message || "Could not load experts."; })
      .addCase(createHrExpert.pending, (state) => { state.saving = true; state.error = ""; })
      .addCase(createHrExpert.fulfilled, (state, action) => { if (action.payload) state.items.unshift(action.payload); state.saving = false; })
      .addCase(createHrExpert.rejected, (state, action) => { state.saving = false; state.error = action.error.message || "Could not create expert."; })
      .addCase(removeHrExpert.pending, (state) => { state.removing = true; state.error = ""; })
      .addCase(removeHrExpert.fulfilled, (state, action) => { state.items = state.items.filter((item) => item.id !== action.payload); state.removing = false; })
      .addCase(removeHrExpert.rejected, (state, action) => { state.removing = false; state.error = action.error.message || "Could not remove expert."; });
  },
});

export const { clearHrExpertsError } = expertsSlice.actions;
export default expertsSlice.reducer;
