const employeeAuthStore = window.employeeAuthStore || null;
const currentEmployee = employeeAuthStore?.requireEmployeeSession({
  redirectTo: "homepage.html",
});
const currentEmployeeName = currentEmployee?.name || "You";
const currentEmployeeFirstName =
  currentEmployeeName.split(/\s+/).filter(Boolean)[0] || currentEmployeeName;

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

const rewardsPerPage = 3;
let rewardPageIndex = 0;
let selectedEmployeeChallengeId = null;

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

function createLeaderboardEntries(challenge) {
  const seed = [...(challenge?.name || "Challenge")].reduce(
    (total, character) => total + character.charCodeAt(0),
    0
  );
  const baseScore = 1200 + (seed % 250);

  return [
    { rank: 1, name: "Alex Rivera", score: baseScore + 220, className: "gold", badge: "Trophy" },
    { rank: 2, name: "Jamie Chen", score: baseScore + 150, className: "silver", badge: "Medal" },
    { rank: 3, name: "Sam Patel", score: baseScore + 90, className: "bronze", badge: "Bronze" },
    {
      rank: 4,
      name: `You (${currentEmployeeFirstName})`,
      score: baseScore + 30,
      className: "you",
      badge: "",
    },
    { rank: 5, name: "Chris Taylor", score: baseScore - 20, className: "normal", badge: "" },
  ];
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

  employeeLeaderboardCard.classList.remove("is-empty");
  const leaderboardEntries = createLeaderboardEntries(challenge);

  employeeLeaderboardCard.innerHTML = `
    <h3><i class="fa-solid fa-medal"></i> ${escapeHtml(challenge.name)} Leaderboard</h3>
    ${leaderboardEntries
      .map(
        (entry) => `
          <div class="leader ${entry.className}">
            <div class="num">${entry.rank}</div>
            <div>
              <h4>${escapeHtml(entry.name)}</h4>
              <p>${entry.score.toLocaleString()} points</p>
            </div>
            ${entry.badge ? `<span>${escapeHtml(entry.badge)}</span>` : "<span></span>"}
          </div>
        `
      )
      .join("")}
  `;
}

function renderEmployeeChallenges() {
  if (!employeeChallengeList) {
    return;
  }

  const challenges = typeof readChallenges === "function" ? readChallenges() : [];
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

  const rewards = typeof readRewards === "function" ? readRewards() : [];
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
    .map(
      (reward, index) => `
        <div class="reward-item ${["light-green", "light-blue", "light-yellow"][index % 3]}">
          <img src="${escapeHtml(reward.imageUrl)}" alt="${escapeHtml(
        reward.name
      )}" class="reward-logo" />
          <h4>${escapeHtml(reward.name)}</h4>
          <p>${escapeHtml(reward.description)}</p>
          <div class="reward-bottom">
            <span>${escapeHtml(reward.points)}</span>
            <button>Redeem</button>
          </div>
        </div>
      `
    )
    .join("");

  if (prevRewardsBtn) {
    prevRewardsBtn.disabled = rewardPageIndex === 0;
  }

  if (nextRewardsBtn) {
    nextRewardsBtn.disabled = rewardPageIndex >= totalPages - 1;
  }
}

if (consultationNavLink) {
  consultationNavLink.addEventListener("click", (event) => {
    event.preventDefault();
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
    const rewards = typeof readRewards === "function" ? readRewards() : [];
    const totalPages = Math.ceil(rewards.length / rewardsPerPage);

    if (rewardPageIndex >= totalPages - 1) {
      return;
    }

    rewardPageIndex += 1;
    renderRewards();
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
  renderEmployeeChallenges();
  renderRewards();
});

renderEmployeeChallenges();
renderRewards();
