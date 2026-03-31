const employeeAuthStore = window.employeeAuthStore || null;
const currentEmployee = employeeAuthStore?.requireEmployeeSession({
  redirectTo: "homepage.html",
});
const currentEmployeeName = currentEmployee?.name || "Employee";
const currentEmployeeFirstName =
  currentEmployeeName.split(/\s+/).filter(Boolean)[0] || currentEmployeeName;

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

const SESSIONS_PER_PAGE = 9;
let currentSessionsPage = 1;

const liveSessionMockData = {
  ongoing: [
    {
      title: "Morning Yoga & Mindfulness",
      category: "Physical Wellness",
      hostName: "Dr. Sarah Mitchell",
      date: "2026-03-28",
      startTime: "07:00",
      duration: "45 min",
      maxParticipants: "30",
      statusText: "Ongoing",
      statusClass: "ongoing",
      buttonText: "Join Now",
      buttonClass: "join",
    },
    {
      title: "Guided Meditation for Stress Relief",
      category: "Mind Relaxation",
      hostName: "Dr. Emily Chen",
      date: "2026-03-30",
      startTime: "18:00",
      duration: "30 min",
      maxParticipants: "40",
      statusText: "Ongoing",
      statusClass: "ongoing",
      buttonText: "Join Now",
      buttonClass: "join",
    },
  ],
  attended: [
    {
      title: "Healthy Cooking Workshop",
      category: "Health Related",
      hostName: "Dr. James Peterson",
      date: "2026-03-12",
      startTime: "17:30",
      duration: "60 min",
      maxParticipants: "25",
      statusText: "Attended",
      statusClass: "attended",
      buttonText: "View Summary",
      buttonClass: "details",
    },
    {
      title: "Work-Life Balance Strategies",
      category: "Mind Relaxation",
      hostName: "Dr. Laura Williams",
      date: "2026-03-05",
      startTime: "16:00",
      duration: "45 min",
      maxParticipants: "35",
      statusText: "Attended",
      statusClass: "attended",
      buttonText: "View Summary",
      buttonClass: "details",
    },
  ],
};

function buildLiveSessionEmptyState(message) {
  return `<div class="empty-live-state">${message}</div>`;
}

function buildSessionCard(session) {
  const date = liveSessionStore.formatDate(session.date);
  const time = liveSessionStore.formatTime(session.startTime);

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
        <button class="action-btn ${session.buttonClass || "details"}">${session.buttonText || "View Details"}</button>
      </div>
    </div>
  `;
}

function renderSessions(category) {
  const scheduledSessions = liveSessionStore.getSessionsByStatus("scheduled");
  const sessions =
    category === "scheduled"
      ? scheduledSessions.map((session) => ({
          ...session,
          statusText: "Scheduled",
          statusClass: "scheduled",
          buttonText: "View Details",
          buttonClass: "details",
        }))
      : liveSessionMockData[category] || [];
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
  const scheduledSessions = liveSessionStore.getSessionsByStatus("scheduled");
  if (scheduledCount)
    scheduledCount.textContent = String(scheduledSessions.length);
  if (ongoingCount)
    ongoingCount.textContent = String(liveSessionMockData.ongoing.length);
  if (attendedCount)
    attendedCount.textContent = String(liveSessionMockData.attended.length);
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
    tabs.forEach((item) => item.classList.remove("active"));
    tab.classList.add("active");
    currentSessionsPage = 1;
    renderSessions(tab.dataset.tab);
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

syncCounts();
renderSessions("scheduled");
