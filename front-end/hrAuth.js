(function () {
  const SESSION_KEY = "stackbuilders.hrSession.v1";
  const hrProfileStore = window.hrProfileStore || null;

  function normalizeText(value) {
    return String(value || "").trim();
  }

  function normalizeEmail(value) {
    return normalizeText(value).toLowerCase();
  }

  function createCompanyContext(companyLike) {
    return {
      companyId: normalizeText(companyLike?.companyId || companyLike?.id),
      companyName: normalizeText(companyLike?.companyName || companyLike?.name),
    };
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

  function findProfile(profileInput) {
    const normalizedInput = normalizeText(profileInput);
    const normalizedEmailInput = normalizeEmail(profileInput);

    if (!normalizedInput) {
      return null;
    }

    return (
      hrProfileStore?.findProfileById?.(normalizedInput)
      || hrProfileStore?.findProfileByEmail?.(normalizedEmailInput)
      || null
    );
  }

  function getCurrentHrProfile(target) {
    if (normalizeText(target)) {
      return findProfile(target);
    }

    const session = readCurrentHrSession();
    if (!session?.hrId) {
      return null;
    }

    return findProfile(session.hrId);
  }

  function persistCurrentSession(session) {
    if (!session?.hrId || !session?.source) {
      clearCurrentHrSession();
      return null;
    }

    const serialized = JSON.stringify({
      hrId: normalizeText(session.hrId),
      source: normalizeText(session.source),
    });

    getSessionStorage()?.setItem(SESSION_KEY, serialized);
    getLegacySessionStorage()?.removeItem(SESSION_KEY);
    return session;
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

        const parsedLegacy = JSON.parse(legacyRaw);
        if (!parsedLegacy || typeof parsedLegacy !== "object") {
          return null;
        }

        const legacySession = {
          hrId: normalizeText(parsedLegacy.hrId),
          email: normalizeEmail(parsedLegacy.email),
          source: normalizeText(parsedLegacy.source),
        };

        if (!legacySession.hrId && legacySession.email) {
          const matchedProfile = hrProfileStore?.findProfileByEmail?.(legacySession.email) || null;
          legacySession.hrId = normalizeText(matchedProfile?.id);
        }

        if (!legacySession.hrId || !legacySession.source) {
          return null;
        }

        persistCurrentSession(legacySession);
        return {
          hrId: legacySession.hrId,
          source: legacySession.source,
        };
      }

      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") {
        return null;
      }

      const currentSession = {
        hrId: normalizeText(parsed.hrId),
        email: normalizeEmail(parsed.email),
        source: normalizeText(parsed.source),
      };

      if (!currentSession.hrId && currentSession.email) {
        const matchedProfile = hrProfileStore?.findProfileByEmail?.(currentSession.email) || null;
        currentSession.hrId = normalizeText(matchedProfile?.id);
      }

      if (!currentSession.hrId || !currentSession.source) {
        return null;
      }

      if (currentSession.email) {
        persistCurrentSession(currentSession);
      }

      return {
        hrId: currentSession.hrId,
        source: currentSession.source,
      };
    } catch (error) {
      return null;
    }
  }

  function clearCurrentHrSession() {
    getSessionStorage()?.removeItem(SESSION_KEY);
    getLegacySessionStorage()?.removeItem(SESSION_KEY);
  }

  function setCurrentHrSession(profileInput, options = {}) {
    const profile = findProfile(profileInput);
    const source = normalizeText(options.source);

    if (!profile || !source) {
      clearCurrentHrSession();
      return null;
    }

    persistCurrentSession({
      hrId: profile.id,
      source,
    });
    return profile;
  }

  function getCurrentHr() {
    const session = readCurrentHrSession();
    const profile = getCurrentHrProfile(session?.hrId);

    if (!session?.hrId || !profile) {
      clearCurrentHrSession();
      return null;
    }

    if (profile.id !== session.hrId || session.source !== "homepage") {
      clearCurrentHrSession();
      return null;
    }

    return profile;
  }

  function authenticateHr(username, password, options = {}) {
    const normalizedUsername = normalizeEmail(username);
    const normalizedPassword = normalizeText(password);
    const source = normalizeText(options.source);
    const profile = hrProfileStore?.findProfileByEmail?.(normalizedUsername) || null;

    if (!profile) {
      return {
        ok: false,
        error: "Invalid credentials. Please check your username and password.",
      };
    }

    if (normalizedPassword !== normalizeText(profile.password)) {
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

    setCurrentHrSession(profile.id, { source });
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
    createCompanyContext,
    authenticateHr,
    getCurrentHr,
    getCurrentHrProfile,
    getCurrentCompanyContext() {
      return createCompanyContext(getCurrentHr());
    },
    readCurrentHrSession,
    setCurrentHrSession,
    clearCurrentHrSession,
    requireHrSession,
  };
})();
