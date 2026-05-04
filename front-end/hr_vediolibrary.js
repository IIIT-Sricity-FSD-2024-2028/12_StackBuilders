const hrVideoSearchInput = document.getElementById("hrVideoSearchInput");
const hrAuthStore = window.hrAuthStore || null;
const rolePermissionsStore = window.rolePermissionsStore || null;
const currentHr = hrAuthStore?.requireHrSession({
  redirectTo: "homepage.html",
});
const currentHrName = currentHr?.name || "HR";
const currentHrFirstName =
  currentHrName.split(/\s+/).filter(Boolean)[0] || currentHrName;
const currentHrCompanyContext = {
  companyId: String(currentHr?.companyId || "").trim(),
  companyName: String(currentHr?.companyName || "").trim(),
};
const hrPermissionGroup = "hr";
const hrWelcomeMessage = document.getElementById("hrWelcomeMessage");
const profileNavIcon = document.getElementById("profileNavIcon");
const profileOverlay = document.getElementById("profileOverlay");
const profileDrawerBackBtn = document.getElementById("profileDrawerBackBtn");
const hrChallengesNavLink = document.querySelector('.nav-links a[href="hr_challenges.html"]');
const hrCategorySectionMap = {
  "Health Related": "health",
  "Mind Relaxation": "mind",
  "Physical Wellness": "physical",
};

rolePermissionsStore?.watchPermissions(hrPermissionGroup);
rolePermissionsStore?.guardPageAccess({
  group: hrPermissionGroup,
  anyOf: ["client-management-read"],
  title: "Video library access is disabled",
  message:
    "Ask the admin to enable Company Management read access for HR before opening the video library.",
});
rolePermissionsStore?.restrictElement(
  hrChallengesNavLink,
  rolePermissionsStore?.hasPermission(hrPermissionGroup, "challenge-management-read") ?? true
);

if (hrWelcomeMessage) {
  hrWelcomeMessage.textContent = `Welcome, ${currentHrFirstName}`;
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

function getHrCardsPerView() {
  if (window.innerWidth <= 700) {
    return 1;
  }

  if (window.innerWidth <= 1100) {
    return 2;
  }

  return 3;
}

function escapeHrHtml(value) {
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

function createHrVideoCardMarkup({ title, duration, videoLink, thumbnailLink, creatorExpertName }) {
  const safeTitle = escapeHrHtml(title);
  const safeDuration = escapeHrHtml(duration || "00:00");
  const safeVideoLink = escapeHrHtml(videoLink || "#");
  const safeThumbnailLink = escapeHrHtml(
    thumbnailLink ||
      "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=900&q=80"
  );
  const safeUploader = escapeHrHtml(creatorExpertName || "Wellness Expert");

  return `
    <article class="video-card" data-title="${safeTitle}" data-custom-video="true">
      <a class="thumbnail" href="${safeVideoLink}" target="_blank" rel="noopener noreferrer">
        <img src="${safeThumbnailLink}" alt="${safeTitle}">
        <span class="duration">${safeDuration}</span>
      </a>
      <div class="card-body">
        <h3>${safeTitle}</h3>
        <span class="video-uploader-tag">Uploaded by ${safeUploader}</span>
      </div>
    </article>
  `;
}

function syncHrVideoLibraryEmptyState(availableVideoCount) {
  const firstSection = document.querySelector(".video-category");
  if (!firstSection?.parentNode) {
    return;
  }

  let emptyState = document.getElementById("hrVideoLibraryEmptyState");

  if (availableVideoCount > 0) {
    if (emptyState) {
      emptyState.remove();
    }
    return;
  }

  if (!emptyState) {
    emptyState = document.createElement("div");
    emptyState.id = "hrVideoLibraryEmptyState";
    emptyState.className = "empty-state";
    emptyState.textContent =
      "No company videos are available yet. Ask a wellness expert from your company to add one.";
    firstSection.parentNode.insertBefore(emptyState, firstSection);
  }
}

function renderHrStoredVideos() {
  if (!window.videoLibraryStore) {
    return;
  }

  document.querySelectorAll(".video-grid .video-card").forEach((card) => {
    card.remove();
  });

  window.videoLibraryStore.readVideos(currentHrCompanyContext).forEach((video) => {
    const sectionKey = hrCategorySectionMap[video.category];
    const targetSection = document.querySelector(`[data-category-section="${sectionKey}"]`);
    const targetGrid = targetSection ? targetSection.querySelector(".video-grid") : null;

    if (!targetGrid) {
      return;
    }

    targetGrid.insertAdjacentHTML("beforeend", createHrVideoCardMarkup(video));
  });

  document.querySelectorAll(".video-category").forEach((section) => {
    section.hidden = !section.querySelector(".video-card");

    if (typeof section.refreshCarousel === "function") {
      section.refreshCarousel();
    }
  });

  const availableVideoCount = document.querySelectorAll(".video-grid .video-card").length;
  syncHrVideoLibraryEmptyState(availableVideoCount);

  if (hrVideoSearchInput) {
    hrVideoSearchInput.dispatchEvent(new Event("input"));
  }
}

async function refreshHrVideoLibrary() {
  if (window.videoLibraryStore?.syncVideosFromBackend) {
    await window.videoLibraryStore.syncVideosFromBackend(currentHrCompanyContext);
  }

  renderHrStoredVideos();
}

if (hrVideoSearchInput) {
  hrVideoSearchInput.addEventListener("input", () => {
    const query = hrVideoSearchInput.value.trim().toLowerCase();

    document.querySelectorAll(".video-category").forEach((section) => {
      const cards = Array.from(section.querySelectorAll(".video-card"));
      let visibleCount = 0;

      cards.forEach((card) => {
        const title = (card.dataset.title || card.querySelector("h3")?.textContent || "").toLowerCase();
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
    const cardsPerView = getHrCardsPerView();
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

window.addEventListener("storage", (event) => {
  if (event.key && event.key !== "stackbuilders.videoLibrary.v1") {
    return;
  }

  renderHrStoredVideos();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeProfileOverlay();
  }
});

void refreshHrVideoLibrary();
