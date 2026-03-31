const EXPERT_STORAGE_KEY = "stackbuilders.hr.experts";
const EXPERT_BADGE_CLASSES = ["violet", "magenta", "purple", "blue", "teal", "green"];
const employeeAuthStore = window.employeeAuthStore || null;
const expertAuthStore = window.expertAuthStore || null;
const hrAuthStore = window.hrAuthStore || null;
const currentHr = hrAuthStore?.requireHrSession({
  redirectTo: "homepage.html",
});
const currentHrName = currentHr?.name || "HR";
const currentHrFirstName =
  currentHrName.split(/\s+/).filter(Boolean)[0] || currentHrName;

const body = document.body;
const hrWelcomeMessage = document.getElementById("hrWelcomeMessage");
const employeeModal = document.getElementById("employeeModal");
const expertModal = document.getElementById("expertModal");
const employeeForm = employeeModal?.querySelector(".employee-form") || null;
const expertForm = expertModal?.querySelector(".expert-form") || null;
const openEmployeeModalButton = document.getElementById("openEmployeeModal");
const openExpertModalButton = document.getElementById("openExpertModal");
const consultationNavLink = document.getElementById("consultationNavLink");
const videoLibraryNavLink = document.getElementById("videoLibraryNavLink");
const dashboardEmployeeCount = document.getElementById("dashboardEmployeeCount");
const dashboardExpertCount = document.getElementById("dashboardExpertCount");
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

let activeModal = null;
let selectedDashboardChallengeId = null;

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
  return employeeAuthStore ? employeeAuthStore.readEmployees() : [];
}

function readExperts() {
  return expertAuthStore ? expertAuthStore.readExperts() : readStoredCollection(EXPERT_STORAGE_KEY);
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

function getCurrentHrCompanyContext() {
  return {
    companyId: String(currentHr?.companyId || "").trim(),
    companyName: String(currentHr?.companyName || "").trim(),
  };
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
        <button
          type="button"
          class="delete-icon"
          data-delete-employee="${escapeHtml(employee.id)}"
          aria-label="Delete ${escapeHtml(employee.name)}"
        >
          <i class="fa-regular fa-trash-can"></i>
        </button>
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
        <button
          type="button"
          class="danger-button"
          data-delete-expert="${escapeHtml(expert.id)}"
          aria-label="Delete ${escapeHtml(expert.name)}"
        >
          <i class="fa-regular fa-trash-can"></i>
        </button>
      </div>
    `;
    expertManagementGrid.appendChild(card);
  });
}

function renderDashboardRewardCount() {
  if (!dashboardRewardCount) return;
  const rewards = typeof readRewards === "function" ? readRewards() : [];
  dashboardRewardCount.textContent = String(rewards.length);
}

function createDashboardLeaderboardEntries(challenge) {
  const seed = [...(challenge?.name || "Challenge")].reduce(
    (total, character) => total + character.charCodeAt(0),
    0
  );
  const baseScore = 9800 + (seed % 1600);

  return [
    {
      rank: 1,
      initials: "SJ",
      name: "Sarah Johnson",
      score: baseScore + 420,
      badgeClass: "teal",
      rowClass: "highlight",
    },
    {
      rank: 2,
      initials: "MC",
      name: "Michael Chen",
      score: baseScore + 210,
      badgeClass: "mint",
      rowClass: "",
    },
    {
      rank: 3,
      initials: "ED",
      name: "Emily Davis",
      score: baseScore + 80,
      badgeClass: "green",
      rowClass: "",
    },
    {
      rank: 4,
      initials: "DM",
      name: "David Martinez",
      score: baseScore - 110,
      badgeClass: "sea",
      rowClass: "",
    },
    {
      rank: 5,
      initials: "LA",
      name: "Lisa Anderson",
      score: baseScore - 260,
      badgeClass: "cyan",
      rowClass: "",
    },
  ];
}

function renderDashboardLeaderboard(challenge) {
  if (!dashboardLeaderboardTitle || !dashboardLeaderboardList) return;

  dashboardLeaderboardList.innerHTML = "";

  if (!challenge) {
    dashboardLeaderboardTitle.textContent = "Challenge Leaderboard";
    dashboardLeaderboardList.appendChild(
      createEmptyState(
        "Select or create an active challenge to view its leaderboard."
      )
    );
    return;
  }

  dashboardLeaderboardTitle.textContent = `${challenge.name} - Leaderboard`;

  const entries = createDashboardLeaderboardEntries(challenge);
  entries.forEach((entry) => {
    const row = document.createElement("div");
    row.className = `leaderboard-row${entry.rowClass ? ` ${entry.rowClass}` : ""}`;
    row.innerHTML = `
      <div class="person-meta">
        <span class="rank-avatar">${entry.rank}</span>
        <span class="person-badge ${entry.badgeClass}">${entry.initials}</span>
        <span>${escapeHtml(entry.name)}</span>
      </div>
      <strong>${entry.score.toLocaleString()}</strong>
    `;
    dashboardLeaderboardList.appendChild(row);
  });
}

function renderDashboardChallenges() {
  if (!dashboardChallengeList || !dashboardChallengeCount) return;

  const challenges = readChallenges();
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

function handleEmployeeSubmit(event) {
  event.preventDefault();
  if (!employeeForm) return;

  const companyContext = requireCurrentHrCompanyContext();
  if (!companyContext) return;

  const nameInput = employeeForm.querySelector("#employeeName");
  const departmentSelect = employeeForm.querySelector("#department");
  const emailInput = employeeForm.querySelector("#employeeEmail");
  const passwordInput = employeeForm.querySelector("#employeePassword");

  const result = employeeAuthStore?.createEmployee({
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

  employeeForm.reset();
  renderEmployeeOverview();
  closeModal(employeeModal);
}

function handleExpertSubmit(event) {
  event.preventDefault();
  if (!expertForm) return;

  const companyContext = requireCurrentHrCompanyContext();
  if (!companyContext) return;

  const nameInput = expertForm.querySelector("#expertName");
  const experienceInput = expertForm.querySelector("#expertExperience");
  const emailInput = expertForm.querySelector("#expertEmail");
  const passwordInput = expertForm.querySelector("#expertPassword");
  const specializationInput = expertForm.querySelector(
    "input[name='specialization']:checked"
  );

  const result = expertAuthStore?.createExpert({
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

  expertForm.reset();
  syncSpecializationCards(expertForm.querySelector(".specialization-grid"));
  renderExpertOverview();
  closeModal(expertModal);
}

function deleteEmployee(employeeId) {
  if (employeeAuthStore) {
    employeeAuthStore.deleteEmployee(employeeId);
  }
  renderEmployeeOverview();
}

function deleteExpert(expertId) {
  if (expertAuthStore) {
    expertAuthStore.deleteExpert(expertId);
  }
  renderExpertOverview();
}

function renderManagementSections() {
  renderEmployeeOverview();
  renderExpertOverview();
}

if (hrWelcomeMessage) {
  hrWelcomeMessage.textContent = `Welcome, ${currentHrFirstName}`;
}

if (openEmployeeModalButton) {
  openEmployeeModalButton.addEventListener("click", () => {
    openModal(employeeModal);
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
  employeeManagementTableBody.addEventListener("click", (event) => {
    const deleteButton = event.target.closest("[data-delete-employee]");
    if (!deleteButton) return;

    deleteEmployee(deleteButton.dataset.deleteEmployee || "");
  });
}

if (expertManagementGrid) {
  expertManagementGrid.addEventListener("click", (event) => {
    const deleteButton = event.target.closest("[data-delete-expert]");
    if (!deleteButton) return;

    deleteExpert(deleteButton.dataset.deleteExpert || "");
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
  renderManagementSections();
});

syncSpecializationCards(expertForm?.querySelector(".specialization-grid"));
renderDashboardChallenges();
renderDashboardRewardCount();
renderManagementSections();
