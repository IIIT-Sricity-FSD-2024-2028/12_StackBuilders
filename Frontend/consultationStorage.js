(function () {
  const STORAGE_KEY = "stackbuilders.consultations.v1";
  const EXPERT_STORAGE_KEY = "stackbuilders.hr.experts";
  const employeeAuthStore = window.employeeAuthStore || null;
  const expertAuthStore = window.expertAuthStore || null;

  const FALLBACK_CATEGORY_MAP = {
    "Dr. Sarah Mitchell": "Wellness Coaching",
    "Dr. James Peterson": "Nutritional Guidance",
    "Dr. Emily Chen": "Mental Health Support",
  };

  function normalizeText(value) {
    return String(value || "").trim();
  }

  function normalizeExpertName(value) {
    const raw = normalizeText(value);
    if (!raw) return "";

    return raw.split("(")[0].trim();
  }

  function readExperts() {
    if (expertAuthStore?.readExperts) {
      return expertAuthStore.readExperts();
    }

    try {
      const raw = window.localStorage.getItem(EXPERT_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }

  function resolveExpertRecord({ expertId, expertName } = {}) {
    const experts = readExperts();
    const normalizedExpertId = normalizeText(expertId);
    const normalizedExpertName = normalizeExpertName(expertName).toLowerCase();

    if (normalizedExpertId) {
      const byId =
        experts.find((expert) => normalizeText(expert?.id) === normalizedExpertId) || null;

      if (byId) {
        return byId;
      }
    }

    if (!normalizedExpertName) {
      return null;
    }

    return (
      experts.find(
        (expert) =>
          normalizeExpertName(expert?.name).toLowerCase() === normalizedExpertName
      ) || null
    );
  }

  function buildRequestedOn(date) {
    const requestedDate = date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const requestedTime = date.toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    return `${requestedDate} @ ${requestedTime}`;
  }

  function getInitials(name) {
    return normalizeText(name)
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || "")
      .join("");
  }

  function getExpertCategory(expertInput) {
    const expertId =
      expertInput && typeof expertInput === "object"
        ? normalizeText(expertInput.expertId)
        : "";
    const expertName =
      expertInput && typeof expertInput === "object"
        ? normalizeExpertName(expertInput.expertName || expertInput.name)
        : normalizeExpertName(expertInput);
    const expert = resolveExpertRecord({ expertId, expertName });

    if (normalizeText(expert?.specialization)) {
      return normalizeText(expert.specialization);
    }

    return FALLBACK_CATEGORY_MAP[expertName] || "General Wellness";
  }

  function normalizeConsultationRecord(record) {
    const createdAt = normalizeText(record?.createdAt) || new Date().toISOString();
    const expert = resolveExpertRecord(record || {});
    const expertId = normalizeText(record?.expertId) || normalizeText(expert?.id);
    const expertName =
      normalizeExpertName(record?.expertName || expert?.name) || "Wellness Expert";

    return {
      id:
        normalizeText(record?.id) ||
        (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `consult-${Date.now()}-${Math.random().toString(16).slice(2)}`),
      employeeId: normalizeText(record?.employeeId),
      employeeName: normalizeText(record?.employeeName) || "Employee",
      expertId,
      expertName,
      purpose: normalizeText(record?.purpose),
      category:
        normalizeText(record?.category) ||
        getExpertCategory({ expertId, expertName }),
      requestedOn: normalizeText(record?.requestedOn) || buildRequestedOn(new Date(createdAt)),
      status: normalizeText(record?.status) || "requested",
      rejectionReason: normalizeText(record?.rejectionReason),
      sessionTitle: normalizeText(record?.sessionTitle),
      sessionDate: normalizeText(record?.sessionDate),
      sessionTime: normalizeText(record?.sessionTime),
      sessionDuration: normalizeText(record?.sessionDuration),
      sessionMeetingLink: normalizeText(record?.sessionMeetingLink),
      sessionCreatedAt: normalizeText(record?.sessionCreatedAt),
      createdAt,
    };
  }

  function readConsultations() {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      const parsed = stored ? JSON.parse(stored) : [];
      return Array.isArray(parsed) ? parsed.map(normalizeConsultationRecord) : [];
    } catch (error) {
      console.error("Unable to read consultation storage.", error);
      return [];
    }
  }

  function writeConsultations(consultations) {
    const normalizedConsultations = Array.isArray(consultations)
      ? consultations.map(normalizeConsultationRecord)
      : [];

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(normalizedConsultations)
    );
  }

  function createConsultationRequest({
    employeeId,
    employeeName,
    expertId,
    expertName,
    purpose,
  }) {
    const now = new Date();
    const consultations = readConsultations();
    const currentEmployee = employeeAuthStore?.getCurrentEmployee?.() || null;
    const expert = resolveExpertRecord({ expertId, expertName });
    const normalizedPurpose = normalizeText(purpose);

    if (!expert) {
      return {
        ok: false,
        error: "Selected wellness expert is no longer available.",
      };
    }

    if (!normalizedPurpose) {
      return {
        ok: false,
        error: "Please enter the purpose of your consultation request.",
      };
    }

    const request = normalizeConsultationRecord({
      id:
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `consult-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      employeeId: normalizeText(employeeId) || normalizeText(currentEmployee?.id),
      employeeName:
        normalizeText(employeeName) || normalizeText(currentEmployee?.name) || "Employee",
      expertId: normalizeText(expert.id),
      expertName: normalizeExpertName(expert.name),
      purpose: normalizedPurpose,
      category: getExpertCategory({ expertId: expert.id, expertName: expert.name }),
      requestedOn: buildRequestedOn(now),
      status: "requested",
      rejectionReason: "",
      createdAt: now.toISOString(),
    });

    consultations.unshift(request);
    writeConsultations(consultations);
    return { ok: true, request };
  }

  function updateConsultation(id, updates) {
    const normalizedId = normalizeText(id);
    const consultations = readConsultations().map((consultation) =>
      consultation.id === normalizedId
        ? normalizeConsultationRecord({
            ...consultation,
            ...updates,
            id: consultation.id,
            createdAt: consultation.createdAt,
          })
        : consultation
    );

    writeConsultations(consultations);
    return consultations;
  }

  function getConsultationById(id) {
    const normalizedId = normalizeText(id);
    if (!normalizedId) return null;

    return (
      readConsultations().find(
        (consultation) => normalizeText(consultation.id) === normalizedId
      ) || null
    );
  }

  function getConsultationsByStatus(status, options = {}) {
    const employeeId = normalizeText(options.employeeId);
    const expertId = normalizeText(options.expertId);

    return readConsultations()
      .filter((consultation) => consultation.status === status)
      .filter((consultation) =>
        employeeId ? normalizeText(consultation.employeeId) === employeeId : true
      )
      .filter((consultation) =>
        expertId ? normalizeText(consultation.expertId) === expertId : true
      )
      .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));
  }

  function hasScheduledSession(record) {
    return Boolean(
      normalizeText(record?.sessionTitle) &&
        normalizeText(record?.sessionDate) &&
        normalizeText(record?.sessionTime) &&
        normalizeText(record?.sessionDuration) &&
        normalizeText(record?.sessionMeetingLink)
    );
  }

  function getAcceptedConsultations(options = {}) {
    return getConsultationsByStatus("accepted", options);
  }

  function getUpcomingConsultations(options = {}) {
    return getAcceptedConsultations(options).filter(hasScheduledSession);
  }

  function getCurrentEmployeeConsultationsByStatus(status) {
    const currentEmployee = employeeAuthStore?.getCurrentEmployee?.() || null;
    if (!currentEmployee) return [];

    return getConsultationsByStatus(status, { employeeId: currentEmployee.id });
  }

  function getCurrentEmployeeUpcomingConsultations() {
    return getCurrentEmployeeConsultationsByStatus("accepted");
  }

  function getCurrentExpertConsultationsByStatus(status) {
    const currentExpert = expertAuthStore?.getCurrentExpert?.() || null;
    if (!currentExpert) return [];

    return getConsultationsByStatus(status, { expertId: currentExpert.id });
  }

  function getCurrentExpertUpcomingConsultations() {
    const currentExpert = expertAuthStore?.getCurrentExpert?.() || null;
    if (!currentExpert) return [];

    return getUpcomingConsultations({ expertId: currentExpert.id });
  }

  function getCurrentExpertAcceptedConsultations() {
    const currentExpert = expertAuthStore?.getCurrentExpert?.() || null;
    if (!currentExpert) return [];

    return getAcceptedConsultations({ expertId: currentExpert.id });
  }

  function splitRequestedOn(requestedOn) {
    const raw = normalizeText(requestedOn);
    if (!raw) {
      return { date: "", time: "" };
    }

    if (raw.includes(" @ ")) {
      const [date, ...timeParts] = raw.split(" @ ");
      return {
        date: date || "",
        time: timeParts.join(" @ ") || "",
      };
    }

    const legacyParts = raw
      .split(/â€¢|Ã¢â‚¬Â¢|ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢|ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢|ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢/)
      .map((part) => part.trim())
      .filter(Boolean);

    return {
      date: legacyParts[0] || raw,
      time: legacyParts[1] || "",
    };
  }

  function formatScheduleDate(dateValue) {
    const raw = normalizeText(dateValue);
    if (!raw) return "";

    const exactDateMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    const date = exactDateMatch
      ? new Date(
          Number(exactDateMatch[1]),
          Number(exactDateMatch[2]) - 1,
          Number(exactDateMatch[3])
        )
      : new Date(raw);
    if (Number.isNaN(date.getTime())) return raw;

    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  function formatScheduleTime(timeValue) {
    const raw = normalizeText(timeValue);
    if (!raw) return "";

    const [hours, minutes] = raw.split(":").map(Number);
    if (Number.isNaN(hours) || Number.isNaN(minutes)) return raw;

    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date.toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }

  window.consultationStore = {
    STORAGE_KEY,
    readConsultations,
    writeConsultations,
    createConsultationRequest,
    updateConsultation,
    getConsultationById,
    getConsultationsByStatus,
    getAcceptedConsultations,
    getUpcomingConsultations,
    getCurrentEmployeeConsultationsByStatus,
    getCurrentEmployeeUpcomingConsultations,
    getCurrentExpertConsultationsByStatus,
    getCurrentExpertUpcomingConsultations,
    getCurrentExpertAcceptedConsultations,
    getInitials,
    getExpertCategory,
    hasScheduledSession,
    splitRequestedOn,
    formatScheduleDate,
    formatScheduleTime,
  };
})();
