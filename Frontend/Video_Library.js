const videoLibraryRole = new URLSearchParams(window.location.search).get("role") === "wellness"
  ? "wellness"
  : "employee";
const employeeAuthStore = window.employeeAuthStore || null;
const currentEmployee =
  videoLibraryRole === "employee"
    ? employeeAuthStore?.requireEmployeeSession({ redirectTo: "homepage.html" })
    : null;
const currentEmployeeName = currentEmployee?.name || "Employee";
const currentEmployeeFirstName =
  currentEmployeeName.split(/\s+/).filter(Boolean)[0] || currentEmployeeName;

const videoLibraryRoutes = {
  employee: {
    navHome: "Employee_Dashbaord.html",
    navConsultation: "Employee_Consultation2.html",
    navLiveSession: "Live_Session.html",
    navVideoLibrary: "Video_Library.html?role=employee",
  },
  wellness: {
    navHome: "Wellness_Dashboard.html",
    navConsultation: "Consultation_Dashboard.html",
    navLiveSession: "Expert_Live_Session.html",
    navVideoLibrary: "Video_Library.html?role=wellness",
  },
};

Object.entries(videoLibraryRoutes[videoLibraryRole]).forEach(([id, target]) => {
  const link = document.getElementById(id);
  if (!link) {
    return;
  }

  link.href = target;
});

const profileNavIcon = document.getElementById("profileNavIcon");
const employeeWelcomeMessage = document.getElementById("employeeWelcomeMessage");
const profileOverlay = document.getElementById("profileOverlay");
const profileDrawerBackBtn = document.getElementById("profileDrawerBackBtn");
const profileFrame = document.getElementById("profileFrame");
const editProfileDrawerBtn = document.getElementById("editProfileDrawerBtn");
const logoutDrawerBtn = document.getElementById("logoutDrawerBtn");
const openAddVideoModalBtn = document.getElementById("openAddVideoModalBtn");
const videoModalOverlay = document.getElementById("videoModalOverlay");
const closeAddVideoModalBtn = document.getElementById("closeAddVideoModalBtn");
const cancelAddVideoModalBtn = document.getElementById("cancelAddVideoModalBtn");
const videoSearchInput = document.getElementById("videoSearchInput");
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

    targetGrid.insertAdjacentHTML("beforeend", createVideoCardMarkup(video));
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

if (profileNavIcon) {
  profileNavIcon.addEventListener("click", openProfileOverlay);
}

if (employeeWelcomeMessage && videoLibraryRole === "employee") {
  employeeWelcomeMessage.textContent = `Welcome back, ${currentEmployeeFirstName}!`;
}

if (profileFrame) {
  profileFrame.src = `profile.html?role=${videoLibraryRole}`;
}

if (profileDrawerBackBtn) {
  profileDrawerBackBtn.addEventListener("click", closeProfileOverlay);
}

if (editProfileDrawerBtn) {
  editProfileDrawerBtn.addEventListener("click", () => {
    const profileTarget = videoLibraryRole === "wellness"
      ? "Wellness_ManageProfile.html"
      : "Employee_ManageProfile.html";
    window.location.href = profileTarget;
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
  closeAddVideoModalBtn.addEventListener("click", closeVideoModal);
}

if (cancelAddVideoModalBtn) {
  cancelAddVideoModalBtn.addEventListener("click", closeVideoModal);
}

const videoModalForm = document.querySelector(".video-modal-form");

if (videoModalForm) {
  videoModalForm.addEventListener("submit", (event) => {
    event.preventDefault();
    closeVideoModal();
    videoModalForm.reset();
  });
}

if (videoModalOverlay) {
  videoModalOverlay.addEventListener("click", (event) => {
    if (event.target === videoModalOverlay) {
      closeVideoModal();
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
  }
});

window.addEventListener("storage", (event) => {
  if (event.key && event.key !== "stackbuilders.videoLibrary.v1") {
    return;
  }

  renderStoredVideos();
});

renderStoredVideos();
