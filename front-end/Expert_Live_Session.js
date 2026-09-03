const expertAuthStore = window.expertAuthStore || null;
const rolePermissionsStore = window.rolePermissionsStore || null;
const currentExpert = expertAuthStore?.requireExpertSession({
  redirectTo: "homepage.html",
});
const currentExpertName = currentExpert?.name || "Wellness Expert";
const currentExpertFirstName =
  currentExpertName.split(/\s+/).filter(Boolean)[0] || currentExpertName;
const currentExpertCompanyContext = {
  companyId: String(currentExpert?.companyId || "").trim(),
  companyName: String(currentExpert?.companyName || "").trim(),
};
const expertSessionCategoryFallbackMap = {
  mental: "Psychologist",
  nutrition: "Nutritionist",
  physical: "Physical Wellness Instructor",
};
const expertHomeRoute =
  expertAuthStore?.getExpertDashboardRoute?.(currentExpert) || "Wellness_Dashboard.html";
const wellnessPermissionGroup = "wellness-expert";
const canReadWellnessConsultations =
  rolePermissionsStore?.hasPermission(wellnessPermissionGroup, "user-management-read") ?? true;
const canReadWellnessClientFeatures =
  rolePermissionsStore?.hasPermission(wellnessPermissionGroup, "client-management-read") ?? true;
const canCreateWellnessClientFeatures =
  rolePermissionsStore?.hasPermission(wellnessPermissionGroup, "client-management-create") ?? true;

const expertLiveSessionRoutes = {
  navHome: expertHomeRoute,
  navConsultation: "Wellness_Consultation_Dashboard.html",
  navEmployeeCheckins: "Expert_Employee_Checkins.html",
  navLiveSession: "Expert_Live_Session.html",
  navVideoLibrary: "Expert_Video_Library.html",
};

rolePermissionsStore?.watchPermissions(wellnessPermissionGroup);
rolePermissionsStore?.guardPageAccess({
  group: wellnessPermissionGroup,
  anyOf: ["client-management-read"],
  title: "Live session access is disabled",
  message:
    "Ask the admin to enable Company Management read access for wellness experts before opening live sessions.",
});

Object.entries(expertLiveSessionRoutes).forEach(([id, target]) => {
  const link = document.getElementById(id);
  if (!link) return;

  link.addEventListener("click", (event) => {
    event.preventDefault();
    window.location.href = target;
  });
});

rolePermissionsStore?.restrictElement(
  document.getElementById("navConsultation"),
  canReadWellnessConsultations
);
rolePermissionsStore?.restrictElement(
  document.getElementById("navEmployeeCheckins"),
  canReadWellnessConsultations
);
rolePermissionsStore?.restrictElement(
  document.getElementById("navVideoLibrary"),
  canReadWellnessClientFeatures
);

const profileNavIcon = document.getElementById("profileNavIcon");
const createLiveSessionBtn = document.getElementById("createLiveSessionBtn");
const sessionModalForm = document.getElementById("sessionModalForm");
const sessionModalOverlay = document.getElementById("sessionModalOverlay");
const sessionModalCloseBtn = document.getElementById("sessionModalCloseBtn");
const sessionModalBackBtn = document.getElementById("sessionModalBackBtn");
const sessionDateInput = sessionModalForm?.querySelector('input[name="date"]') || null;
const sessionStartTimeInput =
  sessionModalForm?.querySelector('input[name="startTime"]') || null;
const sessionCategoryInput = document.getElementById("sessionCategoryInput");
const sessionCategoryDisplay = document.getElementById("sessionCategoryDisplay");
const profileOverlay = document.getElementById("profileOverlay");
const profileDrawerBackBtn = document.getElementById("profileDrawerBackBtn");
const editProfileDrawerBtn = document.getElementById("editProfileDrawerBtn");
const logoutDrawerBtn = document.getElementById("logoutDrawerBtn");
const expertUpcomingSessionList = document.getElementById("expertUpcomingSessionList");
const expertSessionHistoryList = document.getElementById("expertSessionHistoryList");
const upcomingSessionsCount = document.getElementById("upcomingSessionsCount");
const completedSessionsCount = document.getElementById("completedSessionsCount");
const averageRatingValue = document.getElementById("averageRatingValue");
const upcomingSessionsSubtitle = document.getElementById("upcomingSessionsSubtitle");
const sessionHistorySubtitle = document.getElementById("sessionHistorySubtitle");
const upcomingSessionsPagination = document.getElementById("upcomingSessionsPagination");
const upcomingSessionsPrevBtn = document.getElementById("upcomingSessionsPrevBtn");
const upcomingSessionsNextBtn = document.getElementById("upcomingSessionsNextBtn");
const upcomingSessionsPageNumber = document.getElementById("upcomingSessionsPageNumber");
const sessionHistoryPagination = document.getElementById("sessionHistoryPagination");
const sessionHistoryPrevBtn = document.getElementById("sessionHistoryPrevBtn");
const sessionHistoryNextBtn = document.getElementById("sessionHistoryNextBtn");
const sessionHistoryPageNumber = document.getElementById("sessionHistoryPageNumber");
const expertWelcomeMessage = document.getElementById("expertWelcomeMessage");

const UPCOMING_SESSIONS_PER_PAGE = 3;
const SESSION_HISTORY_PER_PAGE = 3;
let upcomingSessionsPage = 1;
let sessionHistoryPage = 1;

function buildEmptySessionState(message) {
  return `<div class="empty-session-state">${message}</div>`;
}

function getActiveExpertRecord() {
  return expertAuthStore?.getCurrentExpert?.() || currentExpert || null;
}

function resolveCurrentExpertSessionCategory() {
  const activeExpert = getActiveExpertRecord();
  const specialization = String(activeExpert?.specialization || "").trim();
  if (specialization) {
    return specialization;
  }

  const expertTrack = expertAuthStore?.getExpertTrack?.(activeExpert) || "";
  return expertSessionCategoryFallbackMap[expertTrack] || "Wellness Expert";
}

function syncSessionCategoryField() {
  const sessionCategory = resolveCurrentExpertSessionCategory();

  if (sessionCategoryInput) {
    sessionCategoryInput.value = sessionCategory;
  }

  if (sessionCategoryDisplay) {
    sessionCategoryDisplay.value = sessionCategory;
  }
}

function buildExpertSessionCard(session, options = {}) {
  const date = liveSessionStore.formatDate(session.date);
  const time = liveSessionStore.formatTime(session.startTime);
  const showActions = options.showActions !== false;
  const isOngoing =
    String(session.status || "").trim().toLowerCase() === "ongoing";

  return `
    <article class="session-card">
      <div class="session-top">
        <div class="session-left">
          <div class="session-avatar green">${liveSessionStore.getInitials(session.category)}</div>
          <div>
            <h3>${session.title}</h3>
            <p>${session.description}</p>
          </div>
        </div>
      </div>

      <span class="tag">${session.category}</span>

      <div class="session-meta">
        <span><i class="fa-regular fa-calendar"></i> ${date}</span>
        <span><i class="fa-regular fa-clock"></i> ${time} (${session.duration})</span>
        <span><i class="fa-solid fa-video"></i> ${session.sessionType}</span>
      </div>

      ${
        showActions
          ? `<div class="session-actions">
               <button class="primary-btn" data-session-action="join" data-meeting-link="${session.meetingLink || ""}" type="button">${isOngoing ? "Join Now" : "Join Session"}</button>
               <button class="secondary-btn"><i class="fa-solid fa-users"></i> Max ${session.maxParticipants} Participants</button>
             </div>`
          : ""
      }
    </article>
  `;
}

function renderExpertSessions() {
  const activeSessions = liveSessionStore.getActiveSessions({
    expertId: currentExpert?.id,
    companyId: currentExpertCompanyContext.companyId,
    companyName: currentExpertCompanyContext.companyName,
  });
  const completedSessions = liveSessionStore.getSessionsByStatus("completed", {
    expertId: currentExpert?.id,
    companyId: currentExpertCompanyContext.companyId,
    companyName: currentExpertCompanyContext.companyName,
  });
  const scheduledSessionsCount = activeSessions.filter(
    (session) => String(session.status || "").trim().toLowerCase() === "scheduled"
  ).length;
  const ongoingSessionsCount = activeSessions.filter(
    (session) => String(session.status || "").trim().toLowerCase() === "ongoing"
  ).length;
  const totalUpcomingPages = Math.max(Math.ceil(activeSessions.length / UPCOMING_SESSIONS_PER_PAGE), 1);
  const totalHistoryPages = Math.max(Math.ceil(completedSessions.length / SESSION_HISTORY_PER_PAGE), 1);
  upcomingSessionsPage = Math.min(upcomingSessionsPage, totalUpcomingPages);
  sessionHistoryPage = Math.min(sessionHistoryPage, totalHistoryPages);
  const startIndex = (upcomingSessionsPage - 1) * UPCOMING_SESSIONS_PER_PAGE;
  const historyStartIndex = (sessionHistoryPage - 1) * SESSION_HISTORY_PER_PAGE;
  const paginatedUpcomingSessions = activeSessions.slice(
    startIndex,
    startIndex + UPCOMING_SESSIONS_PER_PAGE
  );
  const paginatedCompletedSessions = completedSessions.slice(
    historyStartIndex,
    historyStartIndex + SESSION_HISTORY_PER_PAGE
  );

  if (upcomingSessionsCount) upcomingSessionsCount.textContent = String(activeSessions.length);
  if (completedSessionsCount) completedSessionsCount.textContent = String(completedSessions.length);
  if (averageRatingValue) averageRatingValue.textContent = "--";
  if (upcomingSessionsSubtitle) {
    upcomingSessionsSubtitle.textContent = activeSessions.length
      ? `${ongoingSessionsCount} ongoing, ${scheduledSessionsCount} scheduled`
      : "No sessions scheduled";
  }
  if (sessionHistorySubtitle) {
    sessionHistorySubtitle.textContent = completedSessions.length
      ? `${completedSessions.length} completed session${completedSessions.length === 1 ? "" : "s"}`
      : "No completed sessions";
  }

  if (expertUpcomingSessionList) {
    expertUpcomingSessionList.innerHTML = activeSessions.length
      ? paginatedUpcomingSessions.map((session) => buildExpertSessionCard(session)).join("")
      : buildEmptySessionState("No live sessions created yet.");
  }

  if (upcomingSessionsPagination && upcomingSessionsPrevBtn && upcomingSessionsNextBtn) {
    const shouldShowPagination = activeSessions.length > UPCOMING_SESSIONS_PER_PAGE;
    upcomingSessionsPagination.hidden = !shouldShowPagination;
    upcomingSessionsPrevBtn.disabled = upcomingSessionsPage === 1;
    upcomingSessionsNextBtn.disabled = upcomingSessionsPage === totalUpcomingPages;

    if (upcomingSessionsPageNumber) {
      upcomingSessionsPageNumber.textContent = String(upcomingSessionsPage);
    }
  }

  if (expertSessionHistoryList) {
    expertSessionHistoryList.innerHTML = completedSessions.length
      ? paginatedCompletedSessions
          .map((session) => buildExpertSessionCard(session, { showActions: false }))
          .join("")
      : buildEmptySessionState("No completed live sessions yet.");
  }

  if (sessionHistoryPagination && sessionHistoryPrevBtn && sessionHistoryNextBtn) {
    const shouldShowHistoryPagination = completedSessions.length > SESSION_HISTORY_PER_PAGE;
    sessionHistoryPagination.hidden = !shouldShowHistoryPagination;
    sessionHistoryPrevBtn.disabled = sessionHistoryPage === 1;
    sessionHistoryNextBtn.disabled = sessionHistoryPage === totalHistoryPages;

    if (sessionHistoryPageNumber) {
      sessionHistoryPageNumber.textContent = String(sessionHistoryPage);
    }
  }
}

async function syncExpertLiveSessionsFromBackend() {
  if (!liveSessionStore?.syncLiveSessionsFromBackend) {
    return;
  }

  await Promise.resolve(liveSessionStore.syncLiveSessionsFromBackend(currentExpertCompanyContext));
  renderExpertSessions();
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

function openSessionModal() {
  if (!canCreateWellnessClientFeatures) {
    alert("Wellness expert create access is disabled for live sessions.");
    return;
  }

  if (!sessionModalOverlay) return;
  syncSessionCategoryField();
  syncSessionTimeInputMinimum();
  sessionModalOverlay.hidden = false;
  document.body.classList.add("session-modal-open");
}

function closeSessionModal() {
  if (!sessionModalOverlay) return;
  sessionModalOverlay.hidden = true;
  document.body.classList.remove("session-modal-open");
  if (sessionModalForm) {
    sessionModalForm.reset();
    syncSessionCategoryField();
  }
}

function getTodayDateInputValue() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getCurrentTimeInputValue() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function syncSessionTimeInputMinimum() {
  if (!sessionStartTimeInput || !sessionDateInput) {
    return;
  }

  if (sessionDateInput.value === getTodayDateInputValue()) {
    const minimumTime = getCurrentTimeInputValue();
    sessionStartTimeInput.min = minimumTime;

    if (sessionStartTimeInput.value && sessionStartTimeInput.value < minimumTime) {
      sessionStartTimeInput.value = minimumTime;
    }

    return;
  }

  sessionStartTimeInput.removeAttribute("min");
}

if (expertWelcomeMessage) {
  expertWelcomeMessage.textContent = `Welcome back, ${currentExpertFirstName}!`;
}

if (sessionDateInput) {
  sessionDateInput.min = getTodayDateInputValue();
  sessionDateInput.addEventListener("change", syncSessionTimeInputMinimum);
}

syncSessionCategoryField();
syncSessionTimeInputMinimum();

if (profileNavIcon) profileNavIcon.addEventListener("click", openProfileOverlay);
if (createLiveSessionBtn) {
  rolePermissionsStore?.restrictElement(createLiveSessionBtn, canCreateWellnessClientFeatures);
  createLiveSessionBtn.addEventListener("click", openSessionModal);
}
if (sessionModalCloseBtn) sessionModalCloseBtn.addEventListener("click", closeSessionModal);
if (sessionModalBackBtn) sessionModalBackBtn.addEventListener("click", closeSessionModal);
if (profileDrawerBackBtn) profileDrawerBackBtn.addEventListener("click", closeProfileOverlay);
if (editProfileDrawerBtn) editProfileDrawerBtn.addEventListener("click", closeProfileOverlay);
if (logoutDrawerBtn) logoutDrawerBtn.addEventListener("click", closeProfileOverlay);

if (profileOverlay) {
  profileOverlay.addEventListener("click", (event) => {
    if (event.target === profileOverlay) closeProfileOverlay();
  });
}

if (sessionModalOverlay) {
  sessionModalOverlay.addEventListener("click", (event) => {
    if (event.target === sessionModalOverlay) closeSessionModal();
  });
}

if (expertUpcomingSessionList) {
  expertUpcomingSessionList.addEventListener("click", (event) => {
    const joinButton = event.target.closest('[data-session-action="join"]');
    if (!joinButton) {
      return;
    }

    const meetingLink = String(joinButton.dataset.meetingLink || "").trim();
    if (!meetingLink) {
      alert("Meeting link is not available for this session yet.");
      return;
    }

    window.open(meetingLink, "_blank", "noopener,noreferrer");
  });
}

if (sessionModalForm) {
  sessionModalForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!canCreateWellnessClientFeatures) {
      alert("Wellness expert create access is disabled for live sessions.");
      return;
    }

    if (!sessionModalForm.reportValidity()) {
      return;
    }

    const formData = new FormData(sessionModalForm);

    const result = await Promise.resolve(
      liveSessionStore.createLiveSession({
        title: String(formData.get("title") || "").trim(),
        category: resolveCurrentExpertSessionCategory(),
        sessionType: String(formData.get("sessionType") || "").trim(),
        date: String(formData.get("date") || "").trim(),
        startTime: String(formData.get("startTime") || "").trim(),
        duration: String(formData.get("duration") || "").trim(),
        maxParticipants: String(formData.get("maxParticipants") || "").trim(),
        meetingLink: String(formData.get("meetingLink") || "").trim(),
        description: String(formData.get("description") || "").trim(),
        expertId: currentExpert?.id,
        hostName: currentExpert?.name,
        companyId: currentExpertCompanyContext.companyId,
        companyName: currentExpertCompanyContext.companyName,
      })
    );

    if (!result?.ok) {
      alert(result?.error || "Unable to create the live session right now.");
      return;
    }

    renderExpertSessions();
    closeSessionModal();
  });
}

if (upcomingSessionsPrevBtn) {
  upcomingSessionsPrevBtn.addEventListener("click", () => {
    if (upcomingSessionsPage === 1) {
      return;
    }

    upcomingSessionsPage -= 1;
    renderExpertSessions();
  });
}

if (upcomingSessionsNextBtn) {
  upcomingSessionsNextBtn.addEventListener("click", () => {
    upcomingSessionsPage += 1;
    renderExpertSessions();
  });
}

if (sessionHistoryPrevBtn) {
  sessionHistoryPrevBtn.addEventListener("click", () => {
    if (sessionHistoryPage === 1) {
      return;
    }

    sessionHistoryPage -= 1;
    renderExpertSessions();
  });
}

if (sessionHistoryNextBtn) {
  sessionHistoryNextBtn.addEventListener("click", () => {
    sessionHistoryPage += 1;
    renderExpertSessions();
  });
}

window.addEventListener("storage", (event) => {
  if (event.key && event.key !== "stackbuilders.liveSessions.v1") return;
  renderExpertSessions();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeProfileOverlay();
    closeSessionModal();
  }
});

window.setInterval(() => {
  syncSessionTimeInputMinimum();
  renderExpertSessions();
}, 30000);

renderExpertSessions();
void syncExpertLiveSessionsFromBackend();
