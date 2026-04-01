const expertAuthStore = window.expertAuthStore || null;
const currentExpert = expertAuthStore?.requireExpertSession({
  redirectTo: "homepage.html",
});
const currentExpertName = currentExpert?.name || "Wellness Expert";
const currentExpertFirstName =
  currentExpertName.split(/\s+/).filter(Boolean)[0] || currentExpertName;

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
const categorySectionMap = {
  "Health Related": "health",
  "Mind Relaxation": "mind",
  "Physical Wellness": "physical",
};

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

function createVideoCardMarkup({ title, duration, videoLink, thumbnailLink }) {
  const safeTitle = escapeHtml(title);
  const safeDuration = escapeHtml(duration || "00:00");
  const safeVideoLink = escapeHtml(videoLink || "#");
  const safeThumbnailLink = escapeHtml(
    thumbnailLink ||
      "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=900&q=80"
  );

  return `
    <article class="video-card" data-title="${safeTitle}" data-custom-video="true">
      <a class="thumbnail" href="${safeVideoLink}">
        <img src="${safeThumbnailLink}" alt="${safeTitle}" />
        <span class="duration">${safeDuration}</span>
      </a>
      <div class="card-body">
        <h3>${safeTitle}</h3>
      </div>
    </article>
  `;
}

function addVideoToCategory({ title, category, duration, videoLink, thumbnailLink }) {
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

function renderStoredVideos() {
  if (!window.videoLibraryStore) {
    return;
  }

  document.querySelectorAll(".video-grid .video-card[data-custom-video='true']").forEach((card) => {
    card.remove();
  });

  window.videoLibraryStore.readVideos().forEach((video) => {
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

  document.querySelectorAll(".video-category").forEach((section) => {
    section.hidden = !section.querySelector(".video-card");

    if (typeof section.refreshCarousel === "function") {
      section.refreshCarousel();
    }
  });

  if (videoSearchInput) {
    videoSearchInput.dispatchEvent(new Event("input"));
  }
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
  if (!videoModalOverlay) {
    return;
  }

  resetVideoFormValidation();
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
  const isValid = Boolean(value);
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
    resetVideoFormValidation();
  });
}

if (cancelAddVideoModalBtn) {
  cancelAddVideoModalBtn.addEventListener("click", () => {
    closeVideoModal();
    videoModalForm?.reset();
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

  videoModalForm.addEventListener("submit", (event) => {
    event.preventDefault();

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

    if (window.videoLibraryStore) {
      window.videoLibraryStore.addVideo({
        title,
        category,
        duration,
        videoLink,
        thumbnailLink,
        description,
      });

      renderStoredVideos();
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
    resetVideoFormValidation();
  });
}

if (videoModalOverlay) {
  videoModalOverlay.addEventListener("click", (event) => {
    if (event.target === videoModalOverlay) {
      closeVideoModal();
      videoModalForm?.reset();
      resetVideoFormValidation();
    }
  });
}

if (videoSearchInput) {
  videoSearchInput.addEventListener("input", () => {
    const query = videoSearchInput.value.trim().toLowerCase();

    document.querySelectorAll(".video-category").forEach((section) => {
      const cards = Array.from(section.querySelectorAll(".video-card"));
      let visibleCount = 0;

      cards.forEach((card) => {
        const title = (card.dataset.title || "").toLowerCase();
        const matches = !query || title.includes(query);
        card.hidden = !matches;

        if (matches) {
          visibleCount += 1;
        }
      });

      section.hidden = visibleCount === 0;

      if (typeof section.refreshCarousel === "function") {
        section.refreshCarousel();
      }
    });
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
    resetVideoFormValidation();
  }
});

window.addEventListener("storage", (event) => {
  if (event.key && event.key !== "stackbuilders.videoLibrary.v1") {
    return;
  }

  renderStoredVideos();
});

renderStoredVideos();
