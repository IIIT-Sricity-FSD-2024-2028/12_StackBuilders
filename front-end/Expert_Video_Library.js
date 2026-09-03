const expertAuthStore = window.expertAuthStore || null;
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
const currentExpertTrack = expertAuthStore?.getExpertTrack?.(currentExpert) || "";
const expertHomeRoute =
  expertAuthStore?.getExpertDashboardRoute?.(currentExpert) || "Wellness_Dashboard.html";
const wellnessPermissionGroup = "wellness-expert";
const canReadWellnessConsultations =
  rolePermissionsStore?.hasPermission(wellnessPermissionGroup, "user-management-read") ?? true;
const canReadWellnessClientFeatures =
  rolePermissionsStore?.hasPermission(wellnessPermissionGroup, "client-management-read") ?? true;
const canCreateWellnessClientFeatures =
  rolePermissionsStore?.hasPermission(wellnessPermissionGroup, "client-management-create") ?? true;

const profileNavIcon = document.getElementById("profileNavIcon");
const profileOverlay = document.getElementById("profileOverlay");
const profileDrawerBackBtn = document.getElementById("profileDrawerBackBtn");
const editProfileDrawerBtn = document.getElementById("editProfileDrawerBtn");
const logoutDrawerBtn = document.getElementById("logoutDrawerBtn");
const openAddVideoModalBtn = document.getElementById("openAddVideoModalBtn");
const videoModalOverlay = document.getElementById("videoModalOverlay");
const closeAddVideoModalBtn = document.getElementById("closeAddVideoModalBtn");
const cancelAddVideoModalBtn = document.getElementById("cancelAddVideoModalBtn");
const videoSearchInput = document.getElementById("videoSearchInput");
const expertWelcomeMessage = document.getElementById("expertWelcomeMessage");
const videoModalForm = document.getElementById("videoModalForm");
const videoFormError = document.getElementById("videoFormError");
const libraryEyebrow = document.querySelector(".library-hero .eyebrow");
const libraryTitle = document.querySelector(".library-hero h1");
const librarySubtitle = document.querySelector(".library-hero .subtitle");
const videoCategorySelect = videoModalForm?.querySelector('select[name="category"]') || null;
const categorySectionMap = {
  "Health Related": "health",
  "Mind Relaxation": "mind",
  "Physical Wellness": "physical",
};
const trackVideoCategoryConfig = {
  nutrition: {
    sectionKey: "health",
    category: "Health Related",
    libraryLabel: "Nutrition",
    emptyStateLabel: "nutrition",
  },
  mental: {
    sectionKey: "mind",
    category: "Mind Relaxation",
    libraryLabel: "Psychology",
    emptyStateLabel: "mental wellness",
  },
  physical: {
    sectionKey: "physical",
    category: "Physical Wellness",
    libraryLabel: "Physical Wellness",
    emptyStateLabel: "physical wellness",
  },
};
const currentTrackVideoConfig = trackVideoCategoryConfig[currentExpertTrack] || null;

rolePermissionsStore?.watchPermissions(wellnessPermissionGroup);
rolePermissionsStore?.guardPageAccess({
  group: wellnessPermissionGroup,
  anyOf: ["client-management-read"],
  title: "Video library access is disabled",
  message:
    "Ask the admin to enable Company Management read access for wellness experts before opening the video library.",
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
  openAddVideoModalBtn,
  canCreateWellnessClientFeatures
);

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

function createVideoCardMarkup({ title, duration, videoLink, thumbnailLink, creatorExpertName }) {
  const safeTitle = escapeHtml(title);
  const safeDuration = escapeHtml(duration || "00:00");
  const safeVideoLink = escapeHtml(videoLink || "#");
  const safeThumbnailLink = escapeHtml(
    thumbnailLink ||
      "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=900&q=80"
  );
  const safeUploader = escapeHtml(creatorExpertName || "Wellness Expert");

  return `
    <article class="video-card" data-title="${safeTitle}" data-custom-video="true">
      <a class="thumbnail" href="${safeVideoLink}">
        <img src="${safeThumbnailLink}" alt="${safeTitle}" />
        <span class="duration">${safeDuration}</span>
      </a>
      <div class="card-body">
        <h3>${safeTitle}</h3>
        <span class="video-uploader-tag">Uploaded by ${safeUploader}</span>
      </div>
    </article>
  `;
}

function isAllowedSection(sectionKey) {
  if (!currentTrackVideoConfig) {
    return true;
  }

  return sectionKey === currentTrackVideoConfig.sectionKey;
}

function isAllowedCategory(category) {
  const sectionKey = categorySectionMap[String(category || "").trim()];

  if (!currentTrackVideoConfig) {
    return true;
  }

  return Boolean(sectionKey && sectionKey === currentTrackVideoConfig.sectionKey);
}

function getAllowedSections() {
  return Array.from(document.querySelectorAll(".video-category")).filter((section) =>
    isAllowedSection(section.dataset.categorySection || "")
  );
}

function getAllowedCards({ visibleOnly = false } = {}) {
  return getAllowedSections().flatMap((section) =>
    Array.from(section.querySelectorAll(".video-card")).filter((card) => !visibleOnly || !card.hidden)
  );
}

function updateSectionVisibility({ visibleOnly = false } = {}) {
  document.querySelectorAll(".video-category").forEach((section) => {
    const sectionKey = section.dataset.categorySection || "";

    if (!isAllowedSection(sectionKey)) {
      section.hidden = true;
      return;
    }

    const cards = Array.from(section.querySelectorAll(".video-card")).filter(
      (card) => !visibleOnly || !card.hidden
    );

    section.hidden = cards.length === 0;

    if (typeof section.refreshCarousel === "function") {
      section.refreshCarousel();
    }
  });
}

function configureTrackSpecificLibraryView() {
  if (!currentTrackVideoConfig) {
    return;
  }

  if (libraryEyebrow) {
    libraryEyebrow.textContent = `${currentTrackVideoConfig.libraryLabel} Video Library`;
  }

  if (libraryTitle) {
    libraryTitle.textContent = `${currentTrackVideoConfig.libraryLabel} Videos`;
  }

  if (librarySubtitle) {
    librarySubtitle.textContent = `Browse ${currentTrackVideoConfig.emptyStateLabel} videos tailored to your expert role.`;
  }

  if (videoCategorySelect) {
    Array.from(videoCategorySelect.options).forEach((option) => {
      const optionValue = String(option.value || option.textContent || "").trim();
      const isAllowedOption = optionValue === currentTrackVideoConfig.category;

      option.hidden = !isAllowedOption;
      option.disabled = !isAllowedOption;
    });

    videoCategorySelect.value = currentTrackVideoConfig.category;
  }
}

function resetTrackLockedCategorySelection() {
  if (videoCategorySelect && currentTrackVideoConfig) {
    videoCategorySelect.value = currentTrackVideoConfig.category;
  }
}

function addVideoToCategory({ title, category, duration, videoLink, thumbnailLink }) {
  if (!isAllowedCategory(category)) {
    return;
  }

  const sectionKey = categorySectionMap[category];
  if (!sectionKey) {
    return;
  }

  const targetSection = document.querySelector(`[data-category-section="${sectionKey}"]`);
  const targetGrid = targetSection ? targetSection.querySelector(".video-grid") : null;

  if (!targetGrid) {
    return;
  }

  targetGrid.insertAdjacentHTML(
    "beforeend",
    createVideoCardMarkup({ title, duration, videoLink, thumbnailLink })
  );

  targetSection.hidden = false;

  if (typeof targetSection.refreshCarousel === "function") {
    targetSection.refreshCarousel();
  }
}

function syncVideoLibraryEmptyState(availableVideoCount) {
  const firstSection = document.querySelector(".video-category");
  if (!firstSection?.parentNode) {
    return;
  }

  let emptyState = document.getElementById("expertVideoLibraryEmptyState");

  if (availableVideoCount > 0) {
    if (emptyState) {
      emptyState.remove();
    }
    return;
  }

  if (!emptyState) {
    emptyState = document.createElement("div");
    emptyState.id = "expertVideoLibraryEmptyState";
    emptyState.className = "empty-state";
    emptyState.textContent = currentTrackVideoConfig
      ? `No ${currentTrackVideoConfig.emptyStateLabel} videos are available for your company yet. Add one to see it here.`
      : "No videos are available for your company yet. Add a company video to see it here.";
    firstSection.parentNode.insertBefore(emptyState, firstSection);
  }
}

function renderStoredVideos() {
  if (!window.videoLibraryStore) {
    return;
  }

  document.querySelectorAll(".video-grid .video-card").forEach((card) => {
    card.remove();
  });

  window.videoLibraryStore.readVideos(currentExpertCompanyContext).forEach((video) => {
    if (!isAllowedCategory(video.category)) {
      return;
    }

    const sectionKey = categorySectionMap[video.category];
    const targetSection = document.querySelector(`[data-category-section="${sectionKey}"]`);
    const targetGrid = targetSection ? targetSection.querySelector(".video-grid") : null;

    if (!targetGrid) {
      return;
    }

    targetGrid.insertAdjacentHTML(
      "beforeend",
      createVideoCardMarkup(video)
    );
  });

  updateSectionVisibility();

  const availableVideoCount = getAllowedCards().length;
  syncVideoLibraryEmptyState(availableVideoCount);

  if (videoSearchInput) {
    videoSearchInput.dispatchEvent(new Event("input"));
  }
}

async function refreshExpertVideoLibrary() {
  if (window.videoLibraryStore?.syncVideosFromBackend) {
    await window.videoLibraryStore.syncVideosFromBackend(currentExpertCompanyContext);
  }

  renderStoredVideos();
}

function getCardsPerView() {
  if (window.innerWidth <= 700) {
    return 1;
  }

  if (window.innerWidth <= 1100) {
    return 2;
  }

  return 3;
}

function openVideoModal() {
  if (!canCreateWellnessClientFeatures) {
    alert("Wellness expert create access is disabled for the video library.");
    return;
  }

  if (!videoModalOverlay) {
    return;
  }

  resetVideoFormValidation();
  resetTrackLockedCategorySelection();
  videoModalOverlay.hidden = false;
  document.body.classList.add("video-modal-open");
}

function closeVideoModal() {
  if (!videoModalOverlay) {
    return;
  }

  videoModalOverlay.hidden = true;
  document.body.classList.remove("video-modal-open");
}

function setVideoFormMessage(message = "") {
  if (!videoFormError) {
    return;
  }

  videoFormError.textContent = message;
  videoFormError.hidden = !message;
}

function setFieldErrorState(field, showError) {
  if (!field) {
    return;
  }

  const fieldInput = field.querySelector("input, select, textarea");
  const fieldError = field.querySelector(".video-field-error");

  field.classList.toggle("has-error", Boolean(showError));

  if (fieldInput) {
    fieldInput.setAttribute("aria-invalid", showError ? "true" : "false");
  }

  if (fieldError) {
    fieldError.hidden = !showError;
  }
}

function validateVideoFormField(field) {
  const fieldInput = field?.querySelector("input, select, textarea");
  if (!fieldInput) {
    return true;
  }

  const value = String(fieldInput.value || "").trim();
  const isValid = Boolean(value) && fieldInput.checkValidity();
  setFieldErrorState(field, !isValid);
  return isValid;
}

function resetVideoFormValidation() {
  setVideoFormMessage("");
  document.querySelectorAll(".video-field").forEach((field) => {
    setFieldErrorState(field, false);
  });
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

if (expertWelcomeMessage) {
  expertWelcomeMessage.textContent = `Welcome back, ${currentExpertFirstName}!`;
}

configureTrackSpecificLibraryView();

[
  ["navHome", expertHomeRoute],
  ["navConsultation", "Wellness_Consultation_Dashboard.html"],
  ["navEmployeeCheckins", "Expert_Employee_Checkins.html"],
  ["navLiveSession", "Expert_Live_Session.html"],
  ["navVideoLibrary", "Expert_Video_Library.html"],
].forEach(([id, target]) => {
  const link = document.getElementById(id);
  if (!link) {
    return;
  }

  link.addEventListener("click", (event) => {
    event.preventDefault();
    window.location.href = target;
  });
});

if (profileNavIcon) {
  profileNavIcon.addEventListener("click", openProfileOverlay);
}

if (profileDrawerBackBtn) {
  profileDrawerBackBtn.addEventListener("click", closeProfileOverlay);
}

if (editProfileDrawerBtn) {
  editProfileDrawerBtn.addEventListener("click", () => {
    closeProfileOverlay();
  });
}

if (logoutDrawerBtn) {
  logoutDrawerBtn.addEventListener("click", closeProfileOverlay);
}

if (profileOverlay) {
  profileOverlay.addEventListener("click", (event) => {
    if (event.target === profileOverlay) {
      closeProfileOverlay();
    }
  });
}

if (openAddVideoModalBtn) {
  openAddVideoModalBtn.addEventListener("click", openVideoModal);
}

if (closeAddVideoModalBtn) {
  closeAddVideoModalBtn.addEventListener("click", () => {
    closeVideoModal();
    videoModalForm?.reset();
    resetTrackLockedCategorySelection();
    resetVideoFormValidation();
  });
}

if (cancelAddVideoModalBtn) {
  cancelAddVideoModalBtn.addEventListener("click", () => {
    closeVideoModal();
    videoModalForm?.reset();
    resetTrackLockedCategorySelection();
    resetVideoFormValidation();
  });
}

if (videoModalForm) {
  videoModalForm.querySelectorAll("input, select, textarea").forEach((fieldInput) => {
    fieldInput.addEventListener("input", () => {
      validateVideoFormField(fieldInput.closest(".video-field"));

      const hasError = videoModalForm.querySelector(".video-field.has-error");
      if (!hasError) {
        setVideoFormMessage("");
      }
    });

    fieldInput.addEventListener("change", () => {
      validateVideoFormField(fieldInput.closest(".video-field"));

      const hasError = videoModalForm.querySelector(".video-field.has-error");
      if (!hasError) {
        setVideoFormMessage("");
      }
    });
  });

  videoModalForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!canCreateWellnessClientFeatures) {
      setVideoFormMessage("Wellness expert create access is disabled for the video library.");
      return;
    }

    const fields = Array.from(videoModalForm.querySelectorAll(".video-field"));
    const invalidFields = fields.filter((field) => !validateVideoFormField(field));

    if (invalidFields.length) {
      setVideoFormMessage("Please add content here for the highlighted fields.");
      const firstInvalidInput = invalidFields[0]?.querySelector("input, select, textarea");
      firstInvalidInput?.focus();
      return;
    }

    setVideoFormMessage("");
    const formData = new FormData(videoModalForm);
    const title = String(formData.get("title") || "").trim();
    const category = String(formData.get("category") || "").trim();
    const duration = String(formData.get("duration") || "").trim();
    const videoLink = String(formData.get("videoLink") || "").trim();
    const thumbnailLink = String(formData.get("thumbnailLink") || "").trim();
    const description = String(formData.get("description") || "").trim();

    if (!isAllowedCategory(category)) {
      setVideoFormMessage("You can only add videos for your own wellness specialization.");
      videoCategorySelect?.focus();
      return;
    }

    if (window.videoLibraryStore) {
      const result = await window.videoLibraryStore.createVideo({
        title,
        category,
        duration,
        videoLink,
        thumbnailLink,
        description,
        creatorExpertId: String(currentExpert?.id || "").trim(),
        companyId: currentExpertCompanyContext.companyId,
        companyName: currentExpertCompanyContext.companyName,
      });

      if (!result?.ok) {
        setVideoFormMessage(result?.error || "The video could not be added right now.");
        return;
      }

      await refreshExpertVideoLibrary();
    } else {
      addVideoToCategory({
        title,
        category,
        duration,
        videoLink,
        thumbnailLink,
      });
    }

    if (videoSearchInput) {
      videoSearchInput.dispatchEvent(new Event("input"));
    }

    closeVideoModal();
    videoModalForm.reset();
    resetTrackLockedCategorySelection();
    resetVideoFormValidation();
  });
}

if (videoModalOverlay) {
  videoModalOverlay.addEventListener("click", (event) => {
    if (event.target === videoModalOverlay) {
      closeVideoModal();
      videoModalForm?.reset();
      resetTrackLockedCategorySelection();
      resetVideoFormValidation();
    }
  });
}

if (videoSearchInput) {
  videoSearchInput.addEventListener("input", () => {
    const query = videoSearchInput.value.trim().toLowerCase();

    getAllowedSections().forEach((section) => {
      const cards = Array.from(section.querySelectorAll(".video-card"));

      cards.forEach((card) => {
        const title = (card.dataset.title || "").toLowerCase();
        const matches = !query || title.includes(query);
        card.hidden = !matches;
      });
    });

    updateSectionVisibility({ visibleOnly: true });
    syncVideoLibraryEmptyState(getAllowedCards({ visibleOnly: true }).length);
  });
}

document.querySelectorAll(".video-category").forEach((section) => {
  const track = section.querySelector(".video-grid");
  const prevButton = section.querySelector('[data-direction="prev"]');
  const nextButton = section.querySelector('[data-direction="next"]');
  let currentIndex = 0;

  function getVisibleCards() {
    return Array.from(track.querySelectorAll(".video-card")).filter((card) => !card.hidden);
  }

  function updateCarousel() {
    const visibleCards = getVisibleCards();
    const cardsPerView = getCardsPerView();
    const maxIndex = Math.max(visibleCards.length - cardsPerView, 0);
    currentIndex = Math.min(currentIndex, maxIndex);

    let translate = 0;

    if (visibleCards.length > 0 && visibleCards[currentIndex]) {
      translate = visibleCards[currentIndex].offsetLeft;
    }

    track.style.transform = `translateX(-${translate}px)`;

    if (prevButton) {
      prevButton.disabled = currentIndex === 0;
    }

    if (nextButton) {
      nextButton.disabled = currentIndex >= maxIndex;
    }
  }

  if (prevButton) {
    prevButton.addEventListener("click", () => {
      currentIndex -= 1;
      updateCarousel();
    });
  }

  if (nextButton) {
    nextButton.addEventListener("click", () => {
      currentIndex += 1;
      updateCarousel();
    });
  }

  section.refreshCarousel = updateCarousel;
  window.addEventListener("resize", updateCarousel);
  updateCarousel();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeProfileOverlay();
    closeVideoModal();
    videoModalForm?.reset();
    resetTrackLockedCategorySelection();
    resetVideoFormValidation();
  }
});

window.addEventListener("storage", (event) => {
  if (event.key && event.key !== "stackbuilders.videoLibrary.v1") {
    return;
  }

  renderStoredVideos();
});

void refreshExpertVideoLibrary();
