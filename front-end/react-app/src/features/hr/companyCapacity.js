import { findActiveCompanySubscription } from "./hrUtils.js";

export function getCapacityForPlan(kind, company, currentCount, subscriptions) {
  const subscription = findActiveCompanySubscription(subscriptions, company);
  if (!subscription || !["starter", "business", "enterprise"].includes(String(subscription.planId || "").trim().toLowerCase())) {
    return { allowed: false, reason: "No active subscription is attached to this company. Choose a plan from Upgrade Plan before adding users." };
  }
  const planId = String(subscription.planId).trim().toLowerCase();
  const planLimits = { starter: { employee: 100, expert: 10 }, business: { employee: 1000, expert: 50 }, enterprise: { employee: 10000, expert: 100 } };
  const configuredLimit = kind === "employee" ? subscription.employeeLimit : subscription.expertLimit;
  const limit = Number(configuredLimit ?? planLimits[planId][kind]);
  if (!Number.isFinite(limit) || limit <= 0) return { allowed: false, reason: "The active subscription plan is invalid. Choose a plan from Upgrade Plan before adding users." };
  if (currentCount >= limit) return { allowed: false, reason: `${kind === "employee" ? "Employee" : "Wellness expert"} limit reached (${currentCount}/${limit}) on the ${subscription.planName || "current"} plan. Upgrade the plan to add more.` };
  return { allowed: true, limit };
}
