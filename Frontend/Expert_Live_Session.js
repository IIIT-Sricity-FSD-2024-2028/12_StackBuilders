const expertAuthStore = window.expertAuthStore || null;
const currentExpert = expertAuthStore?.requireExpertSession({
  redirectTo: "homepage.html",
});
const currentExpertName = currentExpert?.name || "Wellness Expert";
const currentExpertFirstName =
  currentExpertName.split(/\s+/).filter(Boolean)[0] || currentExpertName;

const expertLiveSessionRoutes = {
  navHome: "Wellness_Dashboard.html",
  navConsultation: "Wellness_Consultation_Dashboard.html",
  navLiveSession: "Expert_Live_Session.html",
  navVideoLibrary: "Expert_Video_Library.html",
};

Object.entries(expertLiveSessionRoutes).forEach(([id, target]) => {
  const link = document.getElementById(id);
  if (!link) return;

  link.addEventListener("click", (event) => {
    event.preventDefault();
    window.location.href = target;
  });
});

const profileNavIcon = document.getElementById("profileNavIcon");
const createLiveSessionBtn = document.getElementById("createLiveSessionBtn");
const sessionModalForm = document.getElementById("sessionModalForm");
const sessionModalOverlay = document.getElementById("sessionModalOverlay");
const sessionModalCloseBtn = document.getElementById("sessionModalCloseBtn");
const sessionModalBackBtn = document.getElementById("sessionModalBackBtn");
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

const expertSessionHistoryMock = [
  {
    title: "Breathing Exercises for Anxiety",
    description: "A guided session focused on grounding techniques and calm breathing.",
    category: "Mind Relaxation",
    date: "2026-02-22",
    startTime: "17:00",
    duration: "45 min",
    sessionType: "Live Workshop",
  },
  {
    title: "Mindful Reset Workshop",
    description: "A short mindfulness practice to help participants reset during busy weeks.",
    category: "Health Related",
    date: "2026-02-12",
    startTime: "16:30",
    duration: "30 min",
    sessionType: "Interactive Session",
  },
];

function buildEmptySessionState(message) {
  return `<div class="empty-session-state">${message}</div>`;
}

function buildExpertSessionCard(session, options = {}) {
  const date = liveSessionStore.formatDate(session.date);
  const time = liveSessionStore.formatTime(session.startTime);
  const showActions = options.showActions !== false;

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
               <button class="primary-btn">Join Session</button>
               <button class="secondary-btn"><i class="fa-solid fa-users"></i> Max ${session.maxParticipants} Participants</button>
             </div>`
          : ""
      }
    </article>
  `;
}

function renderExpertSessions() {
  const scheduledSessions = liveSessionStore.getUpcomingSessions({ expertId: currentExpert?.id });
  const completedSessions = expertSessionHistoryMock;
  const totalUpcomingPages = Math.max(Math.ceil(scheduledSessions.length / UPCOMING_SESSIONS_PER_PAGE), 1);
  const totalHistoryPages = Math.max(Math.ceil(completedSessions.length / SESSION_HISTORY_PER_PAGE), 1);
  upcomingSessionsPage = Math.min(upcomingSessionsPage, totalUpcomingPages);
  sessionHistoryPage = Math.min(sessionHistoryPage, totalHistoryPages);
  const startIndex = (upcomingSessionsPage - 1) * UPCOMING_SESSIONS_PER_PAGE;
  const historyStartIndex = (sessionHistoryPage - 1) * SESSION_HISTORY_PER_PAGE;
  const paginatedUpcomingSessions = scheduledSessions.slice(
    startIndex,
    startIndex + UPCOMING_SESSIONS_PER_PAGE
  );
  const paginatedCompletedSessions = completedSessions.slice(
    historyStartIndex,
    historyStartIndex + SESSION_HISTORY_PER_PAGE
  );

  if (upcomingSessionsCount) upcomingSessionsCount.textContent = String(scheduledSessions.length);
  if (completedSessionsCount) completedSessionsCount.textContent = String(completedSessions.length);
  if (averageRatingValue) averageRatingValue.textContent = completedSessions.length ? "4.7" : "0.0";
  if (upcomingSessionsSubtitle) {
    upcomingSessionsSubtitle.textContent = scheduledSessions.length
      ? `${scheduledSessions.length} session${scheduledSessions.length === 1 ? "" : "s"} scheduled`
      : "No sessions scheduled";
  }
  if (sessionHistorySubtitle) {
    sessionHistorySubtitle.textContent = completedSessions.length
      ? `${completedSessions.length} completed session${completedSessions.length === 1 ? "" : "s"}`
      : "No completed sessions";
  }

  if (expertUpcomingSessionList) {
    expertUpcomingSessionList.innerHTML = scheduledSessions.length
      ? paginatedUpcomingSessions.map((session) => buildExpertSessionCard(session)).join("")
      : buildEmptySessionState("No live sessions created yet.");
  }

  if (upcomingSessionsPagination && upcomingSessionsPrevBtn && upcomingSessionsNextBtn) {
    const shouldShowPagination = scheduledSessions.length > UPCOMING_SESSIONS_PER_PAGE;
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
  if (!sessionModalOverlay) return;
  sessionModalOverlay.hidden = false;
  document.body.classList.add("session-modal-open");
}

function closeSessionModal() {
  if (!sessionModalOverlay) return;
  sessionModalOverlay.hidden = true;
  document.body.classList.remove("session-modal-open");
  if (sessionModalForm) sessionModalForm.reset();
}

if (expertWelcomeMessage) {
  expertWelcomeMessage.textContent = `Welcome back, ${currentExpertFirstName}!`;
}

if (profileNavIcon) profileNavIcon.addEventListener("click", openProfileOverlay);
if (createLiveSessionBtn) {
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

if (sessionModalForm) {
  sessionModalForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(sessionModalForm);

    liveSessionStore.createLiveSession({
      title: String(formData.get("title") || "").trim(),
      category: String(formData.get("category") || "").trim(),
      sessionType: String(formData.get("sessionType") || "").trim(),
      date: String(formData.get("date") || "").trim(),
      startTime: String(formData.get("startTime") || "").trim(),
      duration: String(formData.get("duration") || "").trim(),
      maxParticipants: String(formData.get("maxParticipants") || "").trim(),
      meetingLink: String(formData.get("meetingLink") || "").trim(),
      description: String(formData.get("description") || "").trim(),
      expertId: currentExpert?.id,
      hostName: currentExpert?.name,
    });

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

renderExpertSessions();
