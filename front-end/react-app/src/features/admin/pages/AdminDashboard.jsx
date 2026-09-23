import "../admin-dashboard.css";

function AdminIcon({ name }) {
  const paths = {
    users: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M22 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75",
    user: "M20 21a8 8 0 0 0-16 0 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8",
    heartbeat: "M3 12h4l2-7 4 14 2-7h6",
    plus: "M12 5v14 M5 12h14",
    database: "M4 5c0-1.1 3.6-2 8-2s8 .9 8 2-3.6 2-8 2-8-.9-8-2Zm0 0v7c0 1.1 3.6 2 8 2s8-.9 8-2V5m-16 7v7c0 1.1 3.6 2 8 2s8-.9 8-2v-7",
    file: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Zm0 0v6h6 M8 18h8 M8 14h2",
    settings: "M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-1.7 1.7-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V20h-2.4v-.2a1.7 1.7 0 0 0-1.03-1.56 1.7 1.7 0 0 0-1.88.34l-.06.06-1.7-1.7.06-.06A1.7 1.7 0 0 0 8.4 15a1.7 1.7 0 0 0-1.56-1.03H6v-2.4h.2A1.7 1.7 0 0 0 7.76 10a1.7 1.7 0 0 0-.34-1.88l-.06-.06 1.7-1.7.06.06A1.7 1.7 0 0 0 11 6.76 1.7 1.7 0 0 0 12.03 5.2V5h2.4v.2A1.7 1.7 0 0 0 15.46 6.76a1.7 1.7 0 0 0 1.88-.34l.06-.06 1.7 1.7-.06.06A1.7 1.7 0 0 0 18.7 10a1.7 1.7 0 0 0 1.56 1.03h.2v2.4h-.2A1.7 1.7 0 0 0 19.4 15Z",
  };

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d={paths[name] || paths.user} />
    </svg>
  );
}

const stats = [
  { label: "Total Users", value: "0", detail: "Synced from employee, expert, and HR accounts", icon: "users" },
  { label: "Active Users", value: "0", detail: "Live enabled accounts across the workspace", icon: "user" },
  { label: "System Activity", value: "0", detail: "Consultations, sessions, videos, challenges, and rewards", icon: "heartbeat" },
];

const quickActions = [
  { title: "Add User", detail: "Create new user account", icon: "plus", target: "#user-management" },
  { title: "Manage Companies", detail: "Review company records", icon: "database", target: "#company-management" },
  { title: "View Reports", detail: "Access analytics", icon: "file", target: "#reports" },
  { title: "System Settings", detail: "Configure system", icon: "settings", target: "#settings" },
];

function AdminDashboard() {
  return (
    <main className="admin-dashboard-page">
      <div className="admin-page-heading">
        <div>
          <p className="admin-eyebrow">Overview</p>
          <h1>Dashboard overview</h1>
        </div>
      </div>

      <section className="admin-stats" aria-label="Dashboard statistics">
        {stats.map((stat) => (
          <article className="admin-card" key={stat.label}>
            <div className="admin-card-header">
              <span>{stat.label}</span>
              <span className="admin-card-icon"><AdminIcon name={stat.icon} /></span>
            </div>
            <h2>{stat.value}</h2>
            <p>{stat.detail}</p>
          </article>
        ))}
      </section>

      <section className="admin-content-grid">
        <article className="admin-panel">
          <h3>Quick Actions</h3>
          <div className="admin-action-list">
            {quickActions.map((action) => (
              <a className="admin-action" href={action.target} key={action.title}>
                <span className="admin-action-icon"><AdminIcon name={action.icon} /></span>
                <span>
                  <strong>{action.title}</strong>
                  <small>{action.detail}</small>
                </span>
              </a>
            ))}
          </div>
        </article>

        <article className="admin-panel">
          <h3>Recent Activity</h3>
          <ul className="admin-activity-list">
            <li className="admin-empty-activity">
              <span className="admin-activity-dot" />
              <span>No recent activity loaded yet.</span>
            </li>
          </ul>
        </article>
      </section>
    </main>
  );
}

export default AdminDashboard;
