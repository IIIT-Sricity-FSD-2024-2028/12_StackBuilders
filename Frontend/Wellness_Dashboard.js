const expertAuthStore = window.expertAuthStore || null;
const currentExpert = expertAuthStore?.requireExpertSession({
  redirectTo: "homepage.html",
});
const currentExpertName = currentExpert?.name || "Wellness Expert";
const currentExpertFirstName =
  currentExpertName.split(/\s+/).filter(Boolean)[0] || currentExpertName;

const wellnessDashboardRoutes = {
  navHome: "Wellness_Dashboard.html",
  navConsultation: "Wellness_Consultation_Dashboard.html",
  navLiveSession: "Expert_Live_Session.html",
  navVideoLibrary: "Expert_Video_Library.html",
  viewupcomingLive: "Expert_Live_Session.html",
  viewupcomingConsultations: "Wellness_Consultation_Dashboard.html",
  viewvideolibrary: "Expert_Video_Library.html",
};

const UPCOMING_CONSULTATIONS_PER_PAGE = 3;
const UPCOMING_LIVE_SESSIONS_PER_PAGE = 3;
let upcomingConsultationsPage = 1;
let upcomingLiveSessionsPage = 1;
const wellnessWelcomeMessage = document.getElementById("wellnessWelcomeMessage");
const upcomingConsultationsCount = document.getElementById("upcomingConsultationsCount");
const upcomingLiveSessionsCount = document.getElementById("upcomingLiveSessionsCount");

function updateWellnessDashboardCounts({ consultations = 0, liveSessions = 0 }) {
  if (upcomingConsultationsCount) {
    upcomingConsultationsCount.textContent = String(consultations);
  }

  if (upcomingLiveSessionsCount) {
    upcomingLiveSessionsCount.textContent = String(liveSessions);
  }
}

function buildWellnessDashboardEmptyState(message) {
  return `
    <div class="consult-empty-state">
      <p>${message}</p>
    </div>
  `;
}

function buildUpcomingLiveSessionCard(session) {
  const date = liveSessionStore.formatDate(session.date);
  const time = liveSessionStore.formatTime(session.startTime);

  return `
    <article class="session-card dashboard-live-session-card">
      <div class="session-top dashboard-session-top">
        <div class="session-left dashboard-session-left">
          <div class="session-avatar green">${liveSessionStore.getInitials(session.category)}</div>
          <div>
            <h3>${session.title}</h3>
            <p>${session.description || "Join your next live interactive session."}</p>
          </div>
        </div>
      </div>

      <span class="tag dashboard-session-tag">${session.category}</span>

      <div class="session-meta dashboard-session-meta">
        <span><i class="fa-regular fa-calendar"></i> ${date}</span>
        <span><i class="fa-regular fa-clock"></i> ${time} (${session.duration})</span>
        <span><i class="fa-solid fa-video"></i> ${session.sessionType || "Live Session"}</span>
      </div>

      <div class="session-actions dashboard-session-actions">
        <a class="primary-btn dashboard-session-primary-btn" href="${session.meetingLink || "#"}">Join Session</a>
        <a class="secondary-btn dashboard-session-secondary-btn" href="#">Max ${session.maxParticipants} Participants</a>
      </div>
    </article>
  `;
}

function buildUpcomingConsultationCard(consultation) {
  const timing = consultationStore.splitRequestedOn(consultation.requestedOn);

  return `
    <article class="mini-card dashboard-consultation-card">
      <div class="mini-header">
        <div class="person">
          <div class="avatar dashboard-consultation-avatar">${consultationStore.getInitials(consultation.employeeName)}</div>
          <div>
            <h3>${consultation.employeeName}</h3>
            <span>${consultation.category}</span>
          </div>
        </div>
        <span class="status green">Confirmed</span>
      </div>
      <ul class="meta">
        <li>${timing.date || "Date to be scheduled"}</li>
        <li>${timing.time || "Time to be scheduled"}</li>
        <li>${consultation.expertName || currentExpertName}</li>
      </ul>
      <button class="primary-btn dashboard-consultation-btn" type="button">Open Session</button>
    </article>
  `;
}

function renderUpcomingConsultations() {
  const container = document.getElementById("upcomingConsultationsCards");
  const pager = document.getElementById("upcomingConsultationsPager");
  const prevBtn = document.getElementById("upcomingConsultationsPrevBtn");
  const nextBtn = document.getElementById("upcomingConsultationsNextBtn");
  const pageNumber = document.getElementById("upcomingConsultationsPageNumber");
  if (!container) return;

  const consultations = consultationStore.getCurrentExpertUpcomingConsultations();
  updateWellnessDashboardCounts({
    consultations: consultations.length,
    liveSessions: upcomingLiveSessionsCount ? Number(upcomingLiveSessionsCount.textContent) || 0 : 0,
  });
  const totalPages = Math.max(Math.ceil(consultations.length / UPCOMING_CONSULTATIONS_PER_PAGE), 1);
  upcomingConsultationsPage = Math.min(upcomingConsultationsPage, totalPages);
  const startIndex = (upcomingConsultationsPage - 1) * UPCOMING_CONSULTATIONS_PER_PAGE;
  const paginatedConsultations = consultations.slice(
    startIndex,
    startIndex + UPCOMING_CONSULTATIONS_PER_PAGE
  );

  container.innerHTML = consultations.length
    ? paginatedConsultations.map(buildUpcomingConsultationCard).join("")
    : buildWellnessDashboardEmptyState("No upcoming consultations available.");

  if (pager && prevBtn && nextBtn) {
    const shouldShowPager = consultations.length > UPCOMING_CONSULTATIONS_PER_PAGE;
    pager.hidden = !shouldShowPager;
    prevBtn.disabled = upcomingConsultationsPage === 1;
    nextBtn.disabled = upcomingConsultationsPage === totalPages;

    if (pageNumber) {
      pageNumber.textContent = String(upcomingConsultationsPage);
    }
  }
}

function renderUpcomingLiveSessions() {
  const container = document.getElementById("upcomingLiveSessionsCards");
  const pager = document.getElementById("upcomingLiveSessionsPager");
  const prevBtn = document.getElementById("upcomingLiveSessionsPrevBtn");
  const nextBtn = document.getElementById("upcomingLiveSessionsNextBtn");
  const pageNumber = document.getElementById("upcomingLiveSessionsPageNumber");
  if (!container) return;

  const sessions = liveSessionStore.getUpcomingSessions({ expertId: currentExpert?.id });
  updateWellnessDashboardCounts({
    consultations: upcomingConsultationsCount ? Number(upcomingConsultationsCount.textContent) || 0 : 0,
    liveSessions: sessions.length,
  });
  const totalPages = Math.max(Math.ceil(sessions.length / UPCOMING_LIVE_SESSIONS_PER_PAGE), 1);
  upcomingLiveSessionsPage = Math.min(upcomingLiveSessionsPage, totalPages);
  const startIndex = (upcomingLiveSessionsPage - 1) * UPCOMING_LIVE_SESSIONS_PER_PAGE;
  const paginatedSessions = sessions.slice(startIndex, startIndex + UPCOMING_LIVE_SESSIONS_PER_PAGE);

  container.innerHTML = sessions.length
    ? paginatedSessions.map(buildUpcomingLiveSessionCard).join("")
    : buildWellnessDashboardEmptyState("No upcoming live sessions available.");

  if (pager && prevBtn && nextBtn) {
    const shouldShowPager = sessions.length > UPCOMING_LIVE_SESSIONS_PER_PAGE;
    pager.hidden = !shouldShowPager;
    prevBtn.disabled = upcomingLiveSessionsPage === 1;
    nextBtn.disabled = upcomingLiveSessionsPage === totalPages;

    if (pageNumber) {
      pageNumber.textContent = String(upcomingLiveSessionsPage);
    }
  }
}

Object.entries(wellnessDashboardRoutes).forEach(([id, target]) => {
  const link = document.getElementById(id);
  if (!link) return;

  link.addEventListener("click", (event) => {
    event.preventDefault();
    window.location.href = target;
  });
});

const profileNavIcon = document.getElementById("profileNavIcon");
const profileOverlay = document.getElementById("profileOverlay");
const profileDrawerBackBtn = document.getElementById("profileDrawerBackBtn");
const editProfileDrawerBtn = document.getElementById("editProfileDrawerBtn");
const logoutDrawerBtn = document.getElementById("logoutDrawerBtn");

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

if (wellnessWelcomeMessage) {
  wellnessWelcomeMessage.textContent = `Welcome back, ${currentExpertFirstName}!`;
}

if (profileNavIcon) profileNavIcon.addEventListener("click", openProfileOverlay);
if (profileDrawerBackBtn) profileDrawerBackBtn.addEventListener("click", closeProfileOverlay);
if (editProfileDrawerBtn) editProfileDrawerBtn.addEventListener("click", closeProfileOverlay);
if (logoutDrawerBtn) logoutDrawerBtn.addEventListener("click", closeProfileOverlay);

if (profileOverlay) {
  profileOverlay.addEventListener("click", (event) => {
    if (event.target === profileOverlay) closeProfileOverlay();
  });
}

const upcomingConsultationsPrevBtn = document.getElementById("upcomingConsultationsPrevBtn");
const upcomingConsultationsNextBtn = document.getElementById("upcomingConsultationsNextBtn");
const upcomingLiveSessionsPrevBtn = document.getElementById("upcomingLiveSessionsPrevBtn");
const upcomingLiveSessionsNextBtn = document.getElementById("upcomingLiveSessionsNextBtn");

if (upcomingConsultationsPrevBtn) {
  upcomingConsultationsPrevBtn.addEventListener("click", () => {
    if (upcomingConsultationsPage === 1) return;
    upcomingConsultationsPage -= 1;
    renderUpcomingConsultations();
  });
}

if (upcomingConsultationsNextBtn) {
  upcomingConsultationsNextBtn.addEventListener("click", () => {
    upcomingConsultationsPage += 1;
    renderUpcomingConsultations();
  });
}

if (upcomingLiveSessionsPrevBtn) {
  upcomingLiveSessionsPrevBtn.addEventListener("click", () => {
    if (upcomingLiveSessionsPage === 1) return;
    upcomingLiveSessionsPage -= 1;
    renderUpcomingLiveSessions();
  });
}

if (upcomingLiveSessionsNextBtn) {
  upcomingLiveSessionsNextBtn.addEventListener("click", () => {
    upcomingLiveSessionsPage += 1;
    renderUpcomingLiveSessions();
  });
}

window.addEventListener("storage", (event) => {
  if (event.key === expertAuthStore?.EXPERT_STORAGE_KEY && !expertAuthStore?.getCurrentExpert()) {
    window.location.replace("homepage.html");
    return;
  }

  if (
    event.key &&
    event.key !== "stackbuilders.consultations.v1" &&
    event.key !== "stackbuilders.liveSessions.v1"
  ) {
    return;
  }

  renderUpcomingConsultations();
  renderUpcomingLiveSessions();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeProfileOverlay();
});

renderUpcomingConsultations();
renderUpcomingLiveSessions();
