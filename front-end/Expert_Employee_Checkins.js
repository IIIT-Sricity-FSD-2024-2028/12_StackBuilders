const expertAuthStore = window.expertAuthStore || null;
const consultationStore = window.consultationStore || null;
const wellnessCheckinStore = window.wellnessCheckinStore || null;
const checkinResponseStore = window.checkinResponseStore || null;
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
const canReadWellnessConsultations =
  rolePermissionsStore?.hasPermission(wellnessPermissionGroup, "user-management-read") ?? true;
const canUpdateWellnessConsultations =
  rolePermissionsStore?.hasPermission(wellnessPermissionGroup, "user-management-update") ?? true;
const canReadWellnessClientFeatures =
  rolePermissionsStore?.hasPermission(wellnessPermissionGroup, "client-management-read") ?? true;
const expertHomeRoute =
  expertAuthStore?.getExpertDashboardRoute?.(currentExpert) || "Wellness_Dashboard.html";
const expertTrack = expertAuthStore?.getExpertTrack?.(currentExpert) || "";
const expertTrackConfig = wellnessCheckinStore?.getTrackConfig?.(expertTrack) || null;

const employeeCheckinsRoutes = {
  navHome: expertHomeRoute,
  navConsultation: "Wellness_Consultation_Dashboard.html",
  navEmployeeCheckins: "Expert_Employee_Checkins.html",
  navLiveSession: "Expert_Live_Session.html",
  navVideoLibrary: "Expert_Video_Library.html",
};

const CHECKINS_PER_PAGE = 6;
const pageSearchParams = new URLSearchParams(window.location.search);
let selectedCheckinIdFromUrl = pageSearchParams.get("checkinId") || "";
let allCheckinsPage = 1;
let activeCheckinId = "";

const wellnessWelcomeMessage = document.getElementById("wellnessWelcomeMessage");
const employeeCheckinsPageTitle = document.getElementById("employeeCheckinsPageTitle");
const employeeCheckinsPageSubtitle = document.getElementById("employeeCheckinsPageSubtitle");
const employeeCheckinsSchedule = document.getElementById("employeeCheckinsSchedule");
const totalCheckinsCount = document.getElementById("totalCheckinsCount");
const highPriorityCheckinsCount = document.getElementById("highPriorityCheckinsCount");
const trackedEmployeesCount = document.getElementById("trackedEmployeesCount");
const highPriorityCheckinsCards = document.getElementById("highPriorityCheckinsCards");
const allEmployeeCheckinsCards = document.getElementById("allEmployeeCheckinsCards");
const allEmployeeCheckinsPager = document.getElementById("allEmployeeCheckinsPager");
const allEmployeeCheckinsPrevBtn = document.getElementById("allEmployeeCheckinsPrevBtn");
const allEmployeeCheckinsNextBtn = document.getElementById("allEmployeeCheckinsNextBtn");
const allEmployeeCheckinsPageNumber = document.getElementById("allEmployeeCheckinsPageNumber");
const checkinDetailOverlay = document.getElementById("checkinDetailOverlay");
const checkinDetailCloseBtn = document.getElementById("checkinDetailCloseBtn");
const checkinDetailAvatar = document.getElementById("checkinDetailAvatar");
const checkinDetailEyebrow = document.getElementById("checkinDetailEyebrow");
const checkinDetailTitle = document.getElementById("checkinDetailTitle");
const checkinDetailMeta = document.getElementById("checkinDetailMeta");
const checkinDetailPriority = document.getElementById("checkinDetailPriority");
const checkinDetailMetrics = document.getElementById("checkinDetailMetrics");
const checkinDetailNotes = document.getElementById("checkinDetailNotes");
const checkinDetailResponses = document.getElementById("checkinDetailResponses");
const checkinDetailReason = document.getElementById("checkinDetailReason");
const checkinDetailConsultationStatus = document.getElementById(
  "checkinDetailConsultationStatus"
);
const checkinDetailSuggestedAction = document.getElementById("checkinDetailSuggestedAction");
const checkinDetailConsultationBtn = document.getElementById("checkinDetailConsultationBtn");
const checkinDetailMessageHelper = document.getElementById("checkinDetailMessageHelper");
const checkinResponseForm = document.getElementById("checkinResponseForm");
const checkinResponseMessage = document.getElementById("checkinResponseMessage");
const checkinResponseStatus = document.getElementById("checkinResponseStatus");
const checkinResponseSubmitBtn = document.getElementById("checkinResponseSubmitBtn");
const profileNavIcon = document.getElementById("profileNavIcon");
const profileOverlay = document.getElementById("profileOverlay");
const profileDrawerBackBtn = document.getElementById("profileDrawerBackBtn");

rolePermissionsStore?.watchPermissions(wellnessPermissionGroup);
rolePermissionsStore?.guardPageAccess({
  group: wellnessPermissionGroup,
  anyOf: ["user-management-read"],
  title: "Employee check-in access is disabled",
  message:
    "Ask the admin to enable User Management read access for wellness experts before opening employee check-ins.",
});

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

function setCheckinQuery(checkinId) {
  selectedCheckinIdFromUrl = String(checkinId || "").trim();
  const url = new URL(window.location.href);

  if (selectedCheckinIdFromUrl) {
    url.searchParams.set("checkinId", selectedCheckinIdFromUrl);
  } else {
    url.searchParams.delete("checkinId");
  }

  window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
}

function setResponseStatus(message, options = {}) {
  if (!checkinResponseStatus) {
    return;
  }

  checkinResponseStatus.hidden = !message;
  checkinResponseStatus.textContent = message || "";
  checkinResponseStatus.classList.toggle("error", Boolean(options.isError));
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

function getCheckinById(checkinId) {
  const normalizedCheckinId = String(checkinId || "").trim();
  if (!normalizedCheckinId || !wellnessCheckinStore) {
    return null;
  }

  const record =
    wellnessCheckinStore.getCheckinById?.(
      normalizedCheckinId,
      currentExpertCompanyContext
    ) || null;

  if (!record) {
    return null;
  }

  const recordTrack = wellnessCheckinStore.normalizeTrackKey(record.checkinType);
  if (expertTrack && recordTrack !== expertTrack) {
    return null;
  }

  return record;
}

function getTrackConfigForRecord(record) {
  return wellnessCheckinStore?.getTrackConfig?.(record?.checkinType) || expertTrackConfig;
}

function getOpenConsultationForRecord(record) {
  if (!record || !consultationStore || !currentExpert) {
    return null;
  }

  return (
    consultationStore.getLatestOpenConsultationForExpertEmployee?.({
      employeeId: record.employeeId,
      expertId: currentExpert.id,
      companyId: currentExpertCompanyContext.companyId,
      companyName: currentExpertCompanyContext.companyName,
    }) || null
  );
}

function getLatestResponseForRecord(record) {
  if (!record || !checkinResponseStore) {
    return null;
  }

  return (
    checkinResponseStore.getLatestResponseByCheckinId?.(
      record.id,
      currentExpertCompanyContext
    ) || null
  );
}

function buildMetricMarkup(record, options = {}) {
  const config = getTrackConfigForRecord(record);
  const limit = Number.isFinite(options.limit) ? options.limit : 4;
  const metricItems = (config?.fields || [])
    .map((field) => {
      const value = record[field.name];
      if (!value) {
        return "";
      }

      return `
        <div class="${escapeHtml(options.className || "employee-checkin-metric")}">
          <span class="${escapeHtml(options.labelClass || "employee-checkin-metric-label")}">${escapeHtml(
            field.label
          )}</span>
          <strong class="${escapeHtml(options.valueClass || "employee-checkin-metric-value")}">${escapeHtml(
            wellnessCheckinStore.formatFieldValue(field, value)
          )}</strong>
        </div>
      `;
    })
    .filter(Boolean);

  if (!metricItems.length) {
    const fallbackClass = escapeHtml(options.className || "employee-checkin-metric");

    return `
      <div class="${fallbackClass}">
        <span class="${escapeHtml(options.labelClass || "employee-checkin-metric-label")}">Update</span>
        <strong class="${escapeHtml(options.valueClass || "employee-checkin-metric-value")}">Employee check-in submitted</strong>
      </div>
    `;
  }

  return metricItems.slice(0, limit).join("");
}

function getCardSubtitle(record) {
  const urgency = wellnessCheckinStore.getCheckinUrgency(record);
  const openConsultation = getOpenConsultationForRecord(record);
  const latestResponse = getLatestResponseForRecord(record);

  if (openConsultation) {
    return "Follow-up consultation is already available for this employee.";
  }

  if (latestResponse) {
    return `Suggestion shared on ${wellnessCheckinStore.formatDateTime(latestResponse.createdAt)}.`;
  }

  if (urgency.level === "high") {
    return "Priority review recommended before the next workday.";
  }

  return "Open details to review the full submission and send suggestions.";
}

function getCardActionLabel(record) {
  const urgency = wellnessCheckinStore.getCheckinUrgency(record);
  const latestResponse = getLatestResponseForRecord(record);

  if (urgency.level === "high") {
    return "Respond Now";
  }

  if (latestResponse) {
    return "View Details";
  }

  return "Send Suggestion";
}

function buildCheckinCard(record) {
  const urgency = wellnessCheckinStore.getCheckinUrgency(record);
  const note = record.notes ? escapeHtml(record.notes) : "";

  return `
    <article class="mini-card employee-checkin-card" tabindex="0" data-checkin-id="${escapeHtml(
      record.id
    )}">
      <div class="mini-header">
        <div class="person">
          <div class="avatar dashboard-consultation-avatar">${consultationStore?.getInitials?.(
            record.employeeName
          ) || "EE"}</div>
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
      <div class="employee-checkin-subtitle">${escapeHtml(getCardSubtitle(record))}</div>
      <div class="employee-checkin-metrics">
        ${buildMetricMarkup(record)}
      </div>
      ${
        note
          ? `<p class="employee-checkin-summary"><strong>Notes:</strong> ${note}</p>`
          : ""
      }
      <div class="action-row employee-checkin-actions">
        <button
          class="primary-btn"
          type="button"
          data-checkin-action="open-details"
          data-checkin-id="${escapeHtml(record.id)}"
        >${escapeHtml(getCardActionLabel(record))}</button>
        <a class="ghost-btn" href="Wellness_Consultation_Dashboard.html">Consultations</a>
      </div>
    </article>
  `;
}

function buildEmptyState(message) {
  return `
    <div class="consult-empty-state">
      <p>${escapeHtml(message)}</p>
    </div>
  `;
}

function getAllRelevantCheckins() {
  if (!wellnessCheckinStore || !currentExpert) {
    return [];
  }

  return wellnessCheckinStore.getCheckinsForExpert(currentExpert);
}

async function syncExpertCheckinDataFromBackend() {
  const tasks = [];

  if (wellnessCheckinStore?.syncCheckinsFromBackend) {
    tasks.push(wellnessCheckinStore.syncCheckinsFromBackend(currentExpertCompanyContext));
  }

  if (checkinResponseStore?.syncResponsesFromBackend) {
    tasks.push(checkinResponseStore.syncResponsesFromBackend(currentExpertCompanyContext));
  }

  if (consultationStore?.syncConsultationsFromBackend) {
    tasks.push(consultationStore.syncConsultationsFromBackend(currentExpertCompanyContext));
  }

  if (!tasks.length) {
    return;
  }

  await Promise.allSettled(tasks);
  renderEmployeeCheckinsPage();
}

function syncPageWithSelectedCheckin(allCheckins) {
  if (!selectedCheckinIdFromUrl) {
    return;
  }

  const checkinIndex = allCheckins.findIndex((record) => record.id === selectedCheckinIdFromUrl);
  if (checkinIndex === -1) {
    return;
  }

  allCheckinsPage = Math.floor(checkinIndex / CHECKINS_PER_PAGE) + 1;
}

function renderHeaderCopy() {
  if (wellnessWelcomeMessage) {
    wellnessWelcomeMessage.textContent = `Welcome back, ${currentExpertFirstName}!`;
  }

  if (employeeCheckinsPageTitle) {
    employeeCheckinsPageTitle.textContent = expertTrackConfig
      ? `${expertTrackConfig.label} Employee Check-ins`
      : "Employee Check-ins";
  }

  if (employeeCheckinsPageSubtitle) {
    employeeCheckinsPageSubtitle.textContent = expertTrackConfig
      ? `Review all ${expertTrackConfig.label.toLowerCase()} submissions your employees have entered over time.`
      : "Review employee wellness check-ins shared over time.";
  }

  if (employeeCheckinsSchedule) {
    employeeCheckinsSchedule.textContent = expertTrackConfig?.schedule
      ? `Employees should enter details: ${expertTrackConfig.schedule}`
      : "No check-in schedule is mapped for this expert specialization yet.";
  }
}

function renderStats(allCheckins) {
  const uniqueEmployeeCount = new Set(
    allCheckins.map((record) => record.employeeId || record.employeeName)
  ).size;
  const highPriorityCount = allCheckins.filter(
    (record) => wellnessCheckinStore.getCheckinUrgency(record).level === "high"
  ).length;

  if (totalCheckinsCount) {
    totalCheckinsCount.textContent = String(allCheckins.length);
  }

  if (highPriorityCheckinsCount) {
    highPriorityCheckinsCount.textContent = String(highPriorityCount);
  }

  if (trackedEmployeesCount) {
    trackedEmployeesCount.textContent = String(uniqueEmployeeCount);
  }
}

function renderHighPriorityCheckins(allCheckins) {
  if (!highPriorityCheckinsCards) {
    return;
  }

  const highPriorityCheckins = allCheckins.filter(
    (record) => wellnessCheckinStore.getCheckinUrgency(record).level === "high"
  );

  highPriorityCheckinsCards.innerHTML = highPriorityCheckins.length
    ? highPriorityCheckins.slice(0, 3).map(buildCheckinCard).join("")
    : buildEmptyState("No high-priority employee check-ins are waiting right now.");
}

function renderAllEmployeeCheckins(allCheckins) {
  if (!allEmployeeCheckinsCards) {
    return;
  }

  if (!allCheckins.length) {
    allEmployeeCheckinsCards.innerHTML = buildEmptyState(
      "No employee check-ins have been submitted yet for this specialization."
    );

    if (allEmployeeCheckinsPager) {
      allEmployeeCheckinsPager.hidden = true;
    }

    return;
  }

  const totalPages = Math.max(Math.ceil(allCheckins.length / CHECKINS_PER_PAGE), 1);
  allCheckinsPage = Math.min(allCheckinsPage, totalPages);
  const startIndex = (allCheckinsPage - 1) * CHECKINS_PER_PAGE;
  const visibleCheckins = allCheckins.slice(startIndex, startIndex + CHECKINS_PER_PAGE);

  allEmployeeCheckinsCards.innerHTML = visibleCheckins.map(buildCheckinCard).join("");

  if (allEmployeeCheckinsPager && allEmployeeCheckinsPrevBtn && allEmployeeCheckinsNextBtn) {
    const shouldShowPager = allCheckins.length > CHECKINS_PER_PAGE;
    allEmployeeCheckinsPager.hidden = !shouldShowPager;
    allEmployeeCheckinsPrevBtn.disabled = allCheckinsPage === 1;
    allEmployeeCheckinsNextBtn.disabled = allCheckinsPage === totalPages;

    if (allEmployeeCheckinsPageNumber) {
      allEmployeeCheckinsPageNumber.textContent = String(allCheckinsPage);
    }
  }
}

function buildResponsesMarkup(checkinId) {
  const responses =
    checkinResponseStore?.getResponsesByCheckinId?.(
      checkinId,
      currentExpertCompanyContext
    ) || [];

  if (!responses.length) {
    return `
      <div class="checkin-detail-empty">
        No expert suggestion messages have been sent for this check-in yet.
      </div>
    `;
  }

  return responses
    .map(
      (response) => `
        <article class="checkin-detail-response-card">
          <div class="checkin-detail-response-head">
            <strong>${escapeHtml(response.expertName)}</strong>
            <span>${escapeHtml(
              wellnessCheckinStore.formatDateTime(response.createdAt)
            )}</span>
          </div>
          <p>${escapeHtml(response.message)}</p>
        </article>
      `
    )
    .join("");
}

function getConsultationStatusText(record, openConsultation) {
  const urgency = wellnessCheckinStore.getCheckinUrgency(record);

  if (openConsultation) {
    return `Open ${openConsultation.status} follow-up consultation available.`;
  }

  if (urgency.level === "high") {
    return "No follow-up consultation has been created yet.";
  }

  return "A consultation is optional for this priority level.";
}

function getSuggestedActionText(record, openConsultation) {
  const urgency = wellnessCheckinStore.getCheckinUrgency(record);

  if (openConsultation) {
    return "Review the open consultation or send a suggestion message from here.";
  }

  if (urgency.level === "high") {
    return "Create a follow-up consultation and optionally send supportive guidance.";
  }

  return "Send a suggestion message first. Create a consultation later only if support is still needed.";
}

function renderCheckinDetail(checkinId, options = {}) {
  const record = getCheckinById(checkinId);
  if (!record || !checkinDetailOverlay) {
    return;
  }

  const config = getTrackConfigForRecord(record);
  const urgency = wellnessCheckinStore.getCheckinUrgency(record);
  const openConsultation = getOpenConsultationForRecord(record);
  const submittedLabel = wellnessCheckinStore.formatDateTime(record.submittedAt);
  const metaParts = [`Submitted ${submittedLabel}`];
  if (record.employeeEmail) {
    metaParts.push(record.employeeEmail);
  }

  activeCheckinId = record.id;
  setCheckinQuery(record.id);
  document.body.classList.add("checkin-detail-open");
  checkinDetailOverlay.hidden = false;

  if (checkinDetailAvatar) {
    checkinDetailAvatar.textContent =
      consultationStore?.getInitials?.(record.employeeName) || "EE";
  }

  if (checkinDetailEyebrow) {
    checkinDetailEyebrow.textContent = `${config?.label || "Wellness"} Check-in`;
  }

  if (checkinDetailTitle) {
    checkinDetailTitle.textContent = record.employeeName || "Employee";
  }

  if (checkinDetailMeta) {
    checkinDetailMeta.textContent = metaParts.join(" | ");
  }

  if (checkinDetailPriority) {
    checkinDetailPriority.className = `status ${getCheckinStatusClass(urgency.level)}`;
    checkinDetailPriority.textContent = urgency.label;
  }

  if (checkinDetailMetrics) {
    checkinDetailMetrics.innerHTML = buildMetricMarkup(record, {
      limit: Number.MAX_SAFE_INTEGER,
      className: "checkin-detail-metric",
      labelClass: "checkin-detail-metric-label",
      valueClass: "checkin-detail-metric-value",
    });
  }

  if (checkinDetailNotes) {
    checkinDetailNotes.textContent =
      record.notes || "No additional notes were shared with this check-in.";
  }

  if (checkinDetailResponses) {
    checkinDetailResponses.innerHTML = buildResponsesMarkup(record.id);
  }

  if (checkinDetailReason) {
    checkinDetailReason.textContent = urgency.reason;
  }

  if (checkinDetailConsultationStatus) {
    checkinDetailConsultationStatus.textContent = getConsultationStatusText(
      record,
      openConsultation
    );
  }

  if (checkinDetailSuggestedAction) {
    checkinDetailSuggestedAction.textContent = getSuggestedActionText(record, openConsultation);
  }

  if (checkinDetailMessageHelper) {
    if (!canUpdateWellnessConsultations) {
      checkinDetailMessageHelper.textContent =
        "Update access is disabled, so this page is read-only for responses and follow-up consultations.";
    } else {
      checkinDetailMessageHelper.textContent =
        urgency.level === "high"
          ? "This check-in is high priority. You can still send quick guidance here, but a follow-up consultation is recommended."
          : "Use this message to share practical suggestions without creating a consultation session.";
    }
  }

  if (checkinDetailConsultationBtn) {
    if (!canUpdateWellnessConsultations) {
      checkinDetailConsultationBtn.hidden = true;
      checkinDetailConsultationBtn.textContent = "";
    } else if (openConsultation) {
      checkinDetailConsultationBtn.hidden = false;
      checkinDetailConsultationBtn.textContent = "Open Follow-up Consultation";
    } else if (urgency.level === "high") {
      checkinDetailConsultationBtn.hidden = false;
      checkinDetailConsultationBtn.textContent = "Create Follow-up Consultation";
    } else {
      checkinDetailConsultationBtn.hidden = true;
      checkinDetailConsultationBtn.textContent = "";
    }
  }

  if (!options.keepMessage && checkinResponseMessage) {
    checkinResponseMessage.value = options.prefillMessage || "";
  }

  setResponseStatus(options.statusMessage || "", { isError: options.isError });
}

function closeCheckinDetail() {
  activeCheckinId = "";
  setCheckinQuery("");
  document.body.classList.remove("checkin-detail-open");

  if (checkinDetailOverlay) {
    checkinDetailOverlay.hidden = true;
  }

  if (checkinResponseMessage) {
    checkinResponseMessage.value = "";
  }

  setResponseStatus("");
}

function openCheckinDetail(checkinId, options = {}) {
  renderCheckinDetail(checkinId, options);
}

function renderEmployeeCheckinsPage() {
  renderHeaderCopy();

  if (!expertTrackConfig || !wellnessCheckinStore) {
    if (highPriorityCheckinsCards) {
      highPriorityCheckinsCards.innerHTML = buildEmptyState(
        "No employee check-in category is mapped for this wellness expert yet."
      );
    }

    if (allEmployeeCheckinsCards) {
      allEmployeeCheckinsCards.innerHTML = buildEmptyState(
        "No employee check-in category is mapped for this wellness expert yet."
      );
    }

    return;
  }

  const allCheckins = getAllRelevantCheckins();
  syncPageWithSelectedCheckin(allCheckins);
  renderStats(allCheckins);
  renderHighPriorityCheckins(allCheckins);
  renderAllEmployeeCheckins(allCheckins);

  if (activeCheckinId) {
    renderCheckinDetail(activeCheckinId, { keepMessage: true });
  } else if (selectedCheckinIdFromUrl) {
    const selectedRecord = getCheckinById(selectedCheckinIdFromUrl);
    if (selectedRecord) {
      renderCheckinDetail(selectedRecord.id);
    }
  }
}

async function handleFollowUpAction(checkinId) {
  const checkin = getCheckinById(checkinId);

  if (!checkin || !currentExpert) {
    return;
  }

  const urgency = wellnessCheckinStore.getCheckinUrgency(checkin);
  const result = await Promise.resolve(
    consultationStore.createExpertFollowUpConsultation?.({
      employeeId: checkin.employeeId,
      employeeName: checkin.employeeName,
      expertId: currentExpert.id,
      expertName: currentExpert.name,
      purpose: `${urgency.label} ${getTrackConfigForRecord(checkin)?.label || "wellness"} follow-up recommended based on the latest employee update.`,
      sourceCheckinId: checkin.id,
      followUpPriority: urgency.level,
    })
  );

  if (!result?.ok || !result.consultation?.id) {
    window.alert(result?.error || "Unable to prepare the follow-up consultation right now.");
    return;
  }

  renderEmployeeCheckinsPage();
  window.location.href = `Create_New_Consultation.html?consultationId=${encodeURIComponent(
    result.consultation.id
  )}`;
}

function handleCheckinCardClick(container, event) {
  if (!container) {
    return;
  }

  const detailButton = event.target.closest("[data-checkin-action='open-details']");
  if (detailButton && container.contains(detailButton)) {
    openCheckinDetail(detailButton.getAttribute("data-checkin-id"));
    return;
  }

  if (event.target.closest("a, button, textarea, input, select, label")) {
    return;
  }

  const card = event.target.closest("[data-checkin-id]");
  if (!card || !container.contains(card)) {
    return;
  }

  openCheckinDetail(card.getAttribute("data-checkin-id"));
}

function handleCheckinCardKeydown(container, event) {
  if (!container || (event.key !== "Enter" && event.key !== " ")) {
    return;
  }

  const card = event.target.closest("[data-checkin-id]");
  if (!card || !container.contains(card)) {
    return;
  }

  event.preventDefault();
  openCheckinDetail(card.getAttribute("data-checkin-id"));
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

Object.entries(employeeCheckinsRoutes).forEach(([id, target]) => {
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
  document.getElementById("navLiveSession"),
  canReadWellnessClientFeatures
);
rolePermissionsStore?.restrictElement(
  document.getElementById("navVideoLibrary"),
  canReadWellnessClientFeatures
);

if (!canUpdateWellnessConsultations && checkinResponseSubmitBtn) {
  rolePermissionsStore?.disableElement(
    checkinResponseSubmitBtn,
    "Wellness expert update access is disabled for employee check-ins."
  );
}

if (!canUpdateWellnessConsultations && checkinResponseMessage) {
  checkinResponseMessage.disabled = true;
  checkinResponseMessage.placeholder =
    "Update access is disabled, so responses cannot be sent from this page.";
}

if (highPriorityCheckinsCards) {
  highPriorityCheckinsCards.addEventListener("click", (event) => {
    handleCheckinCardClick(highPriorityCheckinsCards, event);
  });
  highPriorityCheckinsCards.addEventListener("keydown", (event) => {
    handleCheckinCardKeydown(highPriorityCheckinsCards, event);
  });
}

if (allEmployeeCheckinsCards) {
  allEmployeeCheckinsCards.addEventListener("click", (event) => {
    handleCheckinCardClick(allEmployeeCheckinsCards, event);
  });
  allEmployeeCheckinsCards.addEventListener("keydown", (event) => {
    handleCheckinCardKeydown(allEmployeeCheckinsCards, event);
  });
}

if (checkinResponseForm) {
  checkinResponseForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const activeCheckin = getCheckinById(activeCheckinId);
    if (!activeCheckin) {
      setResponseStatus("Select an employee check-in before sending a response.", {
        isError: true,
      });
      return;
    }

    if (!canUpdateWellnessConsultations) {
      setResponseStatus("Wellness expert update access is disabled for employee check-ins.", {
        isError: true,
      });
      return;
    }

    const message = String(checkinResponseMessage?.value || "").trim();
    const result = await Promise.resolve(
      checkinResponseStore?.createResponse?.({
        checkinId: activeCheckin.id,
        checkinType: activeCheckin.checkinType,
        employeeId: activeCheckin.employeeId,
        employeeName: activeCheckin.employeeName,
        companyId: activeCheckin.companyId,
        companyName: activeCheckin.companyName,
        expertId: currentExpert?.id,
        expertName: currentExpert?.name,
        message,
      })
    );

    if (!result?.ok) {
      setResponseStatus(
        result?.error || "The suggestion message could not be sent right now.",
        {
          isError: true,
        }
      );
      return;
    }

    renderEmployeeCheckinsPage();
    renderCheckinDetail(activeCheckin.id, {
      statusMessage: "Suggestion message sent successfully.",
      isError: false,
    });
  });
}

if (checkinDetailConsultationBtn) {
  checkinDetailConsultationBtn.addEventListener("click", async () => {
    if (!activeCheckinId) {
      return;
    }

    if (!canUpdateWellnessConsultations) {
      setResponseStatus("Wellness expert update access is disabled for follow-up consultations.", {
        isError: true,
      });
      return;
    }

    await handleFollowUpAction(activeCheckinId);
  });
}

if (checkinDetailCloseBtn) {
  checkinDetailCloseBtn.addEventListener("click", closeCheckinDetail);
}

if (checkinDetailOverlay) {
  checkinDetailOverlay.addEventListener("click", (event) => {
    if (event.target === checkinDetailOverlay) {
      closeCheckinDetail();
    }
  });
}

if (allEmployeeCheckinsPrevBtn) {
  allEmployeeCheckinsPrevBtn.addEventListener("click", () => {
    if (allCheckinsPage === 1) {
      return;
    }

    allCheckinsPage -= 1;
    renderEmployeeCheckinsPage();
  });
}

if (allEmployeeCheckinsNextBtn) {
  allEmployeeCheckinsNextBtn.addEventListener("click", () => {
    allCheckinsPage += 1;
    renderEmployeeCheckinsPage();
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
  if (event.key === expertAuthStore?.EXPERT_STORAGE_KEY && !expertAuthStore?.getCurrentExpert()) {
    window.location.replace("homepage.html");
    return;
  }

  if (
    event.key &&
    event.key !== wellnessCheckinStore?.STORAGE_KEY &&
    event.key !== consultationStore?.STORAGE_KEY &&
    event.key !== checkinResponseStore?.STORAGE_KEY
  ) {
    return;
  }

  renderEmployeeCheckinsPage();
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") {
    return;
  }

  if (!checkinDetailOverlay?.hidden) {
    closeCheckinDetail();
    return;
  }

  closeProfileOverlay();
});

renderEmployeeCheckinsPage();
void syncExpertCheckinDataFromBackend();
