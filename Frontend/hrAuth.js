(function () {
  const SESSION_KEY = "stackbuilders.hrSession.v1";
  const hrProfileStore = window.hrProfileStore || null;

  function normalizeText(value) {
    return String(value || "").trim();
  }

  function normalizeEmail(value) {
    return normalizeText(value).toLowerCase();
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

  function getCurrentHrProfile() {
    return hrProfileStore?.getProfile?.() || null;
  }

  function readCurrentHrSession() {
    try {
      const sessionStorage = getSessionStorage();
      const legacyStorage = getLegacySessionStorage();
      const raw = sessionStorage?.getItem(SESSION_KEY);

      if (!raw) {
        const legacyRaw = legacyStorage?.getItem(SESSION_KEY);
        if (!legacyRaw) {
          return null;
        }

        sessionStorage?.setItem(SESSION_KEY, legacyRaw);
        legacyStorage?.removeItem(SESSION_KEY);

        const parsedLegacy = JSON.parse(legacyRaw);
        if (!parsedLegacy || typeof parsedLegacy !== "object") {
          return null;
        }

        return {
          email: normalizeEmail(parsedLegacy.email),
          source: normalizeText(parsedLegacy.source),
        };
      }

      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") {
        return null;
      }

      return {
        email: normalizeEmail(parsed.email),
        source: normalizeText(parsed.source),
      };
    } catch (error) {
      return null;
    }
  }

  function clearCurrentHrSession() {
    getSessionStorage()?.removeItem(SESSION_KEY);
    getLegacySessionStorage()?.removeItem(SESSION_KEY);
  }

  function setCurrentHrSession(email, options = {}) {
    const profile = getCurrentHrProfile();
    const normalizedEmail = normalizeEmail(email);
    const source = normalizeText(options.source);

    if (!profile || normalizedEmail !== normalizeEmail(profile.email) || !source) {
      clearCurrentHrSession();
      return null;
    }

    getSessionStorage()?.setItem(
      SESSION_KEY,
      JSON.stringify({ email: normalizedEmail, source })
    );
    getLegacySessionStorage()?.removeItem(SESSION_KEY);
    return profile;
  }

  function getCurrentHr() {
    const session = readCurrentHrSession();
    const profile = getCurrentHrProfile();

    if (!session?.email || !profile) {
      clearCurrentHrSession();
      return null;
    }

    if (
      session.email !== normalizeEmail(profile.email)
      || session.source !== "homepage"
    ) {
      clearCurrentHrSession();
      return null;
    }

    return profile;
  }

  function authenticateHr(username, password, options = {}) {
    const profile = getCurrentHrProfile();
    const normalizedUsername = normalizeEmail(username);
    const normalizedPassword = normalizeText(password);
    const source = normalizeText(options.source);

    if (!profile) {
      return {
        ok: false,
        error: "HR account is not configured yet. Create it from the Super User console first.",
      };
    }

    if (
      normalizedUsername !== normalizeEmail(profile.email) ||
      normalizedPassword !== normalizeText(profile.password)
    ) {
      return {
        ok: false,
        error: "Invalid credentials. Please check your username and password.",
      };
    }

    if (normalizeText(profile.status || "Active").toLowerCase() !== "active") {
      return {
        ok: false,
        error: "This HR account is inactive.",
      };
    }

    if (source !== "homepage") {
      return {
        ok: false,
        error: "HR can sign in only from the homepage.",
      };
    }

    setCurrentHrSession(profile.email, { source });
    return { ok: true, profile };
  }

  function requireHrSession(options = {}) {
    const redirectTo = normalizeText(options.redirectTo);
    const profile = getCurrentHr();

    if (!profile && redirectTo) {
      window.location.replace(redirectTo);
    }

    return profile;
  }

  window.hrAuthStore = {
    SESSION_KEY,
    normalizeEmail,
    authenticateHr,
    getCurrentHr,
    getCurrentHrProfile,
    readCurrentHrSession,
    setCurrentHrSession,
    clearCurrentHrSession,
    requireHrSession,
  };
})();
