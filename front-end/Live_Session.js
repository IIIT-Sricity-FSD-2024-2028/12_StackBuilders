const employeeAuthStore = window.employeeAuthStore || null;
const rolePermissionsStore = window.rolePermissionsStore || null;
const currentEmployee = employeeAuthStore?.requireEmployeeSession({
  redirectTo: "homepage.html",
});
const currentEmployeeName = currentEmployee?.name || "Employee";
const currentEmployeeFirstName =
  currentEmployeeName.split(/\s+/).filter(Boolean)[0] || currentEmployeeName;
const currentEmployeeCompanyContext = {
  companyId: String(currentEmployee?.companyId || "").trim(),
  companyName: String(currentEmployee?.companyName || "").trim(),
};
const employeePermissionGroup = "employee";
const canReadEmployeeConsultations =
  rolePermissionsStore?.hasPermission(employeePermissionGroup, "user-management-read") ?? true;
const canReadEmployeeClientFeatures =
  rolePermissionsStore?.hasPermission(employeePermissionGroup, "client-management-read") ?? true;

const tabs = document.querySelectorAll(".tab");
const employeeWelcomeMessage = document.getElementById("employeeWelcomeMessage");
const cardsGrid = document.getElementById("liveSessionsGrid");
const scheduledCount = document.getElementById("scheduledCount");
const ongoingCount = document.getElementById("ongoingCount");
const attendedCount = document.getElementById("attendedCount");
const liveSessionsPager = document.getElementById("liveSessionsPager");
const liveSessionsPrevBtn = document.getElementById("liveSessionsPrevBtn");
const liveSessionsNextBtn = document.getElementById("liveSessionsNextBtn");
const liveSessionsPageNumber = document.getElementById(
  "liveSessionsPageNumber",
);
const profileNavIcon = document.getElementById("profileNavIcon");
const profileOverlay = document.getElementById("profileOverlay");
const profileDrawerBackBtn = document.getElementById("profileDrawerBackBtn");
const consultationNavLink = document.querySelector('.nav-links a[href="Employee_Consultation2.html"]');
const employeeWellnessCheckinsNavLink = document.querySelector(
  '.nav-links a[href="Employee_Wellness_Checkins.html"]'
);
const videoLibraryNavLink = document.querySelector('.nav-links a[href="Video_Library.html?role=employee"]');

rolePermissionsStore?.watchPermissions(employeePermissionGroup);
rolePermissionsStore?.guardPageAccess({
  group: employeePermissionGroup,
  anyOf: ["client-management-read"],
  title: "Live session access is disabled",
  message:
    "Ask the admin to enable Company Management read access for employees before opening live sessions.",
});
rolePermissionsStore?.restrictElement(consultationNavLink, canReadEmployeeConsultations);
rolePermissionsStore?.restrictElement(
  employeeWellnessCheckinsNavLink,
  canReadEmployeeClientFeatures
);
rolePermissionsStore?.restrictElement(videoLibraryNavLink, canReadEmployeeClientFeatures);

const SESSIONS_PER_PAGE = 9;
let currentSessionsPage = 1;

function setActiveSessionTab(tabKey) {
  tabs.forEach((item) => item.classList.toggle("active", item.dataset.tab === tabKey));
  currentSessionsPage = 1;
  renderSessions(tabKey);
}

function buildLiveSessionEmptyState(message) {
  return `<div class="empty-live-state">${message}</div>`;
}

function getStatusPresentation(status) {
  const normalizedStatus = String(status || "").trim().toLowerCase();

  if (normalizedStatus === "ongoing") {
    return {
      statusText: "Ongoing",
      statusClass: "live",
      buttonText: "Join Now",
      buttonClass: "join",
      actionType: "join",
    };
  }

  if (normalizedStatus === "completed") {
    return {
      statusText: "Attended",
      statusClass: "attended",
      buttonText: "",
      buttonClass: "",
      actionType: "",
    };
  }

  return {
    statusText: "Scheduled",
    statusClass: "scheduled",
    buttonText: "",
    buttonClass: "",
    actionType: "",
  };
}

function buildSessionCard(session) {
  const date = liveSessionStore.formatDate(session.date);
  const time = liveSessionStore.formatTime(session.startTime);
  const actionMarkup =
    session.actionType === "join"
      ? `<button class="action-btn ${session.buttonClass || "join"}" data-session-action="join" data-session-id="${session.id || ""}" data-meeting-link="${session.meetingLink || ""}" type="button">${session.buttonText || "Join Now"}</button>`
      : "";

  return `
    <div class="session-card session-card-no-image">
      <div class="card-content no-image-content">
        <div class="card-top-row">
          <span class="tag">${session.category}</span>
          <span class="status ${session.statusClass || "scheduled"}">${session.statusText || "Scheduled"}</span>
        </div>
        <h2>${session.title}</h2>
        <p><i class="fa-regular fa-user"></i> ${session.hostName}, Wellness Expert</p>
        <p><i class="fa-regular fa-calendar"></i> ${date}</p>
        <p><i class="fa-regular fa-clock"></i> ${time} (${session.duration})</p>
        <p><i class="fa-solid fa-users"></i> Max ${session.maxParticipants} participants</p>
        ${actionMarkup}
      </div>
    </div>
  `;
}

function renderSessions(category) {
  const statusMap = {
    scheduled: "scheduled",
    ongoing: "ongoing",
    attended: "completed",
  };
  const status = statusMap[category] || "scheduled";
  const sessions = liveSessionStore
    .getSessionsByStatus(status, currentEmployeeCompanyContext)
    .map((session) => ({
      ...session,
      ...getStatusPresentation(status),
    }));
  const totalPages = Math.max(
    Math.ceil(sessions.length / SESSIONS_PER_PAGE),
    1,
  );
  currentSessionsPage = Math.min(currentSessionsPage, totalPages);
  const startIndex = (currentSessionsPage - 1) * SESSIONS_PER_PAGE;
  const paginatedSessions = sessions.slice(
    startIndex,
    startIndex + SESSIONS_PER_PAGE,
  );

  if (cardsGrid) {
    cardsGrid.innerHTML = sessions.length
      ? paginatedSessions.map(buildSessionCard).join("")
      : buildLiveSessionEmptyState(`No ${category} sessions available.`);
  }

  if (liveSessionsPager && liveSessionsPrevBtn && liveSessionsNextBtn) {
    const shouldShowPager = sessions.length > SESSIONS_PER_PAGE;
    liveSessionsPager.hidden = !shouldShowPager;
    liveSessionsPrevBtn.disabled = currentSessionsPage === 1;
    liveSessionsNextBtn.disabled = currentSessionsPage === totalPages;

    if (liveSessionsPageNumber) {
      liveSessionsPageNumber.textContent = String(currentSessionsPage);
    }
  }
}

function syncCounts() {
  const scheduledSessions = liveSessionStore.getSessionsByStatus(
    "scheduled",
    currentEmployeeCompanyContext
  );
  const ongoingSessions = liveSessionStore.getSessionsByStatus(
    "ongoing",
    currentEmployeeCompanyContext
  );
  const attendedSessions = liveSessionStore.getSessionsByStatus(
    "completed",
    currentEmployeeCompanyContext
  );
  if (scheduledCount) scheduledCount.textContent = String(scheduledSessions.length);
  if (ongoingCount) ongoingCount.textContent = String(ongoingSessions.length);
  if (attendedCount) attendedCount.textContent = String(attendedSessions.length);
}

async function syncEmployeeLiveSessionsFromBackend() {
  if (!liveSessionStore?.syncLiveSessionsFromBackend) {
    return;
  }

  await Promise.resolve(liveSessionStore.syncLiveSessionsFromBackend(currentEmployeeCompanyContext));
  syncCounts();
  currentSessionsPage = 1;
  const activeTab = document.querySelector(".tab.active");
  renderSessions(activeTab ? activeTab.dataset.tab : "scheduled");
}

function openProfileOverlay() {
  if (!profileOverlay) return;
  profileOverlay.hidden = false;
  document.body.classList.add("profile-open");
}

function closeProfileOverlay() {
  if (!profileOverlay) return;
  profileOverlay.hidden = true;
  document.body.classList.remove("profile-open");
}

if (employeeWelcomeMessage) {
  employeeWelcomeMessage.textContent = `Welcome back, ${currentEmployeeFirstName}!`;
}

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    setActiveSessionTab(tab.dataset.tab);
  });
});

if (liveSessionsPrevBtn) {
  liveSessionsPrevBtn.addEventListener("click", () => {
    if (currentSessionsPage === 1) return;
    currentSessionsPage -= 1;
    const activeTab = document.querySelector(".tab.active");
    renderSessions(activeTab ? activeTab.dataset.tab : "scheduled");
  });
}

if (liveSessionsNextBtn) {
  liveSessionsNextBtn.addEventListener("click", () => {
    currentSessionsPage += 1;
    const activeTab = document.querySelector(".tab.active");
    renderSessions(activeTab ? activeTab.dataset.tab : "scheduled");
  });
}

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

if (cardsGrid) {
  cardsGrid.addEventListener("click", (event) => {
    const joinButton = event.target.closest('[data-session-action="join"]');
    if (!joinButton) {
      return;
    }

    const sessionId = String(joinButton.dataset.sessionId || "").trim();
    const meetingLink = String(joinButton.dataset.meetingLink || "").trim();
    if (!meetingLink) {
      alert("Meeting link is not available for this session yet.");
      return;
    }

    window.open(meetingLink, "_blank", "noopener,noreferrer");
  });
}

window.addEventListener("storage", (event) => {
  if (event.key && event.key !== "stackbuilders.liveSessions.v1") return;
  syncCounts();
  currentSessionsPage = 1;
  const activeTab = document.querySelector(".tab.active");
  renderSessions(activeTab ? activeTab.dataset.tab : "scheduled");
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeProfileOverlay();
  }
});

window.setInterval(() => {
  syncCounts();
  const activeTab = document.querySelector(".tab.active");
  renderSessions(activeTab ? activeTab.dataset.tab : "scheduled");
}, 30000);

syncCounts();
renderSessions("scheduled");
void syncEmployeeLiveSessionsFromBackend();
