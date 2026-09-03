(function () {
  const STORAGE_KEY = "stackbuilders.liveSessions.v1";
  const EXPERT_STORAGE_KEY = "stackbuilders.hr.experts";
  const COMPANY_STORAGE_KEY = "stack-builders-companies";
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

  function parseDateOnly(value) {
    const raw = normalizeText(value);
    const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) {
      return null;
    }

    const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function parseTimeParts(value) {
    const raw = normalizeText(value);
    const match = raw.match(/^([01]\d|2[0-3]):([0-5]\d)$/);
    if (!match) {
      return null;
    }

    return {
      hours: Number(match[1]),
      minutes: Number(match[2]),
    };
  }

  function buildSessionStartDateTime(dateValue, timeValue) {
    const sessionDate = parseDateOnly(dateValue);
    const timeParts = parseTimeParts(timeValue);

    if (!sessionDate || !timeParts) {
      return null;
    }

    const dateTime = new Date(sessionDate);
    dateTime.setHours(timeParts.hours, timeParts.minutes, 0, 0);
    return Number.isNaN(dateTime.getTime()) ? null : dateTime;
  }

  function parseDurationMinutes(value) {
    const raw = normalizeText(value);
    const match = raw.match(/(\d+)/);
    if (!match) {
      return Number.NaN;
    }

    return Number(match[1]);
  }

  function buildSessionEndDateTime(record) {
    const startDateTime = buildSessionStartDateTime(record?.date, record?.startTime);
    const durationMinutes = parseDurationMinutes(record?.duration);

    if (!startDateTime || !Number.isFinite(durationMinutes) || durationMinutes <= 0) {
      return null;
    }

    return new Date(startDateTime.getTime() + durationMinutes * 60 * 1000);
  }

  function deriveLiveSessionStatus(record, now = new Date()) {
    const explicitStatus = normalizeLookupValue(record?.status);

    if (explicitStatus === "cancelled" || explicitStatus === "completed") {
      return explicitStatus;
    }

    const startDateTime = buildSessionStartDateTime(record?.date, record?.startTime);
    const endDateTime = buildSessionEndDateTime(record);

    if (!startDateTime || !endDateTime) {
      return explicitStatus || "scheduled";
    }

    if (now >= endDateTime) {
      return "completed";
    }

    if (now >= startDateTime) {
      return "ongoing";
    }

    return "scheduled";
  }

  function validateLiveSessionPayload(payload = {}) {
    const requiredFields = [
      ["title", "Enter a session title."],
      ["category", "Choose a session category."],
      ["sessionType", "Choose a session type."],
      ["date", "Choose a session date."],
      ["startTime", "Choose a start time."],
      ["duration", "Choose a session duration."],
      ["maxParticipants", "Enter the maximum participant count."],
      ["meetingLink", "Enter the meeting link."],
      ["description", "Enter a session description."],
    ];

    for (const [fieldName, message] of requiredFields) {
      if (!normalizeText(payload?.[fieldName])) {
        return { ok: false, error: message };
      }
    }

    const participantCount = Number(normalizeText(payload.maxParticipants));
    if (!Number.isInteger(participantCount) || participantCount < 1) {
      return {
        ok: false,
        error: "Maximum participants must be a whole number greater than 0.",
      };
    }

    const sessionDate = parseDateOnly(payload.date);
    if (!sessionDate) {
      return {
        ok: false,
        error: "Choose a valid session date.",
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (sessionDate < today) {
      return {
        ok: false,
        error: "Live sessions cannot be scheduled in the past.",
      };
    }

    const sessionStartDateTime = buildSessionStartDateTime(payload.date, payload.startTime);
    if (!sessionStartDateTime) {
      return {
        ok: false,
        error: "Choose a valid session start time.",
      };
    }

    if (sessionStartDateTime.getTime() < Date.now()) {
      return {
        ok: false,
        error: "Live sessions cannot start earlier than the current time.",
      };
    }

    const durationMinutes = parseDurationMinutes(payload.duration);
    if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
      return {
        ok: false,
        error: "Choose a valid session duration.",
      };
    }

    if (!isValidHttpUrl(payload.meetingLink)) {
      return {
        ok: false,
        error: "Enter a valid meeting link that starts with http:// or https://.",
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

  function normalizeExpertName(value) {
    const raw = normalizeText(value);
    if (!raw) return "";

    return raw.split("(")[0].trim();
  }

  function readCollection(storageKey) {
    try {
      const raw = window.localStorage.getItem(storageKey);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }

  function readExperts() {
    if (expertAuthStore?.readExperts) {
      return expertAuthStore.readExperts({ includeAllCompanies: true });
    }

    return readCollection(EXPERT_STORAGE_KEY);
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

  function getFallbackSingleCompanyContext() {
    const companies = readCollection(COMPANY_STORAGE_KEY);
    return companies.length === 1 ? createCompanyContext(companies[0]) : createCompanyContext({});
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

  function resolveSessionReadOptions(options = {}) {
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

  function resolveLiveSessionCompanyContext(record, expertRecord) {
    const explicitCompanyContext = createCompanyContext(record);
    if (hasCompanyContext(explicitCompanyContext)) {
      return explicitCompanyContext;
    }

    const expertCompanyContext = createCompanyContext(expertRecord);
    if (hasCompanyContext(expertCompanyContext)) {
      return expertCompanyContext;
    }

    return getFallbackSingleCompanyContext();
  }

  function normalizeLiveSessionRecord(record) {
    const createdAt = normalizeText(record?.createdAt) || new Date().toISOString();
    const expert = resolveExpertRecord(record || {});
    const hostName =
      normalizeExpertName(record?.hostName || expert?.name) || "Wellness Expert";
    const companyContext = resolveLiveSessionCompanyContext(record, expert);

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
      status: deriveLiveSessionStatus(record),
      expertId: normalizeText(record?.expertId) || normalizeText(expert?.id),
      hostName,
      companyId: companyContext.companyId,
      companyName: companyContext.companyName,
    };
  }

  function readLiveSessions(options = {}) {
    const { includeAllCompanies, companyContext } = resolveSessionReadOptions(options);

    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      const parsed = stored ? JSON.parse(stored) : [];
      const sessions = Array.isArray(parsed) ? parsed.map(normalizeLiveSessionRecord) : [];

      if (includeAllCompanies || !hasCompanyContext(companyContext)) {
        return sessions;
      }

      return sessions.filter((session) => matchesCompanyContext(session, companyContext));
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

  function persistLiveSessionLocally(record) {
    const nextSession = normalizeLiveSessionRecord(record);
    const sessions = readLiveSessions({ includeAllCompanies: true }).filter(
      (existingSession) => normalizeText(existingSession.id) !== normalizeText(nextSession.id)
    );

    sessions.unshift(nextSession);
    writeLiveSessions(sessions);
    return nextSession;
  }

  function mergeCompanyScopedLiveSessionsLocally(records, companyContext) {
    const normalizedCompanyContext = createCompanyContext(companyContext);
    const currentSessions = readLiveSessions({ includeAllCompanies: true });

    if (!hasCompanyContext(normalizedCompanyContext)) {
      writeLiveSessions(Array.isArray(records) ? records : []);
      return true;
    }

    const remainingSessions = currentSessions.filter(
      (session) => !matchesCompanyContext(session, normalizedCompanyContext)
    );

    writeLiveSessions([...(Array.isArray(records) ? records : []), ...remainingSessions]);
    return true;
  }

  function buildLiveSessionQueryString(filters = {}) {
    const params = new URLSearchParams();
    const normalizedStatus = normalizeText(filters.status);
    const normalizedExpertId = normalizeText(filters.expertId);
    const normalizedCompanyContext = createCompanyContext(filters);

    if (normalizedStatus) {
      params.set("status", normalizedStatus);
    }

    if (normalizedExpertId) {
      params.set("expertId", normalizedExpertId);
    }

    if (normalizedCompanyContext.companyId) {
      params.set("companyId", normalizedCompanyContext.companyId);
    } else if (normalizedCompanyContext.companyName) {
      params.set("companyName", normalizedCompanyContext.companyName);
    }

    const queryString = params.toString();
    return queryString ? `?${queryString}` : "";
  }

  async function syncLiveSessionsFromBackend(options = {}) {
    if (!window.appApiClient?.request) {
      return {
        ok: false,
        skipped: true,
      };
    }

    const companyContext = createCompanyContext(options);
    const resolvedCompanyContext = hasCompanyContext(companyContext)
      ? companyContext
      : getCurrentCompanyContext();

    try {
      const sessions = await window.appApiClient.request(
        `/live-sessions${buildLiveSessionQueryString({
          companyId: resolvedCompanyContext.companyId,
          companyName: resolvedCompanyContext.companyName,
        })}`
      );

      mergeCompanyScopedLiveSessionsLocally(sessions, resolvedCompanyContext);
      return {
        ok: true,
      };
    } catch (error) {
      console.error("Unable to refresh live sessions from the backend.", error);
      return {
        ok: false,
        error: error?.message || "The latest live sessions could not be loaded right now.",
      };
    }
  }

  async function createLiveSession(payload) {
    const validation = validateLiveSessionPayload(payload);
    if (!validation.ok) {
      return validation;
    }

    if (window.appApiClient?.request) {
      try {
        const session = await window.appApiClient.request("/live-sessions", {
          method: "POST",
          json: {
            ...payload,
            expertId: normalizeText(payload?.expertId),
            hostName: normalizeExpertName(payload?.hostName),
            companyId: normalizeText(payload?.companyId),
            companyName: normalizeText(payload?.companyName),
          },
        });

        persistLiveSessionLocally(session);
        return {
          ok: true,
          session,
        };
      } catch (error) {
        return {
          ok: false,
          error: error?.message || "Unable to create the live session right now.",
        };
      }
    }

    const now = new Date();
    const sessions = readLiveSessions({ includeAllCompanies: true });
    const expert = resolveExpertRecord(payload || {});
    const companyContext = resolveLiveSessionCompanyContext(payload, expert);

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
      companyId: companyContext.companyId,
      companyName: companyContext.companyName,
    });

    sessions.unshift(session);
    writeLiveSessions(sessions);
    return {
      ok: true,
      session,
    };
  }

  async function updateLiveSessionStatus(sessionId, status) {
    const normalizedSessionId = normalizeText(sessionId);
    const normalizedStatus = normalizeLookupValue(status);

    if (!normalizedSessionId) {
      return {
        ok: false,
        error: "Live session not found.",
      };
    }

    if (!normalizedStatus) {
      return {
        ok: false,
        error: "Choose a valid live session status.",
      };
    }

    if (window.appApiClient?.request) {
      try {
        const session = await window.appApiClient.request(
          `/live-sessions/${encodeURIComponent(normalizedSessionId)}`,
          {
            method: "PATCH",
            json: {
              status: normalizedStatus,
            },
          }
        );

        persistLiveSessionLocally(session);
        return {
          ok: true,
          session,
        };
      } catch (error) {
        return {
          ok: false,
          error: error?.message || "The live session status could not be updated right now.",
        };
      }
    }

    const currentSession =
      readLiveSessions({ includeAllCompanies: true }).find(
        (session) => normalizeText(session.id) === normalizedSessionId
      ) || null;

    if (!currentSession) {
      return {
        ok: false,
        error: "Live session not found.",
      };
    }

    const nextSession = persistLiveSessionLocally({
      ...currentSession,
      status: normalizedStatus,
    });

    return {
      ok: true,
      session: nextSession,
    };
  }

  function getSessionsByStatus(status, options = {}) {
    const expertId = normalizeText(options.expertId);
    const normalizedStatus = normalizeLookupValue(status);

    return readLiveSessions(options)
      .filter((session) => normalizeLookupValue(session.status) === normalizedStatus)
      .filter((session) =>
        expertId ? normalizeText(session.expertId) === expertId : true
      )
      .sort(
        (left, right) => {
          const leftDateTime = buildSessionStartDateTime(left.date, left.startTime);
          const rightDateTime = buildSessionStartDateTime(right.date, right.startTime);
          const leftTime = leftDateTime ? leftDateTime.getTime() : 0;
          const rightTime = rightDateTime ? rightDateTime.getTime() : 0;

          return normalizedStatus === "completed"
            ? rightTime - leftTime
            : leftTime - rightTime;
        },
      );
  }

  function getActiveSessions(options = {}) {
    return readLiveSessions(options)
      .filter((session) => {
        const normalizedStatus = normalizeLookupValue(session.status);
        return normalizedStatus === "scheduled" || normalizedStatus === "ongoing";
      })
      .filter((session) =>
        options?.expertId
          ? normalizeText(session.expertId) === normalizeText(options.expertId)
          : true
      )
      .sort((left, right) => {
        const leftDateTime = buildSessionStartDateTime(left.date, left.startTime);
        const rightDateTime = buildSessionStartDateTime(right.date, right.startTime);
        return (leftDateTime?.getTime() || 0) - (rightDateTime?.getTime() || 0);
      });
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
    validateLiveSessionPayload,
    deriveLiveSessionStatus,
    syncLiveSessionsFromBackend,
    createLiveSession,
    updateLiveSessionStatus,
    getSessionsByStatus,
    getActiveSessions,
    getUpcomingSessions,
    formatDate,
    formatTime,
    getInitials,
  };
})();
