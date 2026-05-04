const CHALLENGE_STORAGE_KEY = "stackbuilders.hr.challenges";
const REWARD_STORAGE_KEY = "stackbuilders.hr.rewards";
const COMPANY_STORAGE_KEY = "stack-builders-companies";

function normalizeChallengeStorageText(value) {
  return String(value || "").trim();
}

function normalizeChallengeLookupValue(value) {
  return normalizeChallengeStorageText(value).toLowerCase();
}

function createChallengeCompanyContext(companyLike) {
  return {
    companyId: normalizeChallengeStorageText(companyLike?.companyId || companyLike?.id),
    companyName: normalizeChallengeStorageText(companyLike?.companyName || companyLike?.name),
  };
}

function hasChallengeCompanyContext(companyContext) {
  return Boolean(
    normalizeChallengeStorageText(companyContext?.companyId)
      || normalizeChallengeStorageText(companyContext?.companyName)
  );
}

function matchesChallengeCompanyContext(record, companyContext) {
  const normalizedContext = createChallengeCompanyContext(companyContext);

  if (!hasChallengeCompanyContext(normalizedContext)) {
    return true;
  }

  const recordCompanyId = normalizeChallengeStorageText(record?.companyId);
  const recordCompanyName = normalizeChallengeLookupValue(record?.companyName);

  if (
    normalizedContext.companyId &&
    recordCompanyId &&
    recordCompanyId === normalizedContext.companyId
  ) {
    return true;
  }

  return Boolean(
    normalizedContext.companyName &&
    recordCompanyName &&
    recordCompanyName === normalizeChallengeLookupValue(normalizedContext.companyName)
  );
}

function readChallengeCollection(storageKey) {
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function getFallbackChallengeCompanyContext() {
  const companies = readChallengeCollection(COMPANY_STORAGE_KEY);
  return companies.length === 1
    ? createChallengeCompanyContext(companies[0])
    : createChallengeCompanyContext({});
}

function getActiveChallengeCompanyContext() {
  const hrCompanyContext = window.hrAuthStore?.getCurrentCompanyContext?.()
    || createChallengeCompanyContext({});
  if (hasChallengeCompanyContext(hrCompanyContext)) {
    return hrCompanyContext;
  }

  const employeeCompanyContext = window.employeeAuthStore?.getCurrentCompanyContext?.()
    || createChallengeCompanyContext({});
  if (hasChallengeCompanyContext(employeeCompanyContext)) {
    return employeeCompanyContext;
  }

  const expertCompanyContext = window.expertAuthStore?.getCurrentCompanyContext?.()
    || createChallengeCompanyContext({});
  if (hasChallengeCompanyContext(expertCompanyContext)) {
    return expertCompanyContext;
  }

  return getFallbackChallengeCompanyContext();
}

function resolveChallengeReadOptions(options = {}) {
  if (options?.includeAllCompanies) {
    return {
      includeAllCompanies: true,
      companyContext: createChallengeCompanyContext({}),
    };
  }

  const explicitCompanyContext = createChallengeCompanyContext(options);

  return {
    includeAllCompanies: false,
    companyContext: hasChallengeCompanyContext(explicitCompanyContext)
      ? explicitCompanyContext
      : getActiveChallengeCompanyContext(),
  };
}

function normalizeChallengeRecord(record) {
  const explicitCompanyContext = createChallengeCompanyContext(record);
  const normalizedCompanyContext = hasChallengeCompanyContext(explicitCompanyContext)
    ? explicitCompanyContext
    : getFallbackChallengeCompanyContext();

  return {
    id: normalizeChallengeStorageText(record?.id) || String(Date.now()),
    name: normalizeChallengeStorageText(record?.name),
    type: normalizeChallengeStorageText(record?.type),
    reward: normalizeChallengeStorageText(record?.reward),
    deadline: normalizeChallengeStorageText(record?.deadline),
    goal: normalizeChallengeStorageText(record?.goal),
    createdAt: normalizeChallengeStorageText(record?.createdAt) || new Date().toISOString(),
    creatorHrId: normalizeChallengeStorageText(record?.creatorHrId),
    companyId: normalizedCompanyContext.companyId,
    companyName: normalizedCompanyContext.companyName,
  };
}

function normalizeRewardRecord(record) {
  const explicitCompanyContext = createChallengeCompanyContext(record);
  const normalizedCompanyContext = hasChallengeCompanyContext(explicitCompanyContext)
    ? explicitCompanyContext
    : getFallbackChallengeCompanyContext();

  return {
    id: normalizeChallengeStorageText(record?.id) || String(Date.now()),
    imageUrl: normalizeChallengeStorageText(record?.imageUrl),
    name: normalizeChallengeStorageText(record?.name),
    description: normalizeChallengeStorageText(record?.description),
    points: normalizeChallengeStorageText(record?.points),
    claimableCount: normalizeChallengeStorageText(record?.claimableCount),
    claimedCount: normalizeChallengeStorageText(record?.claimedCount),
    createdAt: normalizeChallengeStorageText(record?.createdAt) || new Date().toISOString(),
    creatorHrId: normalizeChallengeStorageText(record?.creatorHrId),
    companyId: normalizedCompanyContext.companyId,
    companyName: normalizedCompanyContext.companyName,
  };
}

function readChallenges(options = {}) {
  const { includeAllCompanies, companyContext } = resolveChallengeReadOptions(options);
  const challenges = readChallengeCollection(CHALLENGE_STORAGE_KEY).map(normalizeChallengeRecord);

  if (includeAllCompanies || !hasChallengeCompanyContext(companyContext)) {
    return challenges;
  }

  return challenges.filter((challenge) =>
    matchesChallengeCompanyContext(challenge, companyContext)
  );
}

function writeChallenges(challenges) {
  const normalizedChallenges = Array.isArray(challenges)
    ? challenges.map(normalizeChallengeRecord)
    : [];

  window.localStorage.setItem(
    CHALLENGE_STORAGE_KEY,
    JSON.stringify(normalizedChallenges)
  );
}

function mergeCompanyScopedChallengesLocally(challenges, companyContext) {
  const normalizedCompanyContext = createChallengeCompanyContext(companyContext);
  const currentChallenges = readChallenges({ includeAllCompanies: true });

  if (!hasChallengeCompanyContext(normalizedCompanyContext)) {
    writeChallenges(Array.isArray(challenges) ? challenges : []);
    return true;
  }

  const remainingChallenges = currentChallenges.filter(
    (challenge) => !matchesChallengeCompanyContext(challenge, normalizedCompanyContext)
  );

  writeChallenges([...(Array.isArray(challenges) ? challenges : []), ...remainingChallenges]);
  return true;
}

function createChallengeRecord({ name, type, reward, deadline, goal }) {
  const currentHr = window.hrAuthStore?.getCurrentHr?.() || null;
  const companyContext = createChallengeCompanyContext(currentHr);

  return normalizeChallengeRecord({
    id: String(Date.now()),
    name,
    type,
    reward,
    deadline,
    goal,
    createdAt: new Date().toISOString(),
    creatorHrId: normalizeChallengeStorageText(currentHr?.id),
    companyId: companyContext.companyId,
    companyName: companyContext.companyName,
  });
}

function readRewards(options = {}) {
  const { includeAllCompanies, companyContext } = resolveChallengeReadOptions(options);
  const rewards = readChallengeCollection(REWARD_STORAGE_KEY).map(normalizeRewardRecord);

  if (includeAllCompanies || !hasChallengeCompanyContext(companyContext)) {
    return rewards;
  }

  return rewards.filter((reward) =>
    matchesChallengeCompanyContext(reward, companyContext)
  );
}

function writeRewards(rewards) {
  const normalizedRewards = Array.isArray(rewards)
    ? rewards.map(normalizeRewardRecord)
    : [];

  window.localStorage.setItem(
    REWARD_STORAGE_KEY,
    JSON.stringify(normalizedRewards)
  );
}

function mergeCompanyScopedRewardsLocally(rewards, companyContext) {
  const normalizedCompanyContext = createChallengeCompanyContext(companyContext);
  const currentRewards = readRewards({ includeAllCompanies: true });

  if (!hasChallengeCompanyContext(normalizedCompanyContext)) {
    writeRewards(Array.isArray(rewards) ? rewards : []);
    return true;
  }

  const remainingRewards = currentRewards.filter(
    (reward) => !matchesChallengeCompanyContext(reward, normalizedCompanyContext)
  );

  writeRewards([...(Array.isArray(rewards) ? rewards : []), ...remainingRewards]);
  return true;
}

function buildChallengeQueryString(companyContext) {
  const normalizedCompanyContext = createChallengeCompanyContext(companyContext);
  const params = new URLSearchParams();

  if (normalizedCompanyContext.companyId) {
    params.set("companyId", normalizedCompanyContext.companyId);
  } else if (normalizedCompanyContext.companyName) {
    params.set("companyName", normalizedCompanyContext.companyName);
  }

  const queryString = params.toString();
  return queryString ? `?${queryString}` : "";
}

async function syncChallengeDataFromBackend(options = {}) {
  if (!window.appApiClient?.request) {
    return {
      ok: false,
      skipped: true,
    };
  }

  const companyContext = createChallengeCompanyContext(options);
  const resolvedCompanyContext = hasChallengeCompanyContext(companyContext)
    ? companyContext
    : getActiveChallengeCompanyContext();

  try {
    const queryString = buildChallengeQueryString(resolvedCompanyContext);
    const [challenges, rewards] = await Promise.all([
      window.appApiClient.request(`/challenges${queryString}`),
      window.appApiClient.request(`/rewards${queryString}`),
    ]);

    mergeCompanyScopedChallengesLocally(challenges, resolvedCompanyContext);
    mergeCompanyScopedRewardsLocally(rewards, resolvedCompanyContext);

    return {
      ok: true,
    };
  } catch (error) {
    console.error("Unable to refresh challenges and rewards from the backend.", error);
    return {
      ok: false,
      error: error?.message || "The latest challenge and reward data could not be loaded right now.",
    };
  }
}

function createRewardRecord({
  imageUrl,
  name,
  description,
  points,
  claimableCount,
  claimedCount,
}) {
  const currentHr = window.hrAuthStore?.getCurrentHr?.() || null;
  const companyContext = createChallengeCompanyContext(currentHr);

  return normalizeRewardRecord({
    id: String(Date.now()),
    imageUrl,
    name,
    description,
    points,
    claimableCount,
    claimedCount,
    createdAt: new Date().toISOString(),
    creatorHrId: normalizeChallengeStorageText(currentHr?.id),
    companyId: companyContext.companyId,
    companyName: companyContext.companyName,
  });
}

function replaceRewardRecordLocally(updatedReward) {
  const normalizedReward = normalizeRewardRecord(updatedReward);
  const rewards = readRewards({ includeAllCompanies: true });
  const existingIndex = rewards.findIndex((reward) => reward.id === normalizedReward.id);

  if (existingIndex >= 0) {
    rewards[existingIndex] = normalizedReward;
  } else {
    rewards.unshift(normalizedReward);
  }

  writeRewards(rewards);
  return normalizedReward;
}

function replaceEmployeeRecordLocally(updatedEmployee) {
  if (!window.employeeAuthStore?.writeEmployees) {
    return updatedEmployee || null;
  }

  const employees = window.employeeAuthStore.readEmployees({ includeAllCompanies: true });
  const existingIndex = employees.findIndex(
    (employee) => normalizeChallengeStorageText(employee?.id) === normalizeChallengeStorageText(updatedEmployee?.id)
  );

  if (existingIndex >= 0) {
    employees[existingIndex] = updatedEmployee;
  } else if (updatedEmployee) {
    employees.unshift(updatedEmployee);
  }

  window.employeeAuthStore.writeEmployees(employees);
  return updatedEmployee || null;
}

async function claimRewardForEmployee(rewardId, employeeId) {
  const normalizedRewardId = normalizeChallengeStorageText(rewardId);
  const normalizedEmployeeId =
    normalizeChallengeStorageText(employeeId)
    || normalizeChallengeStorageText(window.employeeAuthStore?.getCurrentEmployee?.()?.id);

  if (!normalizedRewardId || !normalizedEmployeeId) {
    return {
      ok: false,
      error: "Employee reward claim details are missing.",
    };
  }

  if (!window.appApiClient?.request) {
    return {
      ok: false,
      error: "The reward claim service is unavailable right now.",
    };
  }

  try {
    const result = await window.appApiClient.request(
      `/rewards/${encodeURIComponent(normalizedRewardId)}/claim`,
      {
        method: "POST",
        json: {
          employeeId: normalizedEmployeeId,
        },
      }
    );

    if (result?.reward) {
      replaceRewardRecordLocally(result.reward);
    }

    if (result?.employee) {
      replaceEmployeeRecordLocally(result.employee);
    }

    return {
      ok: true,
      reward: result?.reward || null,
      employee: result?.employee || null,
    };
  } catch (error) {
    return {
      ok: false,
      error: error?.message || "The reward could not be claimed right now.",
    };
  }
}
