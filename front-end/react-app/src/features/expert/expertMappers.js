export function normalizeCheckinType(value) {
  const type = String(value || "").trim().toLowerCase();
  return ["diet", "diet plan", "dietplan"].includes(type) ? "nutrition" : type;
}

function getCheckinPriority(record) {
  const value = (field) => record[field] === "" || record[field] == null ? Number.NaN : Number(record[field]);
  const type = normalizeCheckinType(record.checkinType);
  const supportNeeded = String(record.supportNeeded || "").toLowerCase();
  if (supportNeeded.includes("as soon as possible")) return { priority: "high", urgencyReason: "The employee requested support as soon as possible." };
  if (type === "mental") {
    if (value("stressScore") >= 8 || value("moodScore") <= 3) return { priority: "high", urgencyReason: "Stress is high, mood is very low, or urgent support was requested." };
    if (value("stressScore") >= 6 || value("moodScore") <= 5 || value("sleepHours") < 6) return { priority: "medium", urgencyReason: "Mood, stress, or sleep may benefit from follow-up." };
  }
  if (type === "nutrition") {
    if (value("mealConsistency") <= 3 || value("waterIntakeLiters") < 1.2 || value("energyScore") <= 3) return { priority: "high", urgencyReason: "Hydration, energy, or meal consistency is low." };
    if (value("mealConsistency") <= 5 || value("waterIntakeLiters") < 2 || value("energyScore") <= 5) return { priority: "medium", urgencyReason: "Nutrition habits may benefit from adjustment or coaching." };
  }
  if (type === "physical") {
    if (value("painScore") >= 8 || value("mobilityScore") <= 3 || value("recoveryScore") <= 3) return { priority: "high", urgencyReason: "Pain, mobility, or recovery suggests a need for prompt follow-up." };
    if (value("painScore") >= 6 || value("mobilityScore") <= 5 || value("recoveryScore") <= 5) return { priority: "medium", urgencyReason: "Movement or recovery may benefit from coaching." };
  }
  if (supportNeeded.includes("follow-up")) return { priority: "medium", urgencyReason: "The employee requested a follow-up this week." };
  return { priority: "stable", urgencyReason: "No immediate concern detected in the submitted check-in." };
}

export function mapExpertConsultations(records = []) {
  return records.map((record) => ({
    ...record,
    employee: record.employeeName || record.employee || "Employee",
    requestedAt: record.requestedOn || record.requestedAt || record.createdAt,
    date: record.sessionDate || record.date,
    time: record.sessionTime || record.time,
    completed: String(record.status || "").toLowerCase() === "completed" || Boolean(record.completed),
  }));
}

export function mapExpertCheckins(records = [], responses = [], specialization) {
  const specialty = String(specialization || "").toLowerCase();
  const checkinType = specialty.includes("nutrition") ? "nutrition" : specialty.includes("psych") || specialty.includes("mental") ? "mental" : "physical";
  return records.filter((record) => normalizeCheckinType(record.checkinType) === checkinType).map((record) => {
    const responseHistory = responses.filter((response) => String(response.checkinId) === String(record.id)).map((response) => ({ text: response.message, createdAt: response.createdAt, expertId: response.expertId, expertName: response.expertName }));
    const recordType = normalizeCheckinType(record.checkinType);
    const { priority, urgencyReason } = getCheckinPriority(record);
    const typeFields = recordType === "mental"
      ? [["Mood", record.moodScore], ["Stress", record.stressScore], ["Sleep", record.sleepHours], ["Focus", record.focusScore], ["Support", record.supportNeeded]]
      : recordType === "nutrition"
        ? [["Meal consistency", record.mealConsistency], ["Water", record.waterIntakeLiters], ["Energy", record.energyScore], ["Servings", record.servingsCount], ["Goal", record.nutritionGoal]]
        : [["Active minutes", record.activityMinutes], ["Steps", record.stepCount], ["Pain", record.painScore], ["Mobility", record.mobilityScore], ["Recovery", record.recoveryScore]];
    return {
      ...record,
      employee: record.employeeName || "Employee",
      department: "",
      submittedAt: record.submittedAt,
      priority,
      urgencyReason,
      reason: record.supportNeeded || record.nutritionGoal || record.workoutFocus || "Wellness check-in submitted.",
      metrics: typeFields.filter(([, value]) => value !== undefined && value !== ""),
      responses: responseHistory,
      followUpStatus: responseHistory.length ? "Suggestion sent" : String(record.supportNeeded || "").toLowerCase().includes("follow-up") ? "Follow-up requested" : "Not requested",
    };
  });
}
