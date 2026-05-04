(function () {
  const STORAGE_KEY = "stackbuilders.videoLibrary.v1";
  const COMPANY_STORAGE_KEY = "stack-builders-companies";
  const EXPERT_STORAGE_KEY = "stackbuilders.hr.experts";
  const expertAuthStore = window.expertAuthStore || null;
  const employeeAuthStore = window.employeeAuthStore || null;
  const hrAuthStore = window.hrAuthStore || null;

  function normalizeText(value) {
    return String(value || "").trim();
  }

  function normalizeLookupValue(value) {
    return normalizeText(value).toLowerCase();
  }

  function isValidHttpUrl(value) {
    try {
      const url = new URL(normalizeText(value));
      return url.protocol === "http:" || url.protocol === "https:";
    } catch (error) {
      return false;
    }
  }

  function validateVideoPayload(payload = {}) {
    const requiredFields = [
      ["title", "Enter a video title."],
      ["category", "Choose a video category."],
      ["duration", "Enter the video duration."],
      ["videoLink", "Enter the video link."],
      ["thumbnailLink", "Enter the thumbnail image link."],
      ["description", "Enter a short video description."],
    ];

    for (const [fieldName, message] of requiredFields) {
      if (!normalizeText(payload?.[fieldName])) {
        return { ok: false, error: message };
      }
    }

    if (!isValidHttpUrl(payload.videoLink)) {
      return {
        ok: false,
        error: "Enter a valid video link that starts with http:// or https://.",
      };
    }

    if (!isValidHttpUrl(payload.thumbnailLink)) {
      return {
        ok: false,
        error: "Enter a valid thumbnail link that starts with http:// or https://.",
      };
    }

    return { ok: true };
  }

  function createCompanyContext(companyLike) {
    return {
      companyId: normalizeText(companyLike?.companyId || companyLike?.id),
      companyName: normalizeText(companyLike?.companyName || companyLike?.name),
    };
  }

  function hasCompanyContext(companyContext) {
    return Boolean(
      normalizeText(companyContext?.companyId) || normalizeText(companyContext?.companyName)
    );
  }

  function matchesCompanyContext(record, companyContext) {
    const normalizedContext = createCompanyContext(companyContext);

    if (!hasCompanyContext(normalizedContext)) {
      return true;
    }

    const recordCompanyId = normalizeText(record?.companyId);
    const recordCompanyName = normalizeLookupValue(record?.companyName);

    if (
      normalizedContext.companyId &&
      recordCompanyId &&
      recordCompanyId === normalizedContext.companyId
    ) {
      return true;
    }

    return Boolean(
      normalizedContext.companyName &&
      recordCompanyName &&
      recordCompanyName === normalizeLookupValue(normalizedContext.companyName)
    );
  }

  function readCollection(storageKey) {
    try {
      const stored = window.localStorage.getItem(storageKey);
      const parsed = stored ? JSON.parse(stored) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }

  function getFallbackSingleCompanyContext() {
    const companies = readCollection(COMPANY_STORAGE_KEY);
    return companies.length === 1 ? createCompanyContext(companies[0]) : createCompanyContext({});
  }

  function readExperts() {
    if (expertAuthStore?.readExperts) {
      return expertAuthStore.readExperts({ includeAllCompanies: true });
    }

    return readCollection(EXPERT_STORAGE_KEY);
  }

  function resolveExpertRecord({ creatorExpertId, expertId } = {}) {
    const experts = readExperts();
    const normalizedExpertId = normalizeText(creatorExpertId || expertId);

    if (!normalizedExpertId) {
      return null;
    }

    return (
      experts.find((expert) => normalizeText(expert?.id) === normalizedExpertId) || null
    );
  }

  function getCurrentCompanyContext() {
    const hrCompanyContext = hrAuthStore?.getCurrentCompanyContext?.() || createCompanyContext({});
    if (hasCompanyContext(hrCompanyContext)) {
      return hrCompanyContext;
    }

    const employeeCompanyContext =
      employeeAuthStore?.getCurrentCompanyContext?.() || createCompanyContext({});
    if (hasCompanyContext(employeeCompanyContext)) {
      return employeeCompanyContext;
    }

    const expertCompanyContext =
      expertAuthStore?.getCurrentCompanyContext?.() || createCompanyContext({});
    if (hasCompanyContext(expertCompanyContext)) {
      return expertCompanyContext;
    }

    return getFallbackSingleCompanyContext();
  }

  function resolveVideoReadOptions(options = {}) {
    if (options?.includeAllCompanies) {
      return {
        includeAllCompanies: true,
        companyContext: createCompanyContext({}),
      };
    }

    const explicitCompanyContext = createCompanyContext(options);

    return {
      includeAllCompanies: false,
      companyContext: hasCompanyContext(explicitCompanyContext)
        ? explicitCompanyContext
        : getCurrentCompanyContext(),
    };
  }

  function resolveVideoCompanyContext(record) {
    const explicitCompanyContext = createCompanyContext(record);
    if (hasCompanyContext(explicitCompanyContext)) {
      return explicitCompanyContext;
    }

    const creatorExpert = resolveExpertRecord(record || {});
    const creatorCompanyContext = createCompanyContext(creatorExpert);

    if (hasCompanyContext(creatorCompanyContext)) {
      return creatorCompanyContext;
    }

    return getFallbackSingleCompanyContext();
  }

  function normalizeVideoRecord(record) {
    const creatorExpert = resolveExpertRecord(record || {});
    const companyContext = resolveVideoCompanyContext(record);

    return {
      id:
        normalizeText(record?.id) ||
        (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `video-${Date.now()}-${Math.random().toString(16).slice(2)}`),
      title: normalizeText(record?.title),
      category: normalizeText(record?.category),
      duration: normalizeText(record?.duration) || "00:00",
      videoLink: normalizeText(record?.videoLink),
      thumbnailLink: normalizeText(record?.thumbnailLink),
      description: normalizeText(record?.description),
      createdAt: normalizeText(record?.createdAt) || new Date().toISOString(),
      creatorExpertId: normalizeText(record?.creatorExpertId || record?.expertId),
      creatorExpertName:
        normalizeText(record?.creatorExpertName) ||
        normalizeText(creatorExpert?.name) ||
        "Wellness Expert",
      companyId: companyContext.companyId,
      companyName: companyContext.companyName,
    };
  }

  function readVideos(options = {}) {
    const { includeAllCompanies, companyContext } = resolveVideoReadOptions(options);

    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      const parsed = stored ? JSON.parse(stored) : [];
      const videos = Array.isArray(parsed) ? parsed.map(normalizeVideoRecord) : [];

      if (includeAllCompanies || !hasCompanyContext(companyContext)) {
        return videos;
      }

      return videos.filter((video) => matchesCompanyContext(video, companyContext));
    } catch (error) {
      console.error("Unable to read video library storage.", error);
      return [];
    }
  }

  function writeVideos(videos) {
    const normalizedVideos = Array.isArray(videos) ? videos.map(normalizeVideoRecord) : [];
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizedVideos));
  }

  function persistVideoLocally(record) {
    const nextVideo = normalizeVideoRecord(record);
    const videos = readVideos({ includeAllCompanies: true }).filter(
      (existingVideo) => normalizeText(existingVideo.id) !== normalizeText(nextVideo.id)
    );

    videos.unshift(nextVideo);
    writeVideos(videos);
    return nextVideo;
  }

  function mergeCompanyScopedVideosLocally(records, companyContext) {
    const normalizedCompanyContext = createCompanyContext(companyContext);
    const currentVideos = readVideos({ includeAllCompanies: true });

    if (!hasCompanyContext(normalizedCompanyContext)) {
      writeVideos(Array.isArray(records) ? records : []);
      return true;
    }

    const remainingVideos = currentVideos.filter(
      (video) => !matchesCompanyContext(video, normalizedCompanyContext)
    );

    writeVideos([...(Array.isArray(records) ? records : []), ...remainingVideos]);
    return true;
  }

  function removeVideoLocally(videoId) {
    const normalizedVideoId = normalizeText(videoId);
    const currentVideos = readVideos({ includeAllCompanies: true }).filter(
      (video) => normalizeText(video.id) !== normalizedVideoId
    );

    writeVideos(currentVideos);
    return true;
  }

  function buildVideoQueryString(filters = {}) {
    const params = new URLSearchParams();
    const normalizedCreatorExpertId = normalizeText(filters.creatorExpertId);
    const normalizedCategory = normalizeText(filters.category);
    const normalizedCompanyContext = createCompanyContext(filters);

    if (normalizedCreatorExpertId) {
      params.set("creatorExpertId", normalizedCreatorExpertId);
    }

    if (normalizedCategory) {
      params.set("category", normalizedCategory);
    }

    if (normalizedCompanyContext.companyId) {
      params.set("companyId", normalizedCompanyContext.companyId);
    } else if (normalizedCompanyContext.companyName) {
      params.set("companyName", normalizedCompanyContext.companyName);
    }

    const queryString = params.toString();
    return queryString ? `?${queryString}` : "";
  }

  async function syncVideosFromBackend(options = {}) {
    if (!window.appApiClient?.request) {
      return {
        ok: false,
        skipped: true,
      };
    }

    const companyContext = createCompanyContext(options);
    const resolvedCompanyContext = options?.includeAllCompanies
      ? createCompanyContext({})
      : hasCompanyContext(companyContext)
        ? companyContext
        : getCurrentCompanyContext();

    try {
      const videos = await window.appApiClient.request(
        `/videos${buildVideoQueryString({
          creatorExpertId: options?.creatorExpertId,
          category: options?.category,
          companyId: resolvedCompanyContext.companyId,
          companyName: resolvedCompanyContext.companyName,
        })}`
      );

      mergeCompanyScopedVideosLocally(videos, resolvedCompanyContext);
      return {
        ok: true,
      };
    } catch (error) {
      console.error("Unable to refresh videos from the backend.", error);
      return {
        ok: false,
        error: error?.message || "The latest videos could not be loaded right now.",
      };
    }
  }

  function createVideoRecord(payload) {
    const now = new Date();
    const currentExpert = expertAuthStore?.getCurrentExpert?.() || null;
    const explicitCompanyContext = createCompanyContext(payload);
    const creatorExpert = resolveExpertRecord(payload || {}) || currentExpert;
    const creatorCompanyContext = createCompanyContext(creatorExpert);
    const companyContext =
      hasCompanyContext(explicitCompanyContext)
        ? explicitCompanyContext
        : hasCompanyContext(creatorCompanyContext)
          ? creatorCompanyContext
          : getCurrentCompanyContext();

    return normalizeVideoRecord({
      id:
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `video-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      title: normalizeText(payload?.title),
      category: normalizeText(payload?.category),
      duration: normalizeText(payload?.duration) || "00:00",
      videoLink: normalizeText(payload?.videoLink),
      thumbnailLink: normalizeText(payload?.thumbnailLink),
      description: normalizeText(payload?.description),
      createdAt: now.toISOString(),
      creatorExpertId:
        normalizeText(payload?.creatorExpertId || payload?.expertId) || normalizeText(creatorExpert?.id),
      creatorExpertName:
        normalizeText(payload?.creatorExpertName) ||
        normalizeText(creatorExpert?.name) ||
        "Wellness Expert",
      companyId: companyContext.companyId,
      companyName: companyContext.companyName,
    });
  }

  async function createVideo(payload) {
    const validation = validateVideoPayload(payload);
    if (!validation.ok) {
      return validation;
    }

    if (window.appApiClient?.request) {
      try {
        const currentExpert = expertAuthStore?.getCurrentExpert?.() || null;
        const companyContext = createCompanyContext(payload);
        const resolvedCompanyContext = hasCompanyContext(companyContext)
          ? companyContext
          : createCompanyContext(currentExpert);
        const video = await window.appApiClient.request("/videos", {
          method: "POST",
          json: {
            ...payload,
            creatorExpertId:
              normalizeText(payload?.creatorExpertId || payload?.expertId) || normalizeText(currentExpert?.id),
            companyId: normalizeText(resolvedCompanyContext.companyId),
            companyName: normalizeText(resolvedCompanyContext.companyName),
          },
        });

        persistVideoLocally(video);
        return {
          ok: true,
          video,
        };
      } catch (error) {
        return {
          ok: false,
          error: error?.message || "Unable to save the video right now.",
        };
      }
    }

    const videos = readVideos({ includeAllCompanies: true });
    const record = createVideoRecord(payload);
    videos.unshift(record);
    writeVideos(videos);
    return {
      ok: true,
      video: record,
    };
  }

  async function updateVideo(videoId, payload) {
    const normalizedVideoId = normalizeText(videoId);
    if (!normalizedVideoId) {
      return {
        ok: false,
        error: "Select a valid video before saving changes.",
      };
    }

    const validation = validateVideoPayload(payload);
    if (!validation.ok) {
      return validation;
    }

    if (window.appApiClient?.request) {
      try {
        const updatedVideo = await window.appApiClient.request(
          `/videos/${encodeURIComponent(normalizedVideoId)}`,
          {
            method: "PATCH",
            json: payload,
          }
        );

        persistVideoLocally(updatedVideo);
        return {
          ok: true,
          video: updatedVideo,
        };
      } catch (error) {
        return {
          ok: false,
          error: error?.message || "Unable to update the video right now.",
        };
      }
    }

    const currentVideos = readVideos({ includeAllCompanies: true });
    const existingVideo = currentVideos.find(
      (video) => normalizeText(video.id) === normalizedVideoId
    );

    if (!existingVideo) {
      return {
        ok: false,
        error: "The selected video could not be found.",
      };
    }

    const nextVideo = normalizeVideoRecord({
      ...existingVideo,
      ...payload,
      id: existingVideo.id,
      createdAt: existingVideo.createdAt,
    });

    persistVideoLocally(nextVideo);
    return {
      ok: true,
      video: nextVideo,
    };
  }

  async function deleteVideo(videoId) {
    const normalizedVideoId = normalizeText(videoId);
    if (!normalizedVideoId) {
      return {
        ok: false,
        error: "Select a valid video before deleting it.",
      };
    }

    if (window.appApiClient?.request) {
      try {
        const deletedVideo = await window.appApiClient.request(
          `/videos/${encodeURIComponent(normalizedVideoId)}`,
          {
            method: "DELETE",
          }
        );

        removeVideoLocally(normalizedVideoId);
        return {
          ok: true,
          video: deletedVideo,
        };
      } catch (error) {
        return {
          ok: false,
          error: error?.message || "Unable to delete the video right now.",
        };
      }
    }

    removeVideoLocally(normalizedVideoId);
    return {
      ok: true,
    };
  }

  window.videoLibraryStore = {
    STORAGE_KEY,
    readVideos,
    writeVideos,
    validateVideoPayload,
    syncVideosFromBackend,
    createVideo,
    updateVideo,
    deleteVideo,
    addVideo: createVideo,
  };
})();
