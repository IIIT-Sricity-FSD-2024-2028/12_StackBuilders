(function () {
  const STORAGE_KEY = "stackbuilders.videoLibrary.v1";

  function readVideos() {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      const parsed = stored ? JSON.parse(stored) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error("Unable to read video library storage.", error);
      return [];
    }
  }

  function writeVideos(videos) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(videos));
  }

  function createVideoRecord(payload) {
    const now = new Date();

    return {
      id:
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `video-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      title: payload.title,
      category: payload.category,
      duration: payload.duration || "00:00",
      videoLink: payload.videoLink,
      thumbnailLink:
        payload.thumbnailLink ||
        "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=900&q=80",
      description: payload.description || "",
      createdAt: now.toISOString(),
    };
  }

  function addVideo(payload) {
    const videos = readVideos();
    const record = createVideoRecord(payload);
    videos.unshift(record);
    writeVideos(videos);
    return record;
  }

  window.videoLibraryStore = {
    readVideos,
    writeVideos,
    addVideo,
  };
})();
