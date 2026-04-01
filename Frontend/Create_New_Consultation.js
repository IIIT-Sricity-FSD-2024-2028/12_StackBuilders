const expertAuthStore = window.expertAuthStore || null;
const currentExpert = expertAuthStore?.requireExpertSession({
  redirectTo: "homepage.html",
});

const consultationId = new URLSearchParams(window.location.search).get("consultationId");
const consultation = consultationId
  ? consultationStore.getConsultationById(consultationId)
  : null;

const createConsultationHeading = document.getElementById("createConsultationHeading");
const createConsultationSubheading = document.getElementById("createConsultationSubheading");
const consultationEmployeeName = document.getElementById("consultationEmployeeName");
const consultationCategory = document.getElementById("consultationCategory");
const consultationPurpose = document.getElementById("consultationPurpose");
const consultationRequestedOn = document.getElementById("consultationRequestedOn");
const consultationExpertName = document.getElementById("consultationExpertName");
const consultationSessionForm = document.getElementById("consultationSessionForm");
const cancelCreateConsultationBtn = document.getElementById("cancelCreateConsultationBtn");
const consultationFormStatus = document.getElementById("consultationFormStatus");
const sessionTitleInput = document.getElementById("session-title");
const sessionDateInput = document.getElementById("date");
const sessionTimeInput = document.getElementById("time");
const sessionDurationInput = document.getElementById("duration");
const sessionMeetingLinkInput = document.getElementById("meeting-link");

function redirectToConsultationDashboard() {
  window.location.href = "Wellness_Consultation_Dashboard.html";
}

function setFormStatus(message, options = {}) {
  if (!consultationFormStatus) return;

  consultationFormStatus.hidden = !message;
  consultationFormStatus.textContent = message || "";
  consultationFormStatus.classList.toggle("success", Boolean(message) && !options.isError);
}

function setFormEnabled(isEnabled) {
  if (!consultationSessionForm) return;

  consultationSessionForm
    .querySelectorAll("input, button")
    .forEach((field) => {
      field.disabled = !isEnabled;
    });
}

function getDefaultSessionTitle(record) {
  return `${record.category} Consultation with ${record.employeeName}`;
}

function loadConsultationSummary(record) {
  const requestedTiming = consultationStore.splitRequestedOn(record.requestedOn);
  const isEditing = consultationStore.hasScheduledSession(record);

  if (createConsultationHeading) {
    createConsultationHeading.textContent = isEditing
      ? "Update Consultation Session"
      : "Create New Consultation Session";
  }

  if (createConsultationSubheading) {
    createConsultationSubheading.textContent = isEditing
      ? "Update the schedule or meeting link for this accepted consultation."
      : "Add the session schedule and meeting link for this accepted consultation.";
  }

  if (consultationEmployeeName) {
    consultationEmployeeName.textContent = record.employeeName || "Employee";
  }

  if (consultationCategory) {
    consultationCategory.textContent = record.category || "General Wellness";
  }

  if (consultationPurpose) {
    consultationPurpose.textContent = record.purpose || "No purpose provided.";
  }

  if (consultationRequestedOn) {
    consultationRequestedOn.textContent = requestedTiming.time
      ? `${requestedTiming.date} @ ${requestedTiming.time}`
      : requestedTiming.date || "Not available";
  }

  if (consultationExpertName) {
    consultationExpertName.textContent =
      record.expertName || currentExpert?.name || "Wellness Expert";
  }

  if (sessionTitleInput) {
    sessionTitleInput.value = record.sessionTitle || getDefaultSessionTitle(record);
  }

  if (sessionDateInput) {
    sessionDateInput.value = record.sessionDate || "";
  }

  if (sessionTimeInput) {
    sessionTimeInput.value = record.sessionTime || "";
  }

  if (sessionDurationInput) {
    sessionDurationInput.value = record.sessionDuration || "45 min";
  }

  if (sessionMeetingLinkInput) {
    sessionMeetingLinkInput.value = record.sessionMeetingLink || "";
  }
}

function validateConsultation(record) {
  if (!record) {
    setFormStatus("This consultation could not be found.", { isError: true });
    setFormEnabled(false);
    window.setTimeout(redirectToConsultationDashboard, 1200);
    return false;
  }

  if (record.status !== "accepted") {
    setFormStatus("Only accepted consultations can be scheduled here.", { isError: true });
    setFormEnabled(false);
    window.setTimeout(redirectToConsultationDashboard, 1200);
    return false;
  }

  if (currentExpert?.id && record.expertId && record.expertId !== currentExpert.id) {
    setFormStatus("This consultation belongs to a different wellness expert.", {
      isError: true,
    });
    setFormEnabled(false);
    window.setTimeout(redirectToConsultationDashboard, 1200);
    return false;
  }

  return true;
}

if (cancelCreateConsultationBtn) {
  cancelCreateConsultationBtn.addEventListener("click", redirectToConsultationDashboard);
}

if (validateConsultation(consultation)) {
  loadConsultationSummary(consultation);
}

if (consultationSessionForm) {
  consultationSessionForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const latestConsultation = consultationStore.getConsultationById(consultationId);
    if (!validateConsultation(latestConsultation)) {
      return;
    }

    const formData = new FormData(consultationSessionForm);

    consultationStore.updateConsultation(consultationId, {
      sessionTitle: String(formData.get("title") || "").trim(),
      sessionDate: String(formData.get("date") || "").trim(),
      sessionTime: String(formData.get("time") || "").trim(),
      sessionDuration: String(formData.get("duration") || "").trim(),
      sessionMeetingLink: String(formData.get("meetingLink") || "").trim(),
      sessionCreatedAt: new Date().toISOString(),
    });

    setFormStatus("Consultation session saved. Redirecting...", { isError: false });
    window.setTimeout(redirectToConsultationDashboard, 700);
  });
}
