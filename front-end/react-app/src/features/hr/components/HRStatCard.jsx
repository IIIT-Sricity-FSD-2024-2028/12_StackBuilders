function HRStatCard({ icon, label, tone, value }) {
  return (
    <article className="hr-stat-card">
      <span className={`hr-stat-icon ${tone}`}>{icon}</span>
      <p>{label}</p>
      <h2>{value}</h2>
    </article>
  );
}

export default HRStatCard;
