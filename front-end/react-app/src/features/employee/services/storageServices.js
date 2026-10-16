/**
 * storageServices.js
 * Thin wrappers around the existing localStorage stores.
 * These read the same keys written by the plain HTML app scripts.
 */

// ─── Shared helpers ────────────────────────────────────────────────────────

function readJson(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage may be full
  }
}

// ─── Challenges ────────────────────────────────────────────────────────────

const CHALLENGE_KEY = 'stackbuilders.challenges';

export function readChallenges(companyContext) {
  const all = readJson(CHALLENGE_KEY) || [];
  return all.filter(
    (c) =>
      String(c.companyId || '').trim() === companyContext.companyId ||
      String(c.companyName || '').trim() === companyContext.companyName
  );
}

// ─── Consultations ─────────────────────────────────────────────────────────

const CONSULTATION_KEY = 'stackbuilders.consultations';

export function readConsultations(companyContext) {
  const all = readJson(CONSULTATION_KEY) || [];
  return all.filter(
    (c) =>
      String(c.companyId || '').trim() === companyContext.companyId ||
      String(c.companyName || '').trim() === companyContext.companyName
  );
}

export function readConsultationsByEmployee(employeeId, companyContext) {
  return readConsultations(companyContext).filter(
    (c) => String(c.employeeId || '') === String(employeeId || '')
  );
}

export function addConsultation(record) {
  const all = readJson(CONSULTATION_KEY) || [];
  all.unshift(record);
  writeJson(CONSULTATION_KEY, all);
}

export function formatScheduleDate(dateStr) {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function formatScheduleTime(timeStr) {
  if (!timeStr) return '';
  return timeStr;
}

export function splitRequestedOn(requestedOn) {
  if (!requestedOn) return { date: '—', time: '' };
  try {
    const d = new Date(requestedOn);
    return {
      date: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      time: d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    };
  } catch {
    return { date: requestedOn, time: '' };
  }
}

// ─── Experts ───────────────────────────────────────────────────────────────

const EXPERT_KEY = 'stackbuilders.hr.experts';

export function readExperts(companyContext) {
  const all = readJson(EXPERT_KEY) || [];
  return all.filter(
    (e) =>
      String(e.companyId || '').trim() === companyContext.companyId ||
      String(e.companyName || '').trim() === companyContext.companyName
  );
}

// ─── Live Sessions ─────────────────────────────────────────────────────────

const LIVE_SESSION_KEY = 'stackbuilders.liveSessions';

export function readLiveSessions(companyContext) {
  const all = readJson(LIVE_SESSION_KEY) || [];
  return all.filter(
    (s) =>
      String(s.companyId || '').trim() === companyContext.companyId ||
      String(s.companyName || '').trim() === companyContext.companyName
  );
}

// ─── Video Library ─────────────────────────────────────────────────────────

const VIDEO_KEY = 'stackbuilders.videoLibrary';

export function readVideos(companyContext) {
  const all = readJson(VIDEO_KEY) || [];
  return all.filter(
    (v) =>
      String(v.companyId || '').trim() === companyContext.companyId ||
      String(v.companyName || '').trim() === companyContext.companyName
  );
}

// ─── Wellness Check-ins ────────────────────────────────────────────────────

const CHECKIN_KEY = 'stackbuilders.wellnessCheckins';

const TRACK_CONFIGS = {
  mental: {
    key: 'mental',
    label: 'Mental Wellness',
    expertLabel: 'Psychologist',
    schedule: 'Submit once a week or after a stressful event.',
    intro: 'Share your current mental wellness status with your assigned psychologist.',
    fields: [
      { name: 'moodScore', label: 'Mood score', inputType: 'number', min: 1, max: 10, step: 1, placeholder: 'e.g. 7', required: true },
      { name: 'stressScore', label: 'Stress score', inputType: 'number', min: 1, max: 10, step: 1, placeholder: 'e.g. 6', required: true },
      { name: 'sleepHours', label: 'Sleep last night (hours)', inputType: 'number', min: 0, max: 16, step: 0.5, placeholder: 'e.g. 7.5', required: true },
      { name: 'focusScore', label: 'Focus score', inputType: 'number', min: 1, max: 10, step: 1, placeholder: 'e.g. 7', required: true },
      { name: 'anxietyTrigger', label: 'Main stress trigger today', inputType: 'text', placeholder: 'Describe the main trigger', required: true },
      { name: 'supportNeeded', label: 'Support needed', inputType: 'select', options: ['No immediate support needed', 'Would like a follow-up this week', 'Need support as soon as possible'], required: true },
    ],
  },
  physical: {
    key: 'physical',
    label: 'Physical Wellness',
    expertLabel: 'Physical Wellness Instructor',
    schedule: 'Submit after each workout or at least twice a week.',
    intro: 'Share your activity and recovery details with your physical wellness instructor.',
    fields: [
      { name: 'activityMinutes', label: 'Active minutes today', inputType: 'number', min: 0, max: 1440, step: 1, placeholder: 'e.g. 30', required: true },
      { name: 'stepCount', label: 'Steps today', inputType: 'number', min: 0, max: 100000, step: 1, placeholder: 'e.g. 8000', required: true },
      { name: 'painScore', label: 'Pain or soreness score', inputType: 'number', min: 1, max: 10, step: 1, placeholder: 'e.g. 2', required: true },
      { name: 'mobilityScore', label: 'Mobility score', inputType: 'number', min: 1, max: 10, step: 1, placeholder: 'e.g. 8', required: true },
      { name: 'recoveryScore', label: 'Recovery score', inputType: 'number', min: 1, max: 10, step: 1, placeholder: 'e.g. 7', required: true },
      { name: 'workoutFocus', label: 'Workout focus', inputType: 'select', options: ['Walking or cardio', 'Strength training', 'Mobility or stretching', 'Yoga or mindfulness movement', 'Recovery day'], required: true },
    ],
  },
  nutrition: {
    key: 'nutrition',
    label: 'Diet Plan',
    expertLabel: 'Nutritionist',
    schedule: 'Submit daily or every two days.',
    intro: 'Share your diet and hydration details with your nutritionist.',
    fields: [
      { name: 'mealConsistency', label: 'Meal plan consistency', inputType: 'number', min: 1, max: 10, step: 1, placeholder: 'e.g. 8', required: true },
      { name: 'waterIntakeLiters', label: 'Water intake today', inputType: 'number', min: 0, max: 10, step: 0.1, placeholder: 'e.g. 2.5', required: true },
      { name: 'energyScore', label: 'Energy score', inputType: 'number', min: 1, max: 10, step: 1, placeholder: 'e.g. 7', required: true },
      { name: 'servingsCount', label: 'Fruit and vegetable servings', inputType: 'number', min: 0, max: 20, step: 1, placeholder: 'e.g. 4', required: true },
      { name: 'nutritionGoal', label: 'Primary nutrition goal', inputType: 'select', options: ['Weight management', 'More energy during work', 'Better digestion', 'Muscle gain or recovery', 'Improve eating consistency'], required: true },
      { name: 'dietChallenge', label: 'Biggest diet challenge today', inputType: 'text', placeholder: 'Describe the main challenge', required: true },
    ],
  },
};

export function getTrackConfig(trackKey) {
  return TRACK_CONFIGS[trackKey] || null;
}

export function readCheckins(companyContext) {
  const all = readJson(CHECKIN_KEY) || [];
  return all.filter(
    (c) =>
      String(c.companyId || '').trim() === companyContext.companyId ||
      String(c.companyName || '').trim() === companyContext.companyName
  );
}

export function readCheckinsByEmployee(employeeId, companyContext) {
  return readCheckins(companyContext).filter(
    (c) => String(c.employeeId || '') === String(employeeId || '')
  );
}

export function readCheckinsByTrack(trackKey, employeeId, companyContext) {
  return readCheckinsByEmployee(employeeId, companyContext).filter(
    (c) => c.checkinType === trackKey
  );
}

export function addCheckin(record) {
  const all = readJson(CHECKIN_KEY) || [];
  all.unshift(record);
  writeJson(CHECKIN_KEY, all);
}

export function formatDateTime(isoString) {
  if (!isoString) return '—';
  try {
    return new Date(isoString).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}

export function formatFieldValue(field, value) {
  if (!value) return '—';
  if (field.inputType === 'number') return String(value);
  return String(value);
}

export function getCheckinUrgency(record) {
  const supportNeeded = record.supportNeeded || '';
  if (supportNeeded === 'Need support as soon as possible') return { label: 'Urgent', color: '#ef4444' };
  if (supportNeeded === 'Would like a follow-up this week') return { label: 'Follow-up', color: '#f59e0b' };
  return { label: 'Routine', color: '#10b981' };
}

// ─── Checkin Responses ─────────────────────────────────────────────────────

const RESPONSE_KEY = 'stackbuilders.checkinResponses';

export function readCheckinResponses(companyContext) {
  const all = readJson(RESPONSE_KEY) || [];
  return all.filter(
    (r) =>
      String(r.companyId || '').trim() === companyContext.companyId ||
      String(r.companyName || '').trim() === companyContext.companyName
  );
}

export function getLatestResponseByCheckinId(checkinId, companyContext) {
  const all = readCheckinResponses(companyContext);
  return all.find((r) => String(r.checkinId || '') === String(checkinId || '')) || null;
}

// ─── Rewards ───────────────────────────────────────────────────────────────

const REWARD_KEY = 'stackbuilders.rewards';

export function readRewards(companyContext) {
  const all = readJson(REWARD_KEY) || [];
  return all.filter(
    (r) =>
      String(r.companyId || '').trim() === companyContext.companyId ||
      String(r.companyName || '').trim() === companyContext.companyName
  );
}

// ─── Daily Wellness Tips ───────────────────────────────────────────────────

export const DAILY_WELLNESS_TIPS = [
  { title: 'Start the morning with water.', body: 'Drinking a glass of water after waking up helps you rehydrate and gives your day a simple healthy start.' },
  { title: 'Take a two-minute breathing break.', body: 'Pause, inhale slowly, and exhale fully a few times to lower tension and reset your focus.' },
  { title: 'Stand up once every hour.', body: 'Short movement breaks can ease stiffness, improve circulation, and help you stay more alert through the day.' },
  { title: 'Add one extra serving of vegetables.', body: 'A small nutrition upgrade at lunch or dinner can improve fullness, fiber intake, and overall balance.' },
  { title: 'Go outside for natural light.', body: 'A few minutes of daylight can support your energy, mood, and sleep rhythm, especially in the first half of the day.' },
  { title: 'Take a short walk after meals.', body: 'A gentle walk can help digestion and gives you a quick mental reset without needing a full workout block.' },
  { title: 'Protect your sleep routine tonight.', body: 'Try to keep a consistent bedtime and reduce screen use shortly before sleep to wind down more smoothly.' },
  { title: 'Check in with your posture.', body: 'Relax your shoulders, support your lower back, and bring your screen to eye level to reduce strain.' },
  { title: 'Choose one mindful snack.', body: 'Pick something simple and nourishing today, like fruit, yogurt, nuts, or another option that keeps you steady.' },
  { title: 'Do one stretch you usually skip.', body: 'Even a quick stretch for your neck, hips, or calves can relieve built-up tension from long sitting hours.' },
  { title: 'Give yourself five quiet minutes.', body: 'Stepping away from noise for a brief pause can make the rest of your work feel more manageable.' },
  { title: 'Keep a water bottle nearby.', body: 'Making hydration easy and visible is one of the simplest ways to improve your daily routine.' },
  { title: 'Reset your eyes from screens.', body: 'Look away from your screen every so often and focus on something in the distance to reduce eye fatigue.' },
  { title: 'Make lunch a real break.', body: 'If you can, step away from your desk while eating so your body and mind both get a reset.' },
  { title: 'End the day with a short reflection.', body: 'Ask yourself what gave you energy today and what drained it so tomorrow can be a little more intentional.' },
];

export function getDailyTip() {
  const now = new Date();
  const localMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const index = Math.abs(Math.floor(localMidnight.getTime() / 86400000)) % DAILY_WELLNESS_TIPS.length;
  return DAILY_WELLNESS_TIPS[index];
}
