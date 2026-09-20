function HRChallengeOverview({ challenges, onSelectChallenge, selectedChallenge }) {
  return (
    <section className="hr-two-column-grid" id="challenges">
      <article className="hr-panel">
        <div className="hr-panel-header">
          <h3>Active Challenges</h3>
        </div>

        <div className="hr-challenge-list">
          {challenges.length ? (
            challenges.map((challenge) => (
              <button
                className={`hr-challenge-item ${
                  selectedChallenge?.id === challenge.id ? "selected" : ""
                }`}
                key={challenge.id}
                onClick={() => onSelectChallenge(challenge.id)}
                type="button"
              >
                <span className={`hr-challenge-icon ${getChallengeTone(challenge.type)}`}>
                  {getChallengeSymbol(challenge.type)}
                </span>
                <span>{challenge.name}</span>
                <span className="hr-challenge-arrow">&gt;</span>
              </button>
            ))
          ) : (
            <EmptyState message="No active challenges yet. Create one from the Challenges page." />
          )}
        </div>
      </article>

      <article className="hr-panel">
        <div className="hr-panel-header">
          <h3>{selectedChallenge ? `${selectedChallenge.name} - Summary` : "Challenge Summary"}</h3>
        </div>

        <div className="hr-leaderboard">
          {selectedChallenge ? (
            [
              ["Type", selectedChallenge.type, "TY", "highlight"],
              ["Goal", selectedChallenge.goal, "GL", ""],
              ["Reward", selectedChallenge.reward, "RW", ""],
              ["Deadline", selectedChallenge.deadline, "DL", ""],
            ].map(([label, value, initials, rowClass]) => (
              <div className={`hr-leaderboard-row ${rowClass}`} key={label}>
                <div className="hr-person-meta">
                  <span className="hr-rank-avatar">◎</span>
                  <span className="hr-person-badge">{initials}</span>
                  <span>{label}</span>
                </div>
                <strong>{value}</strong>
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

function getChallengeTone(type) {
  const normalized = type.toLowerCase();
  if (normalized.includes("fitness")) return "trend";
  if (normalized.includes("health")) return "water";
  return "trophy";
}

function getChallengeSymbol(type) {
  const normalized = type.toLowerCase();
  if (normalized.includes("fitness")) return "↗";
  if (normalized.includes("health")) return "◖";
  if (normalized.includes("community")) return "◆";
  return "★";
}

function EmptyState({ message }) {
  return <div className="hr-empty-state">{message}</div>;
}

export default HRChallengeOverview;
