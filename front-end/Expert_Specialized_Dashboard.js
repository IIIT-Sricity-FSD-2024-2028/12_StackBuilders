const expertAuthStore = window.expertAuthStore || null;
const consultationStore = window.consultationStore || null;
const liveSessionStore = window.liveSessionStore || null;
const wellnessCheckinStore = window.wellnessCheckinStore || null;
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
const wellnessPermissionGroup = "wellness-expert";
const canReadWellnessReports =
  rolePermissionsStore?.hasPermission(wellnessPermissionGroup, "reports-read") ?? true;
const canReadWellnessConsultations =
  rolePermissionsStore?.hasPermission(wellnessPermissionGroup, "user-management-read") ?? true;
const canReadWellnessClientFeatures =
  rolePermissionsStore?.hasPermission(wellnessPermissionGroup, "client-management-read") ?? true;
const expertTrack = document.body.dataset.expertTrack || "";
const trackConfig = wellnessCheckinStore.getTrackConfig(expertTrack);
const expectedDashboardRoute =
  expertAuthStore?.getExpertDashboardRoute?.(currentExpert) || "Wellness_Dashboard.html";
const currentDashboardPage = window.location.pathname.split("/").pop() || "";

if (
  expectedDashboardRoute &&
  expectedDashboardRoute !== "Wellness_Dashboard.html" &&
  currentDashboardPage !== expectedDashboardRoute
) {
  window.location.replace(expectedDashboardRoute);
}

rolePermissionsStore?.watchPermissions(wellnessPermissionGroup);
rolePermissionsStore?.guardPageAccess({
  group: wellnessPermissionGroup,
  anyOf: ["reports-read", "user-management-read", "client-management-read"],
  title: "Wellness dashboard access is disabled",
  message:
    "Ask the admin to enable reports, employee check-in, or company access for wellness experts before opening this dashboard.",
});

const wellnessWelcomeMessage = document.getElementById("wellnessWelcomeMessage");
const dashboardEyebrow = document.getElementById("dashboardEyebrow");
const dashboardTitle = document.getElementById("dashboardTitle");
const dashboardSubtitle = document.getElementById("dashboardSubtitle");
const dashboardScheduleNote = document.getElementById("dashboardScheduleNote");
const checkinCountValue = document.getElementById("checkinCountValue");
const followupCountValue = document.getElementById("followupCountValue");
const consultationCountValue = document.getElementById("consultationCountValue");
const liveSessionCountValue = document.getElementById("liveSessionCountValue");
const priorityCheckinsList = document.getElementById("priorityCheckinsList");
const employeeLatestCheckins = document.getElementById("employeeLatestCheckins");
const expertCheckinActivityBody = document.getElementById("expertCheckinActivityBody");
const navEmployeeCheckins = document.getElementById("navEmployeeCheckins");
const employeeCheckinsSection = document.getElementById("employeeCheckinsSection");
const statsGrid = document.querySelector(".stats-grid");
const priorityPanel = priorityCheckinsList?.closest(".panel") || null;
const latestPanel = employeeLatestCheckins?.closest(".panel") || null;
const activityPanel = expertCheckinActivityBody?.closest(".panel") || null;
const profileNavIcon = document.getElementById("profileNavIcon");
const profileOverlay = document.getElementById("profileOverlay");
const profileDrawerBackBtn = document.getElementById("profileDrawerBackBtn");

rolePermissionsStore?.setElementHidden(statsGrid, !canReadWellnessReports);
rolePermissionsStore?.setElementHidden(priorityPanel, !canReadWellnessConsultations);
rolePermissionsStore?.setElementHidden(latestPanel, !canReadWellnessConsultations);
rolePermissionsStore?.setElementHidden(activityPanel, !canReadWellnessConsultations);

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

function getInitials(name) {
  return String(name || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function buildSummary(record) {
  return (trackConfig?.fields || [])
    .slice(0, 3)
    .map((field) => {
      if (!record[field.name]) {
        return "";
      }

      return `${field.label}: ${wellnessCheckinStore.formatFieldValue(field, record[field.name])}`;
    })
    .filter(Boolean)
    .join(" | ");
}

function buildMetricChips(record, limit = 4) {
  return (trackConfig?.fields || [])
    .slice(0, limit)
    .map((field) => {
      const value = record[field.name];
      if (!value) {
        return "";
      }

      return `<span class="metric-chip">${escapeHtml(field.label)}: ${escapeHtml(
        wellnessCheckinStore.formatFieldValue(field, value)
      )}</span>`;
    })
    .filter(Boolean)
    .join("");
}

function buildPriorityCard(record) {
  const urgency = wellnessCheckinStore.getCheckinUrgency(record);

  return `
    <article class="priority-card ${escapeHtml(urgency.level)}">
      <div class="card-head">
        <div class="person-block">
          <div class="avatar">${escapeHtml(getInitials(record.employeeName))}</div>
          <div>
            <h3>${escapeHtml(record.employeeName)}</h3>
            <p>${escapeHtml(wellnessCheckinStore.formatDateTime(record.submittedAt))}</p>
          </div>
        </div>
        <span class="urgency-pill ${escapeHtml(urgency.level)}">${escapeHtml(
          urgency.label
        )}</span>
      </div>
      <p class="card-copy">${escapeHtml(urgency.reason)}</p>
      <div class="metric-chips">${buildMetricChips(record, 4)}</div>
      <div class="notes-block">${escapeHtml(
        record.notes || "No additional notes shared."
      )}</div>
    </article>
  `;
}

function buildLatestCard(record) {
  const urgency = wellnessCheckinStore.getCheckinUrgency(record);

  return `
    <article class="latest-card">
      <div class="card-head">
        <div class="person-block">
          <div class="avatar">${escapeHtml(getInitials(record.employeeName))}</div>
          <div>
            <h3>${escapeHtml(record.employeeName)}</h3>
            <p>${escapeHtml(buildSummary(record))}</p>
          </div>
        </div>
        <span class="urgency-pill ${escapeHtml(urgency.level)}">${escapeHtml(
          urgency.label
        )}</span>
      </div>
      <div class="metric-chips">${buildMetricChips(record, trackConfig.fields.length)}</div>
      <div class="notes-block">${escapeHtml(
        record.notes || "No additional notes shared."
      )}</div>
      <a class="view-all" href="Expert_Employee_Checkins.html?checkinId=${encodeURIComponent(
        record.id
      )}">Open Details <span>&gt;</span></a>
    </article>
  `;
}

function renderStats(checkins, latestEntries) {
  const followups = latestEntries.filter((record) => {
    const urgency = wellnessCheckinStore.getCheckinUrgency(record);
    return urgency.level !== "stable";
  });
  const upcomingConsultations =
    consultationStore?.getCurrentExpertUpcomingConsultations?.() || [];
  const upcomingLiveSessions =
    liveSessionStore?.getUpcomingSessions?.({
      expertId: currentExpert?.id,
      companyId: currentExpertCompanyContext.companyId,
      companyName: currentExpertCompanyContext.companyName,
    }) || [];

  if (checkinCountValue) {
    checkinCountValue.textContent = String(checkins.length);
  }

  if (followupCountValue) {
    followupCountValue.textContent = String(followups.length);
  }

  if (consultationCountValue) {
    consultationCountValue.textContent = String(upcomingConsultations.length);
  }

  if (liveSessionCountValue) {
    liveSessionCountValue.textContent = String(upcomingLiveSessions.length);
  }
}

function renderPriorityQueue(latestEntries) {
  if (!priorityCheckinsList) {
    return;
  }

  const prioritizedEntries = latestEntries.filter((record) => {
    const urgency = wellnessCheckinStore.getCheckinUrgency(record);
    return urgency.level !== "stable";
  });

  if (!prioritizedEntries.length) {
    priorityCheckinsList.innerHTML = `
      <div class="empty-panel">
        No employees currently need immediate follow-up based on the latest
        ${escapeHtml(trackConfig.label.toLowerCase())} submissions.
      </div>
    `;
    return;
  }

  priorityCheckinsList.innerHTML = prioritizedEntries
    .slice(0, 6)
    .map(buildPriorityCard)
    .join("");
}

function renderLatestCheckins(latestEntries) {
  if (!employeeLatestCheckins) {
    return;
  }

  if (!latestEntries.length) {
    employeeLatestCheckins.innerHTML = `
      <div class="empty-panel">
        No employee ${escapeHtml(trackConfig.label.toLowerCase())} updates are available yet.
      </div>
    `;
    return;
  }

  employeeLatestCheckins.innerHTML = latestEntries.map(buildLatestCard).join("");
}

function renderActivityTable(checkins) {
  if (!expertCheckinActivityBody) {
    return;
  }

  if (!checkins.length) {
    expertCheckinActivityBody.innerHTML = `
      <tr>
        <td colspan="4">
          <div class="activity-empty">
            No check-in activity available yet for this dashboard.
          </div>
        </td>
      </tr>
    `;
    return;
  }

  expertCheckinActivityBody.innerHTML = checkins
    .slice(0, 12)
    .map((record) => {
      const urgency = wellnessCheckinStore.getCheckinUrgency(record);
      return `
        <tr>
          <td class="employee-cell">
            <strong>${escapeHtml(record.employeeName)}</strong>
            <span>${escapeHtml(getInitials(record.employeeName))}</span>
          </td>
          <td>${escapeHtml(wellnessCheckinStore.formatDateTime(record.submittedAt))}</td>
          <td>${escapeHtml(buildSummary(record) || "Details submitted.")}</td>
          <td>${escapeHtml(urgency.label)}</td>
        </tr>
      `;
    })
    .join("");
}

function renderDashboard() {
  if (!trackConfig) {
    window.location.replace("Wellness_Dashboard.html");
    return;
  }

  const allCheckins = wellnessCheckinStore.getCheckinsForExpert(currentExpert);
  const latestEntries = wellnessCheckinStore.getLatestCheckinsForExpert(currentExpert);

  if (wellnessWelcomeMessage) {
    wellnessWelcomeMessage.textContent = `Welcome back, ${currentExpertFirstName}!`;
  }

  if (dashboardEyebrow) {
    dashboardEyebrow.textContent = trackConfig.expertLabel;
  }

  if (dashboardTitle) {
    dashboardTitle.textContent = trackConfig.dashboardTitle;
  }

  if (dashboardSubtitle) {
    dashboardSubtitle.textContent = trackConfig.dashboardSubtitle;
  }

  if (dashboardScheduleNote) {
    dashboardScheduleNote.textContent = trackConfig.schedule;
  }

  renderStats(allCheckins, latestEntries);
  renderPriorityQueue(latestEntries);
  renderLatestCheckins(latestEntries);
  renderActivityTable(allCheckins);
}

async function syncSpecializedDashboardDataFromBackend() {
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

  if (!tasks.length) {
    return;
  }

  await Promise.allSettled(tasks);
  renderDashboard();
}

function openProfileOverlay() {
  if (!profileOverlay) {
    return;
  }

  profileOverlay.hidden = false;
  document.body.classList.add("profile-open");
}

function closeProfileOverlay() {
  if (!profileOverlay) {
    return;
  }

  profileOverlay.hidden = true;
  document.body.classList.remove("profile-open");
}

[
  ["navHome", expectedDashboardRoute],
  ["navConsultation", "Wellness_Consultation_Dashboard.html"],
  ["navLiveSession", "Expert_Live_Session.html"],
  ["navVideoLibrary", "Expert_Video_Library.html"],
  ["navEmployeeCheckins", "Expert_Employee_Checkins.html"],
].forEach(([id, route]) => {
  const link = document.getElementById(id);
  if (!link) {
    return;
  }

  link.addEventListener("click", (event) => {
    event.preventDefault();
    window.location.href = route;
  });
});

rolePermissionsStore?.restrictElement(
  document.getElementById("navConsultation"),
  canReadWellnessConsultations
);
rolePermissionsStore?.restrictElement(
  navEmployeeCheckins,
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

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeProfileOverlay();
  }
});

window.addEventListener("storage", (event) => {
  if (
    event.key &&
    event.key !== wellnessCheckinStore.STORAGE_KEY &&
    event.key !== "stackbuilders.consultations.v1" &&
    event.key !== "stackbuilders.liveSessions.v1" &&
    event.key !== expertAuthStore?.EXPERT_STORAGE_KEY
  ) {
    return;
  }

  renderDashboard();
});

renderDashboard();
void syncSpecializedDashboardDataFromBackend();
