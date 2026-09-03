(function () {
  const EXPERT_STORAGE_KEY = "stackbuilders.hr.experts";
  const EXPERT_SESSION_KEY = "stackbuilders.expertSession.v1";
  const EMPLOYEE_STORAGE_KEY = "stackbuilders.hr.employees";
  const SPECIALIZATION_TRACK_MAP = {
    psychologist: "mental",
    psychology: "mental",
    counselor: "mental",
    counsellor: "mental",
    "mental wellness": "mental",
    "mental health": "mental",
    nutritionist: "nutrition",
    nutrition: "nutrition",
    dietitian: "nutrition",
    dietician: "nutrition",
    "diet plan": "nutrition",
    "nutritional guidance": "nutrition",
    "physical wellness instructor": "physical",
    "physical wellness": "physical",
    "physical trainer": "physical",
    "fitness trainer": "physical",
    "fitness coach": "physical",
    "yoga instructor": "physical",
    "wellness coach": "physical",
  };
  const SPECIALIZATION_DASHBOARD_ROUTE_MAP = {
    mental: "Psychologist_Dashboard.html",
    nutrition: "Nutritionist_Dashboard.html",
    physical: "Physical_Wellness_Dashboard.html",
  };

  function normalizeText(value) {
    return String(value || "").trim();
  }

  function normalizeEmail(value) {
    return normalizeText(value).toLowerCase();
  }

  function isValidGmailAddress(value) {
    return /^[a-z0-9._%+-]+@gmail\.com$/i.test(normalizeText(value));
  }

  function isValidPassword(value) {
    return normalizeText(value).length >= 6;
  }

  function parseExperienceYears(value) {
    const raw = normalizeText(value);
    if (!raw) {
      return Number.NaN;
    }

    const match = raw.match(/^(\d+(?:\.\d+)?)(?:\s*(?:years?|yrs?))?$/i);
    return match ? Number(match[1]) : Number.NaN;
  }

  function validateExperience(value) {
    const parsed = parseExperienceYears(value);

    if (!Number.isFinite(parsed) || parsed < 0 || parsed > 60) {
      return {
        ok: false,
        error: "Experience must be a number between 0 and 60 years.",
      };
    }

    return { ok: true };
  }

  function normalizeLookupValue(value) {
    return normalizeText(value).toLowerCase();
  }

  function normalizeSpecialization(value) {
    return normalizeLookupValue(value).replace(/\s+/g, " ");
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
    const currentHr = window.hrAuthStore?.getCurrentHr?.() || null;
    const hrCompanyContext = createCompanyContext(currentHr);
    if (hasCompanyContext(hrCompanyContext)) {
      return hrCompanyContext;
    }

    const currentExpertSession = readCurrentExpertSession();
    if (currentExpertSession?.expertId) {
      const currentExpert =
        readExperts({ includeAllCompanies: true }).find(
          (expert) => expert.id === currentExpertSession.expertId
        ) || null;
      const expertCompanyContext = createCompanyContext(currentExpert);
      if (hasCompanyContext(expertCompanyContext)) {
        return expertCompanyContext;
      }
    }

    const currentEmployeeSession = window.employeeAuthStore?.readCurrentEmployeeSession?.() || null;
    if (currentEmployeeSession?.employeeId) {
      const currentEmployee =
        readStoredEmployees().find(
          (employee) =>
            normalizeText(employee?.id) === normalizeText(currentEmployeeSession.employeeId)
        ) || null;
      const employeeCompanyContext = createCompanyContext(currentEmployee);
      if (hasCompanyContext(employeeCompanyContext)) {
        return employeeCompanyContext;
      }
    }

    return createCompanyContext({});
  }

  function resolveExpertReadOptions(options = {}) {
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

  function readStoredEmployees() {
    try {
      const raw = window.localStorage.getItem(EMPLOYEE_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }

  function findStoredEmployeeByEmail(email) {
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail) return null;

    return (
      readStoredEmployees().find(
        (employee) =>
          normalizeEmail(employee?.email || employee?.username) === normalizedEmail
      ) || null
    );
  }

  function getSessionStorage() {
    try {
      return window.sessionStorage;
    } catch (error) {
      return null;
    }
  }

  function getLegacySessionStorage() {
    try {
      return window.localStorage;
    } catch (error) {
      return null;
    }
  }

  function createExpertId() {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }

    return `expert-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function getInitials(name) {
    const parts = normalizeText(name)
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2);

    if (!parts.length) return "NA";
    return parts.map((part) => part.charAt(0).toUpperCase()).join("");
  }

  function getExpertTrack(target) {
    const expert =
      typeof target === "string"
        ? readExperts({ includeAllCompanies: true }).find(
            (item) => item.id === normalizeText(target)
          ) || null
        : target && typeof target === "object"
          ? normalizeExpertRecord(target)
          : getCurrentExpert();
    const specialization = normalizeSpecialization(expert?.specialization);

    if (!specialization) {
      return "";
    }

    if (SPECIALIZATION_TRACK_MAP[specialization]) {
      return SPECIALIZATION_TRACK_MAP[specialization];
    }

    if (specialization.includes("psych") || specialization.includes("mental")) {
      return "mental";
    }

    if (
      specialization.includes("nutri") ||
      specialization.includes("diet")
    ) {
      return "nutrition";
    }

    if (
      specialization.includes("physical") ||
      specialization.includes("fitness") ||
      specialization.includes("yoga") ||
      specialization.includes("exercise") ||
      specialization.includes("movement")
    ) {
      return "physical";
    }

    return "";
  }

  function getExpertDashboardRoute(target) {
    return "Wellness_Dashboard.html";
  }

  function normalizeExpertRecord(record) {
    const createdAt = normalizeText(record?.createdAt) || new Date().toISOString();

    return {
      id: normalizeText(record?.id) || createExpertId(),
      name: normalizeText(record?.name) || "Wellness Expert",
      email: normalizeEmail(record?.email || record?.username),
      username: normalizeEmail(record?.username || record?.email),
      password: normalizeText(record?.password),
      specialization: normalizeText(record?.specialization) || "Wellness Expert",
      experience: normalizeText(record?.experience) || "",
      phoneNumber: normalizeText(record?.phoneNumber || record?.phone),
      companyId: normalizeText(record?.companyId),
      companyName: normalizeText(record?.companyName),
      status: normalizeText(record?.status) || "Active",
      createdAt,
      updatedAt: normalizeText(record?.updatedAt) || createdAt,
    };
  }

  function readExperts(options = {}) {
    const { includeAllCompanies, companyContext } = resolveExpertReadOptions(options);

    try {
      const raw = window.localStorage.getItem(EXPERT_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      const experts = Array.isArray(parsed) ? parsed.map(normalizeExpertRecord) : [];

      if (includeAllCompanies || !hasCompanyContext(companyContext)) {
        return experts;
      }

      return experts.filter((expert) => matchesCompanyContext(expert, companyContext));
    } catch (error) {
      console.error("Unable to read expert records.", error);
      return [];
    }
  }

  function writeExperts(records) {
    const normalized = Array.isArray(records)
      ? records.map(normalizeExpertRecord)
      : [];

    window.localStorage.setItem(EXPERT_STORAGE_KEY, JSON.stringify(normalized));
    return normalized;
  }

  function findExpertByEmail(email) {
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail) return null;

    return (
      readExperts({ includeAllCompanies: true }).find(
        (expert) => normalizeEmail(expert.email) === normalizedEmail
      ) || null
    );
  }

  function updateExpert(expertId, updates) {
    const normalizedId = normalizeText(expertId);
    if (!normalizedId) {
      return { ok: false, error: "Wellness expert not found." };
    }

    const experts = readExperts({ includeAllCompanies: true });
    const existingExpert = experts.find((expert) => expert.id === normalizedId);

    if (!existingExpert) {
      return { ok: false, error: "Wellness expert not found." };
    }

    const nextEmail = updates && Object.prototype.hasOwnProperty.call(updates, "email")
      ? normalizeEmail(updates.email)
      : existingExpert.email;

    if (
      updates &&
      Object.prototype.hasOwnProperty.call(updates, "name") &&
      !normalizeText(updates.name)
    ) {
      return {
        ok: false,
        error: "Wellness expert name cannot be blank.",
      };
    }

    if (nextEmail && !isValidGmailAddress(nextEmail)) {
      return {
        ok: false,
        error: "Enter a valid Gmail address for the wellness expert.",
      };
    }

    if (
      updates &&
      Object.prototype.hasOwnProperty.call(updates, "password") &&
      !isValidPassword(updates.password)
    ) {
      return {
        ok: false,
        error: "Wellness expert password must be at least 6 characters long.",
      };
    }

    if (
      updates &&
      Object.prototype.hasOwnProperty.call(updates, "specialization") &&
      !normalizeText(updates.specialization)
    ) {
      return {
        ok: false,
        error: "Choose a specialization for the wellness expert.",
      };
    }

    if (updates && Object.prototype.hasOwnProperty.call(updates, "experience")) {
      const experienceValidation = validateExperience(updates.experience);
      if (!experienceValidation.ok) {
        return experienceValidation;
      }
    }

    if (
      nextEmail &&
      experts.some(
        (expert) =>
          expert.id !== normalizedId &&
          normalizeEmail(expert.email) === nextEmail
      )
    ) {
      return {
        ok: false,
        error: "Another wellness expert already uses that email address.",
      };
    }

    if (
      nextEmail &&
      findStoredEmployeeByEmail(nextEmail)
    ) {
      return {
        ok: false,
        error: "That email address is already assigned to an employee account.",
      };
    }

    const mergedExpert = normalizeExpertRecord({
      ...existingExpert,
      ...updates,
      id: existingExpert.id,
      createdAt: existingExpert.createdAt,
      updatedAt: new Date().toISOString(),
      email: nextEmail,
      username: nextEmail || existingExpert.username,
      password:
        updates && Object.prototype.hasOwnProperty.call(updates, "password")
          ? normalizeText(updates.password)
          : existingExpert.password,
    });

    const nextExperts = experts.map((expert) =>
      expert.id === normalizedId ? mergedExpert : expert
    );

    writeExperts(nextExperts);
    return { ok: true, expert: mergedExpert };
  }

  function createExpert(payload) {
    const name = normalizeText(payload?.name);
    const specialization = normalizeText(payload?.specialization);
    const experience = normalizeText(payload?.experience);
    const email = normalizeEmail(payload?.email);
    const password = normalizeText(payload?.password);

    if (!name || !specialization || !experience || !email || !password) {
      return {
        ok: false,
        error: "Please complete all wellness expert fields before saving.",
      };
    }

    if (!isValidGmailAddress(email)) {
      return {
        ok: false,
        error: "Enter a valid Gmail address for the wellness expert.",
      };
    }

    if (!isValidPassword(password)) {
      return {
        ok: false,
        error: "Wellness expert password must be at least 6 characters long.",
      };
    }

    const experienceValidation = validateExperience(experience);
    if (!experienceValidation.ok) {
      return experienceValidation;
    }

    if (findStoredEmployeeByEmail(email)) {
      return {
        ok: false,
        error: "That email address is already assigned to an employee account.",
      };
    }

    const existingExpert = findExpertByEmail(email);
    if (existingExpert) {
      if (!existingExpert.password) {
        return updateExpert(existingExpert.id, {
          name,
          specialization,
          experience,
          email,
          password,
          status: normalizeText(payload?.status) || existingExpert.status || "Active",
        });
      }

      return {
        ok: false,
        error: "A wellness expert with that email already exists.",
      };
    }

    const now = new Date().toISOString();
    const expert = normalizeExpertRecord({
      ...payload,
      id: createExpertId(),
      name,
      specialization,
      experience,
      email,
      username: email,
      password,
      status: normalizeText(payload?.status) || "Active",
      createdAt: now,
      updatedAt: now,
    });

    const experts = readExperts({ includeAllCompanies: true });
    experts.unshift(expert);
    writeExperts(experts);

    return { ok: true, expert };
  }

  function deleteExpert(expertId) {
    const normalizedId = normalizeText(expertId);
    const nextExperts = readExperts({ includeAllCompanies: true }).filter(
      (expert) => expert.id !== normalizedId
    );

    writeExperts(nextExperts);

    const currentExpert = getCurrentExpert();
    if (currentExpert && currentExpert.id === normalizedId) {
      clearCurrentExpertSession();
    }

    return nextExperts;
  }

  function readCurrentExpertSession() {
    try {
      const sessionStorage = getSessionStorage();
      const legacyStorage = getLegacySessionStorage();
      const raw = sessionStorage?.getItem(EXPERT_SESSION_KEY);

      if (!raw) {
        const legacyRaw = legacyStorage?.getItem(EXPERT_SESSION_KEY);
        if (!legacyRaw) return null;

        sessionStorage?.setItem(EXPERT_SESSION_KEY, legacyRaw);
        legacyStorage?.removeItem(EXPERT_SESSION_KEY);

        const parsedLegacy = JSON.parse(legacyRaw);
        if (!parsedLegacy || typeof parsedLegacy !== "object") return null;

        return {
          expertId: normalizeText(parsedLegacy.expertId),
        };
      }

      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return null;

      return {
        expertId: normalizeText(parsed.expertId),
      };
    } catch (error) {
      return null;
    }
  }

  function setCurrentExpertSession(expertId) {
    const normalizedId = normalizeText(expertId);
    if (!normalizedId) {
      clearCurrentExpertSession();
      return null;
    }

    const expert =
      readExperts({ includeAllCompanies: true }).find((item) => item.id === normalizedId) || null;
    if (!expert) {
      clearCurrentExpertSession();
      return null;
    }

    getSessionStorage()?.setItem(
      EXPERT_SESSION_KEY,
      JSON.stringify({ expertId: normalizedId })
    );
    getLegacySessionStorage()?.removeItem(EXPERT_SESSION_KEY);

    return expert;
  }

  function clearCurrentExpertSession() {
    getSessionStorage()?.removeItem(EXPERT_SESSION_KEY);
    getLegacySessionStorage()?.removeItem(EXPERT_SESSION_KEY);
  }

  function getCurrentExpert() {
    const session = readCurrentExpertSession();
    if (!session?.expertId) return null;

    const expert =
      readExperts({ includeAllCompanies: true }).find((item) => item.id === session.expertId) || null;

    if (!expert) {
      clearCurrentExpertSession();
      return null;
    }

    return expert;
  }

  function authenticateExpert(username, password) {
    const normalizedUsername = normalizeEmail(username);
    const normalizedPassword = normalizeText(password);
    const expert = findExpertByEmail(normalizedUsername);

    if (!expert || expert.password !== normalizedPassword) {
      return {
        ok: false,
        error: "Invalid credentials. Please check your username and password.",
      };
    }

    if (normalizeText(expert.status).toLowerCase() !== "active") {
      return {
        ok: false,
        error: "This wellness expert account is inactive.",
      };
    }

    setCurrentExpertSession(expert.id);
    return { ok: true, expert };
  }

  function requireExpertSession(options = {}) {
    const redirectTo = normalizeText(options.redirectTo);
    const expert = getCurrentExpert();

    if (!expert && redirectTo) {
      window.location.replace(redirectTo);
    }

    return expert;
  }

  function getExpertProfile(target) {
    const expert =
      typeof target === "string"
        ? readExperts({ includeAllCompanies: true }).find(
            (item) => item.id === normalizeText(target)
          ) || null
        : target && typeof target === "object"
          ? normalizeExpertRecord(target)
          : getCurrentExpert();

    if (!expert) return null;

    const firstName = normalizeText(expert.name).split(/\s+/)[0] || expert.name;

    return {
      ...expert,
      firstName,
      initials: getInitials(expert.name),
      experienceLabel: expert.experience || "Not specified",
      phoneLabel: expert.phoneNumber || "Not added",
      track: getExpertTrack(expert),
      dashboardRoute: getExpertDashboardRoute(expert),
    };
  }

  window.expertAuthStore = {
    EXPERT_STORAGE_KEY,
    EXPERT_SESSION_KEY,
    SPECIALIZATION_TRACK_MAP,
    SPECIALIZATION_DASHBOARD_ROUTE_MAP,
    normalizeEmail,
    isValidGmailAddress,
    isValidPassword,
    parseExperienceYears,
    normalizeSpecialization,
    createCompanyContext,
    matchesCompanyContext,
    getInitials,
    getExpertTrack,
    getExpertDashboardRoute,
    readExperts,
    writeExperts,
    findExpertByEmail,
    createExpert,
    updateExpert,
    deleteExpert,
    authenticateExpert,
    readCurrentExpertSession,
    setCurrentExpertSession,
    clearCurrentExpertSession,
    getCurrentExpert,
    getCurrentCompanyContext,
    requireExpertSession,
    getExpertProfile,
  };
})();
