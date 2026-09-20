function StatCard({ label, value, tone = "teal" }) {
  return (
    <article className={`stat-card stat-card--${tone}`}>
      <span className="stat-card-icon" aria-hidden="true" />
      <p>{label}</p>
      <strong>{value}</strong>
    </article>
  );
}

export default StatCard;
