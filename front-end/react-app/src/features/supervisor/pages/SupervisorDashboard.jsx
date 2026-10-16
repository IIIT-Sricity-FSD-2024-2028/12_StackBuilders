import SupervisorIcon from "../components/SupervisorIcon.jsx";

function SupervisorDashboard({ navigate, stats, activities }) {
  const actions = [
    ["plus", "Add User", "Create a new user account", "users"],
    ["building", "Manage Companies", "Review company records", "companies"],
    ["file", "View Reports", "Access workspace analytics", "reports"],
    ["gear", "System Settings", "Configure supervisor controls", "settings"],
  ];

  return <>
    <div className="supervisor-page-heading">
      <div><p className="supervisor-eyebrow">Overview</p><h1>Dashboard overview</h1><p className="supervisor-subtitle">A clear view of users, activity, and the operational health of every wellness workspace.</p></div>
    </div>
    <section className="supervisor-stat-grid">
      {stats.map((stat, index) => <article className="stat-card" key={stat.label}>
        <div className="supervisor-panel-heading"><span className="supervisor-muted-label">{stat.label}</span><span className="stat-card-icon"><SupervisorIcon name={["users", "user", "activity"][index]} size={20} /></span></div>
        <strong>{stat.value}</strong><p>{stat.detail}</p>
      </article>)}
    </section>
    <section className="supervisor-content-grid">
      <article className="supervisor-panel"><div className="supervisor-panel-heading"><div><p className="supervisor-eyebrow">Shortcuts</p><h2>Quick actions</h2></div><SupervisorIcon name="chevron" size={20} /></div><div className="supervisor-action-list">{actions.map(([icon, title, detail, target]) => <button className="supervisor-action" type="button" key={title} onClick={() => navigate(target)}><span className="supervisor-action-icon"><SupervisorIcon name={icon} size={20} /></span><span><strong>{title}</strong><small>{detail}</small></span><SupervisorIcon name="chevron" size={18} /></button>)}</div></article>
      <article className="supervisor-panel"><div className="supervisor-panel-heading"><div><p className="supervisor-eyebrow">Workspace pulse</p><h2>Recent activity</h2></div><SupervisorIcon name="activity" size={20} /></div>{activities.length ? <ul className="supervisor-activity-list">{activities.map((activity) => <li key={activity.id}><span className={`activity-dot ${activity.tone}`} /><div><strong>{activity.title}</strong><small>{activity.details} | {activity.time}</small></div></li>)}</ul> : <p className="supervisor-empty-state">No workspace activity has been created yet.</p>}</article>
    </section>
  </>;
}

export default SupervisorDashboard;
