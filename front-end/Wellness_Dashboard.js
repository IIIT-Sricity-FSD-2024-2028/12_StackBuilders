const expertAuthStore = window.expertAuthStore || null;
const consultationStore = window.consultationStore || null;
const liveSessionStore = window.liveSessionStore || null;
const rolePermissionsStore = window.rolePermissionsStore || null;
const wellnessCheckinStore = window.wellnessCheckinStore || null;
const checkinResponseStore = window.checkinResponseStore || null;
const videoLibraryStore = window.videoLibraryStore || null;
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
const expertHomeRoute = "Wellness_Dashboard.html";
const expertTrack = expertAuthStore?.getExpertTrack?.(currentExpert) || "";
const expertTrackConfig = wellnessCheckinStore?.getTrackConfig?.(expertTrack) || null;
const dashboardVideoCategoryConfig = {
  nutrition: {
    category: "Health Related",
    title: "Nutrition Video Library",
    subtitle: "Videos on nutrition, sleep, recovery, and healthy daily habits.",
    tag: "Nutrition",
    tagClass: "green-tag",
  },
  mental: {
    category: "Mind Relaxation",
    title: "Psychology Video Library",
    subtitle: "Videos on mindfulness, stress relief, breathing, and emotional reset.",
    tag: "Mind Relaxation",
    tagClass: "purple-tag",
  },
  physical: {
    category: "Physical Wellness",
    title: "Physical Wellness Video Library",
    subtitle: "Videos on movement, mobility, stretching, and fitness routines.",
    tag: "Physical Wellness",
    tagClass: "red",
  },
};
const currentDashboardVideoConfig = dashboardVideoCategoryConfig[expertTrack] || null;
const wellnessPermissionGroup = "wellness-expert";
const canReadWellnessReports =
  rolePermissionsStore?.hasPermission(wellnessPermissionGroup, "reports-read") ?? true;
const canReadWellnessConsultations =
  rolePermissionsStore?.hasPermission(wellnessPermissionGroup, "user-management-read") ?? true;
const canReadWellnessClientFeatures =
  rolePermissionsStore?.hasPermission(wellnessPermissionGroup, "client-management-read") ?? true;

const wellnessDashboardRoutes = {
  navHome: expertHomeRoute,
  navConsultation: "Wellness_Consultation_Dashboard.html",
  navEmployeeCheckins: "Expert_Employee_Checkins.html",
  navLiveSession: "Expert_Live_Session.html",
  navVideoLibrary: "Expert_Video_Library.html",
  employeeCheckinsAction: "Expert_Employee_Checkins.html",
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
const statsGrid = document.querySelector(".stats-grid");
const upcomingConsultationsPanel =
  document.getElementById("upcomingConsultationsCards")?.closest(".panel") || null;
const upcomingLiveSessionsPanel =
  document.getElementById("upcomingLiveSessionsCards")?.closest(".panel") || null;
const videoLibraryPanel = document.getElementById("viewvideolibrary")?.closest(".panel") || null;
const dashboardVideoLibraryTitle = document.getElementById("dashboardVideoLibraryTitle");
const dashboardVideoLibrarySubtitle = document.getElementById("dashboardVideoLibrarySubtitle");
const dashboardVideoLibraryCards = document.getElementById("dashboardVideoLibraryCards");
const dashboardVideoLibraryCount = document.getElementById("dashboardVideoLibraryCount");
const employeeCheckinsTitle = document.getElementById("employeeCheckinsTitle");
const employeeCheckinsSubtitle = document.getElementById("employeeCheckinsSubtitle");
const employeeCheckinsCards = document.getElementById("employeeCheckinsCards");
const employeeCheckinsPanel = employeeCheckinsCards?.closest(".panel") || null;

rolePermissionsStore?.watchPermissions(wellnessPermissionGroup);
rolePermissionsStore?.guardPageAccess({
  group: wellnessPermissionGroup,
  anyOf: ["reports-read", "user-management-read", "client-management-read"],
  title: "Wellness dashboard access is disabled",
  message:
    "Ask the admin to enable reports, consultation, or company access for wellness experts before opening this dashboard.",
});
rolePermissionsStore?.setElementHidden(statsGrid, !canReadWellnessReports);
rolePermissionsStore?.setElementHidden(upcomingConsultationsPanel, !canReadWellnessConsultations);
rolePermissionsStore?.setElementHidden(employeeCheckinsPanel, !canReadWellnessConsultations);
rolePermissionsStore?.setElementHidden(upcomingLiveSessionsPanel, !canReadWellnessClientFeatures);
rolePermissionsStore?.setElementHidden(videoLibraryPanel, !canReadWellnessClientFeatures);

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

function getCheckinStatusClass(level) {
  if (level === "high") {
    return "red";
  }

  if (level === "medium") {
    return "amber";
  }

  return "green";
}

function getDashboardCheckinSubtitle(record) {
  const urgency = wellnessCheckinStore?.getCheckinUrgency?.(record) || {
    level: "stable",
  };
  const openConsultation =
    consultationStore?.getLatestOpenConsultationForExpertEmployee?.({
      employeeId: record.employeeId,
      expertId: currentExpert?.id,
      companyId: currentExpertCompanyContext.companyId,
      companyName: currentExpertCompanyContext.companyName,
    }) || null;
  const latestResponse =
    checkinResponseStore?.getLatestResponseByCheckinId?.(record.id, currentExpertCompanyContext) ||
    null;

  if (openConsultation) {
    return "Follow-up consultation available.";
  }

  if (latestResponse) {
    return `Suggestion sent on ${wellnessCheckinStore.formatDateTime(latestResponse.createdAt)}.`;
  }

  if (urgency.level === "high") {
    return "Priority review recommended.";
  }

  return "Open the full check-in to review details and send suggestions.";
}

function buildEmployeeCheckinCard(record) {
  const urgency = wellnessCheckinStore.getCheckinUrgency(record);
  const detailItems = (expertTrackConfig?.fields || [])
    .slice(0, 4)
    .map((field) => {
      const value = record[field.name];
      if (!value) {
        return "";
      }

      return `<li>${escapeHtml(field.label)}: ${escapeHtml(
        wellnessCheckinStore.formatFieldValue(field, value)
      )}</li>`;
    })
    .filter(Boolean)
    .join("");
  const note = record.notes ? escapeHtml(record.notes) : "";

  return `
    <article class="mini-card dashboard-checkin-card">
      <div class="mini-header">
        <div class="person">
          <div class="avatar dashboard-consultation-avatar">${consultationStore.getInitials(
            record.employeeName
          )}</div>
          <div>
            <h3>${escapeHtml(record.employeeName)}</h3>
            <span>${escapeHtml(
              wellnessCheckinStore.formatDateTime(record.submittedAt)
            )}</span>
          </div>
        </div>
        <span class="status ${getCheckinStatusClass(urgency.level)}">${escapeHtml(
          urgency.label
        )}</span>
      </div>
      <p class="dashboard-checkin-subtitle">${escapeHtml(getDashboardCheckinSubtitle(record))}</p>
      <ul class="meta">
        ${
          detailItems ||
          `<li>${escapeHtml(
            expertTrackConfig?.label || "Employee check-in"
          )} details were submitted.</li>`
        }
      </ul>
      ${note ? `<p class="dashboard-checkin-note">${note}</p>` : ""}
      <div class="action-row dashboard-checkin-actions">
        <button
          class="primary-btn"
          type="button"
          data-checkin-action="open-details"
          data-checkin-id="${escapeHtml(record.id)}"
        >View Details</button>
        <a class="ghost-btn" href="Wellness_Consultation_Dashboard.html">Consultations</a>
      </div>
    </article>
  `;
}

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

function readDashboardVideoLibraryVideos() {
  if (!currentDashboardVideoConfig) {
    return [];
  }

  return (
    (videoLibraryStore?.readVideos?.(currentExpertCompanyContext) || []).filter(
      (video) => video.category === currentDashboardVideoConfig.category
    )
  );
}

function buildDashboardVideoCard(video) {
  const safeTitle = escapeHtml(video.title || "Wellness Video");
  const safeDescription = escapeHtml(video.description || currentDashboardVideoConfig?.subtitle || "");
  const safeDuration = escapeHtml(video.duration || "00:00");
  const safeVideoLink = escapeHtml(video.videoLink || "Expert_Video_Library.html");
  const safeThumbnailLink = escapeHtml(
    video.thumbnailLink ||
      "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=900&q=80"
  );
  const safeTag = escapeHtml(currentDashboardVideoConfig?.tag || video.category || "Video");
  const safeTagClass = escapeHtml(currentDashboardVideoConfig?.tagClass || "green-tag");
  const safeUploader = escapeHtml(video.creatorExpertName || "Wellness Expert");

  return `
    <a class="video-card dashboard-video-card" href="${safeVideoLink}" target="_blank" rel="noopener noreferrer">
      <div class="video-thumb">
        <img src="${safeThumbnailLink}" alt="${safeTitle}" />
        <span class="video-tag ${safeTagClass}">${safeTag}</span>
        <span class="video-time">${safeDuration}</span>
        <span class="play-chip" aria-hidden="true">▶</span>
      </div>
      <div class="video-copy">
        <h4>${safeTitle}</h4>
        <span class="video-uploader-tag">Uploaded by ${safeUploader}</span>
        <p>${safeDescription}</p>
      </div>
    </a>
  `;
}

function renderDashboardVideoLibrary() {
  if (!dashboardVideoLibraryCards) {
    return;
  }

  if (!currentDashboardVideoConfig) {
    dashboardVideoLibraryCards.innerHTML = buildWellnessDashboardEmptyState(
      "No video category is mapped for this wellness expert yet."
    );

    if (dashboardVideoLibraryCount) {
      dashboardVideoLibraryCount.textContent = "0";
    }
    return;
  }

  if (dashboardVideoLibraryTitle) {
    dashboardVideoLibraryTitle.textContent = currentDashboardVideoConfig.title;
  }

  if (dashboardVideoLibrarySubtitle) {
    dashboardVideoLibrarySubtitle.textContent = currentDashboardVideoConfig.subtitle;
  }

  const videos = readDashboardVideoLibraryVideos();

  if (dashboardVideoLibraryCount) {
    dashboardVideoLibraryCount.textContent = String(videos.length);
  }

  dashboardVideoLibraryCards.innerHTML = videos.length
    ? videos.slice(0, 3).map(buildDashboardVideoCard).join("")
    : buildWellnessDashboardEmptyState(
        `No ${currentDashboardVideoConfig.tag.toLowerCase()} videos are available yet.`
      );
}

async function syncWellnessDashboardDataFromBackend() {
  const tasks = [];

  if (consultationStore?.syncConsultationsFromBackend) {
    tasks.push(consultationStore.syncConsultationsFromBackend(currentExpertCompanyContext));
  }

  if (liveSessionStore?.syncLiveSessionsFromBackend) {
    tasks.push(liveSessionStore.syncLiveSessionsFromBackend(currentExpertCompanyContext));
  }

  if (wellnessCheckinStore?.syncCheckinsFromBackend) {
    tasks.push(wellnessCheckinStore.syncCheckinsFromBackend(currentExpertCompanyContext));
  }

  if (checkinResponseStore?.syncResponsesFromBackend) {
    tasks.push(checkinResponseStore.syncResponsesFromBackend(currentExpertCompanyContext));
  }

  if (videoLibraryStore?.syncVideosFromBackend) {
    tasks.push(videoLibraryStore.syncVideosFromBackend(currentExpertCompanyContext));
  }

  if (!tasks.length) {
    return;
  }

  await Promise.allSettled(tasks);
  renderUpcomingConsultations();
  renderUpcomingLiveSessions();
  renderEmployeeCheckins();
  renderDashboardVideoLibrary();
}

function renderEmployeeCheckins() {
  if (!employeeCheckinsCards) {
    return;
  }

  if (!expertTrackConfig || !wellnessCheckinStore) {
    employeeCheckinsCards.innerHTML = buildWellnessDashboardEmptyState(
      "No employee check-in category is mapped for this wellness expert yet."
    );
    return;
  }

  if (employeeCheckinsTitle) {
    employeeCheckinsTitle.textContent = `${expertTrackConfig.label} Check-ins`;
  }

  if (employeeCheckinsSubtitle) {
    employeeCheckinsSubtitle.textContent = `Latest employee ${expertTrackConfig.label.toLowerCase()} details shared from time to time with the ${expertTrackConfig.expertLabel.toLowerCase()}.`;
  }

  const latestCheckins = (
    wellnessCheckinStore.getLatestCheckinsForExpert?.(currentExpert) || []
  ).slice(0, 3);

  employeeCheckinsCards.innerHTML = latestCheckins.length
    ? latestCheckins.map(buildEmployeeCheckinCard).join("")
    : buildWellnessDashboardEmptyState(
        `No ${expertTrackConfig.label.toLowerCase()} employee check-ins have been submitted yet.`
      );
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
  const date = consultationStore.formatScheduleDate(consultation.sessionDate);
  const time = consultationStore.formatScheduleTime(consultation.sessionTime);

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
        <span class="status green">Scheduled</span>
      </div>
      <ul class="meta">
        <li>${date || "Date to be scheduled"}</li>
        <li>${time ? `${time} (${consultation.sessionDuration})` : "Time to be scheduled"}</li>
        <li>${consultation.sessionTitle || `${consultation.category} Consultation`}</li>
      </ul>
      <button
        class="primary-btn dashboard-consultation-btn"
        type="button"
        data-consultation-id="${consultation.id}"
      >Open Session</button>
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

  const sessions = liveSessionStore.getUpcomingSessions({
    expertId: currentExpert?.id,
    companyId: currentExpertCompanyContext.companyId,
    companyName: currentExpertCompanyContext.companyName,
  });
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

rolePermissionsStore?.restrictElement(
  document.getElementById("navConsultation"),
  canReadWellnessConsultations
);
rolePermissionsStore?.restrictElement(
  document.getElementById("navEmployeeCheckins"),
  canReadWellnessConsultations
);
rolePermissionsStore?.restrictElement(
  document.getElementById("employeeCheckinsAction"),
  canReadWellnessConsultations
);
rolePermissionsStore?.restrictElement(
  document.getElementById("viewupcomingConsultations"),
  canReadWellnessConsultations
);
rolePermissionsStore?.restrictElement(
  document.getElementById("navLiveSession"),
  canReadWellnessClientFeatures
);
rolePermissionsStore?.restrictElement(
  document.getElementById("navVideoLibrary"),
  canReadWellnessClientFeatures
);
rolePermissionsStore?.restrictElement(
  document.getElementById("viewupcomingLive"),
  canReadWellnessClientFeatures
);
rolePermissionsStore?.restrictElement(
  document.getElementById("viewvideolibrary"),
  canReadWellnessClientFeatures
);

const upcomingConsultationsCards = document.getElementById("upcomingConsultationsCards");
if (upcomingConsultationsCards) {
  upcomingConsultationsCards.addEventListener("click", (event) => {
    const button = event.target.closest("[data-consultation-id]");
    if (!button) return;

    const consultation = consultationStore.getConsultationById(
      button.getAttribute("data-consultation-id"),
      currentExpertCompanyContext
    );
    if (!consultation) return;

    if (consultation.sessionMeetingLink) {
      window.open(consultation.sessionMeetingLink, "_blank", "noopener,noreferrer");
      return;
    }

    window.location.href = `Create_New_Consultation.html?consultationId=${encodeURIComponent(
      consultation.id
    )}`;
  });
}

if (employeeCheckinsCards) {
  employeeCheckinsCards.addEventListener("click", (event) => {
    const actionButton = event.target.closest("[data-checkin-action='open-details']");
    if (!actionButton) {
      return;
    }

    const checkinId = actionButton.getAttribute("data-checkin-id") || "";
    window.location.href = `Expert_Employee_Checkins.html?checkinId=${encodeURIComponent(
      checkinId
    )}`;
  });
}

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
    event.key !== "stackbuilders.liveSessions.v1" &&
    event.key !== wellnessCheckinStore?.STORAGE_KEY &&
    event.key !== checkinResponseStore?.STORAGE_KEY &&
    event.key !== "stackbuilders.videoLibrary.v1"
  ) {
    return;
  }

  renderUpcomingConsultations();
  renderUpcomingLiveSessions();
  renderEmployeeCheckins();
  renderDashboardVideoLibrary();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeProfileOverlay();
});

renderUpcomingConsultations();
renderUpcomingLiveSessions();
renderEmployeeCheckins();
renderDashboardVideoLibrary();
void syncWellnessDashboardDataFromBackend();
