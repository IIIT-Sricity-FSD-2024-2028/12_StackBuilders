const routeTo = (target) => {
  if (target) {
    window.location.href = target;
  }
};

const currentAdmin = window.adminAuthStore?.getCurrentAdmin?.() || null;

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
      window.parent.handleEmbeddedFormAction(detail);
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
  hrProfile: "stackbuilders.hr.profile.v1",
  challenges: "stackbuilders.hr.challenges",
  rewards: "stackbuilders.hr.rewards",
  consultations: "stackbuilders.consultations.v1",
  liveSessions: "stackbuilders.liveSessions.v1",
  videos: "stackbuilders.videoLibrary.v1",
};

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

const isValidGmailAddress = (value) => /^[a-z0-9._%+-]+@gmail\.com$/i.test(String(value || "").trim());

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
  department: "",
  designation: "",
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
  const createdBySuperUser = profile?.createdBySuperUser === true;

  if (!name || !email || !password || !createdBySuperUser) {
    return null;
  }

  const createdAt = cleanText(String(profile?.createdAt || "")) || new Date().toISOString();

  return {
    ...HR_PROFILE_DEFAULTS,
    ...profile,
    name,
    email,
    phoneNumber: cleanText(String(profile?.phoneNumber || HR_PROFILE_DEFAULTS.phoneNumber)),
    department: cleanText(String(profile?.department || HR_PROFILE_DEFAULTS.department)),
    designation: cleanText(String(profile?.designation || HR_PROFILE_DEFAULTS.designation)),
    location: cleanText(String(profile?.location || HR_PROFILE_DEFAULTS.location)),
    companyId: cleanText(String(profile?.companyId || "")),
    companyName: cleanText(String(profile?.companyName || "")),
    status: cleanText(String(profile?.status || HR_PROFILE_DEFAULTS.status)) || HR_PROFILE_DEFAULTS.status,
    createdBySuperUser,
    password,
    createdAt,
    updatedAt: cleanText(String(profile?.updatedAt || profile?.createdAt || "")) || createdAt,
  };
};

const readEmployeeAccounts = () => readStoredCollection(APP_STORAGE_KEYS.employees).map(normalizeEmployeeAccount);
const writeEmployeeAccounts = (records) => writeStoredCollection(APP_STORAGE_KEYS.employees, records.map(normalizeEmployeeAccount));
const readExpertAccounts = () => readStoredCollection(APP_STORAGE_KEYS.experts).map(normalizeExpertAccount);
const writeExpertAccounts = (records) => writeStoredCollection(APP_STORAGE_KEYS.experts, records.map(normalizeExpertAccount));
const readHrAccount = () => normalizeHrAccount(readStoredObject(APP_STORAGE_KEYS.hrProfile, null));
const writeHrAccount = (profile) => {
  const normalizedProfile = normalizeHrAccount(profile);
  if (!normalizedProfile) {
    return false;
  }

  return writeStoredObject(APP_STORAGE_KEYS.hrProfile, normalizedProfile);
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
    removable: sourceType !== "hr",
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
  const currentHrAccount = readHrAccount();
  const managedUsers = [
    ...readEmployeeAccounts().map((employee) => buildManagedUserRecord(employee, "employee")),
    ...readExpertAccounts().map((expert) => buildManagedUserRecord(expert, "expert")),
  ];

  if (currentHrAccount) {
    managedUsers.push(buildManagedUserRecord(currentHrAccount, "hr"));
  }

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

const maybeClearAccountSession = (storageKey, email) => {
  const normalizedEmail = normalizeLookupValue(email);
  if (!normalizedEmail) {
    return;
  }

  const storages = [window.sessionStorage, window.localStorage];
  storages.forEach((storage) => {
    try {
      const rawValue = storage?.getItem(storageKey);
      const parsedValue = rawValue ? JSON.parse(rawValue) : null;
      if (normalizeLookupValue(parsedValue?.email) === normalizedEmail) {
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
      maybeClearAccountSession(SESSION_KEYS.employee, user.email);
    }
    return isSaved;
  }

  if (user.sourceType === "expert") {
    const nextExperts = readExpertAccounts().filter(
      (expert) => cleanText(String(expert.id || "")) !== cleanText(String(user.id || "")),
    );
    const isSaved = writeExpertAccounts(nextExperts);
    if (isSaved) {
      maybeClearAccountSession(SESSION_KEYS.expert, user.email);
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

const removeCompanyLinksFromHr = (company) => {
  const currentHr = readHrAccount();
  if (!currentHr) {
    return true;
  }

  if (!isUserLinkedToCompany(buildManagedUserRecord(currentHr, "hr"), company)) {
    return true;
  }

  return writeHrAccount({
    ...currentHr,
    companyId: "",
    companyName: "",
    updatedAt: new Date().toISOString(),
  });
};

const removeCompanyUsers = (company) => {
  const currentEmployees = readEmployeeAccounts();
  const currentExperts = readExpertAccounts();
  const currentLegacyUsers = getStoredUsers();
  const nextEmployees = currentEmployees.filter(
    (employee) => !isUserLinkedToCompany(buildManagedUserRecord(employee, "employee"), company),
  );
  const nextExperts = currentExperts.filter(
    (expert) => !isUserLinkedToCompany(buildManagedUserRecord(expert, "expert"), company),
  );
  const nextLegacyUsers = currentLegacyUsers.filter(
    (legacyUser) => !isUserLinkedToCompany(normalizeStoredUser(legacyUser), company),
  );

  const employeeEmailsToClear = currentEmployees
    .filter((employee) => isUserLinkedToCompany(buildManagedUserRecord(employee, "employee"), company))
    .map((employee) => employee.email);
  const expertEmailsToClear = currentExperts
    .filter((expert) => isUserLinkedToCompany(buildManagedUserRecord(expert, "expert"), company))
    .map((expert) => expert.email);

  if (!writeEmployeeAccounts(nextEmployees)) {
    return false;
  }

  if (!writeExpertAccounts(nextExperts)) {
    writeEmployeeAccounts(currentEmployees);
    return false;
  }

  if (!writeStoredCollection(STORAGE_KEYS.users, nextLegacyUsers)) {
    writeEmployeeAccounts(currentEmployees);
    writeExpertAccounts(currentExperts);
    return false;
  }

  if (!removeCompanyLinksFromHr(company)) {
    writeEmployeeAccounts(currentEmployees);
    writeExpertAccounts(currentExperts);
    writeStoredCollection(STORAGE_KEYS.users, currentLegacyUsers);
    return false;
  }

  employeeEmailsToClear.forEach((email) => maybeClearAccountSession(SESSION_KEYS.employee, email));
  expertEmailsToClear.forEach((email) => maybeClearAccountSession(SESSION_KEYS.expert, email));
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
    button.addEventListener("click", () => {
      const userKey = button.getAttribute("data-remove-user-key");
      const userToRemove = users.find((user) => user.recordKey === userKey);

      if (!userKey || !userToRemove || !window.confirm(`Remove ${userToRemove.name} from the workspace?`)) {
        return;
      }

      if (!removeManagedUser(userToRemove)) {
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
    button.addEventListener("click", () => {
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
      const linkedHrUser = linkedUsers.find((user) => user.sourceType === "hr");
      const confirmationMessage = removableUsers.length || linkedHrUser
        ? `Remove ${companyToRemove.name}, delete ${removableUsers.length} linked account${removableUsers.length === 1 ? "" : "s"}${linkedHrUser ? ", and clear it from the HR account" : ""}?`
        : `Remove ${companyToRemove.name} from Company Management?`;

      if (!window.confirm(confirmationMessage)) {
        return;
      }

      const currentCompanies = getStoredCompanies();
      const nextCompanies = currentCompanies.filter((company) => getCompanyRecordKey(company) !== companyKey);

      if (!writeStoredCollection(STORAGE_KEYS.companies, nextCompanies)) {
        return;
      }

      if ((removableUsers.length || linkedHrUser) && !removeCompanyUsers(companyToRemove)) {
        writeStoredCollection(STORAGE_KEYS.companies, currentCompanies);
        return;
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

  companyForm.addEventListener("submit", (event) => {
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

    if (!isValidGmailAddress(email)) {
      setFormMessage(formMessage, "Enter a valid Gmail address.");
      emailField?.focus();
      return;
    }

    if (companies.some((company) => normalizeLookupValue(company.email) === normalizeLookupValue(email))) {
      setFormMessage(formMessage, "This Gmail address is already used by another company.");
      emailField?.focus();
      return;
    }

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

    setFormMessage(formMessage, "Company added successfully.", "success");
    if (notifyParentModal({ action: "saved", refreshCompanies: true })) {
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

  userForm.addEventListener("submit", (event) => {
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
    const currentHrAccount = readHrAccount();

    if (duplicateUser && !(activeRole === "hr" && duplicateUser.sourceType === "hr")) {
      setFormMessage(formMessage, "This Gmail address is already used by another user.");
      emailField?.focus();
      return;
    }

    let isSaved = false;
    let successMessage = "User added successfully.";

    if (activeRole === "employee") {
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
      const nextHrProfile = normalizeHrAccount({
        ...HR_PROFILE_DEFAULTS,
        ...(currentHrAccount || {}),
        name: fullName,
        email,
        password,
        status: "Active",
        companyId: matchedCompany.id,
        companyName: matchedCompany.name,
        createdAt: currentHrAccount?.createdAt || now,
        updatedAt: now,
      });

      isSaved = Boolean(nextHrProfile) && writeHrAccount(nextHrProfile);
      successMessage = currentHrAccount ? "HR account synced successfully." : "HR account created successfully.";
    }

    if (!isSaved) {
      setFormMessage(formMessage, "User could not be saved in this browser.");
      return;
    }

    setFormMessage(formMessage, successMessage, "success");
    if (notifyParentModal({ action: "saved", refreshUsers: true })) {
      return;
    }
    routeTo("usermgmt.html");
  });
};

const setPermissionToggleState = (toggle, isActive) => {
  toggle.classList.toggle("active", isActive);
  toggle.setAttribute("aria-pressed", isActive ? "true" : "false");
};

const getPermissionToggleDefaultState = (toggle) => toggle.getAttribute("data-default-state") === "on";

const initializePermissionMatrices = () => {
  document.querySelectorAll(".permissions[data-permission-group]").forEach((section) => {
    const permissionGroup = section.getAttribute("data-permission-group");
    const toggles = section.querySelectorAll(".toggle[data-permission-key]");
    const resetButton = section.querySelector(".reset");
    const saveButton = section.querySelector(".save");
    const storageKey = `stack-builders-permissions-${permissionGroup}`;

    if (!toggles.length || !permissionGroup) {
      return;
    }

    const applyStates = (states = {}) => {
      toggles.forEach((toggle) => {
        const permissionKey = toggle.getAttribute("data-permission-key");
        const nextState = Object.prototype.hasOwnProperty.call(states, permissionKey)
          ? Boolean(states[permissionKey])
          : getPermissionToggleDefaultState(toggle);
        setPermissionToggleState(toggle, nextState);
      });
    };

    applyStates();

    try {
      const savedStates = JSON.parse(window.localStorage.getItem(storageKey) || "{}");
      applyStates(savedStates);
    } catch (error) {
      applyStates();
    }

    if (saveButton) {
      saveButton.addEventListener("click", () => {
        const savedStates = {};
        toggles.forEach((toggle) => {
          savedStates[toggle.getAttribute("data-permission-key")] = toggle.classList.contains("active");
        });

        try {
          window.localStorage.setItem(storageKey, JSON.stringify(savedStates));
        } catch (error) {
          return;
        }
      });
    }

    if (resetButton) {
      resetButton.addEventListener("click", () => {
        window.localStorage.removeItem(storageKey);
        applyStates();
      });
    }
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

    closeModal(activeModal);
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
  const normalizeProfileValue = (fieldName, value) => {
    if (fieldName === "name" && value.trim().toLowerCase() === "john doe") {
      return "Ravi";
    }

    if (fieldName === "email" && value.trim().toLowerCase() === "john.doe@gmail.com") {
      return "ravi@gmail.com";
    }

    if (fieldName === "phone" && value.trim() === "+1 (555) 123-4567") {
      return "+91 98765 43210";
    }

    if (fieldName === "role") {
      const normalizedRole = value.trim().toLowerCase();
      if (normalizedRole === "super user" || normalizedRole === "admin") {
        return "HR";
      }
    }

    return value;
  };

  try {
    const savedProfile = JSON.parse(window.localStorage.getItem(storageKey) || "{}");
    fields.forEach((field) => {
      const fieldName = field.getAttribute("data-profile-field");
      if (fieldName && savedProfile[fieldName]) {
        field.value = normalizeProfileValue(fieldName, savedProfile[fieldName]);
      }
    });
  } catch (error) {
    status.textContent = "Saved profile details could not be loaded.";
  }

  saveButton.addEventListener("click", () => {
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

applyEmbeddedFormLayout();
initializePageModals();
activateSidebarLink();
applyRevealMotion();
renderUserManagementTable();
renderCompanyManagementTable();
initializeDashboardOverview();
initializeReportsAnalytics();
initializePermissionMatrices();
initializeProfileSettings();
initializeAddCompanyForm();
initializeAddUserForm();
