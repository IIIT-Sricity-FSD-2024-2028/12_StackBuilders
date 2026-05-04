const EXPERT_STORAGE_KEY = "stackbuilders.hr.experts";
const EXPERT_BADGE_CLASSES = ["violet", "magenta", "purple", "blue", "teal", "green"];
const employeeAuthStore = window.employeeAuthStore || null;
const expertAuthStore = window.expertAuthStore || null;
const hrAuthStore = window.hrAuthStore || null;
const liveSessionStore = window.liveSessionStore || null;
const rolePermissionsStore = window.rolePermissionsStore || null;
const spreadsheetLibrary = window.XLSX || null;
const currentHr = hrAuthStore?.requireHrSession({
  redirectTo: "homepage.html",
});
const currentHrName = currentHr?.name || "HR";
const currentHrFirstName =
  currentHrName.split(/\s+/).filter(Boolean)[0] || currentHrName;
const currentHrCompanyContext = {
  companyId: String(currentHr?.companyId || "").trim(),
  companyName: String(currentHr?.companyName || "").trim(),
};
const hrPermissionGroup = "hr";
const canReadHrUserManagement =
  rolePermissionsStore?.hasPermission(hrPermissionGroup, "user-management-read") ?? true;
const canCreateHrUsers =
  rolePermissionsStore?.hasPermission(hrPermissionGroup, "user-management-create") ?? true;
const canDeleteHrUsers =
  rolePermissionsStore?.hasPermission(hrPermissionGroup, "user-management-delete") ?? true;
const canReadHrReports =
  rolePermissionsStore?.hasPermission(hrPermissionGroup, "reports-read") ?? true;
const canReadHrChallenges =
  rolePermissionsStore?.hasPermission(hrPermissionGroup, "challenge-management-read") ?? true;
const canReadHrVideoLibrary =
  rolePermissionsStore?.hasPermission(hrPermissionGroup, "client-management-read") ?? true;

const body = document.body;
const hrWelcomeMessage = document.getElementById("hrWelcomeMessage");
const employeeModal = document.getElementById("employeeModal");
const expertModal = document.getElementById("expertModal");
const employeeForm = employeeModal?.querySelector(".employee-form") || null;
const expertForm = expertModal?.querySelector(".expert-form") || null;
const openEmployeeModalButton = document.getElementById("openEmployeeModal");
const importEmployeesButton = document.getElementById("importEmployeesButton");
const employeeImportInput = document.getElementById("employeeImportInput");
const employeeImportFeedback = document.getElementById("employeeImportFeedback");
const importExpertsButton = document.getElementById("importExpertsButton");
const expertImportInput = document.getElementById("expertImportInput");
const expertImportFeedback = document.getElementById("expertImportFeedback");
const openExpertModalButton = document.getElementById("openExpertModal");
const consultationNavLink = document.getElementById("consultationNavLink");
const videoLibraryNavLink = document.getElementById("videoLibraryNavLink");
const dashboardEmployeeCount = document.getElementById("dashboardEmployeeCount");
const dashboardExpertCount = document.getElementById("dashboardExpertCount");
const dashboardLiveSessionCount = document.getElementById("dashboardLiveSessionCount");
const employeeSearchInput = document.getElementById("employeeSearchInput");
const expertSearchInput = document.getElementById("expertSearchInput");
const employeeManagementTableBody = document.getElementById("employeeManagementTableBody");
const expertManagementGrid = document.getElementById("expertManagementGrid");
const dashboardChallengeList = document.getElementById("dashboardChallengeList");
const dashboardChallengeCount = document.getElementById("dashboardChallengeCount");
const dashboardRewardCount = document.getElementById("dashboardRewardCount");
const dashboardLeaderboardTitle = document.getElementById("dashboardLeaderboardTitle");
const dashboardLeaderboardList = document.getElementById("dashboardLeaderboardList");
const profileNavIcon = document.getElementById("profileNavIcon");
const profileOverlay = document.getElementById("profileOverlay");
const profileDrawerBackBtn = document.getElementById("profileDrawerBackBtn");
const heroCard = document.querySelector(".hero-card");
const statsGrid = document.querySelector(".stats-grid");
const challengeOverviewSection = document.querySelector(".two-column-grid");
const employeeManagementSection = openEmployeeModalButton?.closest(".section-block") || null;
const expertManagementSection = openExpertModalButton?.closest(".section-block") || null;

let activeModal = null;
let selectedDashboardChallengeId = null;

rolePermissionsStore?.watchPermissions(hrPermissionGroup);
rolePermissionsStore?.guardPageAccess({
  group: hrPermissionGroup,
  anyOf: [
    "user-management-read",
    "reports-read",
    "challenge-management-read",
    "client-management-read",
  ],
  title: "HR access is currently restricted",
  message:
    "Ask the admin to enable User Management, Reports, Challenges, or Video Library access for HR before using this dashboard.",
});
rolePermissionsStore?.setElementHidden(heroCard, !canReadHrReports);
rolePermissionsStore?.setElementHidden(statsGrid, !canReadHrReports);
rolePermissionsStore?.setElementHidden(challengeOverviewSection, !canReadHrChallenges);
rolePermissionsStore?.setElementHidden(employeeManagementSection, !canReadHrUserManagement);
rolePermissionsStore?.setElementHidden(expertManagementSection, !canReadHrUserManagement);
rolePermissionsStore?.restrictElement(openEmployeeModalButton, canCreateHrUsers);
rolePermissionsStore?.restrictElement(importEmployeesButton, canCreateHrUsers);
rolePermissionsStore?.restrictElement(importExpertsButton, canCreateHrUsers);
rolePermissionsStore?.restrictElement(openExpertModalButton, canCreateHrUsers);
rolePermissionsStore?.restrictElement(consultationNavLink, canReadHrChallenges);
rolePermissionsStore?.restrictElement(videoLibraryNavLink, canReadHrVideoLibrary);

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[character] || character;
  });
}

function readStoredCollection(storageKey) {
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function writeStoredCollection(storageKey, records) {
  window.localStorage.setItem(
    storageKey,
    JSON.stringify(Array.isArray(records) ? records : [])
  );
}

function readEmployees() {
  return employeeAuthStore ? employeeAuthStore.readEmployees(currentHrCompanyContext) : [];
}

function readExperts() {
  return expertAuthStore
    ? expertAuthStore.readExperts(currentHrCompanyContext)
    : readStoredCollection(EXPERT_STORAGE_KEY);
}

function createRecordId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getInitials(name) {
  const parts = String(name)
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (!parts.length) return "NA";
  return parts.map((part) => part.charAt(0).toUpperCase()).join("");
}

function getExpertBadgeClass(value) {
  const seed = [...String(value || "expert")].reduce(
    (total, character) => total + character.charCodeAt(0),
    0
  );

  return EXPERT_BADGE_CLASSES[seed % EXPERT_BADGE_CLASSES.length];
}

function formatExperience(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "Not specified";

  return /\byear/i.test(trimmed) ? trimmed : `${trimmed} years`;
}

function normalizeLookupValue(value) {
  return String(value || "").trim().toLowerCase();
}

function getCurrentHrCompanyContext() {
  return { ...currentHrCompanyContext };
}

function requireCurrentHrCompanyContext() {
  const companyContext = getCurrentHrCompanyContext();

  if (companyContext.companyId && companyContext.companyName) {
    return companyContext;
  }

  alert(
    "Your HR account is not linked to a company yet. Ask the super user to assign your company before adding employees or wellness experts."
  );
  return null;
}

function matchesCompanyContext(record, companyContext) {
  if (!record || !companyContext) {
    return false;
  }

  const recordCompanyId = String(record.companyId || "").trim();
  const recordCompanyName = normalizeLookupValue(record.companyName);
  const targetCompanyId = String(companyContext.companyId || "").trim();
  const targetCompanyName = normalizeLookupValue(companyContext.companyName);

  if (targetCompanyId && recordCompanyId && targetCompanyId === recordCompanyId) {
    return true;
  }

  return Boolean(targetCompanyName && recordCompanyName && targetCompanyName === recordCompanyName);
}

function buildCompanyQueryString(companyContext) {
  const params = new URLSearchParams();

  if (companyContext?.companyId) {
    params.set("companyId", companyContext.companyId);
  } else if (companyContext?.companyName) {
    params.set("companyName", companyContext.companyName);
  }

  const queryString = params.toString();
  return queryString ? `?${queryString}` : "";
}

function mergeCompanyScopedRecords(readAllRecords, writeAllRecords, scopedRecords, companyContext) {
  if (typeof readAllRecords !== "function" || typeof writeAllRecords !== "function") {
    return false;
  }

  const allRecords = readAllRecords({ includeAllCompanies: true });
  const remainingRecords = allRecords.filter(
    (record) => !matchesCompanyContext(record, companyContext)
  );

  writeAllRecords([...(Array.isArray(scopedRecords) ? scopedRecords : []), ...remainingRecords]);
  return true;
}

async function syncHrDirectoryFromBackend() {
  if (!window.appApiClient?.request || !currentHr) {
    return {
      ok: false,
      skipped: true,
    };
  }

  const companyContext = getCurrentHrCompanyContext();
  const queryString = buildCompanyQueryString(companyContext);

  try {
    const [employees, experts] = await Promise.all([
      window.appApiClient.request(`/employees${queryString}`),
      window.appApiClient.request(`/experts${queryString}`),
    ]);

    const mergedEmployees = mergeCompanyScopedRecords(
      employeeAuthStore?.readEmployees,
      employeeAuthStore?.writeEmployees,
      employees,
      companyContext
    );
    const mergedExperts = mergeCompanyScopedRecords(
      expertAuthStore?.readExperts,
      expertAuthStore?.writeExperts,
      experts,
      companyContext
    );

    if (!mergedEmployees || !mergedExperts) {
      return {
        ok: false,
        error: "The latest backend directory could not be mirrored into this browser.",
      };
    }

    return {
      ok: true,
    };
  } catch (error) {
    console.error("Unable to refresh the HR directory from the backend.", error);
    return {
      ok: false,
      error: error?.message || "The latest employee and expert records could not be loaded right now.",
    };
  }
}

async function createEmployeeRecord(payload) {
  if (window.appApiClient?.request && currentHr) {
    try {
      const employee = await window.appApiClient.request("/employees", {
        method: "POST",
        json: payload,
      });

      return { ok: true, employee };
    } catch (error) {
      return {
        ok: false,
        error: error?.message || "Unable to add employee right now.",
      };
    }
  }

  return employeeAuthStore?.createEmployee(payload) || {
    ok: false,
    error: "Unable to add employee right now.",
  };
}

async function createExpertRecord(payload) {
  if (window.appApiClient?.request && currentHr) {
    try {
      const expert = await window.appApiClient.request("/experts", {
        method: "POST",
        json: payload,
      });

      return { ok: true, expert };
    } catch (error) {
      return {
        ok: false,
        error: error?.message || "Unable to add wellness expert right now.",
      };
    }
  }

  return expertAuthStore?.createExpert(payload) || {
    ok: false,
    error: "Unable to add wellness expert right now.",
  };
}

async function deleteEmployeeRecord(employeeId) {
  if (window.appApiClient?.request && currentHr) {
    try {
      await window.appApiClient.request(`/employees/${encodeURIComponent(String(employeeId || "").trim())}`, {
        method: "DELETE",
      });

      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        error: error?.message || "Unable to remove this employee right now.",
      };
    }
  }

  if (employeeAuthStore) {
    employeeAuthStore.deleteEmployee(employeeId);
    return { ok: true };
  }

  return {
    ok: false,
    error: "Unable to remove this employee right now.",
  };
}

async function deleteExpertRecord(expertId) {
  if (window.appApiClient?.request && currentHr) {
    try {
      await window.appApiClient.request(`/experts/${encodeURIComponent(String(expertId || "").trim())}`, {
        method: "DELETE",
      });

      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        error: error?.message || "Unable to remove this wellness expert right now.",
      };
    }
  }

  if (expertAuthStore) {
    expertAuthStore.deleteExpert(expertId);
    return { ok: true };
  }

  return {
    ok: false,
    error: "Unable to remove this wellness expert right now.",
  };
}

function setBodyLock() {
  body.classList.toggle("modal-open", Boolean(activeModal));
}

function openModal(modal) {
  if (!modal) return;
  modal.hidden = false;
  activeModal = modal;
  setBodyLock();
}

function closeModal(modal = activeModal) {
  if (!modal) return;
  modal.hidden = true;
  if (activeModal === modal) {
    activeModal = null;
  }
  setBodyLock();
}

function openProfileOverlay() {
  if (!profileOverlay) return;
  profileOverlay.hidden = false;
  body.classList.add("profile-open");
}

function closeProfileOverlay() {
  if (!profileOverlay) return;
  profileOverlay.hidden = true;
  body.classList.remove("profile-open");
}

function getDashboardChallengeIcon(type) {
  const normalized = (type || "").toLowerCase();

  if (normalized.includes("fitness")) return "trend";
  if (normalized.includes("health")) return "water";
  if (normalized.includes("wellness")) return "trophy";
  if (normalized.includes("community")) return "trend";

  return "trophy";
}

function getDashboardChallengeSymbol(type) {
  const normalized = (type || "").toLowerCase();

  if (normalized.includes("fitness")) return "fa-solid fa-shoe-prints";
  if (normalized.includes("health")) return "fa-solid fa-droplet";
  if (normalized.includes("wellness")) return "fa-solid fa-spa";
  if (normalized.includes("community")) return "fa-solid fa-users";

  return "fa-solid fa-trophy";
}

function createEmptyState(message) {
  const empty = document.createElement("div");
  empty.className = "empty-state";
  empty.textContent = message;
  return empty;
}

function createEmptyRow(message, colSpan) {
  const row = document.createElement("tr");
  const cell = document.createElement("td");
  cell.colSpan = colSpan;
  cell.className = "empty-row-cell";
  cell.appendChild(createEmptyState(message));
  row.appendChild(cell);
  return row;
}

function setEmployeeImportFeedback(message, type = "success") {
  if (!employeeImportFeedback) {
    return;
  }

  employeeImportFeedback.hidden = !message;
  employeeImportFeedback.textContent = message || "";
  employeeImportFeedback.classList.remove("is-success", "is-error");

  if (message) {
    employeeImportFeedback.classList.add(type === "error" ? "is-error" : "is-success");
  }
}

function setExpertImportFeedback(message, type = "success") {
  if (!expertImportFeedback) {
    return;
  }

  expertImportFeedback.hidden = !message;
  expertImportFeedback.textContent = message || "";
  expertImportFeedback.classList.remove("is-success", "is-error");

  if (message) {
    expertImportFeedback.classList.add(type === "error" ? "is-error" : "is-success");
  }
}

function normalizeSpreadsheetColumn(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function createSpreadsheetRowMap(row) {
  const rowMap = new Map();

  Object.entries(row || {}).forEach(([columnName, columnValue]) => {
    const normalizedColumnName = normalizeSpreadsheetColumn(columnName);

    if (!normalizedColumnName) {
      return;
    }

    rowMap.set(normalizedColumnName, String(columnValue ?? "").trim());
  });

  return rowMap;
}

function getSpreadsheetColumnValue(rowMap, aliases) {
  for (const alias of aliases) {
    const normalizedAlias = normalizeSpreadsheetColumn(alias);

    if (rowMap.has(normalizedAlias)) {
      return rowMap.get(normalizedAlias) || "";
    }
  }

  return "";
}

function normalizeImportedEmployeeRecord(row) {
  const rowMap = createSpreadsheetRowMap(row);

  return {
    name: getSpreadsheetColumnValue(rowMap, ["employee name", "name", "employee"]),
    department: getSpreadsheetColumnValue(rowMap, ["department", "dept", "team"]),
    email: getSpreadsheetColumnValue(rowMap, [
      "gmail address",
      "email",
      "employee email",
      "gmail",
      "mail",
    ]),
    password: getSpreadsheetColumnValue(rowMap, [
      "password",
      "temporary password",
      "login password",
    ]),
    age: getSpreadsheetColumnValue(rowMap, ["age"]),
    gender: getSpreadsheetColumnValue(rowMap, ["gender"]),
    phoneNumber: getSpreadsheetColumnValue(rowMap, [
      "phone number",
      "phone",
      "mobile",
      "mobile number",
    ]),
    heightCm: getSpreadsheetColumnValue(rowMap, ["height cm", "height", "height cm value"]),
    weightKg: getSpreadsheetColumnValue(rowMap, ["weight kg", "weight", "weight kg value"]),
    status: getSpreadsheetColumnValue(rowMap, ["status"]),
  };
}

function normalizeImportedExpertRecord(row) {
  const rowMap = createSpreadsheetRowMap(row);

  return {
    name: getSpreadsheetColumnValue(rowMap, [
      "full name",
      "expert name",
      "wellness expert name",
      "name",
    ]),
    specialization: getSpreadsheetColumnValue(rowMap, [
      "specialization",
      "specialisation",
      "role",
      "expert type",
    ]),
    experience: getSpreadsheetColumnValue(rowMap, [
      "experience years",
      "experience year",
      "experience",
      "years of experience",
    ]),
    email: getSpreadsheetColumnValue(rowMap, [
      "gmail address",
      "email",
      "expert email",
      "gmail",
      "mail",
    ]),
    password: getSpreadsheetColumnValue(rowMap, [
      "password",
      "temporary password",
      "login password",
    ]),
    phoneNumber: getSpreadsheetColumnValue(rowMap, [
      "phone number",
      "phone",
      "mobile",
      "mobile number",
    ]),
    status: getSpreadsheetColumnValue(rowMap, ["status"]),
  };
}

function isImportedEmployeeRecordEmpty(record) {
  return ![
    record?.name,
    record?.department,
    record?.email,
    record?.password,
    record?.age,
    record?.gender,
    record?.phoneNumber,
    record?.heightCm,
    record?.weightKg,
  ].some((value) => String(value || "").trim());
}

function isImportedExpertRecordEmpty(record) {
  return ![
    record?.name,
    record?.specialization,
    record?.experience,
    record?.email,
    record?.password,
    record?.phoneNumber,
    record?.status,
  ].some((value) => String(value || "").trim());
}

function readFileAsArrayBuffer(file) {
  if (file?.arrayBuffer) {
    return file.arrayBuffer();
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Unable to read the selected file."));
    reader.readAsArrayBuffer(file);
  });
}

async function readImportedSpreadsheetRows(file) {
  if (!spreadsheetLibrary?.read || !spreadsheetLibrary?.utils?.sheet_to_json) {
    throw new Error("Spreadsheet import is unavailable right now. Refresh the page and try again.");
  }

  const workbook = spreadsheetLibrary.read(await readFileAsArrayBuffer(file), {
    type: "array",
  });
  const firstSheetName = workbook?.SheetNames?.[0];

  if (!firstSheetName) {
    throw new Error("The selected sheet is empty.");
  }

  const worksheet = workbook.Sheets[firstSheetName];
  const rows = spreadsheetLibrary.utils.sheet_to_json(worksheet, {
    defval: "",
    raw: false,
  });

  if (!Array.isArray(rows) || !rows.length) {
    throw new Error("No employee rows were found in the first sheet.");
  }

  return rows;
}

function summarizeImportFailures(failures) {
  if (!failures.length) {
    return "";
  }

  const visibleFailures = failures.slice(0, 3).join(" ");
  return failures.length > 3
    ? `${visibleFailures} ${failures.length - 3} more row(s) also failed.`
    : visibleFailures;
}

async function importEmployeesFromFile(file) {
  if (!file) {
    return;
  }

  if (!canCreateHrUsers) {
    setEmployeeImportFeedback(
      "HR create access is disabled for user management.",
      "error"
    );
    return;
  }

  const companyContext = requireCurrentHrCompanyContext();
  if (!companyContext) {
    return;
  }

  setEmployeeImportFeedback("Importing employee spreadsheet...", "success");

  try {
    const rows = await readImportedSpreadsheetRows(file);
    let importedCount = 0;
    let skippedCount = 0;
    const failures = [];

    for (const [index, row] of rows.entries()) {
      const employeeRecord = normalizeImportedEmployeeRecord(row);
      const rowNumber = index + 2;

      if (isImportedEmployeeRecordEmpty(employeeRecord)) {
        skippedCount += 1;
        return;
      }

      const missingFields = [];

      if (!employeeRecord.name) missingFields.push("Employee Name");
      if (!employeeRecord.department) missingFields.push("Department");
      if (!employeeRecord.email) missingFields.push("Gmail Address");
      if (!employeeRecord.password) missingFields.push("Password");

      if (missingFields.length) {
        failures.push(
          `Row ${rowNumber}: missing ${missingFields.join(", ")}.`
        );
        continue;
      }

      const result = await createEmployeeRecord({
        ...employeeRecord,
        status: employeeRecord.status || "Active",
        companyId: companyContext.companyId,
        companyName: companyContext.companyName,
      });

      if (!result?.ok) {
        failures.push(`Row ${rowNumber}: ${result?.error || "Unable to create employee."}`);
        continue;
      }

      importedCount += 1;
    }

    if (window.appApiClient?.request && currentHr && importedCount) {
      const syncResult = await syncHrDirectoryFromBackend();
      if (!syncResult.ok && !syncResult.skipped) {
        failures.push(syncResult.error || "The imported employees could not be synced locally.");
      }
    }

    renderEmployeeOverview();

    const summaryParts = [
      `${importedCount} employee${importedCount === 1 ? "" : "s"} imported successfully.`,
    ];

    if (skippedCount) {
      summaryParts.push(`${skippedCount} empty row${skippedCount === 1 ? "" : "s"} skipped.`);
    }

    if (failures.length) {
      summaryParts.push(summarizeImportFailures(failures));
    }

    setEmployeeImportFeedback(
      summaryParts.join(" "),
      failures.length && !importedCount ? "error" : "success"
    );
  } catch (error) {
    setEmployeeImportFeedback(
      error?.message || "Unable to import the employee spreadsheet.",
      "error"
    );
  }
}

async function importExpertsFromFile(file) {
  if (!file) {
    return;
  }

  if (!canCreateHrUsers) {
    setExpertImportFeedback(
      "HR create access is disabled for user management.",
      "error"
    );
    return;
  }

  const companyContext = requireCurrentHrCompanyContext();
  if (!companyContext) {
    return;
  }

  setExpertImportFeedback("Importing wellness expert spreadsheet...", "success");

  try {
    const rows = await readImportedSpreadsheetRows(file);
    let importedCount = 0;
    let skippedCount = 0;
    const failures = [];

    for (const [index, row] of rows.entries()) {
      const expertRecord = normalizeImportedExpertRecord(row);
      const rowNumber = index + 2;

      if (isImportedExpertRecordEmpty(expertRecord)) {
        skippedCount += 1;
        return;
      }

      const missingFields = [];

      if (!expertRecord.name) missingFields.push("Full Name");
      if (!expertRecord.specialization) missingFields.push("Specialization");
      if (!expertRecord.experience) missingFields.push("Experience (Years)");
      if (!expertRecord.email) missingFields.push("Gmail Address");
      if (!expertRecord.password) missingFields.push("Password");

      if (missingFields.length) {
        failures.push(`Row ${rowNumber}: missing ${missingFields.join(", ")}.`);
        continue;
      }

      const result = await createExpertRecord({
        ...expertRecord,
        status: expertRecord.status || "Active",
        companyId: companyContext.companyId,
        companyName: companyContext.companyName,
      });

      if (!result?.ok) {
        failures.push(
          `Row ${rowNumber}: ${result?.error || "Unable to create wellness expert."}`
        );
        continue;
      }

      importedCount += 1;
    }

    if (window.appApiClient?.request && currentHr && importedCount) {
      const syncResult = await syncHrDirectoryFromBackend();
      if (!syncResult.ok && !syncResult.skipped) {
        failures.push(syncResult.error || "The imported wellness experts could not be synced locally.");
      }
    }

    renderExpertOverview();

    const summaryParts = [
      `${importedCount} wellness expert${importedCount === 1 ? "" : "s"} imported successfully.`,
    ];

    if (skippedCount) {
      summaryParts.push(`${skippedCount} empty row${skippedCount === 1 ? "" : "s"} skipped.`);
    }

    if (failures.length) {
      summaryParts.push(summarizeImportFailures(failures));
    }

    setExpertImportFeedback(
      summaryParts.join(" "),
      failures.length && !importedCount ? "error" : "success"
    );
  } catch (error) {
    setExpertImportFeedback(
      error?.message || "Unable to import the wellness expert spreadsheet.",
      "error"
    );
  }
}

function getEmployeeSearchTerm() {
  return employeeSearchInput?.value.trim().toLowerCase() || "";
}

function getExpertSearchTerm() {
  return expertSearchInput?.value.trim().toLowerCase() || "";
}

function renderEmployeeOverview() {
  const employees = readEmployees();
  const searchTerm = getEmployeeSearchTerm();
  const filteredEmployees = searchTerm
    ? employees.filter((employee) =>
        [employee.name, employee.department, employee.email, employee.status]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(searchTerm))
      )
    : employees;

  if (dashboardEmployeeCount) {
    dashboardEmployeeCount.textContent = String(employees.length);
  }

  if (!employeeManagementTableBody) return;

  employeeManagementTableBody.innerHTML = "";

  if (!filteredEmployees.length) {
    employeeManagementTableBody.appendChild(
      createEmptyRow(
        employees.length
          ? "No employees match your search right now."
          : "No employees added yet. Use Add Employee to populate this overview.",
        4
      )
    );
    return;
  }

  filteredEmployees.forEach((employee) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>
        <div class="employee-cell">
          <span class="person-badge employee-badge">${escapeHtml(
            getInitials(employee.name)
          )}</span>
          <span>${escapeHtml(employee.name)}</span>
        </div>
      </td>
      <td>${escapeHtml(employee.department || "General")}</td>
      <td><span class="status-pill active">${escapeHtml(
        employee.status || "Active"
      )}</span></td>
      <td class="action-cell">
        <a href="mailto:${escapeHtml(employee.email || "")}">Contact</a>
        ${
          canDeleteHrUsers
            ? `
        <button
          type="button"
          class="delete-icon"
          data-delete-employee="${escapeHtml(employee.id)}"
          aria-label="Delete ${escapeHtml(employee.name)}"
        >
          <i class="fa-regular fa-trash-can"></i>
        </button>`
            : ""
        }
      </td>
    `;
    employeeManagementTableBody.appendChild(row);
  });
}

function renderExpertOverview() {
  const experts = readExperts();
  const searchTerm = getExpertSearchTerm();
  const filteredExperts = searchTerm
    ? experts.filter((expert) =>
        [expert.name, expert.specialization, expert.email, expert.experience]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(searchTerm))
      )
    : experts;

  if (dashboardExpertCount) {
    dashboardExpertCount.textContent = String(experts.length);
  }

  if (!expertManagementGrid) return;

  expertManagementGrid.innerHTML = "";

  if (!filteredExperts.length) {
    expertManagementGrid.appendChild(
      createEmptyState(
        experts.length
          ? "No wellness experts match your search right now."
          : "No wellness experts added yet. Use Add Expert to populate this section."
      )
    );
    return;
  }

  filteredExperts.forEach((expert) => {
    const card = document.createElement("article");
    card.className = "expert-card";
    card.innerHTML = `
      <div class="expert-top">
        <span class="person-badge ${getExpertBadgeClass(expert.name)}">${escapeHtml(
          getInitials(expert.name)
        )}</span>
        <div>
          <h4>${escapeHtml(expert.name)}</h4>
          <p>${escapeHtml(expert.specialization || "Wellness Expert")}</p>
        </div>
      </div>
      <div class="expert-stats">
        <span>Experience</span>
        <strong>${escapeHtml(formatExperience(expert.experience))}</strong>
        <span>Email</span>
        <strong>${escapeHtml(expert.email || "Not provided")}</strong>
      </div>
      <div class="expert-actions">
        <a class="secondary-button" href="mailto:${escapeHtml(expert.email || "")}">
          Contact
        </a>
        ${
          canDeleteHrUsers
            ? `
        <button
          type="button"
          class="danger-button"
          data-delete-expert="${escapeHtml(expert.id)}"
          aria-label="Delete ${escapeHtml(expert.name)}"
        >
          <i class="fa-regular fa-trash-can"></i>
        </button>`
            : ""
        }
      </div>
    `;
    expertManagementGrid.appendChild(card);
  });
}

function renderDashboardRewardCount() {
  if (!dashboardRewardCount) return;
  const rewards = typeof readRewards === "function"
    ? readRewards(currentHrCompanyContext)
    : [];
  dashboardRewardCount.textContent = String(rewards.length);
}

function renderDashboardLiveSessionCount() {
  if (!dashboardLiveSessionCount) return;

  const sessions = liveSessionStore?.getSessionsByStatus?.("scheduled", currentHrCompanyContext) || [];
  dashboardLiveSessionCount.textContent = String(sessions.length);
}

function renderDashboardLeaderboard(challenge) {
  if (!dashboardLeaderboardTitle || !dashboardLeaderboardList) return;

  dashboardLeaderboardList.innerHTML = "";

  if (!challenge) {
    dashboardLeaderboardTitle.textContent = "Challenge Summary";
    dashboardLeaderboardList.appendChild(
      createEmptyState(
        "Select or create an active challenge to view its backend-backed details."
      )
    );
    return;
  }

  dashboardLeaderboardTitle.textContent = `${challenge.name} - Summary`;

  [
    {
      label: "Type",
      value: challenge.type || "Not specified",
      initials: "TY",
      badgeClass: "teal",
      rowClass: "highlight",
    },
    {
      label: "Goal",
      value: challenge.goal || "Not specified",
      initials: "GL",
      badgeClass: "mint",
      rowClass: "",
    },
    {
      label: "Reward",
      value: challenge.reward || "Not specified",
      initials: "RW",
      badgeClass: "green",
      rowClass: "",
    },
    {
      label: "Deadline",
      value: challenge.deadline || "No deadline",
      initials: "DL",
      badgeClass: "sea",
      rowClass: "",
    },
  ].forEach((entry) => {
    const row = document.createElement("div");
    row.className = `leaderboard-row${entry.rowClass ? ` ${entry.rowClass}` : ""}`;
    row.innerHTML = `
      <div class="person-meta">
        <span class="rank-avatar"><i class="fa-solid fa-bullseye"></i></span>
        <span class="person-badge ${entry.badgeClass}">${entry.initials}</span>
        <span>${escapeHtml(entry.label)}</span>
      </div>
      <strong>${escapeHtml(entry.value)}</strong>
    `;
    dashboardLeaderboardList.appendChild(row);
  });
}

function renderDashboardChallenges() {
  if (!dashboardChallengeList || !dashboardChallengeCount) return;

  const challenges = readChallenges(currentHrCompanyContext);
  dashboardChallengeCount.textContent = String(challenges.length);
  dashboardChallengeList.innerHTML = "";

  if (!challenges.length) {
    dashboardChallengeList.appendChild(
      createEmptyState("No active challenges yet. Create one from the Challenges page.")
    );
    selectedDashboardChallengeId = null;
    renderDashboardLeaderboard(null);
    return;
  }

  if (
    !selectedDashboardChallengeId ||
    !challenges.some((challenge) => challenge.id === selectedDashboardChallengeId)
  ) {
    selectedDashboardChallengeId = challenges[0].id;
  }

  challenges.forEach((challenge) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = `challenge-item${
      challenge.id === selectedDashboardChallengeId ? " selected" : ""
    }`;
    item.innerHTML = `
      <span class="challenge-icon ${getDashboardChallengeIcon(challenge.type)}">
        <i class="${getDashboardChallengeSymbol(challenge.type)}" aria-hidden="true"></i>
      </span>
      <span>${escapeHtml(challenge.name)}</span>
      <span class="challenge-arrow">&gt;</span>
    `;
    item.addEventListener("click", () => {
      selectedDashboardChallengeId = challenge.id;
      renderDashboardChallenges();
    });
    dashboardChallengeList.appendChild(item);
  });

  const selectedChallenge =
    challenges.find((challenge) => challenge.id === selectedDashboardChallengeId) ||
    challenges[0];
  renderDashboardLeaderboard(selectedChallenge);
}

function syncSpecializationCards(grid) {
  if (!grid) return;

  grid.querySelectorAll(".special-card").forEach((card) => {
    const input = card.querySelector("input");
    card.classList.toggle("active", Boolean(input?.checked));
  });
}

async function handleEmployeeSubmit(event) {
  event.preventDefault();
  if (!employeeForm) return;
  if (!canCreateHrUsers) {
    alert("HR create access is disabled for user management.");
    return;
  }

  const companyContext = requireCurrentHrCompanyContext();
  if (!companyContext) return;

  const nameInput = employeeForm.querySelector("#employeeName");
  const departmentSelect = employeeForm.querySelector("#department");
  const emailInput = employeeForm.querySelector("#employeeEmail");
  const passwordInput = employeeForm.querySelector("#employeePassword");

  const result = await createEmployeeRecord({
    name: nameInput?.value.trim() || "",
    department: departmentSelect?.value || "",
    email: emailInput?.value.trim() || "",
    password: passwordInput?.value.trim() || "",
    status: "Active",
    companyId: companyContext.companyId,
    companyName: companyContext.companyName,
  });

  if (!result?.ok) {
    alert(result?.error || "Unable to add employee right now.");
    return;
  }

  if (window.appApiClient?.request && currentHr) {
    const syncResult = await syncHrDirectoryFromBackend();
    if (!syncResult.ok && !syncResult.skipped) {
      alert(syncResult.error || "The new employee could not be synced locally.");
      return;
    }
  }

  employeeForm.reset();
  renderEmployeeOverview();
  closeModal(employeeModal);
}

async function handleExpertSubmit(event) {
  event.preventDefault();
  if (!expertForm) return;
  if (!canCreateHrUsers) {
    alert("HR create access is disabled for user management.");
    return;
  }

  const companyContext = requireCurrentHrCompanyContext();
  if (!companyContext) return;

  const nameInput = expertForm.querySelector("#expertName");
  const experienceInput = expertForm.querySelector("#expertExperience");
  const emailInput = expertForm.querySelector("#expertEmail");
  const passwordInput = expertForm.querySelector("#expertPassword");
  const specializationInput = expertForm.querySelector(
    "input[name='specialization']:checked"
  );

  const result = await createExpertRecord({
    name: nameInput?.value.trim() || "",
    experience: experienceInput?.value.trim() || "",
    email: emailInput?.value.trim() || "",
    password: passwordInput?.value.trim() || "",
    specialization: specializationInput?.value || "Wellness Expert",
    status: "Active",
    companyId: companyContext.companyId,
    companyName: companyContext.companyName,
  });

  if (!result?.ok) {
    alert(result?.error || "Unable to add wellness expert right now.");
    return;
  }

  if (window.appApiClient?.request && currentHr) {
    const syncResult = await syncHrDirectoryFromBackend();
    if (!syncResult.ok && !syncResult.skipped) {
      alert(syncResult.error || "The new wellness expert could not be synced locally.");
      return;
    }
  }

  expertForm.reset();
  syncSpecializationCards(expertForm.querySelector(".specialization-grid"));
  renderExpertOverview();
  closeModal(expertModal);
}

async function deleteEmployee(employeeId) {
  if (!canDeleteHrUsers) {
    alert("HR delete access is disabled for user management.");
    return;
  }

  const result = await deleteEmployeeRecord(employeeId);
  if (!result?.ok) {
    alert(result?.error || "Unable to remove this employee right now.");
    return;
  }

  if (window.appApiClient?.request && currentHr) {
    const syncResult = await syncHrDirectoryFromBackend();
    if (!syncResult.ok && !syncResult.skipped) {
      alert(syncResult.error || "The employee list could not be synced locally.");
      return;
    }
  }

  renderEmployeeOverview();
}

async function deleteExpert(expertId) {
  if (!canDeleteHrUsers) {
    alert("HR delete access is disabled for user management.");
    return;
  }

  const result = await deleteExpertRecord(expertId);
  if (!result?.ok) {
    alert(result?.error || "Unable to remove this wellness expert right now.");
    return;
  }

  if (window.appApiClient?.request && currentHr) {
    const syncResult = await syncHrDirectoryFromBackend();
    if (!syncResult.ok && !syncResult.skipped) {
      alert(syncResult.error || "The wellness expert list could not be synced locally.");
      return;
    }
  }

  renderExpertOverview();
}

function renderManagementSections() {
  renderEmployeeOverview();
  renderExpertOverview();
}

async function syncHrDashboardDataFromBackend() {
  const tasks = [syncHrDirectoryFromBackend()];

  if (typeof syncChallengeDataFromBackend === "function") {
    tasks.push(syncChallengeDataFromBackend(currentHrCompanyContext));
  }

  if (liveSessionStore?.syncLiveSessionsFromBackend) {
    tasks.push(liveSessionStore.syncLiveSessionsFromBackend(currentHrCompanyContext));
  }

  await Promise.allSettled(tasks);
}

if (hrWelcomeMessage) {
  hrWelcomeMessage.textContent = `Welcome, ${currentHrFirstName}`;
}

if (openEmployeeModalButton) {
  openEmployeeModalButton.addEventListener("click", () => {
    openModal(employeeModal);
  });
}

if (importEmployeesButton) {
  importEmployeesButton.addEventListener("click", () => {
    if (!canCreateHrUsers) {
      alert("HR create access is disabled for user management.");
      return;
    }

    employeeImportInput?.click();
  });
}

if (employeeImportInput) {
  employeeImportInput.addEventListener("change", async (event) => {
    const selectedFile = event.target?.files?.[0] || null;
    await importEmployeesFromFile(selectedFile);
    employeeImportInput.value = "";
  });
}

if (importExpertsButton) {
  importExpertsButton.addEventListener("click", () => {
    if (!canCreateHrUsers) {
      alert("HR create access is disabled for user management.");
      return;
    }

    expertImportInput?.click();
  });
}

if (expertImportInput) {
  expertImportInput.addEventListener("change", async (event) => {
    const selectedFile = event.target?.files?.[0] || null;
    await importExpertsFromFile(selectedFile);
    expertImportInput.value = "";
  });
}

if (openExpertModalButton) {
  openExpertModalButton.addEventListener("click", () => {
    openModal(expertModal);
  });
}

[consultationNavLink, videoLibraryNavLink].forEach((link) => {
  if (!link) return;

  link.addEventListener("click", (event) => {
    const target = link.dataset.navTarget || link.getAttribute("href");
    if (!target) return;

    event.preventDefault();
    window.location.assign(target);
  });
});

if (profileNavIcon) {
  profileNavIcon.addEventListener("click", openProfileOverlay);
}

if (profileDrawerBackBtn) {
  profileDrawerBackBtn.addEventListener("click", closeProfileOverlay);
}

if (profileOverlay) {
  profileOverlay.addEventListener("click", (event) => {
    if (event.target === profileOverlay) {
      closeProfileOverlay();
    }
  });
}

document.querySelectorAll("[data-close-modal]").forEach((button) => {
  button.addEventListener("click", () => {
    closeModal(button.closest(".modal-overlay"));
  });
});

[employeeModal, expertModal].forEach((modal) => {
  if (!modal) return;

  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      closeModal(modal);
    }
  });
});

if (employeeForm) {
  employeeForm.addEventListener("submit", handleEmployeeSubmit);
}

if (expertForm) {
  expertForm.addEventListener("submit", handleExpertSubmit);
}

if (employeeSearchInput) {
  employeeSearchInput.addEventListener("input", renderEmployeeOverview);
}

if (expertSearchInput) {
  expertSearchInput.addEventListener("input", renderExpertOverview);
}

if (employeeManagementTableBody) {
  employeeManagementTableBody.addEventListener("click", async (event) => {
    const deleteButton = event.target.closest("[data-delete-employee]");
    if (!deleteButton) return;

    await deleteEmployee(deleteButton.dataset.deleteEmployee || "");
  });
}

if (expertManagementGrid) {
  expertManagementGrid.addEventListener("click", async (event) => {
    const deleteButton = event.target.closest("[data-delete-expert]");
    if (!deleteButton) return;

    await deleteExpert(deleteButton.dataset.deleteExpert || "");
  });
}

document.querySelectorAll(".special-card input[name='specialization']").forEach((input) => {
  input.addEventListener("change", () => {
    const grid = input.closest(".specialization-grid");
    syncSpecializationCards(grid);
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeModal();
    closeProfileOverlay();
  }
});

window.addEventListener("storage", () => {
  renderDashboardChallenges();
  renderDashboardRewardCount();
  renderDashboardLiveSessionCount();
  renderManagementSections();
});

async function initializeHrDashboard() {
  await syncHrDashboardDataFromBackend();
  renderDashboardChallenges();
  renderDashboardRewardCount();
  renderDashboardLiveSessionCount();
  renderManagementSections();
}

syncSpecializationCards(expertForm?.querySelector(".specialization-grid"));
void initializeHrDashboard();
