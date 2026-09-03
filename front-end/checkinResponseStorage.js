(function () {
  const STORAGE_KEY = "stackbuilders.checkinResponses.v1";
  const expertAuthStore = window.expertAuthStore || null;
  const employeeAuthStore = window.employeeAuthStore || null;
  const hrAuthStore = window.hrAuthStore || null;

  function normalizeText(value) {
    return String(value || "").trim();
  }

  function normalizeLookupValue(value) {
    return normalizeText(value).toLowerCase();
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

  function getCurrentCompanyContext() {
    const hrCompanyContext = hrAuthStore?.getCurrentCompanyContext?.() || createCompanyContext({});
    if (hasCompanyContext(hrCompanyContext)) {
      return hrCompanyContext;
    }

    const expertCompanyContext =
      expertAuthStore?.getCurrentCompanyContext?.() || createCompanyContext({});
    if (hasCompanyContext(expertCompanyContext)) {
      return expertCompanyContext;
    }

    const employeeCompanyContext =
      employeeAuthStore?.getCurrentCompanyContext?.() || createCompanyContext({});
    if (hasCompanyContext(employeeCompanyContext)) {
      return employeeCompanyContext;
    }

    return createCompanyContext({});
  }

  function resolveResponseReadOptions(options = {}) {
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

  function createResponseId() {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }

    return `response-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function normalizeResponseRecord(record) {
    return {
      id: normalizeText(record?.id) || createResponseId(),
      checkinId: normalizeText(record?.checkinId),
      checkinType: normalizeText(record?.checkinType),
      employeeId: normalizeText(record?.employeeId),
      employeeName: normalizeText(record?.employeeName) || "Employee",
      expertId: normalizeText(record?.expertId),
      expertName: normalizeText(record?.expertName) || "Wellness Expert",
      companyId: normalizeText(record?.companyId),
      companyName: normalizeText(record?.companyName),
      message: normalizeText(record?.message),
      createdAt: normalizeText(record?.createdAt) || new Date().toISOString(),
    };
  }

  function readResponses(options = {}) {
    const { includeAllCompanies, companyContext } = resolveResponseReadOptions(options);

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      const responses = Array.isArray(parsed) ? parsed.map(normalizeResponseRecord) : [];

      if (includeAllCompanies || !hasCompanyContext(companyContext)) {
        return responses;
      }

      return responses.filter((record) => matchesCompanyContext(record, companyContext));
    } catch (error) {
      console.error("Unable to read check-in responses.", error);
      return [];
    }
  }

  function writeResponses(records) {
    const normalizedRecords = Array.isArray(records)
      ? records.map(normalizeResponseRecord)
      : [];

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizedRecords));
    return normalizedRecords;
  }

  function persistResponseLocally(record) {
    const nextResponse = normalizeResponseRecord(record);
    const records = readResponses({ includeAllCompanies: true }).filter(
      (existingRecord) => normalizeText(existingRecord.id) !== normalizeText(nextResponse.id)
    );

    records.unshift(nextResponse);
    writeResponses(records);
    return nextResponse;
  }

  function mergeCompanyScopedResponsesLocally(records, companyContext) {
    const normalizedCompanyContext = createCompanyContext(companyContext);
    const currentRecords = readResponses({ includeAllCompanies: true });

    if (!hasCompanyContext(normalizedCompanyContext)) {
      writeResponses(Array.isArray(records) ? records : []);
      return true;
    }

    const remainingRecords = currentRecords.filter(
      (record) => !matchesCompanyContext(record, normalizedCompanyContext)
    );

    writeResponses([...(Array.isArray(records) ? records : []), ...remainingRecords]);
    return true;
  }

  function buildResponseQueryString(companyContext) {
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

  async function syncResponsesFromBackend(options = {}) {
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
      const responses = await window.appApiClient.request(
        `/checkin-responses${buildResponseQueryString(resolvedCompanyContext)}`
      );

      mergeCompanyScopedResponsesLocally(responses, resolvedCompanyContext);
      return {
        ok: true,
      };
    } catch (error) {
      console.error("Unable to refresh check-in responses from the backend.", error);
      return {
        ok: false,
        error: error?.message || "The latest expert responses could not be loaded right now.",
      };
    }
  }

  function getResponsesByCheckinId(checkinId, options = {}) {
    const normalizedCheckinId = normalizeText(checkinId);
    if (!normalizedCheckinId) {
      return [];
    }

    return readResponses(options)
      .filter((record) => record.checkinId === normalizedCheckinId)
      .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));
  }

  function getLatestResponseByCheckinId(checkinId, options = {}) {
    return getResponsesByCheckinId(checkinId, options)[0] || null;
  }

  async function createResponse(payload) {
    const currentExpert = expertAuthStore?.getCurrentExpert?.() || null;
    const message = normalizeText(payload?.message);
    const checkinId = normalizeText(payload?.checkinId);

    if (!checkinId) {
      return {
        ok: false,
        error: "Employee check-in details are missing for this message.",
      };
    }

    if (!currentExpert) {
      return {
        ok: false,
        error: "Expert session not found.",
      };
    }

    if (!message) {
      return {
        ok: false,
        error: "Please enter a message before sending your response.",
      };
    }

    if (window.appApiClient?.request && currentExpert) {
      try {
        const response = await window.appApiClient.request("/checkin-responses", {
          method: "POST",
          json: {
            ...payload,
            checkinId,
            employeeId: normalizeText(payload?.employeeId),
            employeeName: normalizeText(payload?.employeeName),
            expertId: normalizeText(payload?.expertId) || normalizeText(currentExpert.id),
            expertName: normalizeText(payload?.expertName) || normalizeText(currentExpert.name),
            companyId: normalizeText(payload?.companyId) || normalizeText(currentExpert.companyId),
            companyName:
              normalizeText(payload?.companyName) || normalizeText(currentExpert.companyName),
            message,
          },
        });

        persistResponseLocally(response);
        return {
          ok: true,
          response,
        };
      } catch (error) {
        return {
          ok: false,
          error: error?.message || "The suggestion message could not be sent right now.",
        };
      }
    }

    const records = readResponses({ includeAllCompanies: true });
    const response = normalizeResponseRecord({
      ...payload,
      checkinId,
      employeeId: normalizeText(payload?.employeeId),
      employeeName: normalizeText(payload?.employeeName),
      expertId: normalizeText(payload?.expertId) || normalizeText(currentExpert.id),
      expertName: normalizeText(payload?.expertName) || normalizeText(currentExpert.name),
      companyId: normalizeText(payload?.companyId) || normalizeText(currentExpert.companyId),
      companyName:
        normalizeText(payload?.companyName) || normalizeText(currentExpert.companyName),
      createdAt: new Date().toISOString(),
      message,
    });

    records.unshift(response);
    writeResponses(records);

    return {
      ok: true,
      response,
    };
  }

  window.checkinResponseStore = {
    STORAGE_KEY,
    readResponses,
    writeResponses,
    syncResponsesFromBackend,
    getResponsesByCheckinId,
    getLatestResponseByCheckinId,
    createResponse,
  };
})();
