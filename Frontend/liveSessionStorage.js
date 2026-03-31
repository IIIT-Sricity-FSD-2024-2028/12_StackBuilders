(function () {
  const STORAGE_KEY = "stackbuilders.liveSessions.v1";
  const EXPERT_STORAGE_KEY = "stackbuilders.hr.experts";

  function normalizeText(value) {
    return String(value || "").trim();
  }

  function normalizeExpertName(value) {
    const raw = normalizeText(value);
    if (!raw) return "";

    return raw.split("(")[0].trim();
  }

  function readExperts() {
    try {
      const raw = window.localStorage.getItem(EXPERT_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }

  function resolveExpertRecord({ expertId, hostName } = {}) {
    const experts = readExperts();
    const normalizedExpertId = normalizeText(expertId);
    const normalizedHostName = normalizeExpertName(hostName).toLowerCase();

    if (normalizedExpertId) {
      const byId =
        experts.find((expert) => normalizeText(expert?.id) === normalizedExpertId) || null;

      if (byId) {
        return byId;
      }
    }

    if (!normalizedHostName) {
      return null;
    }

    return (
      experts.find(
        (expert) =>
          normalizeExpertName(expert?.name).toLowerCase() === normalizedHostName
      ) || null
    );
  }

  function normalizeLiveSessionRecord(record) {
    const createdAt = normalizeText(record?.createdAt) || new Date().toISOString();
    const expert = resolveExpertRecord(record || {});
    const hostName =
      normalizeExpertName(record?.hostName || expert?.name) || "Wellness Expert";

    return {
      id:
        normalizeText(record?.id) ||
        (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `live-${Date.now()}-${Math.random().toString(16).slice(2)}`),
      title: normalizeText(record?.title),
      category: normalizeText(record?.category),
      sessionType: normalizeText(record?.sessionType),
      date: normalizeText(record?.date),
      startTime: normalizeText(record?.startTime),
      duration: normalizeText(record?.duration),
      maxParticipants: normalizeText(record?.maxParticipants),
      meetingLink: normalizeText(record?.meetingLink),
      description: normalizeText(record?.description),
      createdAt,
      status: normalizeText(record?.status) || "scheduled",
      expertId: normalizeText(record?.expertId) || normalizeText(expert?.id),
      hostName,
    };
  }

  function readLiveSessions() {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      const parsed = stored ? JSON.parse(stored) : [];
      return Array.isArray(parsed) ? parsed.map(normalizeLiveSessionRecord) : [];
    } catch (error) {
      console.error("Unable to read live session storage.", error);
      return [];
    }
  }

  function writeLiveSessions(sessions) {
    const normalizedSessions = Array.isArray(sessions)
      ? sessions.map(normalizeLiveSessionRecord)
      : [];

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizedSessions));
  }

  function createLiveSession(payload) {
    const now = new Date();
    const sessions = readLiveSessions();
    const expert = resolveExpertRecord(payload || {});

    const session = normalizeLiveSessionRecord({
      id:
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `live-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      title: payload?.title,
      category: payload?.category,
      sessionType: payload?.sessionType,
      date: payload?.date,
      startTime: payload?.startTime,
      duration: payload?.duration,
      maxParticipants: payload?.maxParticipants,
      meetingLink: payload?.meetingLink,
      description: payload?.description,
      createdAt: now.toISOString(),
      status: "scheduled",
      expertId: normalizeText(payload?.expertId) || normalizeText(expert?.id),
      hostName: normalizeExpertName(payload?.hostName || expert?.name),
    });

    sessions.unshift(session);
    writeLiveSessions(sessions);
    return session;
  }

  function getSessionsByStatus(status, options = {}) {
    const expertId = normalizeText(options.expertId);

    return readLiveSessions()
      .filter((session) => session.status === status)
      .filter((session) =>
        expertId ? normalizeText(session.expertId) === expertId : true
      )
      .sort(
        (left, right) => new Date(right.createdAt) - new Date(left.createdAt),
      );
  }

  function getUpcomingSessions(options = {}) {
    return getSessionsByStatus("scheduled", options);
  }

  function formatDate(dateValue) {
    if (!dateValue) return "";
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return dateValue;
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  function formatTime(timeValue) {
    if (!timeValue) return "";
    const [hours, minutes] = String(timeValue).split(":").map(Number);
    if (Number.isNaN(hours) || Number.isNaN(minutes)) return timeValue;

    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date.toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }

  function getInitials(text) {
    return String(text || "")
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || "")
      .join("");
  }

  window.liveSessionStore = {
    STORAGE_KEY,
    readLiveSessions,
    writeLiveSessions,
    createLiveSession,
    getSessionsByStatus,
    getUpcomingSessions,
    formatDate,
    formatTime,
    getInitials,
  };
})();
