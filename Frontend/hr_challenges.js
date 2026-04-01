const challengeModal = document.getElementById("challengeModal");
const rewardModal = document.getElementById("rewardModal");
const hrAuthStore = window.hrAuthStore || null;
const currentHr = hrAuthStore?.requireHrSession({
  redirectTo: "homepage.html",
});
const currentHrName = currentHr?.name || "HR";
const currentHrFirstName =
  currentHrName.split(/\s+/).filter(Boolean)[0] || currentHrName;
const hrWelcomeMessage = document.getElementById("hrWelcomeMessage");
const openChallengeModalButton = document.getElementById("openChallengeModal");
const openRewardModalButton = document.getElementById("openRewardModal");
const scrollTopButton = document.querySelector(".scroll-top-btn");
const challengeGrid = document.getElementById("challengeGrid");
const rewardGrid = document.getElementById("rewardGrid");
const challengeForm = challengeModal ? challengeModal.querySelector(".challenge-form") : null;
const rewardForm = document.getElementById("rewardForm");
const rewardFormMessage = document.getElementById("rewardFormMessage");
const prevHrRewardsBtn = document.getElementById("prevHrRewardsBtn");
const nextHrRewardsBtn = document.getElementById("nextHrRewardsBtn");
const prevChallengesBtn = document.getElementById("prevChallengesBtn");
const nextChallengesBtn = document.getElementById("nextChallengesBtn");
const profileNavIcon = document.getElementById("profileNavIcon");
const profileOverlay = document.getElementById("profileOverlay");
const profileDrawerBackBtn = document.getElementById("profileDrawerBackBtn");

if (hrWelcomeMessage) {
  hrWelcomeMessage.textContent = `Welcome, ${currentHrFirstName}`;
}

const hrChallengesPerPage = 3;
const hrRewardsPerPage = 3;
let hrChallengePageIndex = 0;
let hrRewardPageIndex = 0;

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

function isAnyModalOpen() {
  return Boolean(
    (challengeModal && !challengeModal.hidden) || (rewardModal && !rewardModal.hidden)
  );
}

function syncBodyLock() {
  document.body.classList.toggle("modal-open", isAnyModalOpen());
}

function openModal(modal) {
  if (!modal) return;
  modal.hidden = false;
  syncBodyLock();
}

function closeModal(modal) {
  if (!modal) return;
  modal.hidden = true;
  syncBodyLock();
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

function formatDeadline(deadline) {
  if (!deadline) return "No deadline";

  const date = new Date(deadline);
  if (Number.isNaN(date.getTime())) return deadline;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getChallengeIcon(type) {
  const normalized = (type || "").toLowerCase();

  if (normalized.includes("fitness")) return "fa-solid fa-shoe-prints";
  if (normalized.includes("health")) return "fa-solid fa-heart-pulse";
  if (normalized.includes("wellness")) return "fa-solid fa-spa";
  if (normalized.includes("community")) return "fa-solid fa-users";

  return "fa-solid fa-trophy";
}

function getRewardTheme(index) {
  const themes = ["reward-card-green", "reward-card-blue", "reward-card-gold"];
  return themes[index % themes.length];
}

function getRewardBadge(index) {
  const badges = [
    { icon: "fa-solid fa-gift", text: "Popular" },
    { icon: "fa-solid fa-star", text: "Featured" },
    { icon: "fa-solid fa-crown", text: "Premium" },
  ];

  return badges[index % badges.length];
}

function createEmptyState(message) {
  const empty = document.createElement("div");
  empty.className = "empty-state";
  empty.textContent = message;
  return empty;
}

function setRewardFormMessage(message) {
  if (!rewardFormMessage) return;

  if (!message) {
    rewardFormMessage.hidden = true;
    rewardFormMessage.textContent = "";
    return;
  }

  rewardFormMessage.hidden = false;
  rewardFormMessage.textContent = message;
}

function renderChallenges() {
  if (!challengeGrid) return;

  const challenges = readChallenges();
  challengeGrid.innerHTML = "";

  if (!challenges.length) {
    challengeGrid.appendChild(
      createEmptyState("No active challenges yet. Create a challenge to see it here.")
    );

    if (prevChallengesBtn) prevChallengesBtn.disabled = true;
    if (nextChallengesBtn) nextChallengesBtn.disabled = true;
    return;
  }

  const totalPages = Math.ceil(challenges.length / hrChallengesPerPage);
  if (hrChallengePageIndex >= totalPages) {
    hrChallengePageIndex = Math.max(0, totalPages - 1);
  }

  const startIndex = hrChallengePageIndex * hrChallengesPerPage;
  const visibleChallenges = challenges.slice(startIndex, startIndex + hrChallengesPerPage);

  visibleChallenges.forEach((challenge) => {
    const card = document.createElement("article");
    card.className = "challenge-card";
    card.innerHTML = `
      <div class="challenge-title-row">
        <div class="challenge-mark"><i class="${getChallengeIcon(challenge.type)}" aria-hidden="true"></i></div>
        <div>
          <h3>${escapeHtml(challenge.name)}</h3>
          <span class="challenge-tag">${escapeHtml(challenge.type || "General")}</span>
        </div>
      </div>
      <div class="challenge-metrics">
        <div class="metric-box">
          <span class="metric-label">Reward</span>
          <strong>${escapeHtml(challenge.reward)}</strong>
        </div>
        <div class="metric-box">
          <span class="metric-label">Deadline</span>
          <strong>${escapeHtml(formatDeadline(challenge.deadline))}</strong>
        </div>
        <div class="metric-box">
          <span class="metric-label">Goal</span>
          <strong>${escapeHtml(challenge.goal)}</strong>
        </div>
      </div>
    `;
    challengeGrid.appendChild(card);
  });

  if (prevChallengesBtn) {
    prevChallengesBtn.disabled = hrChallengePageIndex === 0;
  }

  if (nextChallengesBtn) {
    nextChallengesBtn.disabled = hrChallengePageIndex >= totalPages - 1;
  }
}

function renderRewards() {
  if (!rewardGrid) return;

  const rewards = readRewards();
  rewardGrid.innerHTML = "";

  if (!rewards.length) {
    rewardGrid.appendChild(
      createEmptyState("No rewards in the catalog yet. Create a reward to display it here.")
    );

    if (prevHrRewardsBtn) prevHrRewardsBtn.disabled = true;
    if (nextHrRewardsBtn) nextHrRewardsBtn.disabled = true;
    return;
  }

  const totalPages = Math.ceil(rewards.length / hrRewardsPerPage);
  if (hrRewardPageIndex >= totalPages) {
    hrRewardPageIndex = Math.max(0, totalPages - 1);
  }

  const startIndex = hrRewardPageIndex * hrRewardsPerPage;
  const visibleRewards = rewards.slice(startIndex, startIndex + hrRewardsPerPage);

  visibleRewards.forEach((reward, index) => {
    const badge = getRewardBadge(index);
    const card = document.createElement("article");
    card.className = `reward-card ${getRewardTheme(index)}`;
    card.innerHTML = `
      <div class="reward-badge">
        <i class="${badge.icon}" aria-hidden="true"></i>
        ${escapeHtml(badge.text)}
      </div>
      <img class="reward-image" src="${escapeHtml(reward.imageUrl)}" alt="${escapeHtml(reward.name)}" />
      <h3>${escapeHtml(reward.name)}</h3>
      <p>${escapeHtml(reward.description)}</p>
      <div class="reward-meta">
        <span>${escapeHtml(reward.points)}</span>
        <span>Claimable: ${escapeHtml(reward.claimableCount || "0")}</span>
        <span>Claimed: ${escapeHtml(reward.claimedCount || "0")}</span>
      </div>
    `;
    rewardGrid.appendChild(card);
  });

  if (prevHrRewardsBtn) {
    prevHrRewardsBtn.disabled = hrRewardPageIndex === 0;
  }

  if (nextHrRewardsBtn) {
    nextHrRewardsBtn.disabled = hrRewardPageIndex >= totalPages - 1;
  }
}

if (openChallengeModalButton) {
  openChallengeModalButton.addEventListener("click", () => openModal(challengeModal));
}

if (openRewardModalButton) {
  openRewardModalButton.addEventListener("click", () => {
    setRewardFormMessage("");
    openModal(rewardModal);
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

if (prevHrRewardsBtn) {
  prevHrRewardsBtn.addEventListener("click", () => {
    if (hrRewardPageIndex === 0) return;
    hrRewardPageIndex -= 1;
    renderRewards();
  });
}

if (nextHrRewardsBtn) {
  nextHrRewardsBtn.addEventListener("click", () => {
    const rewards = readRewards();
    const totalPages = Math.ceil(rewards.length / hrRewardsPerPage);
    if (hrRewardPageIndex >= totalPages - 1) return;
    hrRewardPageIndex += 1;
    renderRewards();
  });
}

if (prevChallengesBtn) {
  prevChallengesBtn.addEventListener("click", () => {
    if (hrChallengePageIndex === 0) return;
    hrChallengePageIndex -= 1;
    renderChallenges();
  });
}

if (nextChallengesBtn) {
  nextChallengesBtn.addEventListener("click", () => {
    const challenges = readChallenges();
    const totalPages = Math.ceil(challenges.length / hrChallengesPerPage);
    if (hrChallengePageIndex >= totalPages - 1) return;
    hrChallengePageIndex += 1;
    renderChallenges();
  });
}

[challengeModal, rewardModal].forEach((modal) => {
  if (!modal) return;

  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      closeModal(modal);
    }
  });
});

if (challengeModal) {
  challengeModal.querySelectorAll("[data-close-modal]").forEach((button) => {
    button.addEventListener("click", () => closeModal(challengeModal));
  });
}

if (rewardModal) {
  rewardModal.querySelectorAll("[data-close-reward-modal]").forEach((button) => {
    button.addEventListener("click", () => {
      setRewardFormMessage("");
      closeModal(rewardModal);
    });
  });
}

if (challengeForm) {
  challengeForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(challengeForm);
    const newChallenge = createChallengeRecord({
      name: formData.get("challengeName") || challengeForm.querySelector("#challengeName")?.value || "",
      type: formData.get("challengeTitle") || challengeForm.querySelector("#challengeTitle")?.value || "",
      reward: formData.get("challengeReward") || challengeForm.querySelector("#challengeReward")?.value || "",
      deadline: formData.get("challengeDeadline") || challengeForm.querySelector("#challengeDeadline")?.value || "",
      goal: formData.get("challengeGoal") || challengeForm.querySelector("#challengeGoal")?.value || "",
    });

    if (!newChallenge.name || !newChallenge.type || !newChallenge.reward || !newChallenge.goal) {
      return;
    }

    const challenges = readChallenges();
    challenges.unshift(newChallenge);
    writeChallenges(challenges);

    hrChallengePageIndex = 0;
    challengeForm.reset();
    renderChallenges();
    closeModal(challengeModal);
  });
}

if (rewardForm) {
  rewardForm.addEventListener("submit", (event) => {
    event.preventDefault();
    setRewardFormMessage("");

    const formData = new FormData(rewardForm);
    const newReward = createRewardRecord({
      imageUrl: formData.get("rewardImageUrl") || rewardForm.querySelector("#rewardImageUrl")?.value || "",
      name: formData.get("rewardName") || rewardForm.querySelector("#rewardName")?.value || "",
      description:
        formData.get("rewardDescription") ||
        rewardForm.querySelector("#rewardDescription")?.value ||
        "",
      points: formData.get("rewardPoints") || rewardForm.querySelector("#rewardPoints")?.value || "",
      claimableCount:
        formData.get("rewardClaimableCount") ||
        rewardForm.querySelector("#rewardClaimableCount")?.value ||
        "",
      claimedCount: "0",
    });

    if (!newReward.imageUrl || !newReward.name || !newReward.description || !newReward.points) {
      setRewardFormMessage("Please fill in the image URL, reward name, description, and points needed.");
      return;
    }

    if (!newReward.claimableCount) {
      setRewardFormMessage("Please enter how many people can claim the reward.");
      return;
    }

    if (Number(newReward.claimableCount) < 1) {
      setRewardFormMessage("The number of people who can claim the reward must be at least 1.");
      return;
    }

    const rewards = readRewards();
    rewards.unshift(newReward);
    writeRewards(rewards);

    hrRewardPageIndex = 0;

    rewardForm.reset();
    setRewardFormMessage("");
    renderRewards();
    closeModal(rewardModal);
  });
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    if (challengeModal && !challengeModal.hidden) closeModal(challengeModal);
    if (rewardModal && !rewardModal.hidden) closeModal(rewardModal);
    closeProfileOverlay();
  }
});

function syncScrollTopButton() {
  if (!scrollTopButton) return;
  scrollTopButton.classList.toggle("is-visible", window.scrollY > 300);
}

if (scrollTopButton) {
  scrollTopButton.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

function rerenderAll() {
  renderChallenges();
  renderRewards();
}

window.addEventListener("scroll", syncScrollTopButton);
window.addEventListener("storage", rerenderAll);

rerenderAll();
syncScrollTopButton();
