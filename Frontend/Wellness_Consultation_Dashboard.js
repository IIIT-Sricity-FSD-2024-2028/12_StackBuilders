const expertAuthStore = window.expertAuthStore || null;
const currentExpert = expertAuthStore?.requireExpertSession({
  redirectTo: "homepage.html",
});
const currentExpertName = currentExpert?.name || "Wellness Expert";
const currentExpertFirstName =
  currentExpertName.split(/\s+/).filter(Boolean)[0] || currentExpertName;
const wellnessWelcomeMessage = document.getElementById("wellnessWelcomeMessage");
function buildWellnessEmptyState(message, colSpan = 1) {
  if (colSpan > 1) {
    return `
      <tr>
        <td colspan="${colSpan}">
          <div class="empty-panel">${message}</div>
        </td>
      </tr>
    `;
  }

  return `<div class="empty-panel">${message}</div>`;
}

function buildUpcomingCard(item) {
  const timing = consultationStore.splitRequestedOn(item.requestedOn);

  return `
    <div class="mini-card">
      <div class="mini-header">
        <div class="person">
          <div class="avatar avatar-emily">${consultationStore.getInitials(item.employeeName)}</div>
          <div>
            <h3>${item.employeeName}</h3>
            <span>${item.category}</span>
          </div>
        </div>
        <span class="status green">Confirmed</span>
      </div>
      <ul class="meta">
        <li>${timing.date || "Date to be scheduled"}</li>
        <li>${timing.time || "Time to be scheduled"}</li>
        <li>${item.expertName || currentExpertName}</li>
      </ul>
      <button class="primary-btn">Open Session</button>
    </div>
  `;
}

function buildAcceptedCard(item) {
  return `
    <div class="list-card">
      <div class="list-head">
        <div class="table-person">
          <div class="avatar small avatar-sarah">${consultationStore.getInitials(item.employeeName)}</div>
          <div>
            <strong>${item.employeeName}</strong>
            <span>${item.category}</span>
          </div>
        </div>
        <span class="status green">Accepted</span>
      </div>
      <button class="primary-btn full">Create Session</button>
    </div>
  `;
}

function buildRejectedCard(item) {
  return `
    <div class="reject-card">
      <div class="table-person">
        <div class="avatar small avatar-michael">${consultationStore.getInitials(item.employeeName)}</div>
        <div>
          <strong>${item.employeeName}</strong>
          <span>${item.category}</span>
        </div>
      </div>
      <span class="status red">Rejected</span>
    </div>
  `;
}

const UPCOMING_CONSULTATIONS_PER_PAGE = 3;
let upcomingConsultationsPage = 1;

function renderUpcomingConsultations() {
  const container = document.getElementById("upcomingConsultationsGrid");
  const pager = document.getElementById("upcomingConsultationsPager");
  const prevBtn = document.getElementById("upcomingConsultationsPrevBtn");
  const nextBtn = document.getElementById("upcomingConsultationsNextBtn");
  const pageNumber = document.getElementById("upcomingConsultationsPageNumber");
  if (!container) return;

  const consultations = consultationStore.getCurrentExpertUpcomingConsultations();
  const totalPages = Math.max(Math.ceil(consultations.length / UPCOMING_CONSULTATIONS_PER_PAGE), 1);
  upcomingConsultationsPage = Math.min(upcomingConsultationsPage, totalPages);
  const startIndex = (upcomingConsultationsPage - 1) * UPCOMING_CONSULTATIONS_PER_PAGE;
  const paginatedConsultations = consultations.slice(
    startIndex,
    startIndex + UPCOMING_CONSULTATIONS_PER_PAGE
  );

  container.innerHTML = consultations.length
    ? paginatedConsultations.map(buildUpcomingCard).join("")
    : buildWellnessEmptyState("No upcoming consultations scheduled.");

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

function renderAcceptedConsultations() {
  const container = document.getElementById("acceptedConsultationsList");
  if (!container) return;

  const consultations = consultationStore.getCurrentExpertUpcomingConsultations();
  container.innerHTML = consultations.length
    ? consultations.map(buildAcceptedCard).join("")
    : buildWellnessEmptyState("No accepted consultations yet.");
}

function renderRejectedConsultations() {
  const container = document.getElementById("rejectedConsultationsList");
  if (!container) return;

  const consultations = consultationStore.getCurrentExpertConsultationsByStatus("rejected");
  container.innerHTML = consultations.length
    ? consultations.map(buildRejectedCard).join("")
    : buildWellnessEmptyState("No rejected consultations.");
}

function renderConsultationRequests() {
  const container = document.getElementById("consultationRequestsBody");
  if (!container) return;

  const consultations = consultationStore.getCurrentExpertConsultationsByStatus("requested");

  container.innerHTML = consultations.length
    ? consultations
        .map(
          (item, index) => `
            <tr>
              <td>${index + 1}</td>
              <td>
                <div class="table-person">
                  <div class="avatar small avatar-aarush">${consultationStore.getInitials(item.employeeName)}</div>
                  ${item.employeeName}
                </div>
              </td>
              <td>${item.purpose}</td>
              <td class="actions">
                <button class="badge accept" data-action="accept" data-id="${item.id}">Accept</button>
                <button class="badge reject" data-action="reject" data-id="${item.id}">Reject</button>
              </td>
            </tr>
          `
        )
        .join("")
    : buildWellnessEmptyState("No consultation requests pending.", 4);
}

function renderWellnessDashboard() {
  renderUpcomingConsultations();
  renderAcceptedConsultations();
  renderRejectedConsultations();
  renderConsultationRequests();
}

function attachWellnessActions() {
  const requestsBody = document.getElementById("consultationRequestsBody");
  if (!requestsBody) return;

  requestsBody.addEventListener("click", (event) => {
    const button = event.target.closest("[data-action]");
    if (!button) return;

    const action = button.getAttribute("data-action");
    const id = button.getAttribute("data-id");
    if (!id) return;

    if (action === "accept") {
      consultationStore.updateConsultation(id, { status: "accepted", rejectionReason: "" });
    }

    if (action === "reject") {
      consultationStore.updateConsultation(id, {
        status: "rejected",
        rejectionReason: "Consultation request could not be scheduled.",
      });
    }

    renderWellnessDashboard();
  });
}

function attachUpcomingConsultationsPagination() {
  const prevBtn = document.getElementById("upcomingConsultationsPrevBtn");
  const nextBtn = document.getElementById("upcomingConsultationsNextBtn");

  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      if (upcomingConsultationsPage === 1) return;
      upcomingConsultationsPage -= 1;
      renderUpcomingConsultations();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      upcomingConsultationsPage += 1;
      renderUpcomingConsultations();
    });
  }
}

function attachNavigation() {
  const consultationDashboardRoutes = {
    navHome: "Wellness_Dashboard.html",
    navConsultation: "Wellness_Consultation_Dashboard.html",
    navLiveSession: "Expert_Live_Session.html",
    navVideoLibrary: "Expert_Video_Library.html",
  };

  Object.entries(consultationDashboardRoutes).forEach(([id, target]) => {
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

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeProfileOverlay();
  });
}

window.addEventListener("storage", (event) => {
  if (event.key === expertAuthStore?.EXPERT_STORAGE_KEY && !expertAuthStore?.getCurrentExpert()) {
    window.location.replace("homepage.html");
    return;
  }

  if (event.key && event.key !== "stackbuilders.consultations.v1") return;
  renderWellnessDashboard();
});

attachNavigation();
attachWellnessActions();
attachUpcomingConsultationsPagination();
renderWellnessDashboard();
