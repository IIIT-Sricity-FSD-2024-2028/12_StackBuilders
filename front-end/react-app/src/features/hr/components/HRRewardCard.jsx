function HRRewardCard({ reward, onDelete, canDelete = true }) {
  return (
    <article className={`reward-card ${getTheme(reward)}`}>
      <div className="reward-badge">
        <i className="fa-solid fa-star" aria-hidden="true" /> Popular
      </div>
      <img className="reward-image" src={reward.imageUrl} alt={reward.name} />
      <h3>{reward.name}</h3>
      <p>{reward.description}</p>
      <div className="reward-meta">
        <span>{reward.points} points</span>
        <span>Claimable: {reward.claimableCount || "0"}</span>
        <span>Claimed: {reward.claimedCount || "0"}</span>
      </div>
      {canDelete && (
        <div className="reward-card-actions">
          <button
            className="reward-delete-btn"
            onClick={() => onDelete(reward.id)}
            type="button"
          >
            <i className="fa-regular fa-trash-can" aria-hidden="true" /> Delete
          </button>
        </div>
      )}
    </article>
  );
}

function getTheme(reward) {
  const seed = String(reward?.id || reward?.name || "reward").length % 3;
  return ["reward-card-green", "reward-card-blue", "reward-card-gold"][seed];
}

export default HRRewardCard;
