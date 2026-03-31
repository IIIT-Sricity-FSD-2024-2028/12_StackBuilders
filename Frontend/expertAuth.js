(function () {
  const EXPERT_STORAGE_KEY = "stackbuilders.hr.experts";
  const EXPERT_SESSION_KEY = "stackbuilders.expertSession.v1";
  const EMPLOYEE_STORAGE_KEY = "stackbuilders.hr.employees";

  function normalizeText(value) {
    return String(value || "").trim();
  }

  function normalizeEmail(value) {
    return normalizeText(value).toLowerCase();
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

  function readExperts() {
    try {
      const raw = window.localStorage.getItem(EXPERT_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed.map(normalizeExpertRecord) : [];
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
      readExperts().find(
        (expert) => normalizeEmail(expert.email) === normalizedEmail
      ) || null
    );
  }

  function updateExpert(expertId, updates) {
    const normalizedId = normalizeText(expertId);
    if (!normalizedId) {
      return { ok: false, error: "Wellness expert not found." };
    }

    const experts = readExperts();
    const existingExpert = experts.find((expert) => expert.id === normalizedId);

    if (!existingExpert) {
      return { ok: false, error: "Wellness expert not found." };
    }

    const nextEmail = updates && Object.prototype.hasOwnProperty.call(updates, "email")
      ? normalizeEmail(updates.email)
      : existingExpert.email;

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

    const experts = readExperts();
    experts.unshift(expert);
    writeExperts(experts);

    return { ok: true, expert };
  }

  function deleteExpert(expertId) {
    const normalizedId = normalizeText(expertId);
    const nextExperts = readExperts().filter((expert) => expert.id !== normalizedId);

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

    const expert = readExperts().find((item) => item.id === normalizedId) || null;
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
      readExperts().find((item) => item.id === session.expertId) || null;

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
        ? readExperts().find((item) => item.id === normalizeText(target)) || null
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
    };
  }

  window.expertAuthStore = {
    EXPERT_STORAGE_KEY,
    EXPERT_SESSION_KEY,
    normalizeEmail,
    getInitials,
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
    requireExpertSession,
    getExpertProfile,
  };
})();
