function normalizeTimestamp(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const text = String(value ?? "").trim();
  if (!text) return 0;
  const numericValue = Number(text);
  if (Number.isFinite(numericValue)) return numericValue;
  const parsedValue = Date.parse(text);
  return Number.isFinite(parsedValue) ? parsedValue : 0;
}

function cleanText(value, fallback) {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  return text || fallback;
}

function formatRelativeTimestamp(value) {
  const timestamp = normalizeTimestamp(value);
  if (!timestamp) return "Date unavailable";

  const diffInDays = Math.floor((Date.now() - timestamp) / 86400000);
  if (diffInDays <= 0) return "Today";
  if (diffInDays === 1) return "1 day ago";
  if (diffInDays < 7) return `${diffInDays} days ago`;

  return new Date(timestamp).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function buildRecentActivityEntries(collections, limit = 5) {
  const users = (collections.users || []).filter((user) => !user.isSeededDefault);
  const companies = collections.companies || [];
  const consultations = collections.consultations || [];
  const liveSessions = collections.liveSessions || [];
  const videos = collections.videos || [];
  const challenges = collections.challenges || [];
  const rewards = collections.rewards || [];

  const entries = [
    ...users.map((user) => {
      const companyName = String(user.companyName || user.company || "").trim();
      const details = companyName && companyName !== "--" && companyName !== "—"
        ? companyName
        : cleanText(user.email, "--");
      return {
        id: `user:${user.id || user.email || user.name}`,
        title: `${cleanText(user.name, "--")} added as ${cleanText(user.role, "User")}`,
        details,
        tone: user.role === "Wellness Expert" ? "green" : user.role === "HR" ? "orange" : "blue",
        createdAt: user.createdAt,
      };
    }),
    ...companies.map((company) => ({
      id: `company:${company.id || company.name}`,
      title: `${cleanText(company.name, "Company")} company added`,
      details: `${cleanText(company.id, "--")} | ${cleanText(company.email, "--")}`,
      tone: "blue",
      createdAt: company.createdAt,
    })),
    ...consultations.map((consultation) => ({
      id: `consultation:${consultation.id || consultation.createdAt}`,
      title: `Consultation ${cleanText(consultation.status, "requested")}`,
      details: `${cleanText(consultation.employeeName, "Employee")} | ${cleanText(consultation.expertName, "Wellness Expert")}`,
      tone: "green",
      createdAt: consultation.createdAt,
    })),
    ...liveSessions.map((session) => ({
      id: `session:${session.id || session.createdAt}`,
      title: cleanText(session.title, "Live session scheduled"),
      details: cleanText(session.hostName, "Wellness Expert"),
      tone: "orange",
      createdAt: session.createdAt,
    })),
    ...videos.map((video) => ({
      id: `video:${video.id || video.createdAt}`,
      title: cleanText(video.title, "Video added"),
      details: cleanText(video.category, "Video library"),
      tone: "blue",
      createdAt: video.createdAt,
    })),
    ...challenges.map((challenge) => ({
      id: `challenge:${challenge.id || challenge.createdAt}`,
      title: cleanText(challenge.name, "Challenge created"),
      details: cleanText(challenge.type, "Challenge"),
      tone: "green",
      createdAt: challenge.createdAt,
    })),
    ...rewards.map((reward) => ({
      id: `reward:${reward.id || reward.createdAt}`,
      title: cleanText(reward.name, "Reward added"),
      details: cleanText(reward.points, "Reward"),
      tone: "orange",
      createdAt: reward.createdAt,
    })),
  ];

  return entries
    .map((entry, index) => ({ ...entry, timestamp: normalizeTimestamp(entry.createdAt), index }))
    .sort((left, right) => right.timestamp - left.timestamp || left.index - right.index)
    .slice(0, limit)
    .map(({ timestamp, index, ...entry }) => ({ ...entry, id: `${entry.id}:${index}`, time: formatRelativeTimestamp(entry.createdAt) }));
}
