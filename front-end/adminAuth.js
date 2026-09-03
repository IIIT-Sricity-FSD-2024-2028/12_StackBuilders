(function () {
  const SESSION_KEY = "stackbuilders.adminSession.v1";
  
  const VALID_ADMINS = [
    {
      username: "ravi@gmail.com",
      password: "1234",
      name: "Super User",
      email: "ravi@gmail.com",
      role: "Admin",
    },
    {
      username: "raju@gmail.com",
      password: "1234",
      name: "Supervisor",
      email: "raju@gmail.com",
      role: "Admin", // keeping role same as admin so the UI works exactly the same
    }
  ];

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

  function getAdminProfile(username) {
    const admin = VALID_ADMINS.find(a => normalizeEmail(a.username) === normalizeEmail(username));
    if (!admin) return null;
    return {
      name: admin.name,
      email: admin.email,
      username: admin.username,
      role: admin.role,
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

    const admin = VALID_ADMINS.find(a => normalizeEmail(a.username) === normalizedUsername);

    if (!admin || !source) {
      clearCurrentAdminSession();
      return null;
    }

    getSessionStorage()?.setItem(
      SESSION_KEY,
      JSON.stringify({ username: normalizedUsername, source })
    );
    getLegacySessionStorage()?.removeItem(SESSION_KEY);

    return getAdminProfile(normalizedUsername);
  }

  function getCurrentAdmin() {
    const session = readCurrentAdminSession();

    if (!session?.username || session.source !== "homepage") {
      clearCurrentAdminSession();
      return null;
    }

    const admin = VALID_ADMINS.find(a => normalizeEmail(a.username) === session.username);
    if (!admin) {
      clearCurrentAdminSession();
      return null;
    }

    return getAdminProfile(session.username);
  }

  function authenticateAdmin(username, password, options = {}) {
    const normalizedUsername = normalizeEmail(username);
    const normalizedPassword = normalizeText(password);
    const source = normalizeText(options.source);

    const admin = VALID_ADMINS.find(a => normalizeEmail(a.username) === normalizedUsername && normalizeText(a.password) === normalizedPassword);

    if (!admin) {
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

    setCurrentAdminSession(admin.username, { source });
    return { ok: true, profile: getAdminProfile(admin.username) };
  }

  window.adminAuthStore = {
    SESSION_KEY,
    getAdminProfile: () => {
        const session = readCurrentAdminSession();
        return session ? getAdminProfile(session.username) : null;
    },
    readCurrentAdminSession,
    getCurrentAdmin,
    authenticateAdmin,
    setCurrentAdminSession,
    clearCurrentAdminSession,
  };
})();

