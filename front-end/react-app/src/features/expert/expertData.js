const STORAGE_KEY = "stackbuilders.react.expert.workspace.v1";

function isoDate(offset) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
}

function isoDateTime(offset, hour = 10) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
}

export function createExpertWorkspaceData() {
  return {
    expert: {
      name: "Dr. Sarah Mitchell",
      specialization: "Physical Wellness Instructor",
      track: "Physical Wellness",
      schedule: "Employees can submit their physical wellness check-in anytime. Review the latest entries to spot follow-up needs.",
    },
    availability: ["today-09:00", "today-09:15", "today-10:00", "tomorrow-14:00", "tomorrow-14:15"],
    sessions: [
      { id: "session-1", title: "Desk Mobility Reset", category: "Physical Wellness", sessionType: "Workshop", date: isoDate(2), startTime: "10:00", duration: "45 Minutes", maxParticipants: 40, attendees: 28, meetingLink: "https://meet.google.com/", description: "A gentle, practical movement session for people who spend long days at a desk.", status: "scheduled" },
      { id: "session-2", title: "Build a Better Sleep Routine", category: "Mind Relaxation", sessionType: "Webinar", date: isoDate(5), startTime: "16:30", duration: "60 Minutes", maxParticipants: 70, attendees: 42, meetingLink: "https://meet.google.com/", description: "Simple ways to make rest more consistent and restorative.", status: "scheduled" },
      { id: "session-3", title: "Lunch Break Stretch", category: "Physical Wellness", sessionType: "Video Session", date: isoDate(-7), startTime: "12:30", duration: "30 Minutes", maxParticipants: 50, attendees: 37, meetingLink: "https://meet.google.com/", description: "A short full-body reset that fits into a working day.", status: "completed", rating: 4.8 },
      { id: "session-4", title: "Mindful Morning Check-in", category: "Mind Relaxation", sessionType: "Video Session", date: isoDate(-15), startTime: "09:00", duration: "30 Minutes", maxParticipants: 60, attendees: 51, meetingLink: "https://meet.google.com/", description: "A guided routine to start the day feeling focused and calm.", status: "completed", rating: 4.7 },
    ],
    videos: [
      { id: "video-1", title: "5 Habits for a Healthier Workday", category: "Health Related", duration: "08:32", description: "Small habits that help energy, posture, and focus stay steady all day.", videoLink: "https://www.youtube.com/", accent: "coral" },
      { id: "video-2", title: "A Gentle Guide to Better Sleep", category: "Health Related", duration: "11:20", description: "A calm, evidence-informed routine for winding down at night.", videoLink: "https://www.youtube.com/", accent: "sun" },
      { id: "video-3", title: "Three Minute Breathing Space", category: "Mind Relaxation", duration: "03:05", description: "Reset your attention with a short guided breathing practice.", videoLink: "https://www.youtube.com/", accent: "violet" },
      { id: "video-4", title: "Stretching for Desk Workers", category: "Physical Wellness", duration: "14:18", description: "Follow-along mobility exercises for your neck, shoulders, and hips.", videoLink: "https://www.youtube.com/", accent: "mint" },
      { id: "video-5", title: "Low Impact Core Flow", category: "Physical Wellness", duration: "18:45", description: "A supportive core-strength session with no equipment required.", videoLink: "https://www.youtube.com/", accent: "blue" },
    ],
    checkins: [
      { id: "checkin-1", employee: "Ananya Rao", department: "Product", submittedAt: isoDateTime(-1, 10), priority: "high", reason: "Persistent lower-back discomfort reported.", metrics: [["Movement", "2 of 5 days"], ["Energy", "Low"], ["Sleep", "5.5 hours"]], notes: "I have been working late and my lower back feels stiff by the end of the day.", responses: [], followUpStatus: "Not requested" },
      { id: "checkin-2", employee: "Karthik Iyer", department: "Engineering", submittedAt: isoDateTime(-1, 15), priority: "medium", reason: "Activity level dropped compared with the previous update.", metrics: [["Movement", "1 of 5 days"], ["Energy", "Moderate"], ["Sleep", "6.5 hours"]], notes: "I want a short routine that I can do between meetings.", responses: [], followUpStatus: "Not requested" },
      { id: "checkin-3", employee: "Meera Nair", department: "Design", submittedAt: isoDateTime(-2, 11), priority: "stable", reason: "Wellness indicators are steady.", metrics: [["Movement", "4 of 5 days"], ["Energy", "Good"], ["Sleep", "7 hours"]], notes: "The lunchtime walks have helped me feel much better this week.", responses: ["Great consistency, Meera. Keep the lunchtime walks in your routine."], followUpStatus: "Not needed" },
      { id: "checkin-4", employee: "Rohan Shah", department: "Sales", submittedAt: isoDateTime(-3, 16), priority: "high", reason: "Pain is limiting normal movement.", metrics: [["Movement", "0 of 5 days"], ["Energy", "Low"], ["Sleep", "5 hours"]], notes: "My shoulder is still sore, and I have avoided any exercise this week.", responses: [], followUpStatus: "Not requested" },
      { id: "checkin-5", employee: "Priya Menon", department: "People Ops", submittedAt: isoDateTime(-5, 9), priority: "stable", reason: "Wellness indicators are steady.", metrics: [["Movement", "3 of 5 days"], ["Energy", "Good"], ["Sleep", "7.5 hours"]], notes: "I would like ideas for building a more regular stretching habit.", responses: [], followUpStatus: "Not needed" },
    ],
    consultations: [
      { id: "consult-1", employee: "Nikhil Varma", purpose: "Guidance for recurring neck stiffness", requestedAt: isoDateTime(-1, 9), status: "pending" },
      { id: "consult-2", employee: "Sana Khan", purpose: "Build a beginner-friendly activity plan", requestedAt: isoDateTime(-2, 12), status: "pending" },
      { id: "consult-3", employee: "Aarav Patel", purpose: "Review a sustainable movement routine", requestedAt: isoDateTime(-3, 14), status: "accepted", date: isoDate(1), time: "14:00" },
      { id: "consult-4", employee: "Divya Das", purpose: "Follow up on wellbeing goals", requestedAt: isoDateTime(-10, 11), status: "accepted", date: isoDate(-3), time: "11:30", completed: true, rating: 5 },
      { id: "consult-5", employee: "Vikram Roy", purpose: "Discuss a recent injury", requestedAt: isoDateTime(-7, 13), status: "rejected", reason: "Please re-request after sharing a current medical clearance." },
    ],
  };
}

export function loadExpertWorkspaceData() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return createExpertWorkspaceData();
    const data = JSON.parse(saved);
    return data && data.expert && Array.isArray(data.sessions) ? data : createExpertWorkspaceData();
  } catch {
    return createExpertWorkspaceData();
  }
}

export function saveExpertWorkspaceData(data) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // The workspace remains usable when browser storage is unavailable.
  }
}

export function makeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function nextAvailableDate() {
  return isoDate(1);
}
