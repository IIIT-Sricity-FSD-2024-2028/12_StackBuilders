(function () {
  const DEFAULT_BASE_URL = "http://127.0.0.1:3000";

  function normalizeText(value) {
    return String(value || "").trim();
  }

  function getBaseUrl() {
    return normalizeText(window.APP_API_BASE_URL) || DEFAULT_BASE_URL;
  }

  function getCurrentRole() {
    try {
      if (window.adminAuthStore?.getCurrentAdmin?.()) {
        return "Admin";
      }

      if (window.hrAuthStore?.getCurrentHr?.()) {
        return "HR";
      }

      if (window.employeeAuthStore?.getCurrentEmployee?.()) {
        return "Employee";
      }

      if (window.expertAuthStore?.getCurrentExpert?.()) {
        return "Wellness Expert";
      }
    } catch (error) {
      return "";
    }

    return "";
  }

  function buildUrl(path) {
    const baseUrl = getBaseUrl().replace(/\/+$/, "");
    const normalizedPath = String(path || "").startsWith("/")
      ? String(path || "")
      : `/${String(path || "")}`;
    return `${baseUrl}${normalizedPath}`;
  }

  function extractErrorMessage(payload, fallbackMessage) {
    if (Array.isArray(payload?.message) && payload.message.length) {
      return payload.message.join(" ");
    }

    if (typeof payload?.message === "string" && payload.message.trim()) {
      return payload.message.trim();
    }

    if (typeof payload?.error === "string" && payload.error.trim()) {
      return payload.error.trim();
    }

    if (typeof payload === "string" && payload.trim()) {
      return payload.trim();
    }

    return fallbackMessage;
  }

  async function request(path, options = {}) {
    const method = normalizeText(options.method || "GET").toUpperCase() || "GET";
    const headers = new Headers(options.headers || {});
    const includeRole = options.includeRole !== false;
    const role = normalizeText(options.role) || getCurrentRole();

    if (includeRole && role) {
      headers.set("role", role);
    }

    let body = options.body;
    if (Object.prototype.hasOwnProperty.call(options, "json")) {
      headers.set("Content-Type", "application/json");
      body = JSON.stringify(options.json);
    }

    const response = await fetch(buildUrl(path), {
      method,
      headers,
      body,
    });

    const responseText = await response.text();
    let payload = null;

    if (responseText) {
      try {
        payload = JSON.parse(responseText);
      } catch (error) {
        payload = responseText;
      }
    }

    if (!response.ok) {
      const fallbackMessage =
        response.status >= 500
          ? "The backend could not process this request right now."
          : "The request could not be completed.";
      const error = new Error(extractErrorMessage(payload, fallbackMessage));
      error.status = response.status;
      error.payload = payload;
      throw error;
    }

    return payload;
  }

  window.appApiClient = {
    DEFAULT_BASE_URL,
    getBaseUrl,
    getCurrentRole,
    request,
  };
})();
