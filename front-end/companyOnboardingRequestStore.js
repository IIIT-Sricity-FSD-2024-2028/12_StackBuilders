(function () {
  const STORAGE_KEY = "stackbuilders.companyOnboardingRequests.v1";
  const COMPANY_STORAGE_KEY = "stack-builders-companies";
  const LEGACY_USER_STORAGE_KEY = "stack-builders-users";
  const HR_PROFILE_STORAGE_KEY = "stackbuilders.hr.profiles.v2";
  const LEGACY_HR_PROFILE_STORAGE_KEY = "stackbuilders.hr.profile.v1";
  const EMPLOYEE_STORAGE_KEY = "stackbuilders.hr.employees";
  const EXPERT_STORAGE_KEY = "stackbuilders.hr.experts";
  const ADMIN_EMAIL = "ravi@gmail.com";

  function normalizeText(value) {
    return String(value || "").trim();
  }

  function normalizeEmail(value) {
    return normalizeText(value).toLowerCase();
  }

  function normalizeLookupValue(value) {
    return normalizeText(value).toLowerCase();
  }

  function createRequestId() {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }

    return `request-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function formatIndianPhoneNumber(value) {
    const digitsOnly = String(value || "").replace(/\D/g, "");

    if (digitsOnly.length === 10) {
      return `+91 ${digitsOnly.slice(0, 5)} ${digitsOnly.slice(5)}`;
    }

    if (digitsOnly.length === 12 && digitsOnly.startsWith("91")) {
      return `+91 ${digitsOnly.slice(2, 7)} ${digitsOnly.slice(7)}`;
    }

    return null;
  }

  function isValidEmailAddress(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/i.test(String(value || "").trim());
  }

  function isValidGmailAddress(value) {
    return /^[a-z0-9._%+-]+@gmail\.com$/i.test(String(value || "").trim());
  }

  function isValidPassword(value) {
    return normalizeText(value).length >= 6;
  }

  function readCollection(key) {
    try {
      const raw = window.localStorage.getItem(key);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }

  function readCompanies() {
    return readCollection(COMPANY_STORAGE_KEY);
  }

  function readLegacyUsers() {
    return readCollection(LEGACY_USER_STORAGE_KEY);
  }

  function readHrAccounts() {
    if (window.hrProfileStore?.readProfiles) {
      return window.hrProfileStore.readProfiles();
    }

    const hrProfiles = readCollection(HR_PROFILE_STORAGE_KEY);
    if (hrProfiles.length) {
      return hrProfiles;
    }

    try {
      const raw = window.localStorage.getItem(LEGACY_HR_PROFILE_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      return parsed && typeof parsed === "object" ? [parsed] : [];
    } catch (error) {
      return [];
    }
  }

  function readEmployees() {
    return readCollection(EMPLOYEE_STORAGE_KEY);
  }

  function readExperts() {
    return readCollection(EXPERT_STORAGE_KEY);
  }

  function normalizeRequest(record) {
    const createdAt = normalizeText(record?.createdAt) || new Date().toISOString();

    return {
      id: normalizeText(record?.id) || createRequestId(),
      companyName: normalizeText(record?.companyName),
      companyPhone:
        formatIndianPhoneNumber(record?.companyPhone)
        || normalizeText(record?.companyPhone),
      companyAddress: normalizeText(record?.companyAddress),
      companyEmail: normalizeEmail(record?.companyEmail),
      hrName: normalizeText(record?.hrName),
      hrEmail: normalizeEmail(record?.hrEmail),
      hrPassword: normalizeText(record?.hrPassword),
      hrPhoneNumber:
        formatIndianPhoneNumber(record?.hrPhoneNumber)
        || normalizeText(record?.hrPhoneNumber),
      status: normalizeText(record?.status) || "pending",
      createdAt,
    };
  }

  function readRequests() {
    return readCollection(STORAGE_KEY).map(normalizeRequest).filter((request) => request.status === "pending");
  }

  function writeRequests(requests) {
    const normalizedRequests = Array.isArray(requests)
      ? requests.map(normalizeRequest).filter(Boolean)
      : [];

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizedRequests));
    return normalizedRequests;
  }

  function getRequestById(requestId) {
    const normalizedRequestId = normalizeText(requestId);
    if (!normalizedRequestId) {
      return null;
    }

    return readRequests().find((request) => request.id === normalizedRequestId) || null;
  }

  function getPendingRequests() {
    return readRequests();
  }

  function findPendingRequestByHrEmail(email) {
    const normalizedEmailValue = normalizeEmail(email);
    if (!normalizedEmailValue) {
      return null;
    }

    return readRequests().find((request) => request.hrEmail === normalizedEmailValue) || null;
  }

  function removeRequest(requestId) {
    const normalizedRequestId = normalizeText(requestId);
    const currentRequests = readRequests();
    const nextRequests = currentRequests.filter((request) => request.id !== normalizedRequestId);

    writeRequests(nextRequests);
    return nextRequests.length !== currentRequests.length;
  }

  async function refreshRequests() {
    if (!window.appApiClient?.request) {
      return {
        ok: true,
        requests: readRequests(),
        source: "local",
      };
    }

    const currentRole = normalizeText(window.appApiClient.getCurrentRole?.());
    if (currentRole !== "Admin") {
      return {
        ok: true,
        requests: readRequests(),
        source: "local",
      };
    }

    try {
      const requests = await window.appApiClient.request("/company-onboarding-requests");
      const normalizedRequests = writeRequests(Array.isArray(requests) ? requests : []);

      return {
        ok: true,
        requests: normalizedRequests,
        source: "backend",
      };
    } catch (error) {
      return {
        ok: false,
        error:
          error?.message ||
          "Pending company requests could not be loaded from the backend.",
        requests: readRequests(),
      };
    }
  }

  async function createRequest(payload) {
    const companyName = normalizeText(payload?.companyName);
    const companyPhone = formatIndianPhoneNumber(payload?.companyPhone || "");
    const companyAddress = normalizeText(payload?.companyAddress);
    const companyEmail = normalizeEmail(payload?.companyEmail);
    const hrName = normalizeText(payload?.hrName);
    const hrEmail = normalizeEmail(payload?.hrEmail);
    const hrPassword = normalizeText(payload?.hrPassword);
    const hrPhoneRaw = normalizeText(payload?.hrPhoneNumber);
    const hrPhoneNumber = hrPhoneRaw ? formatIndianPhoneNumber(hrPhoneRaw) : "";

    if (!companyName || !companyPhone || !companyAddress || !companyEmail) {
      return {
        ok: false,
        error: "Please fill in all company details before submitting your request.",
      };
    }

    if (!isValidEmailAddress(companyEmail)) {
      return {
        ok: false,
        error: "Enter a valid company email address.",
      };
    }

    if (!hrName || !hrEmail || !hrPassword) {
      return {
        ok: false,
        error: "Please fill in the required HR details before submitting your request.",
      };
    }

    if (!isValidPassword(hrPassword)) {
      return {
        ok: false,
        error: "HR password must be at least 6 characters long.",
      };
    }

    if (!isValidGmailAddress(hrEmail)) {
      return {
        ok: false,
        error: "Use a valid Gmail address for the HR login email.",
      };
    }

    if (hrPhoneRaw && !hrPhoneNumber) {
      return {
        ok: false,
        error: "Enter a valid Indian phone number for the HR contact.",
      };
    }

    const existingCompanies = readCompanies();
    if (
      existingCompanies.some(
        (company) => normalizeLookupValue(company.name) === normalizeLookupValue(companyName)
      )
    ) {
      return {
        ok: false,
        error: "A company with this name is already registered.",
      };
    }

    if (
      existingCompanies.some(
        (company) => normalizeLookupValue(company.email) === normalizeLookupValue(companyEmail)
      )
    ) {
      return {
        ok: false,
        error: "A company with this email is already registered.",
      };
    }

    if (
      existingCompanies.some((company) => {
        const existingPhone = formatIndianPhoneNumber(company.phone || "") || normalizeText(company.phone);
        return normalizeLookupValue(existingPhone) === normalizeLookupValue(companyPhone);
      })
    ) {
      return {
        ok: false,
        error: "A company with this phone number is already registered.",
      };
    }

    const existingHrAccount = readHrAccounts().find(
      (profile) => normalizeLookupValue(profile.email || profile.username) === normalizeLookupValue(hrEmail)
    );
    const existingEmployeeAccount = readEmployees().find(
      (employee) => normalizeLookupValue(employee.email || employee.username) === normalizeLookupValue(hrEmail)
    );
    const existingExpertAccount = readExperts().find(
      (expert) => normalizeLookupValue(expert.email || expert.username) === normalizeLookupValue(hrEmail)
    );
    const existingLegacyUser = readLegacyUsers().find(
      (user) => normalizeLookupValue(user.email || user.username) === normalizeLookupValue(hrEmail)
    );

    if (
      existingHrAccount
      || existingEmployeeAccount
      || existingExpertAccount
      || existingLegacyUser
      || normalizeLookupValue(hrEmail) === normalizeLookupValue(ADMIN_EMAIL)
    ) {
      return {
        ok: false,
        error: "That HR email is already used by another account.",
      };
    }

    const pendingRequests = readRequests();
    if (
      pendingRequests.some(
        (request) => normalizeLookupValue(request.companyName) === normalizeLookupValue(companyName)
      )
    ) {
      return {
        ok: false,
        error: "A company request with this company name is already pending review.",
      };
    }

    if (
      pendingRequests.some(
        (request) => normalizeLookupValue(request.companyEmail) === normalizeLookupValue(companyEmail)
      )
    ) {
      return {
        ok: false,
        error: "A company request with this company email is already pending review.",
      };
    }

    if (
      pendingRequests.some(
        (request) => normalizeLookupValue(request.companyPhone) === normalizeLookupValue(companyPhone)
      )
    ) {
      return {
        ok: false,
        error: "A company request with this phone number is already pending review.",
      };
    }

    if (
      pendingRequests.some(
        (request) => normalizeLookupValue(request.hrEmail) === normalizeLookupValue(hrEmail)
      )
    ) {
      return {
        ok: false,
        error: "An onboarding request for this HR email is already pending review.",
      };
    }

    const request = normalizeRequest({
      id: createRequestId(),
      companyName,
      companyPhone,
      companyAddress,
      companyEmail,
      hrName,
      hrEmail,
      hrPassword,
      hrPhoneNumber,
      status: "pending",
      createdAt: new Date().toISOString(),
    });

    if (!window.appApiClient?.request) {
      writeRequests([request, ...pendingRequests]);
      return { ok: true, request };
    }

    try {
      const createdRequest = await window.appApiClient.request(
        "/company-onboarding-requests",
        {
          method: "POST",
          includeRole: false,
          json: {
            companyName,
            companyPhone: normalizeText(payload?.companyPhone),
            companyAddress,
            companyEmail,
            hrName,
            hrPhoneNumber: hrPhoneRaw,
            hrEmail,
            hrPassword,
          },
        }
      );

      const normalizedRequest = normalizeRequest(createdRequest);
      const nextRequests = [
        normalizedRequest,
        ...pendingRequests.filter((pendingRequest) => pendingRequest.id !== normalizedRequest.id),
      ];
      writeRequests(nextRequests);

      return { ok: true, request: normalizedRequest };
    } catch (error) {
      return {
        ok: false,
        error:
          error?.message ||
          "Your company request could not be submitted right now.",
      };
    }
  }

  async function deleteRequest(requestId) {
    const normalizedRequestId = normalizeText(requestId);
    if (!normalizedRequestId) {
      return {
        ok: false,
        error: "This company request could not be found.",
      };
    }

    if (!window.appApiClient?.request) {
      return {
        ok: removeRequest(normalizedRequestId),
      };
    }

    try {
      await window.appApiClient.request(
        `/company-onboarding-requests/${encodeURIComponent(normalizedRequestId)}`,
        {
          method: "DELETE",
        }
      );

      removeRequest(normalizedRequestId);
      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        error:
          error?.message ||
          "This company request could not be deleted right now.",
      };
    }
  }

  async function approveRequest(requestId) {
    const normalizedRequestId = normalizeText(requestId);
    if (!normalizedRequestId) {
      return {
        ok: false,
        error: "This company request could not be found.",
      };
    }

    if (!window.appApiClient?.request) {
      return {
        ok: false,
        error: "Backend API support is unavailable for company approval.",
      };
    }

    try {
      const approvalResult = await window.appApiClient.request(
        `/company-onboarding-requests/${encodeURIComponent(normalizedRequestId)}/approve`,
        {
          method: "POST",
        }
      );

      removeRequest(approvalResult?.removedRequestId || normalizedRequestId);
      return {
        ok: true,
        result: approvalResult,
      };
    } catch (error) {
      return {
        ok: false,
        error:
          error?.message ||
          "This company request could not be approved right now.",
      };
    }
  }

  window.companyOnboardingRequestStore = {
    STORAGE_KEY,
    readRequests,
    writeRequests,
    getPendingRequests,
    getRequestById,
    findPendingRequestByHrEmail,
    createRequest,
    removeRequest,
    refreshRequests,
    deleteRequest,
    approveRequest,
  };
})();
