import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import expertApi from "./expertApi.js";
import { loadExpertWorkspaceData } from "./expertData.js";

const pendingUploads = new Map();
export function registerExpertVideoFiles(files) {
  const token = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  pendingUploads.set(token, files);
  return token;
}

export const loadExpertVideos = createAsyncThunk("expert/videos/load", (expert) => expertApi.getVideos(expert));
export const createExpertVideo = createAsyncThunk("expert/videos/create", async ({ video, expert, filesToken }) => {
  const files = pendingUploads.get(filesToken) || {};
  try {
    const thumbnailFile = video.thumbnailSource === "upload"
      ? files.thumbnailFile || (video.videoSource === "upload" ? files.generatedThumbnailFile : null)
      : video.thumbnailLink?.trim() ? null : video.videoSource === "upload" ? files.generatedThumbnailFile : null;
    return await expertApi.createVideo({
      title: video.title,
      category: video.category,
      duration: video.duration,
      videoLink: video.videoSource === "upload" ? "" : video.videoLink,
      thumbnailLink: video.thumbnailSource === "link" ? video.thumbnailLink : "",
      description: video.description,
      creatorExpertId: expert?.id,
      creatorExpertName: expert?.name,
      companyId: expert?.companyId,
      companyName: expert?.companyName,
    }, { videoFile: video.videoSource === "upload" ? files.videoFile : null, thumbnailFile });
  } finally { pendingUploads.delete(filesToken); }
});
export const removeExpertVideo = createAsyncThunk("expert/videos/remove", ({ id, expertId }) => expertApi.deleteVideo(id, expertId).then(() => id));

const videosSlice = createSlice({
  name: "expertVideos",
  initialState: { items: loadExpertWorkspaceData().videos, loading: false, saving: false, error: "" },
  reducers: {},
  extraReducers(builder) {
    builder
      .addCase(loadExpertVideos.pending, (state) => { state.loading = true; state.error = ""; })
      .addCase(loadExpertVideos.fulfilled, (state, action) => { state.items = action.payload || []; state.loading = false; })
      .addCase(loadExpertVideos.rejected, (state, action) => { state.loading = false; state.error = action.error.message || "Unable to load videos."; })
      .addCase(createExpertVideo.pending, (state) => { state.saving = true; state.error = ""; })
      .addCase(createExpertVideo.fulfilled, (state, action) => { if (action.payload) state.items.push(action.payload); state.saving = false; })
      .addCase(createExpertVideo.rejected, (state, action) => { state.saving = false; state.error = action.error.message || "The video could not be saved."; })
      .addCase(removeExpertVideo.pending, (state) => { state.saving = true; state.error = ""; })
      .addCase(removeExpertVideo.fulfilled, (state, action) => { state.items = state.items.filter((video) => video.id !== action.payload); state.saving = false; })
      .addCase(removeExpertVideo.rejected, (state, action) => { state.saving = false; state.error = action.error.message || "The video could not be deleted."; });
  },
});

export default videosSlice.reducer;
