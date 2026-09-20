import StatCard from "../../../components/StatCard.jsx";
import SupervisorIcon from "../components/SupervisorIcon.jsx";

const actions = [
  ["users", "User Management", "Review employee, HR, and expert accounts.", "users"],
  ["building", "Company Management", "Review company records and requests.", "companies"],
  ["file", "View Reports", "Access analytics and workspace trends.", "reports"],
  ["gear", "System Settings", "Configure profile and access rules.", "settings"],
];

function SupervisorDashboard({ navigate, stats, activities }) {
  return (
    <>
      <div className="supervisor-page-heading">
        <div><p className="supervisor-eyebrow">Overview</p><h1>Dashboard overview</h1></div>
        <span className="supervisor-live-badge"><i /> Live workspace</span>
      </div>

      <section className="supervisor-stat-grid" aria-label="Dashboard statistics">
        {stats.map((stat) => <StatCard key={stat.label} label={stat.label} value={stat.value} />)}
      </section>

      <section className="supervisor-content-grid">
        <article className="supervisor-panel">
          <div className="supervisor-panel-heading"><div><p className="supervisor-eyebrow">Shortcuts</p><h2>Quick Actions</h2></div><SupervisorIcon name="plus" /></div>
          <div className="supervisor-action-list">
            {actions.map(([icon, title, detail, target]) => <button className="supervisor-action" type="button" key={title} onClick={() => navigate(target)}><span className="supervisor-action-icon"><SupervisorIcon name={icon} /></span><span><strong>{title}</strong><small>{detail}</small></span><SupervisorIcon name="chevron" size={17} /></button>)}
          </div>
        </article>

        <article className="supervisor-panel">
          <div className="supervisor-panel-heading"><div><p className="supervisor-eyebrow">System pulse</p><h2>Recent Activity</h2></div><span className="supervisor-muted-label">Today</span></div>
          <ul className="supervisor-activity-list">
            {activities.length === 0 ? <li className="supervisor-empty-state">No recent activity loaded yet.</li> : activities.map((activity) => <li key={activity.id}><span className="activity-dot" /><span><strong>{activity.title}</strong><small>{activity.detail}</small></span><time>{activity.time}</time></li>)}
          </ul>
        </article>
      </section>
    </>
  );
}

export default SupervisorDashboard;
