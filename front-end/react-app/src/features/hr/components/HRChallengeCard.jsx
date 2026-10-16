function HRChallengeCard({ challenge, onDelete, canDelete = true }) {
  return (
    <article className="challenge-card">
      <div className="challenge-title-row">
        <div className="challenge-mark">
          <i className={getIcon(challenge.type)} aria-hidden="true" />
        </div>
        <div>
          <h3>{challenge.name}</h3>
          <span className="challenge-tag">{challenge.type || "General"}</span>
        </div>
      </div>
      <div className="challenge-metrics">
        <div className="metric-box">
          <span className="metric-label">Reward</span>
          <strong>{challenge.reward}</strong>
        </div>
        <div className="metric-box">
          <span className="metric-label">Deadline</span>
          <strong>{formatDate(challenge.deadline)}</strong>
        </div>
        <div className="metric-box">
          <span className="metric-label">Goal</span>
          <strong>{challenge.goal}</strong>
        </div>
      </div>
      {canDelete && (
        <div className="challenge-card-actions">
          <button
            className="challenge-delete-btn"
            onClick={() => onDelete(challenge.id)}
            type="button"
          >
            <i className="fa-regular fa-trash-can" aria-hidden="true" /> Delete
          </button>
        </div>
      )}
    </article>
  );
}

function getIcon(type = "") {
  const normalized = type.toLowerCase();
  if (normalized.includes("fitness")) return "fa-solid fa-shoe-prints";
  if (normalized.includes("health")) return "fa-solid fa-droplet";
  if (normalized.includes("wellness")) return "fa-solid fa-spa";
  return "fa-solid fa-trophy";
}

function formatDate(value) {
  if (!value) return "Open";
  const date = new Date(value);
  return Number.isNaN(date.valueOf())
    ? value
    : date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
}

export default HRChallengeCard;
