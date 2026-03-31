(function () {
  const SESSION_KEY = "stackbuilders.adminSession.v1";
  const ADMIN_CREDENTIALS = Object.freeze({
    username: "ravi@gmail.com",
    password: "1234",
    name: "Super User",
    email: "ravi@gmail.com",
    role: "Admin",
  });

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

  function getAdminProfile() {
    return {
      name: ADMIN_CREDENTIALS.name,
      email: ADMIN_CREDENTIALS.email,
      username: ADMIN_CREDENTIALS.username,
      role: ADMIN_CREDENTIALS.role,
    };
  }

  function readCurrentAdminSession() {
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
          username: normalizeEmail(parsedLegacy.username),
          source: normalizeText(parsedLegacy.source),
        };
      }

      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") {
        return null;
      }

      return {
        username: normalizeEmail(parsed.username),
        source: normalizeText(parsed.source),
      };
    } catch (error) {
      return null;
    }
  }

  function clearCurrentAdminSession() {
    getSessionStorage()?.removeItem(SESSION_KEY);
    getLegacySessionStorage()?.removeItem(SESSION_KEY);
  }

  function setCurrentAdminSession(username, options = {}) {
    const normalizedUsername = normalizeEmail(username);
    const source = normalizeText(options.source);

    if (
      normalizedUsername !== normalizeEmail(ADMIN_CREDENTIALS.username)
      || !source
    ) {
      clearCurrentAdminSession();
      return null;
    }

    getSessionStorage()?.setItem(
      SESSION_KEY,
      JSON.stringify({ username: normalizedUsername, source })
    );
    getLegacySessionStorage()?.removeItem(SESSION_KEY);

    return getAdminProfile();
  }

  function getCurrentAdmin() {
    const session = readCurrentAdminSession();

    if (
      !session?.username
      || session.username !== normalizeEmail(ADMIN_CREDENTIALS.username)
      || session.source !== "homepage"
    ) {
      clearCurrentAdminSession();
      return null;
    }

    return getAdminProfile();
  }

  function authenticateAdmin(username, password, options = {}) {
    const normalizedUsername = normalizeEmail(username);
    const normalizedPassword = normalizeText(password);
    const source = normalizeText(options.source);

    if (
      normalizedUsername !== normalizeEmail(ADMIN_CREDENTIALS.username)
      || normalizedPassword !== normalizeText(ADMIN_CREDENTIALS.password)
    ) {
      return {
        ok: false,
        error: "Invalid credentials. Please check your username and password.",
      };
    }

    if (source !== "homepage") {
      return {
        ok: false,
        error: "Admin can sign in only from the homepage.",
      };
    }

    setCurrentAdminSession(ADMIN_CREDENTIALS.username, { source });
    return { ok: true, profile: getAdminProfile() };
  }

  window.adminAuthStore = {
    SESSION_KEY,
    getAdminProfile,
    readCurrentAdminSession,
    getCurrentAdmin,
    authenticateAdmin,
    setCurrentAdminSession,
    clearCurrentAdminSession,
  };
})();
