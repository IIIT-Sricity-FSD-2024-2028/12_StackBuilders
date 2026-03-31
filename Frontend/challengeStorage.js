const CHALLENGE_STORAGE_KEY = "stackbuilders.hr.challenges";
const REWARD_STORAGE_KEY = "stackbuilders.hr.rewards";

function readChallenges() {
  try {
    const raw = window.localStorage.getItem(CHALLENGE_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function writeChallenges(challenges) {
  window.localStorage.setItem(
    CHALLENGE_STORAGE_KEY,
    JSON.stringify(Array.isArray(challenges) ? challenges : [])
  );
}

function createChallengeRecord({ name, type, reward, deadline, goal }) {
  return {
    id: String(Date.now()),
    name: name.trim(),
    type: type.trim(),
    reward: reward.trim(),
    deadline: deadline.trim(),
    goal: goal.trim(),
    createdAt: new Date().toISOString(),
  };
}

function readRewards() {
  try {
    const raw = window.localStorage.getItem(REWARD_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function writeRewards(rewards) {
  window.localStorage.setItem(
    REWARD_STORAGE_KEY,
    JSON.stringify(Array.isArray(rewards) ? rewards : [])
  );
}

function createRewardRecord({
  imageUrl,
  name,
  description,
  points,
  claimableCount,
  claimedCount,
}) {
  return {
    id: String(Date.now()),
    imageUrl: imageUrl.trim(),
    name: name.trim(),
    description: description.trim(),
    points: points.trim(),
    claimableCount: claimableCount.trim(),
    claimedCount: claimedCount.trim(),
    createdAt: new Date().toISOString(),
  };
}
