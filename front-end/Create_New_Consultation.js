const expertAuthStore = window.expertAuthStore || null;
const currentExpert = expertAuthStore?.requireExpertSession({
  redirectTo: "homepage.html",
});
const currentExpertCompanyContext = {
  companyId: String(currentExpert?.companyId || "").trim(),
  companyName: String(currentExpert?.companyName || "").trim(),
};

const consultationId = new URLSearchParams(window.location.search).get("consultationId");
let consultation = null;

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

function getTodayDateInputValue() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateOnly(value) {
  const raw = String(value || "").trim();
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return null;
  }

  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? null : date;
}

function getCurrentTimeInputValue() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function parseTimeOnly(value) {
  const raw = String(value || "").trim();
  const match = raw.match(/^(\d{2}):(\d{2})$/);
  if (!match) {
    return null;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }

  return { hours, minutes };
}

function isSameCalendarDate(left, right) {
  return Boolean(
    left &&
      right &&
      left.getFullYear() === right.getFullYear() &&
      left.getMonth() === right.getMonth() &&
      left.getDate() === right.getDate()
  );
}

function syncConsultationTimeConstraint() {
  if (!sessionDateInput || !sessionTimeInput) {
    return;
  }

  const selectedDate = parseDateOnly(sessionDateInput.value);
  const today = parseDateOnly(getTodayDateInputValue());

  if (selectedDate && today && isSameCalendarDate(selectedDate, today)) {
    sessionTimeInput.min = getCurrentTimeInputValue();
    return;
  }

  sessionTimeInput.removeAttribute("min");
}

function isValidHttpUrl(value) {
  try {
    const url = new URL(String(value || "").trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch (error) {
    return false;
  }
}

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

  syncConsultationTimeConstraint();

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

if (sessionDateInput) {
  sessionDateInput.min = getTodayDateInputValue();
  sessionDateInput.addEventListener("input", syncConsultationTimeConstraint);
}

if (sessionTimeInput) {
  sessionTimeInput.addEventListener("focus", syncConsultationTimeConstraint);
}

if (consultationSessionForm) {
  consultationSessionForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const latestConsultation = consultationStore.getConsultationById(
      consultationId,
      currentExpertCompanyContext
    );
    if (!validateConsultation(latestConsultation)) {
      return;
    }

    const formData = new FormData(consultationSessionForm);
    const sessionDate = String(formData.get("date") || "").trim();
    const sessionTime = String(formData.get("time") || "").trim();
    const sessionMeetingLink = String(formData.get("meetingLink") || "").trim();

    if (!consultationSessionForm.reportValidity()) {
      return;
    }

    const parsedDate = parseDateOnly(sessionDate);
    const today = parseDateOnly(getTodayDateInputValue());
    if (!parsedDate || (today && parsedDate < today)) {
      setFormStatus("Choose today or a future date for the consultation session.", {
        isError: true,
      });
      sessionDateInput?.focus();
      return;
    }

    const parsedTime = parseTimeOnly(sessionTime);
    if (!parsedTime) {
      setFormStatus("Choose a valid consultation time.", {
        isError: true,
      });
      sessionTimeInput?.focus();
      return;
    }

    const now = new Date();
    if (
      isSameCalendarDate(parsedDate, now) &&
      (
        parsedTime.hours < now.getHours() ||
        (parsedTime.hours === now.getHours() && parsedTime.minutes < now.getMinutes())
      )
    ) {
      setFormStatus("Choose the current time or a future time for today’s consultation session.", {
        isError: true,
      });
      sessionTimeInput?.focus();
      return;
    }

    if (!isValidHttpUrl(sessionMeetingLink)) {
      setFormStatus("Enter a valid meeting link that starts with http:// or https://.", {
        isError: true,
      });
      sessionMeetingLinkInput?.focus();
      return;
    }

    const result = await consultationStore.updateConsultation(
      consultationId,
      {
        sessionTitle: String(formData.get("title") || "").trim(),
        sessionDate,
        sessionTime,
        sessionDuration: String(formData.get("duration") || "").trim(),
        sessionMeetingLink,
        sessionCreatedAt: new Date().toISOString(),
      },
      currentExpertCompanyContext
    );

    if (!result?.ok) {
      setFormStatus(result?.error || "Unable to save this consultation session right now.", {
        isError: true,
      });
      return;
    }

    setFormStatus("Consultation session saved. Redirecting...", { isError: false });
    window.setTimeout(redirectToConsultationDashboard, 700);
  });
}

async function initializeCreateConsultationPage() {
  await consultationStore?.syncConsultationsFromBackend?.(currentExpertCompanyContext);
  consultation = consultationId
    ? consultationStore.getConsultationById(consultationId, currentExpertCompanyContext)
    : null;

  if (validateConsultation(consultation)) {
    loadConsultationSummary(consultation);
  }

  syncConsultationTimeConstraint();
}

void initializeCreateConsultationPage();
