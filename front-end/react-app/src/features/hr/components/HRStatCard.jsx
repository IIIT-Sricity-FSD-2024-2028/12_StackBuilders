function HRStatCard({ label, tone, value }) {
  const icons = {
    teal: "fa-people-group",
    blue: "fa-briefcase",
    green: "fa-wave-square",
    purple: "fa-gift",
    orange: "fa-bullseye",
  };
  return (
    <article className="stat-card">
      <span className={`stat-icon ${tone}`}>
        <i className={`fa-solid ${icons[tone] || "fa-chart-line"}`} />
      </span>
      <p className="stat-label">{label}</p>
      <h2>{value}</h2>
    </article>
  );
}

export default HRStatCard;
