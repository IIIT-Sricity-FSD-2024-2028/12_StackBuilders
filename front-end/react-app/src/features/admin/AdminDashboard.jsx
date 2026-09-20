import "./admin-dashboard.css";

function AdminIcon({ name }) {
  const paths = {
    users: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M22 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75",
    user: "M20 21a8 8 0 0 0-16 0 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8",
    heartbeat: "M3 12h4l2-7 4 14 2-7h6",
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

    </main>
  );
}

export default AdminDashboard;
