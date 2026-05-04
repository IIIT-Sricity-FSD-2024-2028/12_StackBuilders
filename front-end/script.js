const routeTo = (target) => {
  if (target) {
    window.location.href = target;
  }
};

const currentAdmin = window.adminAuthStore?.getCurrentAdmin?.() || null;
const companyOnboardingRequestStore = window.companyOnboardingRequestStore || null;

if (!currentAdmin) {
  const redirectTarget = "homepage.html";

  try {
    if (window.top && window.top !== window) {
      window.top.location.replace(redirectTarget);
    } else {
      window.location.replace(redirectTarget);
    }
  } catch (error) {
    window.location.replace(redirectTarget);
  }
}

const pageQueryParams = new URLSearchParams(window.location.search);
const isEmbeddedModalPage = pageQueryParams.get("modal") === "1" && window.parent !== window;

const notifyParentModal = (detail = {}) => {
  if (!isEmbeddedModalPage) {
    return false;
  }

  try {
    if (typeof window.parent.handleEmbeddedFormAction === "function") {
      try {
        window.parent.handleEmbeddedFormAction(detail);
      } catch (error) {
        console.error("Unable to complete the embedded modal action.", error);
      }

      return true;
    }
  } catch (error) {
    return false;
  }

  return false;
};

const getEmbeddedModalHeight = () => {
  const formCard = document.querySelector(".form-card");
  const measuredElement = formCard || document.body;

  if (!measuredElement) {
    return 0;
  }

  const computedStyles = window.getComputedStyle(measuredElement);
  const marginTop = parseFloat(computedStyles.marginTop || "0");
  const marginBottom = parseFloat(computedStyles.marginBottom || "0");

  return Math.ceil(measuredElement.scrollHeight + marginTop + marginBottom + 4);
};

const applyEmbeddedFormLayout = () => {
  if (!isEmbeddedModalPage) {
    return;
  }

  document.body.classList.add("modal-mode");

  const backButton = document.querySelector(".back-btn");
  if (backButton) {
    backButton.addEventListener("click", (event) => {
      event.preventDefault();
      const fallbackTarget = backButton.getAttribute("href");
      if (!notifyParentModal({ action: "close" }) && fallbackTarget) {
        routeTo(fallbackTarget);
      }
    });
  }

  const syncModalHeight = () => {
    notifyParentModal({ action: "resize", modalHeight: getEmbeddedModalHeight() });
  };

  window.addEventListener("load", () => {
    syncModalHeight();
  });

  if ("ResizeObserver" in window) {
    const resizeObserver = new ResizeObserver(() => {
      syncModalHeight();
    });

    const observedElement = document.querySelector(".form-card") || document.body;
    if (observedElement) {
      resizeObserver.observe(observedElement);
    }
  }
};

const activateSidebarLink = () => {
  const currentPath = window.location.pathname.split("/").pop() || "dash.html";
  const activePath = ["rolesadmin.html", "rolesuser.html", "roleswellness.html"].includes(currentPath) ? "roles.html" : currentPath;
  document.querySelectorAll(".sidebar-link").forEach((link) => {
    const targetPath = link.getAttribute("href");
    link.classList.toggle("active", targetPath === activePath);
  });
};

const applyRevealMotion = () => {
  const animatedGroups = [
    ".page-heading",
    ".stats > *",
    ".grid > *",
    ".table-container",
    ".table-card",
    ".filters",
    ".tabs",
    ".toolbar",
    ".roles",
    ".permissions",
    ".sidebar",
    ".card.tab.active",
    ".settings-sidebar",
    ".settings-panel.active",
    ".sidebar-card"
  ];

  const elements = [];
  animatedGroups.forEach((selector) => {
    document.querySelectorAll(selector).forEach((element) => {
      if (!elements.includes(element)) {
        elements.push(element);
      }
    });
  });

  elements.forEach((element, index) => {
    element.classList.add("reveal-on-load");
    element.style.setProperty("--stagger-delay", `${index * 65}ms`);
  });

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      elements.forEach((element) => element.classList.add("is-visible"));
    });
  });
};

const replayReveal = (element) => {
  if (!element) {
    return;
  }

  element.classList.remove("is-visible");
  element.classList.add("reveal-on-load");
  element.style.setProperty("--stagger-delay", "0ms");

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      element.classList.add("is-visible");
    });
  });
};

const STORAGE_KEYS = {
  users: "stack-builders-users",
  companies: "stack-builders-companies",
};

const APP_STORAGE_KEYS = {
  employees: "stackbuilders.hr.employees",
  experts: "stackbuilders.hr.experts",
  hrProfiles: "stackbuilders.hr.profiles.v2",
  challenges: "stackbuilders.hr.challenges",
  rewards: "stackbuilders.hr.rewards",
  consultations: "stackbuilders.consultations.v1",
  liveSessions: "stackbuilders.liveSessions.v1",
  videos: "stackbuilders.videoLibrary.v1",
};

const LEGACY_HR_PROFILE_STORAGE_KEY = "stackbuilders.hr.profile.v1";

const readStoredCollection = (key) => {
  try {
    const rawValue = window.localStorage.getItem(key);
    const parsedValue = rawValue ? JSON.parse(rawValue) : [];
    return Array.isArray(parsedValue) ? parsedValue : [];
  } catch (error) {
    return [];
  }
};

const writeStoredCollection = (key, collection) => {
  try {
    window.localStorage.setItem(key, JSON.stringify(collection));
    return true;
  } catch (error) {
    return false;
  }
};

const readStoredObject = (key, fallbackValue = {}) => {
  try {
    const rawValue = window.localStorage.getItem(key);
    const parsedValue = rawValue ? JSON.parse(rawValue) : fallbackValue;
    return parsedValue && typeof parsedValue === "object" && !Array.isArray(parsedValue)
      ? parsedValue
      : fallbackValue;
  } catch (error) {
    return fallbackValue;
  }
};

const writeStoredObject = (key, value) => {
  try {
    window.localStorage.setItem(key, JSON.stringify(value && typeof value === "object" ? value : {}));
    return true;
  } catch (error) {
    return false;
  }
};

const cleanText = (value) => value.replace(/\s+/g, " ").trim();
const normalizeLookupValue = (value) => cleanText(String(value || "")).toLowerCase();
const escapeHtml = (value) => String(value ?? "")
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&#39;");

const normalizeTimestamp = (value) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  const normalizedValue = cleanText(String(value || ""));
  if (!normalizedValue) {
    return 0;
  }

  const numericValue = Number(normalizedValue);
  if (Number.isFinite(numericValue)) {
    return numericValue;
  }

  const parsedValue = Date.parse(normalizedValue);
  return Number.isFinite(parsedValue) ? parsedValue : 0;
};

const sortNewestFirst = (collection) => [...collection].sort(
  (left, right) => normalizeTimestamp(right?.createdAt) - normalizeTimestamp(left?.createdAt),
);

const generateSequentialId = (prefix, records) => {
  const highestExistingNumber = records.reduce((currentMax, record) => {
    const matchedNumber = String(record.id || "").match(new RegExp(`^${prefix}-(\\d+)$`));
    if (!matchedNumber) {
      return currentMax;
    }

    return Math.max(currentMax, Number(matchedNumber[1]));
  }, 1000);

  return `${prefix}-${highestExistingNumber + 1}`;
};

const formatStoredDate = (timestamp) => {
  const normalizedTimestamp = normalizeTimestamp(timestamp);
  if (!normalizedTimestamp) {
    return "--";
  }

  return new Date(normalizedTimestamp).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatIndianPhoneNumber = (value) => {
  const digitsOnly = String(value || "").replace(/\D/g, "");

  if (digitsOnly.length === 10) {
    return `+91 ${digitsOnly.slice(0, 5)} ${digitsOnly.slice(5)}`;
  }

  if (digitsOnly.length === 12 && digitsOnly.startsWith("91")) {
    return `+91 ${digitsOnly.slice(2, 7)} ${digitsOnly.slice(7)}`;
  }

  return null;
};

const isValidEmailAddress = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/i.test(String(value || "").trim());
const isValidGmailAddress = (value) => /^[a-z0-9._%+-]+@gmail\.com$/i.test(String(value || "").trim());
const isValidPassword = (value) => cleanText(String(value || "")).length >= 6;

const getStoredCompanies = () => readStoredCollection(STORAGE_KEYS.companies);
const getStoredUsers = () => readStoredCollection(STORAGE_KEYS.users);

const normalizeUserRoleLabel = (role) => {
  const normalizedRole = normalizeLookupValue(role);

  if (["hr", "admin", "super user", "superuser"].includes(normalizedRole)) {
    return "HR";
  }

  if (["wellness expert", "expert"].includes(normalizedRole)) {
    return "Wellness Expert";
  }

  if (["employee", "end user", "enduser", "user"].includes(normalizedRole)) {
    return "Employee";
  }

  return "Employee";
};

const describeUserDetails = (user) => {
  if (user.role === "Employee" && user.department) {
    return user.department;
  }

  if (user.role === "Wellness Expert") {
    const detailParts = [];
    if (user.specialization) {
      detailParts.push(user.specialization);
    }
    if (Number.isFinite(user.experienceYears) && user.experienceYears > 0) {
      detailParts.push(`${user.experienceYears} year${user.experienceYears === 1 ? "" : "s"} exp.`);
    }
    if (detailParts.length) {
      return detailParts.join(" | ");
    }
  }

  return user.companyName || user.companyId || "--";
};

const describeCompanyDetails = (company) => {
  const detailParts = [company.email, company.address].filter((value) => value && value !== "--");
  return detailParts.length ? detailParts.join(" | ") : "--";
};

const getCompanyRecordKey = (company) => {
  const companyId = cleanText(String(company?.id || ""));
  if (companyId) {
    return `id:${companyId}`;
  }

  const fallbackParts = [
    cleanText(String(company?.email || "")).toLowerCase(),
    cleanText(String(company?.name || "")).toLowerCase(),
    String(Number(company?.createdAt || 0) || 0),
  ];

  return `fallback:${fallbackParts.join("|")}`;
};

const isUserLinkedToCompany = (user, company) => (
  normalizeLookupValue(user.companyId) === normalizeLookupValue(company.id)
  || normalizeLookupValue(user.companyName) === normalizeLookupValue(company.name)
);

const getUserRecordKey = (user) => {
  const userId = cleanText(String(user?.id || ""));
  if (userId) {
    return `id:${userId}`;
  }

  const fallbackParts = [
    cleanText(String(user?.email || "")).toLowerCase(),
    cleanText(String(user?.name || "")).toLowerCase(),
    String(Number(user?.createdAt || 0) || 0),
  ];

  return `fallback:${fallbackParts.join("|")}`;
};

const normalizeStoredCompany = (company) => {
  const createdAt = Number(company?.createdAt || 0) || 0;
  return {
    recordKey: getCompanyRecordKey(company),
    id: cleanText(String(company?.id || "")) || "--",
    name: cleanText(String(company?.name || "")),
    phone: formatIndianPhoneNumber(company?.phone || "") || cleanText(String(company?.phone || "")) || "--",
    address: cleanText(String(company?.address || "")) || "--",
    email: cleanText(String(company?.email || "")).toLowerCase() || "--",
    createdAt,
    createdLabel: cleanText(String(company?.createdLabel || "")) || (createdAt ? formatStoredDate(createdAt) : "--"),
  };
};

const normalizeStoredUser = (user) => ({
  recordKey: getUserRecordKey(user),
  id: cleanText(String(user?.id || "")) || "--",
  name: cleanText(String(user?.name || "")) || "--",
  email: cleanText(String(user?.email || "")).toLowerCase() || "--",
  role: normalizeUserRoleLabel(user?.role),
  status: normalizeLookupValue(user?.status) === "inactive" ? "Inactive" : "Active",
  companyId: cleanText(String(user?.companyId || "")) || "--",
  companyName: cleanText(String(user?.companyName || "")) || "--",
  department: cleanText(String(user?.department || "")),
  experienceYears: Number.isFinite(Number(user?.experienceYears)) ? Number(user.experienceYears) : 0,
  specialization: cleanText(String(user?.specialization || "")),
  createdAt: Number(user?.createdAt || 0) || 0,
});

const HR_PROFILE_DEFAULTS = {
  phoneNumber: "",
  department: "HR",
  designation: "HR Admin",
  location: "",
  companyId: "",
  companyName: "",
  status: "Active",
  createdBySuperUser: true,
};

const SESSION_KEYS = {
  employee: "stackbuilders.employeeSession.v1",
  expert: "stackbuilders.expertSession.v1",
  hr: "stackbuilders.hrSession.v1",
};

const createManagedRecordId = (prefix) => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
};

const normalizeEmployeeAccount = (employee) => {
  const createdAt = cleanText(String(employee?.createdAt || "")) || new Date().toISOString();

  return {
    id: cleanText(String(employee?.id || "")) || createManagedRecordId("employee"),
    name: cleanText(String(employee?.name || "")) || "Employee User",
    email: cleanText(String(employee?.email || employee?.username || "")).toLowerCase(),
    username: cleanText(String(employee?.username || employee?.email || "")).toLowerCase(),
    password: cleanText(String(employee?.password || "")),
    department: cleanText(String(employee?.department || "")) || "General",
    status: cleanText(String(employee?.status || "")) || "Active",
    age: cleanText(String(employee?.age || "")),
    gender: cleanText(String(employee?.gender || "")),
    phoneNumber: cleanText(String(employee?.phoneNumber || employee?.phone || "")),
    companyId: cleanText(String(employee?.companyId || "")),
    companyName: cleanText(String(employee?.companyName || "")),
    heightCm: cleanText(String(employee?.heightCm || employee?.height || "")),
    weightKg: cleanText(String(employee?.weightKg || employee?.weight || "")),
    createdAt,
    updatedAt: cleanText(String(employee?.updatedAt || employee?.createdAt || "")) || createdAt,
  };
};

const normalizeExpertAccount = (expert) => {
  const createdAt = cleanText(String(expert?.createdAt || "")) || new Date().toISOString();

  return {
    id: cleanText(String(expert?.id || "")) || createManagedRecordId("expert"),
    name: cleanText(String(expert?.name || "")) || "Wellness Expert",
    email: cleanText(String(expert?.email || expert?.username || "")).toLowerCase(),
    username: cleanText(String(expert?.username || expert?.email || "")).toLowerCase(),
    password: cleanText(String(expert?.password || "")),
    specialization: cleanText(String(expert?.specialization || "")) || "Wellness Expert",
    experience: cleanText(String(expert?.experience || expert?.experienceYears || "")),
    phoneNumber: cleanText(String(expert?.phoneNumber || expert?.phone || "")),
    companyId: cleanText(String(expert?.companyId || "")),
    companyName: cleanText(String(expert?.companyName || "")),
    status: cleanText(String(expert?.status || "")) || "Active",
    createdAt,
    updatedAt: cleanText(String(expert?.updatedAt || expert?.createdAt || "")) || createdAt,
  };
};

const normalizeHrAccount = (profile) => {
  const name = cleanText(String(profile?.name || ""));
  const email = cleanText(String(profile?.email || "")).toLowerCase();
  const password = cleanText(String(profile?.password || ""));

  if (!name || !email || !password) {
    return null;
  }

  const createdAt = cleanText(String(profile?.createdAt || "")) || new Date().toISOString();

  return {
    ...HR_PROFILE_DEFAULTS,
    ...profile,
    id: cleanText(String(profile?.id || "")) || createManagedRecordId("hr"),
    name,
    email,
    username: cleanText(String(profile?.username || email)).toLowerCase() || email,
    phoneNumber: cleanText(String(profile?.phoneNumber || HR_PROFILE_DEFAULTS.phoneNumber)),
    department: HR_PROFILE_DEFAULTS.department,
    designation: HR_PROFILE_DEFAULTS.designation,
    location: cleanText(String(profile?.location || HR_PROFILE_DEFAULTS.location)),
    companyId: cleanText(String(profile?.companyId || "")),
    companyName: cleanText(String(profile?.companyName || "")),
    status: cleanText(String(profile?.status || HR_PROFILE_DEFAULTS.status)) || HR_PROFILE_DEFAULTS.status,
    createdBySuperUser: profile?.createdBySuperUser !== false,
    password,
    createdAt,
    updatedAt: cleanText(String(profile?.updatedAt || profile?.createdAt || "")) || createdAt,
  };
};

const readEmployeeAccounts = () => readStoredCollection(APP_STORAGE_KEYS.employees).map(normalizeEmployeeAccount);
const writeEmployeeAccounts = (records) => writeStoredCollection(APP_STORAGE_KEYS.employees, records.map(normalizeEmployeeAccount));
const readExpertAccounts = () => readStoredCollection(APP_STORAGE_KEYS.experts).map(normalizeExpertAccount);
const writeExpertAccounts = (records) => writeStoredCollection(APP_STORAGE_KEYS.experts, records.map(normalizeExpertAccount));

const migrateLegacyHrAccounts = () => {
  const legacyHrAccount = normalizeHrAccount(readStoredObject(LEGACY_HR_PROFILE_STORAGE_KEY, null));
  if (!legacyHrAccount) {
    return [];
  }

  writeStoredCollection(APP_STORAGE_KEYS.hrProfiles, [legacyHrAccount]);
  window.localStorage.removeItem(LEGACY_HR_PROFILE_STORAGE_KEY);
  return [legacyHrAccount];
};

const readHrAccounts = () => {
  const storedHrAccounts = readStoredCollection(APP_STORAGE_KEYS.hrProfiles)
    .map(normalizeHrAccount)
    .filter(Boolean);

  if (storedHrAccounts.length) {
    return storedHrAccounts;
  }

  return migrateLegacyHrAccounts();
};

const writeHrAccounts = (records) => {
  const normalizedHrAccounts = Array.isArray(records)
    ? records.map(normalizeHrAccount).filter(Boolean)
    : [];

  const isSaved = writeStoredCollection(APP_STORAGE_KEYS.hrProfiles, normalizedHrAccounts);
  if (isSaved) {
    window.localStorage.removeItem(LEGACY_HR_PROFILE_STORAGE_KEY);
  }
  return isSaved;
};

const findHrAccountByEmail = (email) => {
  const normalizedEmail = cleanText(String(email || "")).toLowerCase();
  if (!normalizedEmail) {
    return null;
  }

  return readHrAccounts().find((profile) => profile.email === normalizedEmail) || null;
};

const isHrAccountLinkedToCompany = (profile, company) => {
  const profileCompanyId = cleanText(String(profile?.companyId || ""));
  const profileCompanyName = normalizeLookupValue(profile?.companyName);
  const targetCompanyId = cleanText(String(company?.id || company?.companyId || ""));
  const targetCompanyName = normalizeLookupValue(company?.name || company?.companyName);

  if (profileCompanyId && targetCompanyId && profileCompanyId === targetCompanyId) {
    return true;
  }

  return Boolean(profileCompanyName && targetCompanyName && profileCompanyName === targetCompanyName);
};

const replaceCompanyHrAccount = (profile) => {
  const nextHrAccount = normalizeHrAccount(profile);
  if (!nextHrAccount) {
    return {
      ok: false,
      error: "The HR account could not be prepared.",
    };
  }

  if (!isValidGmailAddress(nextHrAccount.email)) {
    return {
      ok: false,
      error: "Enter a valid Gmail address for the HR account.",
    };
  }

  if (!isValidPassword(nextHrAccount.password)) {
    return {
      ok: false,
      error: "HR password must be at least 6 characters long.",
    };
  }

  const currentHrAccounts = readHrAccounts();
  const replacedAccounts = currentHrAccounts.filter((currentProfile) =>
    isHrAccountLinkedToCompany(currentProfile, nextHrAccount),
  );
  const remainingHrAccounts = currentHrAccounts.filter(
    (currentProfile) => !isHrAccountLinkedToCompany(currentProfile, nextHrAccount),
  );

  if (!writeHrAccounts([nextHrAccount, ...remainingHrAccounts])) {
    return {
      ok: false,
      error: "The HR account could not be saved right now.",
    };
  }

  replacedAccounts.forEach((currentProfile) => {
    maybeClearAccountSession(SESSION_KEYS.hr, {
      id: currentProfile.id,
      email: currentProfile.email,
    });
  });

  return {
    ok: true,
    hrAccount: nextHrAccount,
    replacedAccounts,
  };
};

const buildManagedUserRecord = (user, sourceType) => {
  const role = sourceType === "employee"
    ? "Employee"
    : sourceType === "expert"
      ? "Wellness Expert"
      : sourceType === "hr"
        ? "HR"
        : normalizeUserRoleLabel(user?.role);

  const experienceValue = Number(
    sourceType === "expert"
      ? user?.experience || user?.experienceYears
      : user?.experienceYears,
  );

  return {
    recordKey: `${sourceType}:${cleanText(String(user?.id || user?.email || getUserRecordKey(user)) || sourceType)}`,
    sourceType,
    removable: true,
    isSeededDefault: Boolean(user?.isSeededDefault),
    id: cleanText(String(user?.id || "")) || "--",
    name: cleanText(String(user?.name || "")) || "--",
    email: cleanText(String(user?.email || "")).toLowerCase() || "--",
    role,
    status: normalizeLookupValue(user?.status) === "inactive" ? "Inactive" : "Active",
    companyId: cleanText(String(user?.companyId || "")) || "--",
    companyName: cleanText(String(user?.companyName || "")) || "--",
    department: cleanText(String(user?.department || "")),
    experienceYears: Number.isFinite(experienceValue) ? experienceValue : 0,
    specialization: cleanText(String(user?.specialization || "")),
    createdAt: normalizeTimestamp(user?.createdAt),
  };
};

const getManagedUsers = () => {
  const managedUsers = [
    ...readEmployeeAccounts().map((employee) => buildManagedUserRecord(employee, "employee")),
    ...readExpertAccounts().map((expert) => buildManagedUserRecord(expert, "expert")),
    ...readHrAccounts().map((profile) => buildManagedUserRecord(profile, "hr")),
  ];

  const knownEmails = new Set(
    managedUsers
      .map((user) => normalizeLookupValue(user.email))
      .filter(Boolean),
  );

  const legacyUsers = getStoredUsers()
    .map(normalizeStoredUser)
    .filter((user) => {
      const normalizedEmail = normalizeLookupValue(user.email);
      return normalizedEmail ? !knownEmails.has(normalizedEmail) : true;
    })
    .map((user) => ({
      ...user,
      recordKey: `legacy:${user.recordKey}`,
      sourceType: "legacy",
      removable: true,
    }));

  return sortNewestFirst([...managedUsers, ...legacyUsers]);
};

const clearStoredSession = (storageKey) => {
  try {
    window.sessionStorage.removeItem(storageKey);
  } catch (error) {
    // Ignore unavailable session storage.
  }

  try {
    window.localStorage.removeItem(storageKey);
  } catch (error) {
    // Ignore unavailable local storage.
  }
};

const maybeClearAccountSession = (storageKey, matchers = {}) => {
  const normalizedEmail = normalizeLookupValue(matchers.email);
  const normalizedId = cleanText(String(matchers.id || ""));
  if (!normalizedEmail && !normalizedId) {
    return;
  }

  const storages = [window.sessionStorage, window.localStorage];
  storages.forEach((storage) => {
    try {
      const rawValue = storage?.getItem(storageKey);
      const parsedValue = rawValue ? JSON.parse(rawValue) : null;
      const normalizedSessionEmail = normalizeLookupValue(parsedValue?.email || parsedValue?.username);
      const normalizedSessionId = cleanText(String(
        parsedValue?.employeeId
        || parsedValue?.expertId
        || parsedValue?.hrId
        || ""
      ));

      if (
        (normalizedEmail && normalizedSessionEmail === normalizedEmail)
        || (normalizedId && normalizedSessionId === normalizedId)
      ) {
        storage.removeItem(storageKey);
      }
    } catch (error) {
      // Ignore malformed or unavailable storage.
    }
  });
};

const removeManagedUser = (user) => {
  if (!user?.recordKey) {
    return false;
  }

  if (user.sourceType === "employee") {
    const nextEmployees = readEmployeeAccounts().filter(
      (employee) => cleanText(String(employee.id || "")) !== cleanText(String(user.id || "")),
    );
    const isSaved = writeEmployeeAccounts(nextEmployees);
    if (isSaved) {
      maybeClearAccountSession(SESSION_KEYS.employee, {
        id: user.id,
        email: user.email,
      });
    }
    return isSaved;
  }

  if (user.sourceType === "expert") {
    const nextExperts = readExpertAccounts().filter(
      (expert) => cleanText(String(expert.id || "")) !== cleanText(String(user.id || "")),
    );
    const isSaved = writeExpertAccounts(nextExperts);
    if (isSaved) {
      maybeClearAccountSession(SESSION_KEYS.expert, {
        id: user.id,
        email: user.email,
      });
    }
    return isSaved;
  }

  if (user.sourceType === "hr") {
    const nextHrAccounts = readHrAccounts().filter(
      (profile) => cleanText(String(profile.id || "")) !== cleanText(String(user.id || "")),
    );
    const isSaved = writeHrAccounts(nextHrAccounts);
    if (isSaved) {
      maybeClearAccountSession(SESSION_KEYS.hr, {
        id: user.id,
        email: user.email,
      });
    }
    return isSaved;
  }

  if (user.sourceType === "legacy") {
    const legacyKey = user.recordKey.replace(/^legacy:/, "");
    return writeStoredCollection(
      STORAGE_KEYS.users,
      getStoredUsers().filter((storedUser) => getUserRecordKey(storedUser) !== legacyKey),
    );
  }

  return false;
};

const removeCompanyUsers = (company) => {
  const currentEmployees = readEmployeeAccounts();
  const currentExperts = readExpertAccounts();
  const currentHrAccounts = readHrAccounts();
  const currentLegacyUsers = getStoredUsers();
  const nextEmployees = currentEmployees.filter(
    (employee) => !isUserLinkedToCompany(buildManagedUserRecord(employee, "employee"), company),
  );
  const nextExperts = currentExperts.filter(
    (expert) => !isUserLinkedToCompany(buildManagedUserRecord(expert, "expert"), company),
  );
  const nextHrAccounts = currentHrAccounts.filter(
    (profile) => !isUserLinkedToCompany(buildManagedUserRecord(profile, "hr"), company),
  );
  const nextLegacyUsers = currentLegacyUsers.filter(
    (legacyUser) => !isUserLinkedToCompany(normalizeStoredUser(legacyUser), company),
  );

  const employeeEmailsToClear = currentEmployees
    .filter((employee) => isUserLinkedToCompany(buildManagedUserRecord(employee, "employee"), company))
    .map((employee) => ({ id: employee.id, email: employee.email }));
  const expertEmailsToClear = currentExperts
    .filter((expert) => isUserLinkedToCompany(buildManagedUserRecord(expert, "expert"), company))
    .map((expert) => ({ id: expert.id, email: expert.email }));
  const hrAccountsToClear = currentHrAccounts
    .filter((profile) => isUserLinkedToCompany(buildManagedUserRecord(profile, "hr"), company))
    .map((profile) => ({ id: profile.id, email: profile.email }));

  if (!writeEmployeeAccounts(nextEmployees)) {
    return false;
  }

  if (!writeExpertAccounts(nextExperts)) {
    writeEmployeeAccounts(currentEmployees);
    return false;
  }

  if (!writeHrAccounts(nextHrAccounts)) {
    writeEmployeeAccounts(currentEmployees);
    writeExpertAccounts(currentExperts);
    return false;
  }

  if (!writeStoredCollection(STORAGE_KEYS.users, nextLegacyUsers)) {
    writeEmployeeAccounts(currentEmployees);
    writeExpertAccounts(currentExperts);
    writeHrAccounts(currentHrAccounts);
    return false;
  }

  employeeEmailsToClear.forEach((matcher) => maybeClearAccountSession(SESSION_KEYS.employee, matcher));
  expertEmailsToClear.forEach((matcher) => maybeClearAccountSession(SESSION_KEYS.expert, matcher));
  hrAccountsToClear.forEach((matcher) => maybeClearAccountSession(SESSION_KEYS.hr, matcher));
  return true;
};

const setFormMessage = (element, message, type = "error") => {
  if (!element) {
    return;
  }

  element.textContent = message;
  element.classList.toggle("is-success", type === "success");
};

const getUserRoleLabel = (role) => ({
  employee: "Employee",
  hr: "HR",
  expert: "Wellness Expert",
})[role] || "Employee";

const getUserRoleClass = (roleLabel) => ({
  "Employee": "employee",
  "HR": "hr",
  "Wellness Expert": "expert",
})[roleLabel] || "employee";

const populateCompanySuggestions = () => {
  const companySuggestions = document.getElementById("companySuggestions");

  if (!companySuggestions) {
    return;
  }

  const optionsMarkup = sortNewestFirst(getStoredCompanies())
    .map((company) => `<option value="${escapeHtml(company.name)}"></option>`)
    .join("");

  companySuggestions.innerHTML = optionsMarkup;
};

const findStoredCompany = (value, companies) => companies.find((company) => {
  const companyName = normalizeLookupValue(company.name);
  const companyId = normalizeLookupValue(company.id);
  const lookupValue = normalizeLookupValue(value);

  return lookupValue && (lookupValue === companyName || lookupValue === companyId);
});

const persistCompanyCollectionLocally = (companies) => writeStoredCollection(
  STORAGE_KEYS.companies,
  (Array.isArray(companies) ? companies : []).map((company) => {
    const normalizedCompany = normalizeStoredCompany(company);

    return {
      id: normalizedCompany.id,
      name: normalizedCompany.name,
      phone: normalizedCompany.phone,
      address: normalizedCompany.address,
      email: normalizedCompany.email,
      createdAt: normalizedCompany.createdAt,
      createdLabel: normalizedCompany.createdLabel,
    };
  }),
);

const persistApprovedCompanyLocally = (company) => {
  const normalizedCompany = normalizeStoredCompany(company);
  const companyRecordKey = getCompanyRecordKey(normalizedCompany);
  const currentCompanies = getStoredCompanies().map(normalizeStoredCompany);
  const remainingCompanies = currentCompanies.filter(
    (currentCompany) => currentCompany.recordKey !== companyRecordKey,
  );

  return writeStoredCollection(STORAGE_KEYS.companies, [
    {
      id: normalizedCompany.id,
      name: normalizedCompany.name,
      phone: normalizedCompany.phone,
      address: normalizedCompany.address,
      email: normalizedCompany.email,
      createdAt: normalizedCompany.createdAt,
      createdLabel: normalizedCompany.createdLabel,
    },
    ...remainingCompanies.map((currentCompany) => ({
      id: currentCompany.id,
      name: currentCompany.name,
      phone: currentCompany.phone,
      address: currentCompany.address,
      email: currentCompany.email,
      createdAt: currentCompany.createdAt,
      createdLabel: currentCompany.createdLabel,
    })),
  ]);
};

const persistEmployeeAccountLocally = (employee) => {
  const nextEmployee = normalizeEmployeeAccount(employee);
  const remainingEmployees = readEmployeeAccounts().filter(
    (currentEmployee) => cleanText(String(currentEmployee?.id || "")) !== nextEmployee.id,
  );

  return writeEmployeeAccounts([nextEmployee, ...remainingEmployees]);
};

const persistExpertAccountLocally = (expert) => {
  const nextExpert = normalizeExpertAccount(expert);
  const remainingExperts = readExpertAccounts().filter(
    (currentExpert) => cleanText(String(currentExpert?.id || "")) !== nextExpert.id,
  );

  return writeExpertAccounts([nextExpert, ...remainingExperts]);
};

const refreshAdminDirectoryDataFromBackend = async () => {
  if (!currentAdmin || !window.appApiClient?.request) {
    return {
      ok: false,
      skipped: true,
    };
  }

  try {
    const [companies, employees, experts, hrProfiles, consultations, liveSessions, challenges, rewards] = await Promise.all([
      window.appApiClient.request("/companies"),
      window.appApiClient.request("/employees"),
      window.appApiClient.request("/experts"),
      window.appApiClient.request("/hr-profiles"),
      window.appApiClient.request("/consultations"),
      window.appApiClient.request("/live-sessions"),
      window.appApiClient.request("/challenges"),
      window.appApiClient.request("/rewards"),
    ]);

    const isCompaniesSaved = persistCompanyCollectionLocally(companies);
    const isEmployeesSaved = writeEmployeeAccounts(Array.isArray(employees) ? employees : []);
    const isExpertsSaved = writeExpertAccounts(Array.isArray(experts) ? experts : []);
    const isHrProfilesSaved = writeHrAccounts(Array.isArray(hrProfiles) ? hrProfiles : []);
    const isConsultationsSaved = writeStoredCollection(
      APP_STORAGE_KEYS.consultations,
      Array.isArray(consultations) ? consultations : []
    );
    const isLiveSessionsSaved = writeStoredCollection(
      APP_STORAGE_KEYS.liveSessions,
      Array.isArray(liveSessions) ? liveSessions : []
    );
    const isChallengesSaved = writeStoredCollection(
      APP_STORAGE_KEYS.challenges,
      Array.isArray(challenges) ? challenges : []
    );
    const isRewardsSaved = writeStoredCollection(
      APP_STORAGE_KEYS.rewards,
      Array.isArray(rewards) ? rewards : []
    );

    if (
      !isCompaniesSaved
      || !isEmployeesSaved
      || !isExpertsSaved
      || !isHrProfilesSaved
      || !isConsultationsSaved
      || !isLiveSessionsSaved
      || !isChallengesSaved
      || !isRewardsSaved
    ) {
      return {
        ok: false,
        error: "The latest backend data could not be mirrored into this browser.",
      };
    }

    return {
      ok: true,
    };
  } catch (error) {
    console.error("Unable to refresh the admin directory from the backend.", error);
    return {
      ok: false,
      error: error?.message || "The latest backend data could not be loaded right now.",
    };
  }
};

const approveCompanyOnboardingRequest = async (requestId) => {
  const result = await companyOnboardingRequestStore?.approveRequest?.(requestId);

  if (!result?.ok) {
    return {
      ok: false,
      error: result?.error || "This company request could not be approved.",
    };
  }

  const approvedCompany = result?.result?.company || null;
  const approvedHrProfile = result?.result?.hrProfile || null;

  if (!approvedCompany || !approvedHrProfile) {
    return {
      ok: false,
      error: "The backend approval response is missing company or HR details.",
    };
  }

  const companiesBeforeUpdate = getStoredCompanies();
  if (!persistApprovedCompanyLocally(approvedCompany)) {
    return {
      ok: false,
      error: "The approved company could not be mirrored into local storage.",
    };
  }

  const normalizedApprovedHrProfile = {
    ...approvedHrProfile,
    phoneNumber: cleanText(String(approvedHrProfile?.phoneNumber || ""))
      || cleanText(String(approvedCompany?.phone || "")),
  };
  const hrSaveResult = replaceCompanyHrAccount(normalizedApprovedHrProfile);
  if (!hrSaveResult.ok) {
    writeStoredCollection(STORAGE_KEYS.companies, companiesBeforeUpdate);
    return {
      ok: false,
      error: hrSaveResult.error || "The approved HR account could not be saved locally.",
    };
  }

  return {
    ok: true,
    company: normalizeStoredCompany(approvedCompany),
    hrAccount: hrSaveResult.hrAccount,
  };

};

const renderCompanyOnboardingRequests = async () => {
  const tableBody = document.getElementById("companyRequestTableBody");
  const footer = document.getElementById("companyRequestTableFooter");

  if (!tableBody || !footer) {
    return;
  }

  await companyOnboardingRequestStore?.refreshRequests?.();

  const requests = sortNewestFirst(
    companyOnboardingRequestStore?.getPendingRequests?.()
    || companyOnboardingRequestStore?.readRequests?.()
    || []
  );

  if (!requests.length) {
    tableBody.innerHTML = `
      <tr class="empty-row">
        <td colspan="5">No company approval requests are pending right now.</td>
      </tr>
    `;
    footer.textContent = "Showing 0 requests";
    return;
  }

  tableBody.innerHTML = requests.map((request) => `
    <tr>
      <td>
        <span class="cell-title">${escapeHtml(request.companyName)}</span>
        <span class="cell-meta">${escapeHtml(request.companyEmail)} | ${escapeHtml(request.companyPhone)}</span>
        <span class="cell-meta">${escapeHtml(request.companyAddress)}</span>
      </td>
      <td>
        <span class="cell-title">${escapeHtml(request.hrName)}</span>
        <span class="cell-meta">${escapeHtml(request.hrEmail)}</span>
        <span class="cell-meta">${escapeHtml(request.hrPhoneNumber || "Phone not provided")}</span>
      </td>
      <td>
        <span class="cell-title">${escapeHtml(formatStoredDate(request.createdAt))}</span>
        <span class="cell-meta">${escapeHtml(new Date(request.createdAt).toLocaleTimeString("en-IN", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }))}</span>
      </td>
      <td><span class="status active">Pending Review</span></td>
      <td>
        <div class="request-action-row">
          <button class="approve-button action-button" type="button" data-approve-request="${escapeHtml(request.id)}">Accept</button>
          <button class="delete action-button" type="button" data-delete-request="${escapeHtml(request.id)}">Delete</button>
        </div>
      </td>
    </tr>
  `).join("");

  footer.textContent = `Showing ${requests.length} request${requests.length === 1 ? "" : "s"}`;

  tableBody.querySelectorAll("[data-approve-request]").forEach((button) => {
    button.addEventListener("click", async () => {
      const requestKey = button.getAttribute("data-approve-request");
      const request = requests.find((entry) => entry.id === requestKey);

      if (!request) {
        return;
      }

      if (!window.confirm(`Approve ${request.companyName} and create its HR account?`)) {
        return;
      }

      const result = await approveCompanyOnboardingRequest(request.id);
      if (!result?.ok) {
        window.alert(result?.error || "This company request could not be approved.");
        return;
      }

      await renderCompanyOnboardingRequests();
      renderCompanyManagementTable();
      renderUserManagementTable();
      initializeDashboardOverview();
      initializeReportsAnalytics();
    });
  });

  tableBody.querySelectorAll("[data-delete-request]").forEach((button) => {
    button.addEventListener("click", async () => {
      const requestKey = button.getAttribute("data-delete-request");
      const request = requests.find((entry) => entry.id === requestKey);

      if (!request) {
        return;
      }

      if (!window.confirm(`Delete the pending request for ${request.companyName}?`)) {
        return;
      }

      const result = await companyOnboardingRequestStore?.deleteRequest?.(request.id);
      if (!result?.ok) {
        window.alert(result?.error || "This company request could not be deleted.");
        return;
      }

      await renderCompanyOnboardingRequests();
    });
  });
};

const renderUserManagementTable = () => {
  const tableBody = document.getElementById("userTableBody");
  const footer = document.getElementById("userTableFooter");

  if (!tableBody || !footer) {
    return;
  }

  const users = getManagedUsers();

  if (!users.length) {
    tableBody.innerHTML = `
      <tr class="empty-row">
        <td colspan="6">No users added yet. Use Add User to create the first account.</td>
      </tr>
    `;
    footer.textContent = "Showing 0 users";
    return;
  }

  tableBody.innerHTML = users.map((user) => `
    <tr>
      <td>${escapeHtml(user.companyId || "--")}</td>
      <td>
        <span class="cell-title">${escapeHtml(user.name)}</span>
        <span class="cell-meta">${escapeHtml(user.companyName || "--")}</span>
      </td>
      <td>
        <span class="cell-title">${escapeHtml(user.email)}</span>
        <span class="cell-meta">${escapeHtml(describeUserDetails(user))}</span>
      </td>
      <td><span class="badge ${escapeHtml(getUserRoleClass(user.role))}">${escapeHtml(user.role)}</span></td>
      <td><span class="badge ${user.status === "Inactive" ? "inactive" : "active"}">${escapeHtml(user.status || "Active")}</span></td>
      <td>${user.removable
        ? `<button class="delete action-button" type="button" data-remove-user-key="${escapeHtml(user.recordKey)}">Remove</button>`
        : `<span class="cell-meta">Primary account</span>`}</td>
    </tr>
  `).join("");

  footer.textContent = `Showing ${users.length} user${users.length === 1 ? "" : "s"}`;

  tableBody.querySelectorAll("[data-remove-user-key]").forEach((button) => {
    button.addEventListener("click", async () => {
      const userKey = button.getAttribute("data-remove-user-key");
      const userToRemove = users.find((user) => user.recordKey === userKey);

      if (!userKey || !userToRemove || !window.confirm(`Remove ${userToRemove.name} from the workspace?`)) {
        return;
      }

      let isRemoved = false;

      if (window.appApiClient?.request && currentAdmin && ["employee", "expert", "hr"].includes(userToRemove.sourceType)) {
        const endpoint = userToRemove.sourceType === "employee"
          ? "employees"
          : userToRemove.sourceType === "expert"
            ? "experts"
            : "hr-profiles";

        try {
          await window.appApiClient.request(`/${endpoint}/${encodeURIComponent(cleanText(String(userToRemove.id || "")))}`, {
            method: "DELETE",
          });

          const refreshResult = await refreshAdminDirectoryDataFromBackend();
          isRemoved = refreshResult.ok || refreshResult.skipped;
        } catch (error) {
          window.alert(error?.message || "This user could not be removed from the backend.");
          return;
        }
      } else {
        isRemoved = removeManagedUser(userToRemove);
      }

      if (!isRemoved) {
        window.alert("This user could not be mirrored in local storage after deletion.");
        return;
      }

      renderUserManagementTable();
      renderCompanyManagementTable();
      initializeDashboardOverview();
      initializeReportsAnalytics();
    });
  });
};

const renderCompanyManagementTable = () => {
  const tableBody = document.getElementById("companyTableBody");
  const footer = document.getElementById("companyTableFooter");

  if (!tableBody || !footer) {
    return;
  }

  const companies = sortNewestFirst(getStoredCompanies().map(normalizeStoredCompany));
  const users = getManagedUsers();

  if (!companies.length) {
    tableBody.innerHTML = `
      <tr class="empty-row">
        <td colspan="7">No companies added yet. Use Add Company to create the first record.</td>
      </tr>
    `;
    footer.textContent = "Showing 0 entries";
    return;
  }

  tableBody.innerHTML = companies.map((company) => {
    const companyUsers = users.filter((user) => isUserLinkedToCompany(user, company));

    const employeeCount = companyUsers.filter((user) => user.role === "Employee").length;
    const expertCount = companyUsers.filter((user) => user.role === "Wellness Expert").length;
    const hrCount = companyUsers.filter((user) => user.role === "HR").length;

    return `
      <tr>
        <td>${escapeHtml(company.id)}</td>
        <td>
          <span class="cell-title">${escapeHtml(company.name)}</span>
          <span class="cell-meta">${escapeHtml(describeCompanyDetails(company))}</span>
        </td>
        <td>${employeeCount}</td>
        <td>${expertCount}</td>
        <td>${hrCount}</td>
        <td>
          <span class="cell-title">${escapeHtml(company.createdLabel || "--")}</span>
          <span class="cell-meta">${escapeHtml(company.phone)}</span>
        </td>
        <td><button class="delete action-button" type="button" data-remove-company-key="${escapeHtml(company.recordKey)}">Remove</button></td>
      </tr>
    `;
  }).join("");

  footer.textContent = `Showing ${companies.length} entr${companies.length === 1 ? "y" : "ies"}`;

  tableBody.querySelectorAll("[data-remove-company-key]").forEach((button) => {
    button.addEventListener("click", async () => {
      const companyKey = button.getAttribute("data-remove-company-key");
      if (!companyKey) {
        return;
      }

      const companyToRemove = companies.find((company) => company.recordKey === companyKey);
      if (!companyToRemove) {
        return;
      }

      const linkedUsers = users.filter((user) => isUserLinkedToCompany(user, companyToRemove));
      const removableUsers = linkedUsers.filter((user) => user.removable);
      const confirmationMessage = removableUsers.length
        ? `Remove ${companyToRemove.name} and delete ${removableUsers.length} linked account${removableUsers.length === 1 ? "" : "s"}?`
        : `Remove ${companyToRemove.name} from Company Management?`;

      if (!window.confirm(confirmationMessage)) {
        return;
      }

      if (window.appApiClient?.request && currentAdmin && cleanText(String(companyToRemove.id || ""))) {
        try {
          await window.appApiClient.request(`/companies/${encodeURIComponent(cleanText(String(companyToRemove.id || "")))}`, {
            method: "DELETE",
          });

          const refreshResult = await refreshAdminDirectoryDataFromBackend();
          if (!refreshResult.ok && !refreshResult.skipped) {
            window.alert(refreshResult.error || "The deleted company could not be mirrored locally.");
            return;
          }
        } catch (error) {
          window.alert(error?.message || "This company could not be removed from the backend.");
          return;
        }
      } else {
        const currentCompanies = getStoredCompanies();
        const nextCompanies = currentCompanies.filter((company) => getCompanyRecordKey(company) !== companyKey);

        if (!writeStoredCollection(STORAGE_KEYS.companies, nextCompanies)) {
          return;
        }

        if (removableUsers.length && !removeCompanyUsers(companyToRemove)) {
          writeStoredCollection(STORAGE_KEYS.companies, currentCompanies);
          return;
        }
      }

      renderCompanyManagementTable();
      renderUserManagementTable();
      initializeDashboardOverview();
      initializeReportsAnalytics();
    });
  });
};

const initializeAddCompanyForm = () => {
  const companyForm = document.querySelector(".company-form");
  const formMessage = document.getElementById("companyFormMessage");

  if (!companyForm) {
    return;
  }

  companyForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const companyNameField = document.getElementById("companyName");
    const phoneField = document.getElementById("phoneNumber");
    const addressField = document.getElementById("address");
    const emailField = document.getElementById("emailAddress");
    const companies = getStoredCompanies();

    const companyName = cleanText(companyNameField?.value || "");
    const phoneNumber = formatIndianPhoneNumber(phoneField?.value || "");
    const address = cleanText(addressField?.value || "");
    const email = cleanText(emailField?.value || "").toLowerCase();

    if (!companyName) {
      setFormMessage(formMessage, "Enter a company name.");
      companyNameField?.focus();
      return;
    }

    if (companies.some((company) => normalizeLookupValue(company.name) === normalizeLookupValue(companyName))) {
      setFormMessage(formMessage, "A company with this name already exists.");
      companyNameField?.focus();
      return;
    }

    if (!phoneNumber) {
      setFormMessage(formMessage, "Enter a valid Indian phone number.");
      phoneField?.focus();
      return;
    }

    if (companies.some((company) => normalizeLookupValue(company.phone) === normalizeLookupValue(phoneNumber))) {
      setFormMessage(formMessage, "This phone number is already linked to another company.");
      phoneField?.focus();
      return;
    }

    if (!address) {
      setFormMessage(formMessage, "Enter the company address.");
      addressField?.focus();
      return;
    }

    if (!isValidEmailAddress(email)) {
      setFormMessage(formMessage, "Enter a valid company email address.");
      emailField?.focus();
      return;
    }

    if (companies.some((company) => normalizeLookupValue(company.email) === normalizeLookupValue(email))) {
      setFormMessage(formMessage, "This company email is already used by another company.");
      emailField?.focus();
      return;
    }

    if (window.appApiClient?.request && currentAdmin) {
      try {
        const createdCompany = await window.appApiClient.request("/companies", {
          method: "POST",
          json: {
            name: companyName,
            phone: phoneNumber,
            address,
            email,
          },
        });

        const refreshResult = await refreshAdminDirectoryDataFromBackend();
        const isMirrored = refreshResult.ok || persistApprovedCompanyLocally(createdCompany);

        if (!isMirrored) {
          setFormMessage(formMessage, "Company was created in the backend, but local sync failed.");
          return;
        }
      } catch (error) {
        setFormMessage(formMessage, error?.message || "Company could not be saved right now.");
        return;
      }
    } else {
      const createdAt = Date.now();
      const nextCompanies = [{
        id: generateSequentialId("CMP", companies),
        name: companyName,
        phone: phoneNumber,
        address,
        email,
        createdAt,
        createdLabel: formatStoredDate(createdAt),
      }, ...companies];

      if (!writeStoredCollection(STORAGE_KEYS.companies, nextCompanies)) {
        setFormMessage(formMessage, "Company could not be saved in this browser.");
        return;
      }
    }

    setFormMessage(formMessage, "Company added successfully.", "success");

    if (isEmbeddedModalPage) {
      if (!notifyParentModal({ action: "saved", refreshCompanies: true })) {
        try {
          if (window.top && window.top !== window) {
            window.top.location.replace("datamgmt.html");
            return;
          }
        } catch (error) {
          // Fall back to local navigation below.
        }
      }
      return;
    }

    routeTo("datamgmt.html");
  });
};

const initializeAddUserForm = () => {
  const userForm = document.querySelector(".admin-form");
  const formMessage = document.getElementById("userFormMessage");

  if (!userForm) {
    return;
  }

  populateCompanySuggestions();

  if (!getStoredCompanies().length) {
    setFormMessage(formMessage, "Add a company first in Company Management before creating users.");
  }

  userForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const companies = getStoredCompanies();
    const managedUsers = getManagedUsers();
    const activeRole = userForm.dataset.role || "employee";
    const nameField = document.getElementById("nameField");
    const emailField = document.getElementById("emailAddress");
    const passwordField = document.getElementById("password");
    const departmentField = document.getElementById("department");
    const experienceField = document.getElementById("experience");
    const specializationField = document.querySelector('input[name="specialization"]:checked');
    const companyField = activeRole === "employee"
      ? document.getElementById("employeeCompany")
      : activeRole === "expert"
        ? document.getElementById("expertCompany")
        : document.getElementById("companyName");

    const fullName = cleanText(nameField?.value || "");
    const email = cleanText(emailField?.value || "").toLowerCase();
    const password = String(passwordField?.value || "").trim();
    const companyLookup = cleanText(companyField?.value || "");
    const matchedCompany = findStoredCompany(companyLookup, companies);

    if (!companies.length) {
      setFormMessage(formMessage, "Add a company first in Company Management before creating users.");
      return;
    }

    if (!fullName) {
      setFormMessage(formMessage, "Enter the user name.");
      nameField?.focus();
      return;
    }

    if (!isValidGmailAddress(email)) {
      setFormMessage(formMessage, "Enter a valid Gmail address.");
      emailField?.focus();
      return;
    }

    if (!password) {
      setFormMessage(formMessage, "Password is required.");
      passwordField?.focus();
      return;
    }

    if (!isValidPassword(password)) {
      setFormMessage(formMessage, "Password must be at least 6 characters long.");
      passwordField?.focus();
      return;
    }

    if (!matchedCompany) {
      setFormMessage(formMessage, "Select a valid company name that already exists.");
      companyField?.focus();
      return;
    }

    if (activeRole === "employee") {
      const department = cleanText(departmentField?.value || "");
      if (!department || department.toLowerCase() === "select department") {
        setFormMessage(formMessage, "Choose a department for the employee.");
        departmentField?.focus();
        return;
      }
    }

    if (activeRole === "expert") {
      const rawExperience = cleanText(experienceField?.value || "");
      const yearsOfExperience = Number(rawExperience);
      if (!rawExperience || !Number.isFinite(yearsOfExperience) || yearsOfExperience < 0 || yearsOfExperience > 60) {
        setFormMessage(formMessage, "Enter a valid experience value for the wellness expert.");
        experienceField?.focus();
        return;
      }

      if (!specializationField) {
        setFormMessage(formMessage, "Choose a specialization for the wellness expert.");
        return;
      }
    }

    const duplicateUser = managedUsers.find((user) => normalizeLookupValue(user.email) === normalizeLookupValue(email));

    if (duplicateUser) {
      setFormMessage(formMessage, "This Gmail address is already used by another user.");
      emailField?.focus();
      return;
    }

    let isSaved = false;
    let successMessage = "User added successfully.";

    if (window.appApiClient?.request && currentAdmin) {
      try {
        if (activeRole === "employee") {
          const createdEmployee = await window.appApiClient.request("/employees", {
            method: "POST",
            json: {
              name: fullName,
              email,
              password,
              department: cleanText(departmentField?.value || ""),
              status: "Active",
              companyId: matchedCompany.id,
              companyName: matchedCompany.name,
            },
          });

          const refreshResult = await refreshAdminDirectoryDataFromBackend();
          isSaved = refreshResult.ok || persistEmployeeAccountLocally(createdEmployee);
        } else if (activeRole === "expert") {
          const createdExpert = await window.appApiClient.request("/experts", {
            method: "POST",
            json: {
              name: fullName,
              email,
              password,
              specialization: specializationField.value,
              experience: cleanText(experienceField?.value || ""),
              status: "Active",
              companyId: matchedCompany.id,
              companyName: matchedCompany.name,
            },
          });

          const refreshResult = await refreshAdminDirectoryDataFromBackend();
          isSaved = refreshResult.ok || persistExpertAccountLocally(createdExpert);
        } else {
          const createdHrPayload = await window.appApiClient.request("/hr-profiles", {
            method: "POST",
            json: {
              ...HR_PROFILE_DEFAULTS,
              name: fullName,
              email,
              password,
              status: "Active",
              companyId: matchedCompany.id,
              companyName: matchedCompany.name,
              createdBySuperUser: true,
            },
          });

          const createdHrProfile = createdHrPayload?.hrProfile || null;
          const replacedProfiles = Array.isArray(createdHrPayload?.replacedProfiles)
            ? createdHrPayload.replacedProfiles
            : [];
          const refreshResult = await refreshAdminDirectoryDataFromBackend();
          const fallbackHrResult = createdHrProfile
            ? replaceCompanyHrAccount(createdHrProfile)
            : { ok: false };

          isSaved = refreshResult.ok || fallbackHrResult.ok;
          successMessage = isSaved
            ? replacedProfiles.length
              ? "Previous HR removed. The new HR now has access to this company."
              : "HR account created successfully."
            : fallbackHrResult.error || "HR account could not be saved.";
        }
      } catch (error) {
        setFormMessage(formMessage, error?.message || "User could not be saved right now.");
        return;
      }
    } else if (activeRole === "employee") {
      const now = new Date().toISOString();
      const nextEmployees = [
        normalizeEmployeeAccount({
          id: createManagedRecordId("employee"),
          name: fullName,
          email,
          username: email,
          password,
          department: cleanText(departmentField?.value || ""),
          status: "Active",
          companyId: matchedCompany.id,
          companyName: matchedCompany.name,
          createdAt: now,
          updatedAt: now,
        }),
        ...readEmployeeAccounts(),
      ];

      isSaved = writeEmployeeAccounts(nextEmployees);
    } else if (activeRole === "expert") {
      const now = new Date().toISOString();
      const nextExperts = [
        normalizeExpertAccount({
          id: createManagedRecordId("expert"),
          name: fullName,
          email,
          username: email,
          password,
          specialization: specializationField.value,
          experience: cleanText(experienceField?.value || ""),
          status: "Active",
          companyId: matchedCompany.id,
          companyName: matchedCompany.name,
          createdAt: now,
          updatedAt: now,
        }),
        ...readExpertAccounts(),
      ];

      isSaved = writeExpertAccounts(nextExperts);
    } else {
      const now = new Date().toISOString();
      const hrSaveResult = replaceCompanyHrAccount({
        id: createManagedRecordId("hr"),
        ...HR_PROFILE_DEFAULTS,
        name: fullName,
        email,
        username: email,
        password,
        status: "Active",
        companyId: matchedCompany.id,
        companyName: matchedCompany.name,
        createdAt: now,
        updatedAt: now,
      });

      isSaved = hrSaveResult.ok;
      successMessage = hrSaveResult.ok
        ? hrSaveResult.replacedAccounts?.length
          ? "Previous HR removed. The new HR now has access to this company."
          : "HR account created successfully."
        : hrSaveResult.error || "HR account could not be saved.";
    }

    if (!isSaved) {
      setFormMessage(formMessage, successMessage || "User could not be saved in this browser.");
      return;
    }

    setFormMessage(formMessage, successMessage, "success");

    if (isEmbeddedModalPage) {
      if (!notifyParentModal({ action: "saved", refreshUsers: true })) {
        try {
          if (window.top && window.top !== window) {
            window.top.location.replace("usermgmt.html");
            return;
          }
        } catch (error) {
          // Fall back to local navigation below.
        }
      }
      return;
    }

    routeTo("usermgmt.html");
  });
};

const setPermissionToggleState = (toggle, isActive) => {
  let symbol = toggle.querySelector(".toggle-symbol");
  if (!symbol) {
    symbol = document.createElement("span");
    symbol.className = "toggle-symbol";
    symbol.setAttribute("aria-hidden", "true");
  }

  toggle.classList.toggle("active", isActive);
  toggle.setAttribute("aria-pressed", isActive ? "true" : "false");
  symbol.textContent = isActive ? "✓" : "✕";
  toggle.replaceChildren(symbol);
  toggle.setAttribute("title", isActive ? "Enabled" : "Disabled");
};

const getPermissionToggleDefaultState = (toggle) => toggle.getAttribute("data-default-state") === "on";

const getPermissionStorageKey = (permissionGroup) => `stack-builders-permissions-${permissionGroup}`;

const readPermissionStateCache = (permissionGroup) => {
  try {
    return JSON.parse(window.localStorage.getItem(getPermissionStorageKey(permissionGroup)) || "{}");
  } catch (error) {
    return {};
  }
};

const writePermissionStateCache = (permissionGroup, states = {}) => {
  try {
    window.localStorage.setItem(getPermissionStorageKey(permissionGroup), JSON.stringify(states));
    return true;
  } catch (error) {
    return false;
  }
};

const clearPermissionStateCache = (permissionGroup) => {
  try {
    window.localStorage.removeItem(getPermissionStorageKey(permissionGroup));
    return true;
  } catch (error) {
    return false;
  }
};

const collectPermissionStates = (toggles) => {
  const savedStates = {};
  toggles.forEach((toggle) => {
    const permissionKey = toggle.getAttribute("data-permission-key");
    if (permissionKey) {
      savedStates[permissionKey] = toggle.classList.contains("active");
    }
  });
  return savedStates;
};

const initializePermissionMatrices = () => {
  document.querySelectorAll(".permissions[data-permission-group]").forEach((section) => {
    const permissionGroup = section.getAttribute("data-permission-group");
    const toggles = section.querySelectorAll(".toggle[data-permission-key]");
    const resetButton = section.querySelector(".reset");
    const statusLabel = section.querySelector(".permission-status");

    if (!toggles.length || !permissionGroup) {
      return;
    }

    const setPermissionStatus = (message) => {
      if (statusLabel) {
        statusLabel.textContent = message;
      }
    };
    let interactionRevision = 0;

    const applyStates = (states = {}) => {
      toggles.forEach((toggle) => {
        const permissionKey = toggle.getAttribute("data-permission-key");
        const nextState = Object.prototype.hasOwnProperty.call(states, permissionKey)
          ? Boolean(states[permissionKey])
          : getPermissionToggleDefaultState(toggle);
        setPermissionToggleState(toggle, nextState);
      });
    };

    const syncFromBackend = async () => {
      const syncRevision = interactionRevision;

      if (!window.appApiClient?.request || !currentAdmin) {
        applyStates(readPermissionStateCache(permissionGroup));
        return;
      }

      setPermissionStatus("Loading permissions...");

      try {
        const backendPayload = await window.appApiClient.request(`/role-permissions/${encodeURIComponent(permissionGroup)}`);
        if (syncRevision !== interactionRevision) {
          return;
        }

        const backendStates = backendPayload?.permissions && typeof backendPayload.permissions === "object"
          ? backendPayload.permissions
          : {};
        writePermissionStateCache(permissionGroup, backendStates);
        applyStates(backendStates);
        setPermissionStatus("Changes save automatically");
      } catch (error) {
        applyStates(readPermissionStateCache(permissionGroup));
        setPermissionStatus(error?.message || "Permissions could not be loaded right now.");
      }
    };

    const persistStates = async () => {
      interactionRevision += 1;
      const persistRevision = interactionRevision;
      const savedStates = collectPermissionStates(toggles);
      writePermissionStateCache(permissionGroup, savedStates);

      if (!window.appApiClient?.request || !currentAdmin) {
        setPermissionStatus("Changes saved in this browser");
        return;
      }

      setPermissionStatus("Saving changes...");

      try {
        const updatedPermissions = await window.appApiClient.request(`/role-permissions/${encodeURIComponent(permissionGroup)}`, {
          method: "PUT",
          json: {
            permissions: savedStates,
          },
        });

        if (persistRevision !== interactionRevision) {
          return;
        }

        const nextStates = updatedPermissions?.permissions && typeof updatedPermissions.permissions === "object"
          ? updatedPermissions.permissions
          : savedStates;
        writePermissionStateCache(permissionGroup, nextStates);
        applyStates(nextStates);
        setPermissionStatus("Changes saved to the backend");
      } catch (error) {
        setPermissionStatus(error?.message || "Permissions could not be saved right now.");
      }
    };

    const resetStates = async () => {
      interactionRevision += 1;
      const resetRevision = interactionRevision;

      if (!window.appApiClient?.request || !currentAdmin) {
        clearPermissionStateCache(permissionGroup);
        applyStates();
        setPermissionStatus("Defaults restored in this browser");
        return;
      }

      setPermissionStatus("Restoring defaults...");

      try {
        const resetPermissions = await window.appApiClient.request(`/role-permissions/${encodeURIComponent(permissionGroup)}`, {
          method: "DELETE",
        });

        if (resetRevision !== interactionRevision) {
          return;
        }

        const nextStates = resetPermissions?.permissions && typeof resetPermissions.permissions === "object"
          ? resetPermissions.permissions
          : {};
        writePermissionStateCache(permissionGroup, nextStates);
        applyStates(nextStates);
        setPermissionStatus("Defaults restored from the backend");
      } catch (error) {
        setPermissionStatus(error?.message || "Permissions could not be reset right now.");
      }
    };

    applyStates(readPermissionStateCache(permissionGroup));
    void syncFromBackend();

    if (resetButton) {
      resetButton.addEventListener("click", () => {
        void resetStates();
      });
    }

    toggles.forEach((toggle) => {
      toggle.addEventListener("click", () => {
        setPermissionToggleState(toggle, !toggle.classList.contains("active"));
        void persistStates();
      });
    });
  });
};

const initializePageModals = () => {
  const modalTriggers = document.querySelectorAll("[data-modal-trigger][data-modal-src]");

  if (!modalTriggers.length) {
    return;
  }

  const closeModal = (modal) => {
    if (!modal) {
      return;
    }

    const frame = modal.querySelector(".page-modal-frame");
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");

    if (frame) {
      frame.setAttribute("src", "about:blank");
    }

    if (!document.querySelector(".page-modal.is-open")) {
      document.body.classList.remove("modal-open");
    }
  };

  const openModal = (modal, src, modalHeight) => {
    if (!modal || !src) {
      return;
    }

    const frame = modal.querySelector(".page-modal-frame");
    const cacheBustedSrc = `${src}${src.includes("?") ? "&" : "?"}modalSession=${Date.now()}`;
    const fallbackHeight = Number(modalHeight) || 860;

    if (frame) {
      frame.style.setProperty("--modal-frame-height", `${fallbackHeight}px`);
      frame.addEventListener("load", () => {
        try {
          const embeddedDocument = frame.contentDocument;
          const embeddedWindow = frame.contentWindow;
          const formCard = embeddedDocument?.querySelector(".form-card");
          const measuredElement = formCard || embeddedDocument?.body;

          if (!embeddedWindow || !measuredElement) {
            return;
          }

          const computedStyles = embeddedWindow.getComputedStyle(measuredElement);
          const marginTop = parseFloat(computedStyles.marginTop || "0");
          const marginBottom = parseFloat(computedStyles.marginBottom || "0");
          const measuredHeight = Math.ceil(measuredElement.scrollHeight + marginTop + marginBottom + 4);

          frame.style.setProperty("--modal-frame-height", `${Math.max(measuredHeight, 420)}px`);
        } catch (error) {
          frame.style.setProperty("--modal-frame-height", `${fallbackHeight}px`);
        }
      }, { once: true });
      frame.setAttribute("src", cacheBustedSrc);
    }

    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");

    const closeButton = modal.querySelector(".page-modal-close");
    if (closeButton) {
      closeButton.focus();
    }
  };

  modalTriggers.forEach((trigger) => {
    trigger.addEventListener("click", () => {
      const modalId = trigger.getAttribute("data-modal-trigger");
      const modalSrc = trigger.getAttribute("data-modal-src");
      const modalHeight = trigger.getAttribute("data-modal-height");
      const modal = modalId ? document.getElementById(modalId) : null;
      openModal(modal, modalSrc, modalHeight);
    });
  });

  document.querySelectorAll(".page-modal").forEach((modal) => {
    modal.querySelectorAll("[data-close-modal]").forEach((closeControl) => {
      closeControl.addEventListener("click", () => {
        closeModal(modal);
      });
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") {
      return;
    }

    const activeModal = document.querySelector(".page-modal.is-open");
    if (activeModal) {
      closeModal(activeModal);
    }
  });

  window.handleEmbeddedFormAction = (detail = {}) => {
    const activeModal = document.querySelector(".page-modal.is-open");
    const activeFrame = activeModal?.querySelector(".page-modal-frame");

    try {
      if (detail.modalHeight && activeFrame) {
        activeFrame.style.setProperty("--modal-frame-height", `${Math.max(Number(detail.modalHeight) || 0, 420)}px`);
      }

      if (detail.action === "resize") {
        return;
      }

      if (detail.refreshUsers) {
        renderUserManagementTable();
      }

      if (detail.refreshCompanies) {
        renderCompanyManagementTable();
      }

      initializeDashboardOverview();
      initializeReportsAnalytics();
    } catch (error) {
      console.error("Unable to refresh the admin page after closing the modal.", error);
    } finally {
      if (detail.action !== "resize") {
        closeModal(activeModal);
      }
    }
  };
};

document.querySelectorAll("[data-href]").forEach((item) => {
  item.addEventListener("click", () => {
    routeTo(item.getAttribute("data-href"));
  });

  if (!["BUTTON", "A"].includes(item.tagName)) {
    item.tabIndex = 0;
    item.setAttribute("role", "button");
    item.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        routeTo(item.getAttribute("data-href"));
      }
    });
  }
});

const sidebarTabs = document.querySelectorAll(".sidebar li[data-tab], .settings-sidebar li[data-tab]");
const tabSections = document.querySelectorAll(".tab[id], .settings-panel[id]");

if (sidebarTabs.length && tabSections.length) {
  sidebarTabs.forEach((tab) => {
    tab.tabIndex = 0;
    tab.setAttribute("role", "button");

    const activateTab = () => {
      sidebarTabs.forEach((item) => item.classList.remove("active"));
      tab.classList.add("active");

      tabSections.forEach((section) => section.classList.remove("active"));
      const target = document.getElementById(tab.getAttribute("data-tab"));
      if (target) {
        target.classList.add("active");
        replayReveal(target);
      }
    };

    tab.addEventListener("click", () => {
      activateTab();
    });

    tab.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        activateTab();
      }
    });
  });
}

document.querySelectorAll(".toggle").forEach((toggle) => {
  if (toggle.querySelector(".switch")) {
    toggle.addEventListener("click", () => {
      const switchControl = toggle.querySelector(".switch");
      switchControl.classList.toggle("is-on");
    });
    return;
  }

  if (toggle.hasAttribute("data-permission-key")) {
    return;
  }

  setPermissionToggleState(toggle, toggle.classList.contains("active"));
  toggle.addEventListener("click", () => {
    setPermissionToggleState(toggle, !toggle.classList.contains("active"));
  });
});

const formatCompactCount = (value) => new Intl.NumberFormat("en-IN", {
  notation: Number(value) >= 1000 ? "compact" : "standard",
  maximumFractionDigits: 1,
}).format(Number(value) || 0);

const formatRelativeTimestamp = (timestamp) => {
  const normalizedTimestamp = normalizeTimestamp(timestamp);
  if (!normalizedTimestamp) {
    return "Date unavailable";
  }

  const diffInDays = Math.floor((Date.now() - normalizedTimestamp) / 86400000);
  if (diffInDays <= 0) {
    return "Today";
  }

  if (diffInDays === 1) {
    return "1 day ago";
  }

  if (diffInDays < 7) {
    return `${diffInDays} days ago`;
  }

  return formatStoredDate(normalizedTimestamp);
};

const readWorkspaceCollections = () => {
  const users = getManagedUsers();
  const companies = sortNewestFirst(getStoredCompanies().map(normalizeStoredCompany));
  const consultations = sortNewestFirst(readStoredCollection(APP_STORAGE_KEYS.consultations));
  const liveSessions = sortNewestFirst(readStoredCollection(APP_STORAGE_KEYS.liveSessions));
  const videos = sortNewestFirst(readStoredCollection(APP_STORAGE_KEYS.videos));
  const challenges = sortNewestFirst(readStoredCollection(APP_STORAGE_KEYS.challenges));
  const rewards = sortNewestFirst(readStoredCollection(APP_STORAGE_KEYS.rewards));

  return {
    users,
    companies,
    consultations,
    liveSessions,
    videos,
    challenges,
    rewards,
  };
};

const buildRecentActivityEntries = (collections, limit = 5) => {
  const entries = [
    ...collections.users.filter((user) => !user.isSeededDefault).map((user) => ({
      title: `${user.name} added as ${user.role}`,
      details: user.companyName !== "--" ? user.companyName : user.email,
      tone: user.role === "Wellness Expert" ? "green" : user.role === "HR" ? "orange" : "blue",
      createdAt: user.createdAt,
    })),
    ...collections.companies.map((company) => ({
      title: `${company.name} company added`,
      details: `${company.id} | ${company.email}`,
      tone: "blue",
      createdAt: company.createdAt,
    })),
    ...collections.consultations.map((consultation) => ({
      title: `Consultation ${cleanText(String(consultation?.status || "requested"))}`,
      details: `${cleanText(String(consultation?.employeeName || "Employee"))} | ${cleanText(String(consultation?.expertName || "Wellness Expert"))}`,
      tone: "green",
      createdAt: consultation?.createdAt,
    })),
    ...collections.liveSessions.map((session) => ({
      title: cleanText(String(session?.title || "Live session scheduled")),
      details: cleanText(String(session?.hostName || "Wellness Expert")),
      tone: "orange",
      createdAt: session?.createdAt,
    })),
    ...collections.videos.map((video) => ({
      title: cleanText(String(video?.title || "Video added")),
      details: cleanText(String(video?.category || "Video library")),
      tone: "blue",
      createdAt: video?.createdAt,
    })),
    ...collections.challenges.map((challenge) => ({
      title: cleanText(String(challenge?.name || "Challenge created")),
      details: cleanText(String(challenge?.type || "Challenge")),
      tone: "green",
      createdAt: challenge?.createdAt,
    })),
    ...collections.rewards.map((reward) => ({
      title: cleanText(String(reward?.name || "Reward added")),
      details: cleanText(String(reward?.points || "Reward")),
      tone: "orange",
      createdAt: reward?.createdAt,
    })),
  ];

  return sortNewestFirst(entries).slice(0, limit);
};

const initializeDashboardOverview = () => {
  const totalUsersElement = document.getElementById("dashboardTotalUsers");
  const activeUsersElement = document.getElementById("dashboardActiveUsers");
  const activityVolumeElement = document.getElementById("dashboardActivityVolume");
  const totalUsersMetaElement = document.getElementById("dashboardTotalUsersMeta");
  const activeUsersMetaElement = document.getElementById("dashboardActiveUsersMeta");
  const activityVolumeMetaElement = document.getElementById("dashboardActivityVolumeMeta");
  const activityList = document.getElementById("dashboardActivityList");

  if (
    !totalUsersElement
    && !activeUsersElement
    && !activityVolumeElement
    && !activityList
  ) {
    return;
  }

  const collections = readWorkspaceCollections();
  const activeUsers = collections.users.filter((user) => user.status === "Active").length;
  const activityVolume = (
    collections.consultations.length
    + collections.liveSessions.length
    + collections.videos.length
    + collections.challenges.length
    + collections.rewards.length
  );

  if (totalUsersElement) {
    totalUsersElement.textContent = formatCompactCount(collections.users.length);
  }

  if (activeUsersElement) {
    activeUsersElement.textContent = formatCompactCount(activeUsers);
  }

  if (activityVolumeElement) {
    activityVolumeElement.textContent = formatCompactCount(activityVolume);
  }

  if (totalUsersMetaElement) {
    totalUsersMetaElement.textContent = `${collections.companies.length} compan${collections.companies.length === 1 ? "y" : "ies"} connected to the workspace`;
  }

  if (activeUsersMetaElement) {
    activeUsersMetaElement.textContent = `${activeUsers} of ${collections.users.length} accounts are currently active`;
  }

  if (activityVolumeMetaElement) {
    activityVolumeMetaElement.textContent = `${collections.consultations.length} consultations | ${collections.liveSessions.length} live sessions | ${collections.videos.length} videos`;
  }

  if (activityList) {
    const entries = buildRecentActivityEntries(collections);
    activityList.innerHTML = entries.length
      ? entries.map((entry) => `
        <li>
          <strong><span class="dot ${entry.tone}"></span>${escapeHtml(entry.title)}</strong>
          <small>${escapeHtml(entry.details)} | ${escapeHtml(formatRelativeTimestamp(entry.createdAt))}</small>
        </li>
      `).join("")
      : `<li class="placeholder-text">No workspace activity has been created yet.</li>`;
  }
};

const buildMonthlyCountSeries = (records, months = 6) => {
  const labels = [];
  const data = [];
  const today = new Date();

  for (let index = months - 1; index >= 0; index -= 1) {
    const rangeStart = new Date(today.getFullYear(), today.getMonth() - index, 1);
    const rangeEnd = new Date(today.getFullYear(), today.getMonth() - index + 1, 1);
    labels.push(rangeStart.toLocaleDateString("en-IN", { month: "short" }));
    data.push(records.filter((record) => {
      const timestamp = normalizeTimestamp(record?.createdAt);
      return timestamp >= rangeStart.getTime() && timestamp < rangeEnd.getTime();
    }).length);
  }

  return { labels, data };
};

const buildWeeklyCountSeries = (records) => {
  const labels = [];
  const data = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let index = 6; index >= 0; index -= 1) {
    const dayStart = new Date(today);
    dayStart.setDate(today.getDate() - index);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayStart.getDate() + 1);
    labels.push(dayStart.toLocaleDateString("en-IN", { weekday: "short" }));
    data.push(records.filter((record) => {
      const timestamp = normalizeTimestamp(record?.createdAt);
      return timestamp >= dayStart.getTime() && timestamp < dayEnd.getTime();
    }).length);
  }

  return { labels, data };
};

const getReportsChartRegistry = () => {
  if (!window.__superAdminCharts) {
    window.__superAdminCharts = {};
  }

  return window.__superAdminCharts;
};

const renderReportChart = (chartKey, canvasId, config) => {
  const canvas = document.getElementById(canvasId);
  if (!canvas || typeof window.Chart !== "function") {
    return;
  }

  const registry = getReportsChartRegistry();
  if (registry[chartKey]) {
    registry[chartKey].destroy();
  }

  registry[chartKey] = new window.Chart(canvas, config);
};

const initializeReportsAnalytics = () => {
  const lineChart = document.getElementById("lineChart");
  const pieChart = document.getElementById("pieChart");
  const barChart = document.getElementById("barChart");
  const totalCompaniesElement = document.getElementById("reportsTotalCompanies");
  const totalConsultationsElement = document.getElementById("reportsTotalConsultations");
  const totalLiveSessionsElement = document.getElementById("reportsTotalLiveSessions");
  const totalVideosElement = document.getElementById("reportsTotalVideos");

  if (
    !lineChart
    && !pieChart
    && !barChart
    && !totalCompaniesElement
    && !totalConsultationsElement
    && !totalLiveSessionsElement
    && !totalVideosElement
  ) {
    return;
  }

  const collections = readWorkspaceCollections();
  const growthUsers = collections.users.filter((user) => !user.isSeededDefault);
  const monthlyUsers = buildMonthlyCountSeries(growthUsers);
  const workspaceRecords = [
    ...collections.users,
    ...collections.companies,
    ...collections.consultations,
    ...collections.liveSessions,
    ...collections.videos,
    ...collections.challenges,
    ...collections.rewards,
  ];
  const weeklyActivity = buildWeeklyCountSeries(workspaceRecords);
  const roleDistribution = {
    employee: collections.users.filter((user) => user.role === "Employee").length,
    expert: collections.users.filter((user) => user.role === "Wellness Expert").length,
    hr: collections.users.filter((user) => user.role === "HR").length,
  };

  if (totalCompaniesElement) {
    totalCompaniesElement.textContent = formatCompactCount(collections.companies.length);
  }

  if (totalConsultationsElement) {
    totalConsultationsElement.textContent = formatCompactCount(collections.consultations.length);
  }

  if (totalLiveSessionsElement) {
    totalLiveSessionsElement.textContent = formatCompactCount(collections.liveSessions.length);
  }

  if (totalVideosElement) {
    totalVideosElement.textContent = formatCompactCount(collections.videos.length);
  }

  const totalCompaniesMetaElement = document.getElementById("reportsTotalCompaniesMeta");
  const totalConsultationsMetaElement = document.getElementById("reportsTotalConsultationsMeta");
  const totalLiveSessionsMetaElement = document.getElementById("reportsTotalLiveSessionsMeta");
  const totalVideosMetaElement = document.getElementById("reportsTotalVideosMeta");

  if (totalCompaniesMetaElement) {
    totalCompaniesMetaElement.textContent = `${collections.users.length} user${collections.users.length === 1 ? "" : "s"} linked across the workspace`;
  }

  if (totalConsultationsMetaElement) {
    const requestedCount = collections.consultations.filter(
      (consultation) => normalizeLookupValue(consultation?.status) === "requested",
    ).length;
    const acceptedCount = collections.consultations.filter(
      (consultation) => normalizeLookupValue(consultation?.status) === "accepted",
    ).length;
    totalConsultationsMetaElement.textContent = `${requestedCount} pending | ${acceptedCount} accepted`;
  }

  if (totalLiveSessionsMetaElement) {
    const scheduledCount = collections.liveSessions.filter(
      (session) => normalizeLookupValue(session?.status) === "scheduled",
    ).length;
    totalLiveSessionsMetaElement.textContent = `${scheduledCount} session${scheduledCount === 1 ? "" : "s"} currently scheduled`;
  }

  if (totalVideosMetaElement) {
    const videosThisMonth = buildMonthlyCountSeries(collections.videos, 1).data[0] || 0;
    totalVideosMetaElement.textContent = `${videosThisMonth} item${videosThisMonth === 1 ? "" : "s"} added this month`;
  }

  renderReportChart("line", "lineChart", {
    type: "line",
    data: {
      labels: monthlyUsers.labels,
      datasets: [{
        label: "New Users",
        data: monthlyUsers.data,
        borderColor: "#2f6fed",
        backgroundColor: "rgba(47, 111, 237, 0.12)",
        fill: true,
        tension: 0.35,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            precision: 0,
          },
        },
      },
    },
  });

  renderReportChart("pie", "pieChart", {
    type: "pie",
    data: {
      labels: ["Employee", "Wellness Expert", "HR"],
      datasets: [{
        data: [roleDistribution.employee, roleDistribution.expert, roleDistribution.hr],
        backgroundColor: ["#f59e0b", "#10b981", "#3b82f6"],
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
        },
      },
    },
  });

  renderReportChart("bar", "barChart", {
    type: "bar",
    data: {
      labels: weeklyActivity.labels,
      datasets: [{
        label: "Workspace Activity",
        data: weeklyActivity.data,
        backgroundColor: "#2f6fed",
        borderRadius: 12,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            precision: 0,
          },
        },
      },
    },
  });
};

const initializeProfileSettings = () => {
  const saveButton = document.getElementById("saveProfileButton");
  const logoutButton = document.getElementById("logoutButton");
  const status = document.getElementById("profileStatus");
  const fields = document.querySelectorAll("[data-profile-field]");

  if (logoutButton) {
    logoutButton.addEventListener("click", () => {
      window.adminAuthStore?.clearCurrentAdminSession?.();
      window.location.href = "homepage.html";
    });
  }

  if (!saveButton || !status || !fields.length) {
    return;
  }

  const storageKey = "stack-builders-profile-settings";
  const adminProfile = window.adminAuthStore?.getCurrentAdmin?.()
    || window.adminAuthStore?.getAdminProfile?.()
    || {};
  const defaultProfile = {
    name: cleanText(adminProfile.name || "Super User"),
    age: "",
    gender: "",
    email: cleanText(adminProfile.email || adminProfile.username || "ravi@gmail.com"),
    phone: "",
  };
  const normalizeProfileValue = (fieldName, value) => {
    if (fieldName === "phone") {
      return formatIndianPhoneNumber(value) || value;
    }

    if (fieldName === "email") {
      return value.toLowerCase();
    }

    return value;
  };

  try {
    const savedProfile = JSON.parse(window.localStorage.getItem(storageKey) || "{}");
    fields.forEach((field) => {
      const fieldName = field.getAttribute("data-profile-field");
      if (!fieldName) {
        return;
      }

      const savedValue = savedProfile[fieldName];
      const fallbackValue = defaultProfile[fieldName] ?? "";
      const nextValue = savedValue ?? fallbackValue;
      if (nextValue !== undefined && nextValue !== null) {
        field.value = normalizeProfileValue(fieldName, String(nextValue));
      }
    });
  } catch (error) {
    status.textContent = "Saved profile details could not be loaded.";
  }

  saveButton.addEventListener("click", () => {
    const fieldMap = Array.from(fields).reduce((map, field) => {
      const fieldName = field.getAttribute("data-profile-field");
      if (fieldName) {
        map[fieldName] = field;
      }
      return map;
    }, {});
    const nameValue = cleanText(fieldMap.name?.value || "");
    const ageValue = cleanText(fieldMap.age?.value || "");
    const emailValue = cleanText(fieldMap.email?.value || "");
    const phoneValue = cleanText(fieldMap.phone?.value || "");
    const ageNumber = Number(ageValue);

    if (!nameValue) {
      status.textContent = "Enter your profile name before saving.";
      fieldMap.name?.focus?.();
      return;
    }

    if (!ageValue || !Number.isFinite(ageNumber) || ageNumber < 18 || ageNumber > 99) {
      status.textContent = "Enter an age between 18 and 99.";
      fieldMap.age?.focus?.();
      return;
    }

    if (!isValidEmailAddress(emailValue)) {
      status.textContent = "Enter a valid profile email address.";
      fieldMap.email?.focus?.();
      return;
    }

    if (phoneValue && !formatIndianPhoneNumber(phoneValue)) {
      status.textContent = "Enter a valid Indian phone number.";
      fieldMap.phone?.focus?.();
      return;
    }

    const profile = {};

    fields.forEach((field) => {
      const fieldName = field.getAttribute("data-profile-field");
      if (fieldName) {
        profile[fieldName] = normalizeProfileValue(fieldName, field.value.trim());
        field.value = profile[fieldName];
      }
    });

    try {
      window.localStorage.setItem(storageKey, JSON.stringify(profile));
      status.textContent = "Profile changes saved in Settings.";
    } catch (error) {
      status.textContent = "Profile changes could not be saved.";
    }
  });
};

const initializeAdminPages = async () => {
    await refreshAdminDirectoryDataFromBackend();
    renderUserManagementTable();
    renderCompanyManagementTable();
    await renderCompanyOnboardingRequests();
  initializeDashboardOverview();
  initializeReportsAnalytics();
  initializePermissionMatrices();
  initializeProfileSettings();
  initializeAddCompanyForm();
  initializeAddUserForm();
};

applyEmbeddedFormLayout();
initializePageModals();
activateSidebarLink();
applyRevealMotion();
void initializeAdminPages();
