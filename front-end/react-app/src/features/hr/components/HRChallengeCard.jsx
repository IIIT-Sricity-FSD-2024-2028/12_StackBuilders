function HRChallengeCard({ challenge, onDelete }) {
  return (
    <article className="hr-challenge-card">
      <div className="hr-challenge-card-title">
        <span className={`hr-challenge-mark ${getTone(challenge.type)}`}>♜</span>
        <div><h3>{challenge.name}</h3><span className="hr-challenge-tag">{challenge.type}</span></div>
      </div>
      <div className="hr-challenge-metrics">
        <div><span>Reward</span><strong>{challenge.reward}</strong></div>
        <div><span>Deadline</span><strong>{formatDate(challenge.deadline)}</strong></div>
        <div><span>Goal</span><strong>{challenge.goal}</strong></div>
      </div>
      <button className="hr-danger-button" onClick={() => onDelete(challenge.id)} type="button">Delete</button>
    </article>
  );
}

function getTone(type = "") { return type.toLowerCase().includes("fitness") ? "fitness" : type.toLowerCase().includes("health") ? "health" : "wellness"; }
function formatDate(value) { if (!value) return "Open"; const date = new Date(value); return Number.isNaN(date.valueOf()) ? value : date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }

export default HRChallengeCard;
