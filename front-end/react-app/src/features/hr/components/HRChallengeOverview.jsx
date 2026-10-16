function HRChallengeOverview({
  challenges,
  onSelectChallenge,
  selectedChallenge,
}) {
  return (
    <section className="two-column-grid" id="challenges">
      <article className="panel">
        <div className="panel-header">
          <h3>Active Challenges</h3>
        </div>
        <div className="challenge-list">
          {challenges.length ? (
            challenges.map((challenge) => (
              <button
                className={`challenge-item${selectedChallenge?.id === challenge.id ? " selected" : ""}`}
                key={challenge.id}
                onClick={() => onSelectChallenge(challenge.id)}
                type="button"
              >
                <span
                  className={`challenge-icon ${getChallengeTone(challenge.type)}`}
                >
                  <i
                    className={getChallengeSymbol(challenge.type)}
                    aria-hidden="true"
                  />
                </span>
                <span>{challenge.name}</span>
                <span className="challenge-arrow">&gt;</span>
              </button>
            ))
          ) : (
            <EmptyState message="No active challenges yet. Create one from the Challenges page." />
          )}
        </div>
      </article>

      <article className="panel">
        <div className="panel-header">
          <h3 id="dashboardLeaderboardTitle">
            {selectedChallenge
              ? `${selectedChallenge.name} - Summary`
              : "Challenge Summary"}
          </h3>
        </div>
        <div className="leaderboard">
          {selectedChallenge ? (
            [
              ["Type", selectedChallenge.type, "TY", "highlight"],
              ["Goal", selectedChallenge.goal, "GL", ""],
              ["Reward", selectedChallenge.reward, "RW", ""],
              ["Deadline", selectedChallenge.deadline, "DL", ""],
            ].map(([label, value, initials, rowClass]) => (
              <div className={`leaderboard-row ${rowClass}`} key={label}>
                <div className="person-meta">
                  <span className="rank-avatar">◎</span>
                  <span className="person-badge">{initials}</span>
                  <span>{label}</span>
                </div>
                <strong>{value || "Not specified"}</strong>
              </div>
            ))
          ) : (
            <EmptyState message="Select or create an active challenge to view its details." />
          )}
        </div>
      </article>
    </section>
  );
}

function getChallengeTone(type = "") {
  const normalized = type.toLowerCase();
  if (normalized.includes("fitness") || normalized.includes("community"))
    return "trend";
  if (normalized.includes("health")) return "water";
  return "trophy";
}

function getChallengeSymbol(type = "") {
  const normalized = type.toLowerCase();
  if (normalized.includes("fitness")) return "fa-solid fa-shoe-prints";
  if (normalized.includes("health")) return "fa-solid fa-droplet";
  if (normalized.includes("wellness")) return "fa-solid fa-spa";
  if (normalized.includes("community")) return "fa-solid fa-users";
  return "fa-solid fa-trophy";
}

function EmptyState({ message }) {
  return <div className="empty-state">{message}</div>;
}

export default HRChallengeOverview;
