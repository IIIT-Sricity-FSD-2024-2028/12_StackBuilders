const employeeAuthStore = window.employeeAuthStore || null;
const liveSessionStore = window.liveSessionStore || null;
const videoLibraryStore = window.videoLibraryStore || null;
const rolePermissionsStore = window.rolePermissionsStore || null;
const currentEmployee = employeeAuthStore?.requireEmployeeSession({
  redirectTo: "homepage.html",
});
const currentEmployeeName = currentEmployee?.name || "You";
const currentEmployeeFirstName =
  currentEmployeeName.split(/\s+/).filter(Boolean)[0] || currentEmployeeName;
const currentEmployeeCompanyContext = {
  companyId: String(currentEmployee?.companyId || "").trim(),
  companyName: String(currentEmployee?.companyName || "").trim(),
};
const employeePermissionGroup = "employee";
const canReadEmployeeReports =
  rolePermissionsStore?.hasPermission(employeePermissionGroup, "reports-read") ?? true;
const canReadEmployeeConsultations =
  rolePermissionsStore?.hasPermission(employeePermissionGroup, "user-management-read") ?? true;
const canReadEmployeeClientFeatures =
  rolePermissionsStore?.hasPermission(employeePermissionGroup, "client-management-read") ?? true;
const canReadEmployeeChallenges =
  rolePermissionsStore?.hasPermission(employeePermissionGroup, "challenge-management-read") ?? true;
const canUpdateEmployeeChallenges =
  rolePermissionsStore?.hasPermission(employeePermissionGroup, "challenge-management-update") ?? true;

const consultationNavLink = document.getElementById("consultationNavLink");
const employeeWelcomeMessage = document.getElementById("employeeWelcomeMessage");
const profileNavIcon = document.getElementById("profileNavIcon");
const profileOverlay = document.getElementById("profileOverlay");
const profileDrawerBackBtn = document.getElementById("profileDrawerBackBtn");
const editProfileDrawerBtn = document.getElementById("editProfileDrawerBtn");
const logoutDrawerBtn = document.getElementById("logoutDrawerBtn");
const liveSessionBtn = document.getElementById("liveSessionBtn");
const rewardGrid = document.getElementById("rewardGrid");
const prevRewardsBtn = document.getElementById("prevRewardsBtn");
const nextRewardsBtn = document.getElementById("nextRewardsBtn");
const employeeChallengeList = document.getElementById("employeeChallengeList");
const employeeLeaderboardCard = document.querySelector(".top-section .card.main-card:last-child");
const employeeLiveSessionNavLink = document.querySelector('.nav-links a[href="Live_Session.html"]');
const employeeVideoLibraryNavLink = document.querySelector('.nav-links a[href="Video_Library.html?role=employee"]');
const employeeWellnessCheckinsNavLink = document.getElementById("employeeWellnessCheckinsNavLink");
const employeeMetricsCard = document.querySelector(".top-section .card.main-card");
const employeeChallengeCard = employeeChallengeList?.closest(".card.main-card") || null;
const rewardSection = document.querySelector(".reward-section");
const tipSection = document.querySelector(".tip-section");
const employeeDailyTipTitle = document.getElementById("employeeDailyTipTitle");
const employeeDailyTipBody = document.getElementById("employeeDailyTipBody");
const liveSection = document.querySelector(".live-section");
const videoLibrarySection = document.querySelector(".more-btn")?.closest(".card") || null;
const employeeDashboardVideoGrid = document.getElementById("employeeDashboardVideoGrid");
const employeePsychologistCount = document.getElementById("employeePsychologistCount");
const employeeNutritionistCount = document.getElementById("employeeNutritionistCount");
const employeePhysicalExpertCount = document.getElementById("employeePhysicalExpertCount");
const employeeLiveSectionTitle = document.getElementById("employeeLiveSectionTitle");
const employeeLiveSectionCopy = document.getElementById("employeeLiveSectionCopy");
const rewardBalanceCard = document.querySelector(".balance-card.main-card");
const employeeSnapshotPrimaryValue = document.getElementById("employeeSnapshotPrimaryValue");
const employeeSnapshotPrimaryCopy = document.getElementById("employeeSnapshotPrimaryCopy");
const employeeSnapshotProgress = document.getElementById("employeeSnapshotProgress");
const employeeSnapshotSecondaryLabel = document.getElementById("employeeSnapshotSecondaryLabel");
const employeeSnapshotSecondaryValue = document.getElementById("employeeSnapshotSecondaryValue");
const employeeSnapshotTertiaryTitle = document.getElementById("employeeSnapshotTertiaryTitle");
const employeeSnapshotTertiaryCopy = document.getElementById("employeeSnapshotTertiaryCopy");
const employeeSnapshotMetaList = document.getElementById("employeeSnapshotMetaList");
const DAILY_WELLNESS_TIPS = [
  {
    title: "Start the morning with water.",
    body: "Drinking a glass of water after waking up helps you rehydrate and gives your day a simple healthy start.",
  },
  {
    title: "Take a two-minute breathing break.",
    body: "Pause, inhale slowly, and exhale fully a few times to lower tension and reset your focus.",
  },
  {
    title: "Stand up once every hour.",
    body: "Short movement breaks can ease stiffness, improve circulation, and help you stay more alert through the day.",
  },
  {
    title: "Add one extra serving of vegetables.",
    body: "A small nutrition upgrade at lunch or dinner can improve fullness, fiber intake, and overall balance.",
  },
  {
    title: "Go outside for natural light.",
    body: "A few minutes of daylight can support your energy, mood, and sleep rhythm, especially in the first half of the day.",
  },
  {
    title: "Take a short walk after meals.",
    body: "A gentle walk can help digestion and gives you a quick mental reset without needing a full workout block.",
  },
  {
    title: "Protect your sleep routine tonight.",
    body: "Try to keep a consistent bedtime and reduce screen use shortly before sleep to wind down more smoothly.",
  },
  {
    title: "Check in with your posture.",
    body: "Relax your shoulders, support your lower back, and bring your screen to eye level to reduce strain.",
  },
  {
    title: "Choose one mindful snack.",
    body: "Pick something simple and nourishing today, like fruit, yogurt, nuts, or another option that keeps you steady.",
  },
  {
    title: "Do one stretch you usually skip.",
    body: "Even a quick stretch for your neck, hips, or calves can relieve built-up tension from long sitting hours.",
  },
  {
    title: "Give yourself five quiet minutes.",
    body: "Stepping away from noise for a brief pause can make the rest of your work feel more manageable.",
  },
  {
    title: "Notice how much caffeine you need.",
    body: "Try to use caffeine intentionally instead of automatically, especially later in the day when it can affect sleep.",
  },
  {
    title: "Keep a water bottle nearby.",
    body: "Making hydration easy and visible is one of the simplest ways to improve your daily routine.",
  },
  {
    title: "Reset your eyes from screens.",
    body: "Look away from your screen every so often and focus on something in the distance to reduce eye fatigue.",
  },
  {
    title: "Choose one less stressful pace.",
    body: "Doing the next task a little more calmly can help you stay accurate without draining as much energy.",
  },
  {
    title: "Make lunch a real break.",
    body: "If you can, step away from your desk while eating so your body and mind both get a reset.",
  },
  {
    title: "Add movement before your next meeting.",
    body: "A quick walk, stretch, or shoulder roll can improve attention and help you feel less stuck in place.",
  },
  {
    title: "Give your mind a small win.",
    body: "Finish one simple task you have been postponing to create momentum for the rest of the day.",
  },
  {
    title: "Unclench your jaw and shoulders.",
    body: "Stress often shows up physically first, so a quick body scan can help you release tension sooner.",
  },
  {
    title: "Plan one healthy choice in advance.",
    body: "Deciding ahead of time on a meal, walk, or bedtime can make healthy actions much easier to follow through on.",
  },
  {
    title: "Take a moment to slow your breathing.",
    body: "A longer exhale than inhale can help your body shift toward a calmer state in just a minute or two.",
  },
  {
    title: "End the day with a short reflection.",
    body: "Ask yourself what gave you energy today and what drained it so tomorrow can be a little more intentional.",
  },
];
let dailyWellnessTipTimerId = null;

rolePermissionsStore?.watchPermissions(employeePermissionGroup);
rolePermissionsStore?.guardPageAccess({
  group: employeePermissionGroup,
  anyOf: ["reports-read", "challenge-management-read", "client-management-read"],
  title: "Employee dashboard access is disabled",
  message:
    "Ask the admin to enable dashboard, challenge, or company access for employees before opening this page.",
});
rolePermissionsStore?.setElementHidden(employeeMetricsCard, !canReadEmployeeReports);
rolePermissionsStore?.setElementHidden(tipSection, !canReadEmployeeReports);
rolePermissionsStore?.setElementHidden(employeeChallengeCard, !canReadEmployeeChallenges);
rolePermissionsStore?.setElementHidden(employeeLeaderboardCard, !canReadEmployeeChallenges);
rolePermissionsStore?.setElementHidden(rewardSection, !canReadEmployeeChallenges);
rolePermissionsStore?.setElementHidden(liveSection, !canReadEmployeeClientFeatures);
rolePermissionsStore?.setElementHidden(videoLibrarySection, !canReadEmployeeClientFeatures);
rolePermissionsStore?.restrictElement(consultationNavLink, canReadEmployeeConsultations);
rolePermissionsStore?.restrictElement(employeeWellnessCheckinsNavLink, canReadEmployeeClientFeatures);
rolePermissionsStore?.restrictElement(employeeLiveSessionNavLink, canReadEmployeeClientFeatures);
rolePermissionsStore?.restrictElement(employeeVideoLibraryNavLink, canReadEmployeeClientFeatures);

const rewardsPerPage = 3;
let rewardPageIndex = 0;
let selectedEmployeeChallengeId = null;
let activeRewardClaimId = "";

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

function getActiveEmployeeRecord() {
  return window.employeeAuthStore?.getCurrentEmployee?.() || currentEmployee || null;
}

function parsePositiveInteger(value, fallback = 0) {
  const parsed = Number(String(value || "").trim());
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : fallback;
}

function getEmployeeRewardBalance() {
  return parsePositiveInteger(getActiveEmployeeRecord()?.rewardPointsBalance, 500);
}

function getEmployeeClaimedRewardIds() {
  const claimedRewardIds = getActiveEmployeeRecord()?.claimedRewardIds;
  if (!Array.isArray(claimedRewardIds)) {
    return [];
  }

  return [...new Set(claimedRewardIds.map((entry) => String(entry || "").trim()).filter(Boolean))];
}

function getRewardClaimState(reward) {
  const pointsRequired = parsePositiveInteger(reward?.points);
  const claimableCount = parsePositiveInteger(reward?.claimableCount);
  const claimedCount = parsePositiveInteger(reward?.claimedCount);
  const remainingClaims = Math.max(claimableCount - claimedCount, 0);
  const employeeBalance = getEmployeeRewardBalance();
  const alreadyClaimed = getEmployeeClaimedRewardIds().includes(String(reward?.id || "").trim());
  const canAfford = pointsRequired <= employeeBalance;
  const soldOut = remainingClaims < 1;

  return {
    pointsRequired,
    claimableCount,
    claimedCount,
    remainingClaims,
    employeeBalance,
    alreadyClaimed,
    canAfford,
    soldOut,
  };
}

function getDailyWellnessTipIndex(date = new Date()) {
  const localMidnight = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.abs(Math.floor(localMidnight.getTime() / 86400000)) % DAILY_WELLNESS_TIPS.length;
}

function renderDailyWellnessTip() {
  if (!employeeDailyTipTitle || !employeeDailyTipBody) {
    return;
  }

  const tip = DAILY_WELLNESS_TIPS[getDailyWellnessTipIndex()] || DAILY_WELLNESS_TIPS[0];
  employeeDailyTipTitle.textContent = tip.title;
  employeeDailyTipBody.textContent = tip.body;
}

function scheduleDailyWellnessTipRefresh() {
  if (dailyWellnessTipTimerId) {
    window.clearTimeout(dailyWellnessTipTimerId);
  }

  const now = new Date();
  const nextMidnight = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
    0,
    0,
    5,
    0
  );
  const delay = Math.max(nextMidnight.getTime() - now.getTime(), 1000);

  dailyWellnessTipTimerId = window.setTimeout(() => {
    renderDailyWellnessTip();
    scheduleDailyWellnessTipRefresh();
  }, delay);
}

function renderEmployeeLeaderboard(challenge) {
  if (!employeeLeaderboardCard) {
    return;
  }

  if (!challenge) {
    employeeLeaderboardCard.classList.add("is-empty");
    employeeLeaderboardCard.innerHTML = `
      <h3><i class="fa-solid fa-medal"></i> Leaderboard</h3>
      <div class="leaderboard-empty-state">
        No leaderboard yet. Select or create a challenge first.
      </div>
    `;
    return;
  }

  employeeLeaderboardCard.classList.add("is-empty");
  employeeLeaderboardCard.innerHTML = `
    <h3><i class="fa-solid fa-medal"></i> ${escapeHtml(challenge.name)} Summary</h3>
    <div class="leaderboard-empty-state">
      Leaderboard participation data is not available in the current backend entity set.
    </div>
    <div class="leader normal">
      <div class="num"><i class="fa-solid fa-bullseye"></i></div>
      <div>
        <h4>Goal</h4>
        <p>${escapeHtml(challenge.goal || "Not specified")}</p>
      </div>
      <span></span>
    </div>
    <div class="leader normal">
      <div class="num"><i class="fa-solid fa-gift"></i></div>
      <div>
        <h4>Reward</h4>
        <p>${escapeHtml(challenge.reward || "Not specified")}</p>
      </div>
      <span></span>
    </div>
    <div class="leader normal">
      <div class="num"><i class="fa-regular fa-calendar"></i></div>
      <div>
        <h4>Deadline</h4>
        <p>${escapeHtml(challenge.deadline || "No deadline")}</p>
      </div>
      <span></span>
    </div>
  `;
}

function renderEmployeeChallenges() {
  if (!employeeChallengeList) {
    return;
  }

  const challenges = typeof readChallenges === "function"
    ? readChallenges(currentEmployeeCompanyContext)
    : [];
  employeeChallengeList.innerHTML = "";

  if (!challenges.length) {
    selectedEmployeeChallengeId = null;
    employeeChallengeList.classList.add("is-empty");
    employeeChallengeList.innerHTML = `
      <div class="employee-empty-state">
        No active challenges yet. Check back after HR creates one.
      </div>
    `;
    renderEmployeeLeaderboard(null);
    return;
  }

  employeeChallengeList.classList.remove("is-empty");

  if (
    !selectedEmployeeChallengeId ||
    !challenges.some((challenge) => challenge.id === selectedEmployeeChallengeId)
  ) {
    selectedEmployeeChallengeId = challenges[0].id;
  }

  challenges.forEach((challenge) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `employee-challenge-item${
      challenge.id === selectedEmployeeChallengeId ? " is-active" : ""
    }`;
    button.textContent = challenge.name;
    button.addEventListener("click", () => {
      selectedEmployeeChallengeId = challenge.id;
      renderEmployeeChallenges();
    });
    employeeChallengeList.appendChild(button);
  });

  const selectedChallenge =
    challenges.find((challenge) => challenge.id === selectedEmployeeChallengeId) || challenges[0];
  renderEmployeeLeaderboard(selectedChallenge);
}

function renderRewards() {
  if (!rewardGrid) {
    return;
  }

  const rewards = typeof readRewards === "function"
    ? readRewards(currentEmployeeCompanyContext)
    : [];
  rewardGrid.innerHTML = "";

  if (!rewards.length) {
    rewardGrid.classList.add("is-empty");
    rewardGrid.innerHTML = `
      <div class="reward-empty-state">
        No rewards available yet. Check back after HR creates one.
      </div>
    `;

    if (prevRewardsBtn) {
      prevRewardsBtn.disabled = true;
    }

    if (nextRewardsBtn) {
      nextRewardsBtn.disabled = true;
    }

    renderRewardSummary([]);
    return;
  }

  rewardGrid.classList.remove("is-empty");

  const totalPages = Math.ceil(rewards.length / rewardsPerPage);
  if (rewardPageIndex >= totalPages) {
    rewardPageIndex = Math.max(0, totalPages - 1);
  }

  const startIndex = rewardPageIndex * rewardsPerPage;
  const visibleRewards = rewards.slice(startIndex, startIndex + rewardsPerPage);

  rewardGrid.innerHTML = visibleRewards
    .map((reward, index) => {
      const claimState = getRewardClaimState(reward);
      const buttonDisabled =
        !canUpdateEmployeeChallenges
        || claimState.alreadyClaimed
        || claimState.soldOut
        || !claimState.canAfford
        || activeRewardClaimId === reward.id;
      const buttonLabel = claimState.alreadyClaimed
        ? "Claimed"
        : activeRewardClaimId === reward.id
          ? "Claiming..."
          : claimState.soldOut
            ? "Unavailable"
            : claimState.canAfford
              ? "Claim Reward"
              : `Need ${claimState.pointsRequired - claimState.employeeBalance} more`;
      const statusTag = claimState.alreadyClaimed
        ? `<span class="reward-status-tag claimed">Claimed</span>`
        : claimState.soldOut
          ? `<span class="reward-status-tag unavailable">Unavailable</span>`
          : claimState.canAfford
            ? `<span class="reward-status-tag ready">Ready to claim</span>`
            : `<span class="reward-status-tag locked">Locked</span>`;

      return `
        <div class="reward-item ${["light-green", "light-blue", "light-yellow"][index % 3]}${
        claimState.alreadyClaimed ? " is-claimed" : ""
      }">
          <img src="${escapeHtml(reward.imageUrl)}" alt="${escapeHtml(
        reward.name
      )}" class="reward-logo" />
          <h4>${escapeHtml(reward.name)}</h4>
          <p>${escapeHtml(reward.description)}</p>
          <div class="reward-meta">
            <span>${escapeHtml(reward.points)} pts</span>
            <span>${claimState.remainingClaims} left</span>
          </div>
          <div class="reward-status-row">
            ${statusTag}
          </div>
          <div class="reward-bottom">
            <span>${escapeHtml(reward.claimedCount || "0")} claimed</span>
            <button
              type="button"
              data-reward-id="${escapeHtml(reward.id)}"
              ${buttonDisabled ? "disabled" : ""}
              class="${buttonDisabled ? "locked" : ""}"
            >
              ${escapeHtml(buttonLabel)}
            </button>
          </div>
        </div>
      `;
    })
    .join("");

  if (!canUpdateEmployeeChallenges) {
    rewardGrid.querySelectorAll("button").forEach((button) => {
      rolePermissionsStore?.disableElement(
        button,
        "Reward redemption access is disabled for employees."
      );
    });
  }

  if (prevRewardsBtn) {
    prevRewardsBtn.disabled = rewardPageIndex === 0;
  }

  if (nextRewardsBtn) {
    nextRewardsBtn.disabled = rewardPageIndex >= totalPages - 1;
  }

  renderRewardSummary(rewards);
}

function renderRewardSummary(rewardsInput) {
  if (!rewardBalanceCard) {
    return;
  }

  const rewards = Array.isArray(rewardsInput)
    ? rewardsInput
    : typeof readRewards === "function"
      ? readRewards(currentEmployeeCompanyContext)
      : [];
  const employeeBalance = getEmployeeRewardBalance();
  const affordableRewards = rewards.filter((reward) => {
    const claimState = getRewardClaimState(reward);
    return !claimState.alreadyClaimed && !claimState.soldOut && claimState.canAfford;
  });
  const nextReward =
    rewards
      .filter((reward) => {
        const claimState = getRewardClaimState(reward);
        return !claimState.alreadyClaimed && !claimState.soldOut;
      })
      .sort((left, right) => parsePositiveInteger(left.points) - parsePositiveInteger(right.points))[0]
    || null;
  const progressWidth = nextReward
    ? `${Math.min(
      100,
      Math.round((employeeBalance / Math.max(parsePositiveInteger(nextReward.points, 1), 1)) * 100)
    )}%`
    : "0%";

  rewardBalanceCard.innerHTML = `
    <div class="balance-top">
      <div class="small-icon"><i class="fa-solid fa-award"></i></div>
      <div>
        <h5>Your Balance</h5>
        <p>Updated today</p>
      </div>
    </div>

    <h1>${employeeBalance}</h1>
    <h3>Available Points</h3>

    <div class="next-box">
      <div class="next-text">
        <span>${escapeHtml(nextReward?.name || "No reward to claim right now")}</span>
        <span>${nextReward ? `${escapeHtml(nextReward.points)} pts` : `${affordableRewards.length} ready`}</span>
      </div>

      <div class="progress small-progress">
        <div class="progress-fill green-fill" style="width: ${progressWidth};"></div>
      </div>
    </div>
  `;
}

function renderEmployeeMetricsSnapshot() {
  if (!employeeMetricsCard) {
    return;
  }

  const challenges = typeof readChallenges === "function"
    ? readChallenges(currentEmployeeCompanyContext)
    : [];
  const rewards = typeof readRewards === "function"
    ? readRewards(currentEmployeeCompanyContext)
    : [];
  const upcomingSessions = liveSessionStore?.getUpcomingSessions
    ? liveSessionStore.getUpcomingSessions(currentEmployeeCompanyContext)
    : [];
  const totalOfferings = challenges.length + rewards.length + upcomingSessions.length;
  const configuredAreas = [
    challenges.length > 0,
    rewards.length > 0,
    upcomingSessions.length > 0,
  ].filter(Boolean).length;
  const nextSession = upcomingSessions[0] || null;
  const companyLabel = currentEmployeeCompanyContext.companyName || "Your company";

  if (employeeSnapshotPrimaryValue) {
    employeeSnapshotPrimaryValue.textContent = String(totalOfferings);
  }

  if (employeeSnapshotPrimaryCopy) {
    employeeSnapshotPrimaryCopy.textContent = totalOfferings
      ? `${challenges.length} challenge${challenges.length === 1 ? "" : "s"}, ${rewards.length} reward${rewards.length === 1 ? "" : "s"}, and ${upcomingSessions.length} live session${upcomingSessions.length === 1 ? "" : "s"} are currently available. You currently have ${getEmployeeRewardBalance()} points to spend.`
      : "No challenges, rewards, or live sessions are configured for your company yet.";
  }

  if (employeeSnapshotProgress) {
    employeeSnapshotProgress.style.width = `${(configuredAreas / 3) * 100}%`;
  }

  if (employeeSnapshotSecondaryLabel) {
    employeeSnapshotSecondaryLabel.textContent = "Configured Areas";
  }

  if (employeeSnapshotSecondaryValue) {
    employeeSnapshotSecondaryValue.textContent = `${configuredAreas} of 3 activity areas active`;
  }

  if (employeeSnapshotTertiaryTitle) {
    employeeSnapshotTertiaryTitle.textContent = "Next Upcoming Session";
  }

  if (employeeSnapshotTertiaryCopy) {
    employeeSnapshotTertiaryCopy.textContent = nextSession
      ? `${nextSession.title || "Upcoming live session"} on ${liveSessionStore.formatDate(
        nextSession.date
      )} at ${liveSessionStore.formatTime(nextSession.startTime)}.`
      : "No live sessions are scheduled right now.";
  }

  if (employeeSnapshotMetaList) {
    const tags = [
      `${companyLabel}`,
      `${challenges.length} challenge${challenges.length === 1 ? "" : "s"}`,
      `${rewards.length} reward${rewards.length === 1 ? "" : "s"}`,
      `${upcomingSessions.length} session${upcomingSessions.length === 1 ? "" : "s"}`,
    ];

    employeeSnapshotMetaList.innerHTML = tags
      .map((tag) => `<span class="snapshot-tag">${escapeHtml(tag)}</span>`)
      .join("");
  }
}

function renderEmployeeLiveSessionHighlight() {
  if (!liveSection || !liveSessionStore) {
    return;
  }

  const sessions = liveSessionStore.getSessionsByStatus(
    "ongoing",
    currentEmployeeCompanyContext
  );
  const nextSession = sessions[0] || null;

  if (!nextSession) {
    if (employeeLiveSectionTitle) {
      employeeLiveSectionTitle.textContent = "No live sessions are ongoing right now";
    }

    if (employeeLiveSectionCopy) {
      employeeLiveSectionCopy.textContent =
        "Join the live-session page to view scheduled sessions and come back when one starts.";
    }

    if (liveSessionBtn) {
      liveSessionBtn.textContent = "View Live Sessions";
    }

    return;
  }

  if (employeeLiveSectionTitle) {
    employeeLiveSectionTitle.textContent = nextSession.title || "Ongoing Live Session";
  }

  if (employeeLiveSectionCopy) {
    employeeLiveSectionCopy.textContent = `${liveSessionStore.formatDate(
      nextSession.date
    )} at ${liveSessionStore.formatTime(nextSession.startTime)} • ${nextSession.duration} • Hosted by ${nextSession.hostName || "Wellness Expert"}`;
  }

  if (liveSessionBtn) {
    liveSessionBtn.textContent = nextSession.meetingLink ? "Join Ongoing Session" : "View Live Sessions";
  }
}

function buildEmployeeDashboardVideoCard(video) {
  const safeTitle = escapeHtml(video?.title || "Wellness Video");
  const safeDescription = escapeHtml(
    video?.description || "A company wellness video is available in the library."
  );
  const safeDuration = escapeHtml(video?.duration || "00:00");
  const safeVideoLink = escapeHtml(video?.videoLink || "Video_Library.html?role=employee");
  const safeThumbnailLink = escapeHtml(
    video?.thumbnailLink ||
      "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600"
  );
  const safeUploader = escapeHtml(video?.creatorExpertName || "Wellness Expert");
  const normalizedCategory = String(video?.category || "").trim().toLowerCase();
  let tagLabel = "Video";
  let tagClass = "green-tag";

  if (normalizedCategory === "physical wellness") {
    tagLabel = "Physical Wellness";
    tagClass = "red";
  } else if (normalizedCategory === "mind relaxation") {
    tagLabel = "Mind Relaxation";
    tagClass = "purple-tag";
  } else if (normalizedCategory === "health related") {
    tagLabel = "Health Related";
    tagClass = "green-tag";
  }

  return `
    <a class="video-card" href="${safeVideoLink}" target="_blank" rel="noopener noreferrer">
      <div class="video-image">
        <img src="${safeThumbnailLink}" alt="${safeTitle}" />
        <span class="video-tag ${tagClass}">${escapeHtml(tagLabel)}</span>
        <span class="video-time">${safeDuration}</span>
        <div class="play-btn"><i class="fa-solid fa-play"></i></div>
      </div>
      <h4>${safeTitle}</h4>
      <span class="video-uploader-tag">Uploaded by ${safeUploader}</span>
      <p>${safeDescription}</p>
    </a>
  `;
}

function renderEmployeeDashboardVideos() {
  if (!employeeDashboardVideoGrid) {
    return;
  }

  const videos = videoLibraryStore?.readVideos?.(currentEmployeeCompanyContext) || [];

  employeeDashboardVideoGrid.innerHTML = videos.length
    ? videos.slice(0, 3).map(buildEmployeeDashboardVideoCard).join("")
    : `
      <div class="leaderboard-empty-state">
        No company videos are available yet. Open the video library after a wellness expert adds one.
      </div>
    `;
}

function countExpertsByCategory(experts, matcher) {
  return experts.filter((expert) => matcher(String(expert?.specialization || "").trim().toLowerCase())).length;
}

function renderExpertCategoryCounts(experts) {
  const safeExperts = Array.isArray(experts) ? experts : [];
  const psychologistCount = countExpertsByCategory(
    safeExperts,
    (specialization) => specialization.includes("psych")
  );
  const nutritionCount = countExpertsByCategory(
    safeExperts,
    (specialization) => specialization.includes("nutrition")
  );
  const physicalCount = countExpertsByCategory(
    safeExperts,
    (specialization) => specialization.includes("physical") || specialization.includes("trainer")
  );

  if (employeePsychologistCount) {
    employeePsychologistCount.textContent = `${psychologistCount} Experts Available`;
  }

  if (employeeNutritionistCount) {
    employeeNutritionistCount.textContent = `${nutritionCount} Experts Available`;
  }

  if (employeePhysicalExpertCount) {
    employeePhysicalExpertCount.textContent = `${physicalCount} Experts Available`;
  }
}

async function syncEmployeeExpertCountsFromBackend() {
  if (!window.appApiClient?.request) {
    return;
  }

  const params = new URLSearchParams();
  if (currentEmployeeCompanyContext.companyId) {
    params.set("companyId", currentEmployeeCompanyContext.companyId);
  } else if (currentEmployeeCompanyContext.companyName) {
    params.set("companyName", currentEmployeeCompanyContext.companyName);
  }

  const queryString = params.toString() ? `?${params.toString()}` : "";

  try {
    const experts = await window.appApiClient.request(`/experts${queryString}`);
    renderExpertCategoryCounts(experts);
  } catch (error) {
    console.error("Unable to refresh employee expert category counts from the backend.", error);
    renderExpertCategoryCounts([]);
  }
}

async function syncEmployeeDashboardDataFromBackend() {
  const tasks = [];

  if (typeof syncChallengeDataFromBackend === "function") {
    tasks.push(syncChallengeDataFromBackend(currentEmployeeCompanyContext));
  }

  if (liveSessionStore?.syncLiveSessionsFromBackend) {
    tasks.push(liveSessionStore.syncLiveSessionsFromBackend(currentEmployeeCompanyContext));
  }

  if (videoLibraryStore?.syncVideosFromBackend) {
    tasks.push(videoLibraryStore.syncVideosFromBackend(currentEmployeeCompanyContext));
  }

  await Promise.allSettled(tasks);
  renderEmployeeMetricsSnapshot();
  renderEmployeeChallenges();
  renderRewards();
  renderEmployeeLiveSessionHighlight();
  renderEmployeeDashboardVideos();
  await syncEmployeeExpertCountsFromBackend();
}

async function handleEmployeeRewardClaim(rewardId) {
  if (!canUpdateEmployeeChallenges) {
    alert("Reward redemption access is disabled for employees.");
    return;
  }

  const rewards = typeof readRewards === "function"
    ? readRewards(currentEmployeeCompanyContext)
    : [];
  const reward = rewards.find((entry) => String(entry?.id || "").trim() === String(rewardId || "").trim());

  if (!reward) {
    alert("That reward could not be found.");
    return;
  }

  const claimState = getRewardClaimState(reward);
  if (claimState.alreadyClaimed) {
    alert("You have already claimed this reward.");
    return;
  }

  if (claimState.soldOut) {
    alert("This reward is no longer available to claim.");
    return;
  }

  if (!claimState.canAfford) {
    alert("You do not have enough points to claim this reward.");
    return;
  }

  activeRewardClaimId = reward.id;
  renderRewards();

  try {
    const result = await claimRewardForEmployee?.(reward.id, getActiveEmployeeRecord()?.id);
    if (!result?.ok) {
      throw new Error(result?.error || "The reward could not be claimed right now.");
    }

    renderEmployeeMetricsSnapshot();
    renderRewards();
    alert("Reward claimed successfully.");
  } catch (error) {
    alert(error?.message || "The reward could not be claimed right now.");
    renderRewards();
  } finally {
    activeRewardClaimId = "";
    renderEmployeeMetricsSnapshot();
    renderRewards();
  }
}

if (consultationNavLink) {
  consultationNavLink.addEventListener("click", (event) => {
    event.preventDefault();
    if (!canReadEmployeeConsultations) {
      alert("Employee consultation access is disabled.");
      return;
    }

    window.location.href = "Employee_Consultation2.html";
  });
}

if (employeeWelcomeMessage) {
  employeeWelcomeMessage.textContent = `Welcome back, ${currentEmployeeFirstName}!`;
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

if (profileDrawerBackBtn) {
  profileDrawerBackBtn.addEventListener("click", closeProfileOverlay);
}

if (editProfileDrawerBtn) {
  editProfileDrawerBtn.addEventListener("click", () => {
    window.location.href = "Employee_ManageProfile.html";
  });
}

if (logoutDrawerBtn) {
  logoutDrawerBtn.addEventListener("click", closeProfileOverlay);
}

if (liveSessionBtn) {
  liveSessionBtn.addEventListener("click", () => {
    if (!canReadEmployeeClientFeatures) {
      alert("Employee live session access is disabled.");
      return;
    }

    const nextSession =
      liveSessionStore?.getSessionsByStatus?.(
        "ongoing",
        currentEmployeeCompanyContext
    )?.[0] || null;
    if (nextSession?.meetingLink) {
      window.open(nextSession.meetingLink, "_blank", "noopener,noreferrer");
      return;
    }

    window.location.href = "Live_Session.html";
  });
}

if (prevRewardsBtn) {
  prevRewardsBtn.addEventListener("click", () => {
    if (rewardPageIndex === 0) {
      return;
    }

    rewardPageIndex -= 1;
    renderRewards();
  });
}

if (nextRewardsBtn) {
  nextRewardsBtn.addEventListener("click", () => {
    const rewards = typeof readRewards === "function"
      ? readRewards(currentEmployeeCompanyContext)
      : [];
    const totalPages = Math.ceil(rewards.length / rewardsPerPage);

    if (rewardPageIndex >= totalPages - 1) {
      return;
    }

    rewardPageIndex += 1;
    renderRewards();
  });
}

if (rewardGrid) {
  rewardGrid.addEventListener("click", (event) => {
    const claimButton = event.target.closest("button[data-reward-id]");
    if (!claimButton) {
      return;
    }

    void handleEmployeeRewardClaim(claimButton.dataset.rewardId);
  });
}

if (profileOverlay) {
  profileOverlay.addEventListener("click", (event) => {
    if (event.target === profileOverlay) {
      closeProfileOverlay();
    }
  });
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeProfileOverlay();
  }
});

window.addEventListener("storage", () => {
  renderEmployeeMetricsSnapshot();
  renderEmployeeChallenges();
  renderRewards();
  renderEmployeeLiveSessionHighlight();
  renderEmployeeDashboardVideos();
  void syncEmployeeExpertCountsFromBackend();
});

renderEmployeeMetricsSnapshot();
renderEmployeeChallenges();
renderRewards();
renderDailyWellnessTip();
scheduleDailyWellnessTipRefresh();
renderEmployeeLiveSessionHighlight();
renderEmployeeDashboardVideos();
renderExpertCategoryCounts([]);
void syncEmployeeDashboardDataFromBackend();
