const challengeModal = document.getElementById("challengeModal");
const rewardModal = document.getElementById("rewardModal");
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
const canReadHrChallenges =
  rolePermissionsStore?.hasPermission(hrPermissionGroup, "challenge-management-read") ?? true;
const canCreateHrChallenges =
  rolePermissionsStore?.hasPermission(hrPermissionGroup, "challenge-management-create") ?? true;
const canDeleteHrChallenges =
  rolePermissionsStore?.hasPermission(hrPermissionGroup, "challenge-management-delete") ?? true;
const hrWelcomeMessage = document.getElementById("hrWelcomeMessage");
const openChallengeModalButton = document.getElementById("openChallengeModal");
const openRewardModalButton = document.getElementById("openRewardModal");
const scrollTopButton = document.querySelector(".scroll-top-btn");
const challengeGrid = document.getElementById("challengeGrid");
const rewardGrid = document.getElementById("rewardGrid");
const challengeForm = challengeModal ? challengeModal.querySelector(".challenge-form") : null;
const challengeFormMessage = document.getElementById("challengeFormMessage");
const rewardForm = document.getElementById("rewardForm");
const rewardFormMessage = document.getElementById("rewardFormMessage");
const prevHrRewardsBtn = document.getElementById("prevHrRewardsBtn");
const nextHrRewardsBtn = document.getElementById("nextHrRewardsBtn");
const prevChallengesBtn = document.getElementById("prevChallengesBtn");
const nextChallengesBtn = document.getElementById("nextChallengesBtn");
const profileNavIcon = document.getElementById("profileNavIcon");
const profileOverlay = document.getElementById("profileOverlay");
const profileDrawerBackBtn = document.getElementById("profileDrawerBackBtn");
const hrVideoLibraryNavLink = document.querySelector('.nav-links a[href="hr_vediolibrary.html"]');

rolePermissionsStore?.watchPermissions(hrPermissionGroup);
rolePermissionsStore?.guardPageAccess({
  group: hrPermissionGroup,
  anyOf: ["challenge-management-read"],
  title: "Challenges access is disabled",
  message:
    "Ask the admin to enable Challenge Management access for HR before opening this page.",
});
rolePermissionsStore?.restrictElement(openChallengeModalButton, canCreateHrChallenges);
rolePermissionsStore?.restrictElement(openRewardModalButton, canCreateHrChallenges);
rolePermissionsStore?.restrictElement(
  hrVideoLibraryNavLink,
  rolePermissionsStore?.hasPermission(hrPermissionGroup, "client-management-read") ?? true
);

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

function setChallengeFormMessage(message) {
  if (!challengeFormMessage) return;

  if (!message) {
    challengeFormMessage.hidden = true;
    challengeFormMessage.textContent = "";
    return;
  }

  challengeFormMessage.hidden = false;
  challengeFormMessage.textContent = message;
}

function isValidHttpUrl(value) {
  try {
    const url = new URL(String(value || "").trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch (error) {
    return false;
  }
}

function isPastDateValue(value) {
  const raw = String(value || "").trim();
  if (!raw) return false;

  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return true;

  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Number.isNaN(date.getTime()) || date < today;
}

function getTodayDateInputValue() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isPositiveIntegerValue(value) {
  const raw = String(value || "").trim();
  if (!raw) {
    return false;
  }

  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed > 0;
}

function normalizeHrChallengeLookupValue(value) {
  return String(value || "").trim().toLowerCase();
}

function matchesHrChallengeCompanyContext(record, companyContext) {
  if (!record || !companyContext) {
    return false;
  }

  const recordCompanyId = String(record.companyId || "").trim();
  const recordCompanyName = normalizeHrChallengeLookupValue(record.companyName);
  const targetCompanyId = String(companyContext.companyId || "").trim();
  const targetCompanyName = normalizeHrChallengeLookupValue(companyContext.companyName);

  if (targetCompanyId && recordCompanyId && targetCompanyId === recordCompanyId) {
    return true;
  }

  return Boolean(targetCompanyName && recordCompanyName && targetCompanyName === recordCompanyName);
}

function buildHrChallengeQueryString(companyContext) {
  const params = new URLSearchParams();

  if (companyContext?.companyId) {
    params.set("companyId", companyContext.companyId);
  } else if (companyContext?.companyName) {
    params.set("companyName", companyContext.companyName);
  }

  const queryString = params.toString();
  return queryString ? `?${queryString}` : "";
}

function mergeHrChallengeCompanyCollection(readAllRecords, writeAllRecords, scopedRecords, companyContext) {
  if (typeof readAllRecords !== "function" || typeof writeAllRecords !== "function") {
    return false;
  }

  const allRecords = readAllRecords({ includeAllCompanies: true });
  const remainingRecords = allRecords.filter(
    (record) => !matchesHrChallengeCompanyContext(record, companyContext)
  );

  writeAllRecords([...(Array.isArray(scopedRecords) ? scopedRecords : []), ...remainingRecords]);
  return true;
}

function persistChallengeLocally(challenge) {
  const allChallenges = readChallenges({ includeAllCompanies: true });
  const normalizedChallengeId = String(challenge?.id || "").trim();
  const remainingChallenges = allChallenges.filter(
    (entry) => String(entry?.id || "").trim() !== normalizedChallengeId
  );

  writeChallenges([challenge, ...remainingChallenges]);
  return true;
}

function removeChallengeLocally(challengeId) {
  const normalizedChallengeId = String(challengeId || "").trim();
  const remainingChallenges = readChallenges({ includeAllCompanies: true }).filter(
    (entry) => String(entry?.id || "").trim() !== normalizedChallengeId
  );

  writeChallenges(remainingChallenges);
  return true;
}

function persistRewardLocally(reward) {
  const allRewards = readRewards({ includeAllCompanies: true });
  const normalizedRewardId = String(reward?.id || "").trim();
  const remainingRewards = allRewards.filter(
    (entry) => String(entry?.id || "").trim() !== normalizedRewardId
  );

  writeRewards([reward, ...remainingRewards]);
  return true;
}

function removeRewardLocally(rewardId) {
  const normalizedRewardId = String(rewardId || "").trim();
  const remainingRewards = readRewards({ includeAllCompanies: true }).filter(
    (entry) => String(entry?.id || "").trim() !== normalizedRewardId
  );

  writeRewards(remainingRewards);
  return true;
}

async function syncHrChallengeDataFromBackend() {
  if (!window.appApiClient?.request || !currentHr) {
    return {
      ok: false,
      skipped: true,
    };
  }

  const queryString = buildHrChallengeQueryString(currentHrCompanyContext);

  try {
    const [challenges, rewards] = await Promise.all([
      window.appApiClient.request(`/challenges${queryString}`),
      window.appApiClient.request(`/rewards${queryString}`),
    ]);

    const challengesMerged = mergeHrChallengeCompanyCollection(
      readChallenges,
      writeChallenges,
      challenges,
      currentHrCompanyContext
    );
    const rewardsMerged = mergeHrChallengeCompanyCollection(
      readRewards,
      writeRewards,
      rewards,
      currentHrCompanyContext
    );

    if (!challengesMerged || !rewardsMerged) {
      return {
        ok: false,
        error: "The latest challenge data could not be mirrored into this browser.",
      };
    }

    return {
      ok: true,
    };
  } catch (error) {
    console.error("Unable to refresh HR challenge data from the backend.", error);
    return {
      ok: false,
      error: error?.message || "The latest challenges and rewards could not be loaded right now.",
    };
  }
}

function renderChallenges() {
  if (!challengeGrid) return;

  const challenges = readChallenges(currentHrCompanyContext);
  challengeGrid.innerHTML = "";

  if (!challenges.length) {
    challengeGrid.appendChild(
      createEmptyState(
        canCreateHrChallenges
          ? "No active challenges yet. Create a challenge to see it here."
          : "No active challenges available right now."
      )
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
      <div class="challenge-card-actions">
        <button
          class="challenge-delete-btn"
          type="button"
          data-challenge-delete-id="${escapeHtml(challenge.id)}"
          aria-label="Delete ${escapeHtml(challenge.name)}"
        >
          <i class="fa-regular fa-trash-can" aria-hidden="true"></i>
          Delete
        </button>
      </div>
    `;

    const deleteButton = card.querySelector("[data-challenge-delete-id]");
    rolePermissionsStore?.restrictElement(deleteButton, canDeleteHrChallenges, {
      mode: "disable",
      reason: "HR delete access is disabled for challenge management.",
    });

    if (deleteButton) {
      deleteButton.addEventListener("click", async () => {
        if (!canDeleteHrChallenges) {
          alert("HR delete access is disabled for challenge management.");
          return;
        }

        const confirmed = window.confirm(
          `Delete the challenge \"${challenge.name}\"? This action cannot be undone.`
        );
        if (!confirmed) {
          return;
        }

        deleteButton.disabled = true;

        try {
          if (window.appApiClient?.request && currentHr) {
            await window.appApiClient.request(
              `/challenges/${encodeURIComponent(String(challenge.id || "").trim())}`,
              {
                method: "DELETE",
              }
            );

            const syncResult = await syncHrChallengeDataFromBackend();
            if (!syncResult.ok && !syncResult.skipped) {
              const isMirrored = removeChallengeLocally(challenge.id);
              if (!isMirrored) {
                throw new Error("Challenge was deleted in the backend, but local sync failed.");
              }
            }
          } else {
            removeChallengeLocally(challenge.id);
          }

          renderChallenges();
        } catch (error) {
          deleteButton.disabled = false;
          alert(error?.message || "Unable to delete this challenge right now.");
        }
      });
    }

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

  const rewards = readRewards(currentHrCompanyContext);
  rewardGrid.innerHTML = "";

  if (!rewards.length) {
    rewardGrid.appendChild(
      createEmptyState(
        canCreateHrChallenges
          ? "No rewards in the catalog yet. Create a reward to display it here."
          : "No rewards are available in the catalog right now."
      )
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
      <div class="reward-card-actions">
        <button
          class="reward-delete-btn"
          type="button"
          data-reward-delete-id="${escapeHtml(reward.id)}"
          aria-label="Delete ${escapeHtml(reward.name)}"
        >
          <i class="fa-regular fa-trash-can" aria-hidden="true"></i>
          Delete
        </button>
      </div>
    `;

    const deleteButton = card.querySelector("[data-reward-delete-id]");
    rolePermissionsStore?.restrictElement(deleteButton, canDeleteHrChallenges, {
      mode: "disable",
      reason: "HR delete access is disabled for reward management.",
    });

    if (deleteButton) {
      deleteButton.addEventListener("click", async () => {
        if (!canDeleteHrChallenges) {
          alert("HR delete access is disabled for reward management.");
          return;
        }

        const confirmed = window.confirm(
          `Delete the reward \"${reward.name}\"? This action cannot be undone.`
        );
        if (!confirmed) {
          return;
        }

        deleteButton.disabled = true;

        try {
          if (window.appApiClient?.request && currentHr) {
            await window.appApiClient.request(
              `/rewards/${encodeURIComponent(String(reward.id || "").trim())}`,
              {
                method: "DELETE",
              }
            );

            const syncResult = await syncHrChallengeDataFromBackend();
            if (!syncResult.ok && !syncResult.skipped) {
              const isMirrored = removeRewardLocally(reward.id);
              if (!isMirrored) {
                throw new Error("Reward was deleted in the backend, but local sync failed.");
              }
            }
          } else {
            removeRewardLocally(reward.id);
          }

          renderRewards();
        } catch (error) {
          deleteButton.disabled = false;
          alert(error?.message || "Unable to delete this reward right now.");
        }
      });
    }

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
  openChallengeModalButton.addEventListener("click", () => {
    if (!canCreateHrChallenges) {
      alert("HR create access is disabled for challenge management.");
      return;
    }

    setChallengeFormMessage("");
    openModal(challengeModal);
  });
}

if (openRewardModalButton) {
  openRewardModalButton.addEventListener("click", () => {
    if (!canCreateHrChallenges) {
      alert("HR create access is disabled for challenge management.");
      return;
    }

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
    const rewards = readRewards(currentHrCompanyContext);
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
    const challenges = readChallenges(currentHrCompanyContext);
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
    button.addEventListener("click", () => {
      setChallengeFormMessage("");
      closeModal(challengeModal);
    });
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
  const challengeDeadlineInput = challengeForm.querySelector("#challengeDeadline");
  if (challengeDeadlineInput) {
    challengeDeadlineInput.min = getTodayDateInputValue();
  }

  challengeForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!canCreateHrChallenges) {
      alert("HR create access is disabled for challenge management.");
      return;
    }

    if (!challengeForm.reportValidity()) {
      return;
    }

    setChallengeFormMessage("");
    const formData = new FormData(challengeForm);
    const newChallenge = createChallengeRecord({
      name: formData.get("challengeName") || challengeForm.querySelector("#challengeName")?.value || "",
      type: formData.get("challengeTitle") || challengeForm.querySelector("#challengeTitle")?.value || "",
      reward: formData.get("challengeReward") || challengeForm.querySelector("#challengeReward")?.value || "",
      deadline: formData.get("challengeDeadline") || challengeForm.querySelector("#challengeDeadline")?.value || "",
      goal: formData.get("challengeGoal") || challengeForm.querySelector("#challengeGoal")?.value || "",
    });

    if (!newChallenge.name || !newChallenge.type || !newChallenge.reward || !newChallenge.goal) {
      setChallengeFormMessage("Please fill in all required challenge details.");
      return;
    }

    if (!isPositiveIntegerValue(newChallenge.reward)) {
      setChallengeFormMessage("Challenge reward must be a positive whole number.");
      challengeForm.querySelector("#challengeReward")?.focus?.();
      return;
    }

    if (isPastDateValue(newChallenge.deadline)) {
      setChallengeFormMessage("Challenge deadline must be today or a future date.");
      challengeDeadlineInput?.focus?.();
      return;
    }

    if (window.appApiClient?.request && currentHr) {
      try {
        const createdChallenge = await window.appApiClient.request("/challenges", {
          method: "POST",
          json: {
            name: newChallenge.name,
            type: newChallenge.type,
            reward: newChallenge.reward,
            deadline: newChallenge.deadline,
            goal: newChallenge.goal,
            creatorHrId: String(currentHr?.id || "").trim(),
            companyId: currentHrCompanyContext.companyId,
            companyName: currentHrCompanyContext.companyName,
          },
        });

        const syncResult = await syncHrChallengeDataFromBackend();
        const isMirrored = syncResult.ok || persistChallengeLocally(createdChallenge);
        if (!isMirrored) {
          setChallengeFormMessage("Challenge was created in the backend, but local sync failed.");
          return;
        }
      } catch (error) {
        setChallengeFormMessage(error?.message || "Unable to save this challenge right now.");
        return;
      }
    } else {
      const challenges = readChallenges({ includeAllCompanies: true });
      challenges.unshift(newChallenge);
      writeChallenges(challenges);
    }

    hrChallengePageIndex = 0;
    challengeForm.reset();
    renderChallenges();
    closeModal(challengeModal);
  });
}

if (rewardForm) {
  rewardForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!canCreateHrChallenges) {
      setRewardFormMessage("HR create access is disabled for challenge management.");
      return;
    }

    if (!rewardForm.reportValidity()) {
      return;
    }

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

    if (!isPositiveIntegerValue(newReward.points)) {
      setRewardFormMessage("Points needed must be a positive whole number.");
      rewardForm.querySelector("#rewardPoints")?.focus?.();
      return;
    }

    if (!isValidHttpUrl(newReward.imageUrl)) {
      setRewardFormMessage("Enter a valid reward image URL that starts with http:// or https://.");
      rewardForm.querySelector("#rewardImageUrl")?.focus?.();
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

    if (window.appApiClient?.request && currentHr) {
      try {
        const createdReward = await window.appApiClient.request("/rewards", {
          method: "POST",
          json: {
            imageUrl: newReward.imageUrl,
            name: newReward.name,
            description: newReward.description,
            points: newReward.points,
            claimableCount: newReward.claimableCount,
            claimedCount: newReward.claimedCount || "0",
            creatorHrId: String(currentHr?.id || "").trim(),
            companyId: currentHrCompanyContext.companyId,
            companyName: currentHrCompanyContext.companyName,
          },
        });

        const syncResult = await syncHrChallengeDataFromBackend();
        const isMirrored = syncResult.ok || persistRewardLocally(createdReward);
        if (!isMirrored) {
          setRewardFormMessage("Reward was created in the backend, but local sync failed.");
          return;
        }
      } catch (error) {
        setRewardFormMessage(error?.message || "Unable to save this reward right now.");
        return;
      }
    } else {
      const rewards = readRewards({ includeAllCompanies: true });
      rewards.unshift(newReward);
      writeRewards(rewards);
    }

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

async function initializeHrChallengesPage() {
  await syncHrChallengeDataFromBackend();
  rerenderAll();
  syncScrollTopButton();
}

window.addEventListener("scroll", syncScrollTopButton);
window.addEventListener("storage", rerenderAll);

void initializeHrChallengesPage();
