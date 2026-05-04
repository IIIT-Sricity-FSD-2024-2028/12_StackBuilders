(function () {
  const STORAGE_KEY = "stackbuilders.consultations.v1";
  const EXPERT_STORAGE_KEY = "stackbuilders.hr.experts";
  const EMPLOYEE_STORAGE_KEY = "stackbuilders.hr.employees";
  const COMPANY_STORAGE_KEY = "stack-builders-companies";
  const employeeAuthStore = window.employeeAuthStore || null;
  const expertAuthStore = window.expertAuthStore || null;
  const hrAuthStore = window.hrAuthStore || null;

  const FALLBACK_CATEGORY_MAP = {
    "Dr. Sarah Mitchell": "Wellness Coaching",
    "Dr. James Peterson": "Nutritional Guidance",
    "Dr. Emily Chen": "Mental Health Support",
  };

  function normalizeText(value) {
    return String(value || "").trim();
  }

  function normalizeLookupValue(value) {
    return normalizeText(value).toLowerCase();
  }

  function normalizeExpertName(value) {
    const raw = normalizeText(value);
    if (!raw) return "";

    return raw.split("(")[0].trim();
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
      const raw = window.localStorage.getItem(storageKey);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }

  function readEmployees() {
    if (employeeAuthStore?.readEmployees) {
      return employeeAuthStore.readEmployees({ includeAllCompanies: true });
    }

    return readCollection(EMPLOYEE_STORAGE_KEY);
  }

  function readExperts() {
    if (expertAuthStore?.readExperts) {
      return expertAuthStore.readExperts({ includeAllCompanies: true });
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

  function resolveEmployeeRecord({ employeeId } = {}) {
    const normalizedEmployeeId = normalizeText(employeeId);

    if (!normalizedEmployeeId) {
      return null;
    }

    return (
      readEmployees().find(
        (employee) => normalizeText(employee?.id) === normalizedEmployeeId
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

  function resolveConsultationReadOptions(options = {}) {
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

  function resolveConsultationCompanyContext(record, employeeRecord, expertRecord) {
    const explicitCompanyContext = createCompanyContext(record);
    if (hasCompanyContext(explicitCompanyContext)) {
      return explicitCompanyContext;
    }

    const employeeCompanyContext = createCompanyContext(employeeRecord);
    if (hasCompanyContext(employeeCompanyContext)) {
      return employeeCompanyContext;
    }

    const expertCompanyContext = createCompanyContext(expertRecord);
    if (hasCompanyContext(expertCompanyContext)) {
      return expertCompanyContext;
    }

    return getFallbackSingleCompanyContext();
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
    const employeeRecord = resolveEmployeeRecord(record || {});
    const expert = resolveExpertRecord(record || {});
    const expertId = normalizeText(record?.expertId) || normalizeText(expert?.id);
    const expertName =
      normalizeExpertName(record?.expertName || expert?.name) || "Wellness Expert";
    const companyContext = resolveConsultationCompanyContext(record, employeeRecord, expert);

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
      createdByExpert: Boolean(record?.createdByExpert),
      sourceCheckinId: normalizeText(record?.sourceCheckinId),
      followUpPriority: normalizeText(record?.followUpPriority),
      companyId: companyContext.companyId,
      companyName: companyContext.companyName,
      createdAt,
    };
  }

  function readConsultations(options = {}) {
    const { includeAllCompanies, companyContext } = resolveConsultationReadOptions(options);

    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      const parsed = stored ? JSON.parse(stored) : [];
      const consultations = Array.isArray(parsed) ? parsed.map(normalizeConsultationRecord) : [];

      if (includeAllCompanies || !hasCompanyContext(companyContext)) {
        return consultations;
      }

      return consultations.filter((consultation) =>
        matchesCompanyContext(consultation, companyContext)
      );
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

  function persistConsultationLocally(record) {
    const nextConsultation = normalizeConsultationRecord(record);
    const consultations = readConsultations({ includeAllCompanies: true }).filter(
      (consultation) => normalizeText(consultation.id) !== normalizeText(nextConsultation.id)
    );

    consultations.unshift(nextConsultation);
    writeConsultations(consultations);
    return nextConsultation;
  }

  function mergeCompanyScopedConsultationsLocally(records, companyContext) {
    const normalizedCompanyContext = createCompanyContext(companyContext);
    const currentConsultations = readConsultations({ includeAllCompanies: true });

    if (!hasCompanyContext(normalizedCompanyContext)) {
      writeConsultations(Array.isArray(records) ? records : []);
      return true;
    }

    const remainingConsultations = currentConsultations.filter(
      (consultation) => !matchesCompanyContext(consultation, normalizedCompanyContext)
    );

    writeConsultations([...(Array.isArray(records) ? records : []), ...remainingConsultations]);
    return true;
  }

  function buildConsultationQueryString(companyContext) {
    const normalizedCompanyContext = createCompanyContext(companyContext);
    const params = new URLSearchParams();

    if (normalizedCompanyContext.companyId) {
      params.set("companyId", normalizedCompanyContext.companyId);
    } else if (normalizedCompanyContext.companyName) {
      params.set("companyName", normalizedCompanyContext.companyName);
    }

    const queryString = params.toString();
    return queryString ? `?${queryString}` : "";
  }

  async function syncConsultationsFromBackend(options = {}) {
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
      const consultations = await window.appApiClient.request(
        `/consultations${buildConsultationQueryString(resolvedCompanyContext)}`
      );

      mergeCompanyScopedConsultationsLocally(consultations, resolvedCompanyContext);
      return {
        ok: true,
      };
    } catch (error) {
      console.error("Unable to refresh consultation data from the backend.", error);
      return {
        ok: false,
        error: error?.message || "The latest consultations could not be loaded right now.",
      };
    }
  }

  async function createConsultationRequest({
    employeeId,
    employeeName,
    expertId,
    expertName,
    purpose,
  }) {
    const now = new Date();
    const consultations = readConsultations({ includeAllCompanies: true });
    const currentEmployee = employeeAuthStore?.getCurrentEmployee?.() || null;
    const expert = resolveExpertRecord({ expertId, expertName });
    const normalizedPurpose = normalizeText(purpose);
    const companyContext = resolveConsultationCompanyContext({}, currentEmployee, expert);

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

    if (window.appApiClient?.request && currentEmployee) {
      try {
        const request = await window.appApiClient.request("/consultations", {
          method: "POST",
          json: {
            employeeId: normalizeText(employeeId) || normalizeText(currentEmployee?.id),
            employeeName:
              normalizeText(employeeName) || normalizeText(currentEmployee?.name) || "Employee",
            expertId: normalizeText(expert.id),
            expertName: normalizeExpertName(expert.name),
            purpose: normalizedPurpose,
          },
        });

        persistConsultationLocally(request);
        return { ok: true, request };
      } catch (error) {
        return {
          ok: false,
          error: error?.message || "Unable to submit the consultation request right now.",
        };
      }
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
      companyId: companyContext.companyId,
      companyName: companyContext.companyName,
      createdAt: now.toISOString(),
    });

    consultations.unshift(request);
    writeConsultations(consultations);
    return { ok: true, request };
  }

  async function updateConsultation(id, updates, options = {}) {
    const normalizedId = normalizeText(id);
    const { includeAllCompanies, companyContext } = resolveConsultationReadOptions(options);

    if (window.appApiClient?.request) {
      try {
        const consultation = await window.appApiClient.request(
          `/consultations/${encodeURIComponent(normalizedId)}`,
          {
            method: "PATCH",
            json: updates || {},
          }
        );

        persistConsultationLocally(consultation);
        return {
          ok: true,
          consultation,
        };
      } catch (error) {
        return {
          ok: false,
          error: error?.message || "Unable to update the consultation right now.",
        };
      }
    }

    const consultations = readConsultations({ includeAllCompanies: true }).map((consultation) => {
      if (consultation.id !== normalizedId) {
        return consultation;
      }

      if (!includeAllCompanies && !matchesCompanyContext(consultation, companyContext)) {
        return consultation;
      }

      return normalizeConsultationRecord({
        ...consultation,
        ...updates,
        id: consultation.id,
        createdAt: consultation.createdAt,
      });
    });

    writeConsultations(consultations);
    return {
      ok: true,
      consultation: getConsultationById(normalizedId, options),
    };
  }

  function getLatestOpenConsultationForExpertEmployee({
    employeeId,
    expertId,
    companyId,
    companyName,
  } = {}) {
    const normalizedEmployeeId = normalizeText(employeeId);
    const normalizedExpertId = normalizeText(expertId);
    const companyContext = createCompanyContext({ companyId, companyName });

    if (!normalizedEmployeeId || !normalizedExpertId) {
      return null;
    }

    return (
      readConsultations({ includeAllCompanies: true })
        .filter((consultation) =>
          normalizeText(consultation.employeeId) === normalizedEmployeeId
        )
        .filter((consultation) =>
          normalizeText(consultation.expertId) === normalizedExpertId
        )
        .filter((consultation) =>
          consultation.status === "requested" || consultation.status === "accepted"
        )
        .filter((consultation) =>
          hasCompanyContext(companyContext)
            ? matchesCompanyContext(consultation, companyContext)
            : true
        )
        .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))[0] || null
    );
  }

  async function createExpertFollowUpConsultation({
    employeeId,
    employeeName,
    expertId,
    expertName,
    purpose,
    sourceCheckinId,
    followUpPriority,
  } = {}) {
    const normalizedEmployeeId = normalizeText(employeeId);
    const normalizedEmployeeName = normalizeText(employeeName) || "Employee";
    const expert = resolveExpertRecord({ expertId, expertName });
    const employee = resolveEmployeeRecord({ employeeId: normalizedEmployeeId });
    const normalizedPurpose =
      normalizeText(purpose) || "Follow-up consultation recommended by the wellness expert.";
    const companyContext = resolveConsultationCompanyContext({}, employee, expert);

    if (!expert) {
      return {
        ok: false,
        error: "Selected wellness expert is no longer available.",
      };
    }

    if (!normalizedEmployeeId) {
      return {
        ok: false,
        error: "Employee details are missing for this follow-up consultation.",
      };
    }

    if (window.appApiClient?.request) {
      try {
        const result = await window.appApiClient.request("/consultations/follow-up", {
          method: "POST",
          json: {
            employeeId: normalizedEmployeeId,
            employeeName: normalizedEmployeeName,
            expertId: normalizeText(expert.id),
            expertName: normalizeExpertName(expert.name),
            purpose: normalizedPurpose,
            sourceCheckinId: normalizeText(sourceCheckinId),
            followUpPriority: normalizeText(followUpPriority),
            companyId: companyContext.companyId,
            companyName: companyContext.companyName,
          },
        });

        if (result?.consultation) {
          persistConsultationLocally(result.consultation);
        }

        return {
          ok: true,
          consultation: result?.consultation || null,
          reused: Boolean(result?.reused),
        };
      } catch (error) {
        return {
          ok: false,
          error: error?.message || "Unable to prepare the follow-up consultation right now.",
        };
      }
    }

    const existingOpenConsultation = getLatestOpenConsultationForExpertEmployee({
      employeeId: normalizedEmployeeId,
      expertId: expert.id,
      companyId: companyContext.companyId,
      companyName: companyContext.companyName,
    });

    if (existingOpenConsultation) {
      if (existingOpenConsultation.status === "requested") {
        updateConsultation(
          existingOpenConsultation.id,
          {
            status: "accepted",
            rejectionReason: "",
            createdByExpert: true,
            sourceCheckinId:
              normalizeText(sourceCheckinId) || existingOpenConsultation.sourceCheckinId,
            followUpPriority:
              normalizeText(followUpPriority) || existingOpenConsultation.followUpPriority,
            purpose: existingOpenConsultation.purpose || normalizedPurpose,
          },
          companyContext
        );
      }

      return {
        ok: true,
        consultation: getConsultationById(existingOpenConsultation.id, companyContext),
        reused: true,
      };
    }

    const now = new Date();
    const consultations = readConsultations({ includeAllCompanies: true });
    const consultation = normalizeConsultationRecord({
      id:
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `consult-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      employeeId: normalizedEmployeeId,
      employeeName: normalizedEmployeeName,
      expertId: normalizeText(expert.id),
      expertName: normalizeExpertName(expert.name),
      purpose: normalizedPurpose,
      category: getExpertCategory({ expertId: expert.id, expertName: expert.name }),
      requestedOn: buildRequestedOn(now),
      status: "accepted",
      rejectionReason: "",
      createdByExpert: true,
      sourceCheckinId: normalizeText(sourceCheckinId),
      followUpPriority: normalizeText(followUpPriority),
      companyId: companyContext.companyId,
      companyName: companyContext.companyName,
      createdAt: now.toISOString(),
    });

    consultations.unshift(consultation);
    writeConsultations(consultations);

    return {
      ok: true,
      consultation,
      reused: false,
    };
  }

  function getConsultationById(id, options = {}) {
    const normalizedId = normalizeText(id);
    if (!normalizedId) return null;

    return (
      readConsultations(options).find(
        (consultation) => normalizeText(consultation.id) === normalizedId
      ) || null
    );
  }

  function getConsultationsByStatus(status, options = {}) {
    const employeeId = normalizeText(options.employeeId);
    const expertId = normalizeText(options.expertId);

    return readConsultations(options)
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

  function getConsultationSessionTimestamp(record) {
    if (!hasScheduledSession(record)) {
      return null;
    }

    const rawDate = normalizeText(record?.sessionDate);
    if (!rawDate) {
      return null;
    }

    const exactDateMatch = rawDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    const sessionDate = exactDateMatch
      ? new Date(
          Number(exactDateMatch[1]),
          Number(exactDateMatch[2]) - 1,
          Number(exactDateMatch[3])
        )
      : new Date(rawDate);

    if (Number.isNaN(sessionDate.getTime())) {
      return null;
    }

    const rawTime = normalizeText(record?.sessionTime);
    const [hours, minutes] = rawTime.split(":").map(Number);

    if (!Number.isNaN(hours) && !Number.isNaN(minutes)) {
      sessionDate.setHours(hours, minutes, 0, 0);
    } else {
      sessionDate.setHours(23, 59, 59, 999);
    }

    return sessionDate.getTime();
  }

  function isPastScheduledConsultation(record) {
    const sessionTimestamp = getConsultationSessionTimestamp(record);
    return sessionTimestamp !== null && sessionTimestamp < Date.now();
  }

  function getAcceptedConsultations(options = {}) {
    return getConsultationsByStatus("accepted", options);
  }

  function getUpcomingConsultations(options = {}) {
    return getAcceptedConsultations(options).filter(hasScheduledSession);
  }

  function getPastConsultations(options = {}) {
    return getAcceptedConsultations(options)
      .filter(isPastScheduledConsultation)
      .sort(
        (left, right) =>
          (getConsultationSessionTimestamp(right) || 0)
          - (getConsultationSessionTimestamp(left) || 0)
      );
  }

  function getCurrentEmployeeConsultationsByStatus(status) {
    const currentEmployee = employeeAuthStore?.getCurrentEmployee?.() || null;
    if (!currentEmployee) return [];

    return getConsultationsByStatus(status, {
      employeeId: currentEmployee.id,
      companyId: currentEmployee.companyId,
      companyName: currentEmployee.companyName,
    });
  }

  function getCurrentEmployeeUpcomingConsultations() {
    return getCurrentEmployeeConsultationsByStatus("accepted");
  }

  function getCurrentEmployeePastConsultations() {
    const currentEmployee = employeeAuthStore?.getCurrentEmployee?.() || null;
    if (!currentEmployee) return [];

    return getPastConsultations({
      employeeId: currentEmployee.id,
      companyId: currentEmployee.companyId,
      companyName: currentEmployee.companyName,
    });
  }

  function getCurrentExpertConsultationsByStatus(status) {
    const currentExpert = expertAuthStore?.getCurrentExpert?.() || null;
    if (!currentExpert) return [];

    return getConsultationsByStatus(status, {
      expertId: currentExpert.id,
      companyId: currentExpert.companyId,
      companyName: currentExpert.companyName,
    });
  }

  function getCurrentExpertUpcomingConsultations() {
    const currentExpert = expertAuthStore?.getCurrentExpert?.() || null;
    if (!currentExpert) return [];

    return getUpcomingConsultations({
      expertId: currentExpert.id,
      companyId: currentExpert.companyId,
      companyName: currentExpert.companyName,
    });
  }

  function getCurrentExpertAcceptedConsultations() {
    const currentExpert = expertAuthStore?.getCurrentExpert?.() || null;
    if (!currentExpert) return [];

    return getAcceptedConsultations({
      expertId: currentExpert.id,
      companyId: currentExpert.companyId,
      companyName: currentExpert.companyName,
    });
  }

  function getCurrentExpertPastConsultations() {
    const currentExpert = expertAuthStore?.getCurrentExpert?.() || null;
    if (!currentExpert) return [];

    return getPastConsultations({
      expertId: currentExpert.id,
      companyId: currentExpert.companyId,
      companyName: currentExpert.companyName,
    });
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
    syncConsultationsFromBackend,
    createConsultationRequest,
    updateConsultation,
    getLatestOpenConsultationForExpertEmployee,
    createExpertFollowUpConsultation,
    getConsultationById,
    getConsultationsByStatus,
    getAcceptedConsultations,
    getUpcomingConsultations,
    getPastConsultations,
    getCurrentEmployeeConsultationsByStatus,
    getCurrentEmployeeUpcomingConsultations,
    getCurrentEmployeePastConsultations,
    getCurrentExpertConsultationsByStatus,
    getCurrentExpertUpcomingConsultations,
    getCurrentExpertAcceptedConsultations,
    getCurrentExpertPastConsultations,
    getInitials,
    getExpertCategory,
    hasScheduledSession,
    splitRequestedOn,
    formatScheduleDate,
    formatScheduleTime,
  };
})();
