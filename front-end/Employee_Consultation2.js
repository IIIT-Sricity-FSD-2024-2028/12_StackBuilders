const employeeAuthStore = window.employeeAuthStore || null;
const expertAuthStore = window.expertAuthStore || null;
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
const canCreateEmployeeConsultations =
  rolePermissionsStore?.hasPermission(employeePermissionGroup, "user-management-create") ?? true;
const canReadEmployeeClientFeatures =
  rolePermissionsStore?.hasPermission(employeePermissionGroup, "client-management-read") ?? true;

rolePermissionsStore?.watchPermissions(employeePermissionGroup);
rolePermissionsStore?.guardPageAccess({
  group: employeePermissionGroup,
  anyOf: ["user-management-read"],
  title: "Consultation access is disabled",
  message:
    "Ask the admin to enable consultation access for employees before opening this page.",
});

function buildDoctorNameWithMeta(name, subtitle = "", iconVariant = "") {
  const wrapper = document.createElement("div");
  wrapper.className = "doctor-name";

  const icon = document.createElement("span");
  icon.className = `doctor-icon ${iconVariant}`.trim();
  icon.setAttribute("aria-hidden", "true");
  icon.innerHTML = '<i class="fa-regular fa-user"></i>';

  if (subtitle) {
    wrapper.classList.add("doctor-name-large");

    const meta = document.createElement("div");
    meta.className = "doctor-meta";

    const title = document.createElement("h4");
    title.textContent = name;

    const subtitleText = document.createElement("p");
    subtitleText.textContent = subtitle;

    meta.append(title, subtitleText);
    wrapper.append(icon, meta);
    return wrapper;
  }

  const title = document.createElement("h4");
  title.textContent = name;
  wrapper.append(icon, title);
  return wrapper;
}

function buildEmptyState(message) {
  const emptyState = document.createElement("div");
  emptyState.className = "empty-state";
  emptyState.textContent = message;
  return emptyState;
}

function buildUpcomingCard(consultation) {
  const card = document.createElement("div");
  card.className = "card";

  const header = document.createElement("div");
  header.className = "card-header";

  const badge = document.createElement("span");
  badge.className = "badge green";
  badge.textContent = consultation.category;

  const date = consultationStore.formatScheduleDate(consultation.sessionDate);
  const time = consultationStore.formatScheduleTime(consultation.sessionTime);

  const details = document.createElement("p");
  details.textContent =
    date || time
      ? `${date}${time ? ` @ ${time}` : ""}${
          consultation.sessionDuration ? ` (${consultation.sessionDuration})` : ""
        }`
      : "Session details will be shared by your expert soon.";

  const button = document.createElement("button");
  button.className = "join";
  button.type = "button";
  button.textContent = consultation.sessionMeetingLink ? "Join Session" : "Awaiting Link";
  button.dataset.consultationId = consultation.id;
  button.disabled = !consultation.sessionMeetingLink;

  header.append(buildDoctorNameWithMeta(consultation.expertName), badge);
  card.append(header, details, button);
  return card;
}

function buildRequestedCard(request) {
  const card = document.createElement("div");
  card.className = "card status-card requested-card";

  const topRow = document.createElement("div");
  topRow.className = "requested-card-top";

  const timing = consultationStore.splitRequestedOn(request.requestedOn);

  const details = document.createElement("p");
  details.className = "status-date";
  details.innerHTML = `<i class="fa-regular fa-calendar"></i> ${timing.date}`;

  const time = document.createElement("p");
  time.className = "status-time";
  time.innerHTML = `<i class="fa-regular fa-clock"></i> ${timing.time || "Time to be scheduled"}`;

  const purpose = document.createElement("div");
  purpose.className = "status-message requested-message";
  purpose.textContent =
    request.status === "requested" ? "Pending Approval" : request.purpose;

  topRow.append(
    buildDoctorNameWithMeta(
      request.expertName,
      request.category || "Requested Consultation",
      "requested-icon"
    )
  );
  card.append(topRow, details, time, purpose);
  return card;
}

function buildRejectedCard(request) {
  const card = document.createElement("div");
  card.className = "card status-card rejected-card";

  const topRow = document.createElement("div");
  topRow.className = "status-card-top";

  const timing = consultationStore.splitRequestedOn(request.requestedOn);

  const details = document.createElement("p");
  details.className = "status-date";
  details.innerHTML = `<i class="fa-regular fa-calendar"></i> ${timing.date}`;

  const reason = document.createElement("div");
  reason.className = "status-message rejected-message";
  reason.innerHTML = `<strong>Reason:</strong> ${
    request.rejectionReason || "Consultation request was not approved."
  }`;

  topRow.append(
    buildDoctorNameWithMeta(
      request.expertName,
      request.category || "Requested Consultation",
      "rejected-icon"
    )
  );
  card.append(topRow, details, reason);
  return card;
}

function buildPreviousConsultationCard(consultation) {
  const card = document.createElement("div");
  card.className = "prev-item";

  const topRow = document.createElement("div");
  topRow.className = "row";

  const badge = document.createElement("span");
  badge.className = "badge green";
  badge.textContent = "Completed";

  const date = consultationStore.formatScheduleDate(consultation.sessionDate);
  const time = consultationStore.formatScheduleTime(consultation.sessionTime);

  const details = document.createElement("p");
  details.textContent = [date, time].filter(Boolean).join(" @ ") || "Completed consultation";

  const notes = document.createElement("p");
  notes.className = "notes";
  notes.textContent =
    consultation.purpose || "This wellness consultation was completed successfully.";

  const actionsRow = document.createElement("div");
  actionsRow.className = "row";

  if (canCreateEmployeeConsultations && consultation.expertId) {
    const rebookButton = document.createElement("button");
    rebookButton.className = "rebook";
    rebookButton.type = "button";
    rebookButton.textContent = "Rebook";
    rebookButton.dataset.action = "rebook";
    rebookButton.dataset.consultationId = consultation.id;
    actionsRow.appendChild(rebookButton);
  }

  topRow.append(buildDoctorNameWithMeta(consultation.expertName), badge);
  card.append(topRow, details, notes, actionsRow);
  return card;
}

function getAvailableExperts() {
  const experts = expertAuthStore?.readExperts
    ? expertAuthStore.readExperts(currentEmployeeCompanyContext)
    : [];
  return experts.filter(
    (expert) => String(expert?.status || "Active").trim().toLowerCase() === "active"
  );
}

function attachNavigation() {
  const employeeWelcomeMessage = document.getElementById("employeeWelcomeMessage");
  const homeNavLink = document.getElementById("homeNavLink");
  const employeeWellnessCheckinsNavLink = document.getElementById(
    "employeeWellnessCheckinsNavLink"
  );
  const liveSessionNavLink = document.querySelector('.nav-links a[href="Live_Session.html"]');
  const videoLibraryNavLink = document.querySelector('.nav-links a[href="Video_Library.html?role=employee"]');
  const profileNavIcon = document.getElementById("profileNavIcon");
  const profileOverlay = document.getElementById("profileOverlay");
  const profileDrawerBackBtn = document.getElementById("profileDrawerBackBtn");
  const editProfileDrawerBtn = document.getElementById("editProfileDrawerBtn");
  const logoutDrawerBtn = document.getElementById("logoutDrawerBtn");
  const requestButton = document.getElementById("requestConsultationBtn");
  const requestModalOverlay = document.getElementById("requestModalOverlay");
  const requestModalCloseBtn = document.getElementById("requestModalCloseBtn");
  const requestModalBackBtn = document.getElementById("requestModalBackBtn");
  const consultationModalForm = document.getElementById("consultationModalForm");
  const requestedConsultationsList = document.getElementById("requestedConsultationsList");
  const rejectedConsultationsList = document.getElementById("rejectedConsultationsList");
  const upcomingConsultationsList = document.getElementById("upcomingConsultationsList");
  const previousConsultationsList = document.getElementById("previousConsultationsList");
  const modalExpertName = document.getElementById("modalExpertName");
  const modalPurpose = document.getElementById("modalPurpose");
  const submitRequestButton = consultationModalForm?.querySelector(
    ".request-primary-btn"
  );

  rolePermissionsStore?.restrictElement(requestButton, canCreateEmployeeConsultations);
  rolePermissionsStore?.restrictElement(
    employeeWellnessCheckinsNavLink,
    canReadEmployeeClientFeatures
  );
  rolePermissionsStore?.restrictElement(liveSessionNavLink, canReadEmployeeClientFeatures);
  rolePermissionsStore?.restrictElement(videoLibraryNavLink, canReadEmployeeClientFeatures);

  if (employeeWelcomeMessage && currentEmployee) {
    employeeWelcomeMessage.textContent = `Welcome back, ${currentEmployeeFirstName}!`;
  }

  function renderUpcomingConsultations() {
    if (!upcomingConsultationsList) return;

    const upcomingConsultations =
      consultationStore.getCurrentEmployeeUpcomingConsultations();
    upcomingConsultationsList.innerHTML = "";

    if (upcomingConsultations.length === 0) {
      upcomingConsultationsList.appendChild(
        buildEmptyState("No upcoming consultations available yet.")
      );
      return;
    }

    upcomingConsultations.forEach((consultation) => {
      upcomingConsultationsList.appendChild(buildUpcomingCard(consultation));
    });
  }

  function renderRequestedConsultations() {
    if (!requestedConsultationsList) return;

    const requestedConsultations =
      consultationStore.getCurrentEmployeeConsultationsByStatus("requested");
    requestedConsultationsList.innerHTML = "";

    if (requestedConsultations.length === 0) {
      requestedConsultationsList.appendChild(
        buildEmptyState("No requested consultations yet.")
      );
      return;
    }

    requestedConsultations.forEach((request) => {
      requestedConsultationsList.appendChild(buildRequestedCard(request));
    });
  }

  function renderRejectedConsultations() {
    if (!rejectedConsultationsList) return;

    const rejectedConsultations =
      consultationStore.getCurrentEmployeeConsultationsByStatus("rejected");
    rejectedConsultationsList.innerHTML = "";

    if (rejectedConsultations.length === 0) {
      rejectedConsultationsList.appendChild(
        buildEmptyState("No rejected consultations.")
      );
      return;
    }

    rejectedConsultations.forEach((request) => {
      rejectedConsultationsList.appendChild(buildRejectedCard(request));
    });
  }

  function renderPreviousConsultations() {
    if (!previousConsultationsList) return;

    const previousConsultations = consultationStore.getCurrentEmployeePastConsultations();
    previousConsultationsList.innerHTML = "";

    if (previousConsultations.length === 0) {
      previousConsultationsList.appendChild(
        buildEmptyState("No previous consultations are available yet.")
      );
      return;
    }

    previousConsultations.forEach((consultation) => {
      previousConsultationsList.appendChild(buildPreviousConsultationCard(consultation));
    });
  }

  function renderAllConsultations() {
    renderUpcomingConsultations();
    renderRequestedConsultations();
    renderRejectedConsultations();
    renderPreviousConsultations();
  }

  function renderExpertOptions() {
    if (!modalExpertName) return;

    const experts = getAvailableExperts();
    modalExpertName.innerHTML = "";

    if (!experts.length) {
      const option = document.createElement("option");
      option.value = "";
      option.textContent = "No wellness experts available right now";
      modalExpertName.appendChild(option);
      modalExpertName.disabled = true;

      if (submitRequestButton) {
        submitRequestButton.disabled = true;
      }

      return;
    }

    const placeholderOption = document.createElement("option");
    placeholderOption.value = "";
    placeholderOption.textContent = "Select expert";
    modalExpertName.appendChild(placeholderOption);

    experts.forEach((expert) => {
      const option = document.createElement("option");
      option.value = expert.id;
      option.textContent = `${expert.name} (${expert.specialization || "Wellness Expert"})`;
      modalExpertName.appendChild(option);
    });

    modalExpertName.disabled = false;

    if (submitRequestButton) {
      submitRequestButton.disabled = false;
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

  function openRequestModal() {
    if (!canCreateEmployeeConsultations) {
      alert("Employee create access is disabled for consultations.");
      return;
    }

    renderExpertOptions();

    if (!requestModalOverlay) return;
    requestModalOverlay.hidden = false;
    document.body.classList.add("request-modal-open");
  }

  function closeRequestModal() {
    if (!requestModalOverlay) return;
    requestModalOverlay.hidden = true;
    document.body.classList.remove("request-modal-open");

    if (consultationModalForm) {
      consultationModalForm.reset();
    }

    renderExpertOptions();
  }

  if (homeNavLink) {
    homeNavLink.addEventListener("click", () => {
      window.location.href = "Employee_Dashbaord.html";
    });
  }

  if (profileNavIcon) profileNavIcon.addEventListener("click", openProfileOverlay);
  if (profileDrawerBackBtn) profileDrawerBackBtn.addEventListener("click", closeProfileOverlay);
  if (editProfileDrawerBtn) {
    editProfileDrawerBtn.addEventListener("click", () => {
      window.location.href = "Employee_ManageProfile.html";
    });
  }
  if (logoutDrawerBtn) logoutDrawerBtn.addEventListener("click", closeProfileOverlay);

  if (profileOverlay) {
    profileOverlay.addEventListener("click", (event) => {
      if (event.target === profileOverlay) closeProfileOverlay();
    });
  }

  if (requestButton) requestButton.addEventListener("click", openRequestModal);
  if (requestModalCloseBtn) requestModalCloseBtn.addEventListener("click", closeRequestModal);
  if (requestModalBackBtn) requestModalBackBtn.addEventListener("click", closeRequestModal);

  if (requestModalOverlay) {
    requestModalOverlay.addEventListener("click", (event) => {
      if (event.target === requestModalOverlay) closeRequestModal();
    });
  }

  if (consultationModalForm) {
    consultationModalForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!canCreateEmployeeConsultations) {
        alert("Employee create access is disabled for consultations.");
        return;
      }

      if (!consultationModalForm.reportValidity()) {
        return;
      }

      const formData = new FormData(consultationModalForm);
      const purpose = String(formData.get("purpose") || "").trim();
      const expertId = String(formData.get("expertId") || "").trim();

      if (!purpose || !expertId) {
        alert("Please fill in all fields before submitting.");
        return;
      }

      const result = await consultationStore.createConsultationRequest({
        employeeId: currentEmployee?.id,
        employeeName: currentEmployee?.name,
        expertId,
        purpose,
      });

      if (!result?.ok) {
        alert(result?.error || "Unable to submit the consultation request right now.");
        renderExpertOptions();
        return;
      }

      renderAllConsultations();
      closeRequestModal();
    });
  }

  if (upcomingConsultationsList) {
    upcomingConsultationsList.addEventListener("click", (event) => {
      const button = event.target.closest("[data-consultation-id]");
      if (!button) return;

      const consultation = consultationStore.getConsultationById(
        button.getAttribute("data-consultation-id"),
        currentEmployeeCompanyContext
      );

      if (!consultation?.sessionMeetingLink) {
        alert("This consultation session link is not available yet.");
        return;
      }

      window.open(consultation.sessionMeetingLink, "_blank", "noopener,noreferrer");
    });
  }

  if (previousConsultationsList) {
    previousConsultationsList.addEventListener("click", (event) => {
      const button = event.target.closest('[data-action="rebook"]');
      if (!button || !canCreateEmployeeConsultations) {
        return;
      }

      const consultation = consultationStore.getConsultationById(
        button.getAttribute("data-consultation-id"),
        currentEmployeeCompanyContext
      );

      if (!consultation) {
        alert("The previous consultation could not be found.");
        return;
      }

      openRequestModal();

      if (modalPurpose) {
        modalPurpose.value = consultation.purpose || "";
      }

      if (modalExpertName && consultation.expertId) {
        const matchingOption = Array.from(modalExpertName.options || []).find(
          (option) => option.value === consultation.expertId
        );

        if (matchingOption) {
          modalExpertName.value = consultation.expertId;
        }
      }
    });
  }

  window.addEventListener("storage", (event) => {
    if (
      event.key &&
      event.key !== "stackbuilders.consultations.v1" &&
      event.key !== "stackbuilders.hr.experts"
    ) {
      return;
    }

    renderAllConsultations();

    if (!requestModalOverlay?.hidden) {
      renderExpertOptions();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeRequestModal();
      closeProfileOverlay();
    }
  });

  renderExpertOptions();
  async function initializeEmployeeConsultationsPage() {
    await consultationStore?.syncConsultationsFromBackend?.(currentEmployeeCompanyContext);
    renderAllConsultations();
  }

  void initializeEmployeeConsultationsPage();
}

attachNavigation();
