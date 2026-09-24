function HRRewardCard({ reward, onDelete }) {
  return (
    <article className="hr-reward-card">
      <div className="hr-reward-badge">Wellness reward</div>
      <div className="hr-reward-image" style={{ backgroundImage: `url(${reward.imageUrl})` }} aria-label={reward.name} role="img" />
      <h3>{reward.name}</h3>
      <p>{reward.description}</p>
      <div className="hr-reward-meta"><span>{reward.points} points</span><span>Claimable: {reward.claimableCount}</span><span>Claimed: {reward.claimedCount || 0}</span></div>
      <button className="hr-danger-button" onClick={() => onDelete(reward.id)} type="button">Delete</button>
    </article>
  );
}

export default HRRewardCard;
