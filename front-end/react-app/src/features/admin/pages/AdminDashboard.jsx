import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import RouteLoadingScreen from "../../../components/RouteLoadingScreen.jsx";
import usePageStylesheets from "../../../hooks/usePageStylesheets.js";
import adminApi from "../adminApi.js";
import useAutoRefresh from "../../../hooks/useAutoRefresh.js";
import { buildRecentActivityEntries } from "../../../utils/recentActivity.js";

const quickActions = [
  { title: "Add User", detail: "Create new user account", icon: "plus", target: "/admin/users" },
  { title: "Manage Companies", detail: "Review company records", icon: "database", target: "/admin/companies" },
  { title: "View Reports", detail: "Access analytics", icon: "file", target: "/admin/reports" },
  { title: "System Settings", detail: "Configure system", icon: "cog", target: "/admin/settings" },
];

function AdminDashboard() {
  const stylesReady = usePageStylesheets("/admin-dashboard-legacy.css");
  const navigate = useNavigate();
  const [stats, setStats] = useState([
    { label: "Total Users", value: "0", detail: "Synced from employee, expert, and HR accounts", icon: "users", id: "dashboardTotalUsers" },
    { label: "Active Users", value: "0", detail: "Live enabled accounts across the workspace", icon: "user", id: "dashboardActiveUsers" },
    { label: "System Activity", value: "0", detail: "Consultations, sessions, videos, challenges, and rewards", icon: "heartbeat", id: "dashboardActivityVolume" },
  ]);
  const [activity, setActivity] = useState([]);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async (silent = false) => {
    try {
      const [employees, experts, hrProfiles, companies, consultations, sessions, videos, challenges, rewards] = await Promise.all([
      adminApi.getUsers(),
      adminApi.getExperts(),
      adminApi.getHrProfiles(),
      adminApi.getCompanies(),
      adminApi.getConsultations(),
      adminApi.getLiveSessions(),
      adminApi.getVideos(),
      adminApi.getChallenges(),
      adminApi.getRewards(),
      ]);
      const users = [
        ...(employees || []).map((user) => ({ ...user, role: "Employee" })),
        ...(experts || []).map((user) => ({ ...user, role: "Wellness Expert" })),
        ...(hrProfiles || []).map((user) => ({ ...user, role: "HR" })),
      ];
      const records = [
        ...(consultations || []).map((item) => ({ label: "Consultation", detail: item.purpose || item.sessionTitle || "Consultation record" })),
        ...(sessions || []).map((item) => ({ label: "Live session", detail: item.title || "Live session record" })),
        ...(videos || []).map((item) => ({ label: "Video", detail: item.title || "Video record" })),
        ...(challenges || []).map((item) => ({ label: "Challenge", detail: item.name || "Challenge record" })),
        ...(rewards || []).map((item) => ({ label: "Reward", detail: item.name || "Reward record" })),
      ];
      setStats([
        { label: "Total Users", value: String(users.length), detail: "Synced from employee, expert, and HR accounts", icon: "users", id: "dashboardTotalUsers" },
        { label: "Active Users", value: String(users.filter((user) => (user.status || "Active") === "Active").length), detail: "Live enabled accounts across the workspace", icon: "user", id: "dashboardActiveUsers" },
        { label: "System Activity", value: String(records.length), detail: "Consultations, sessions, videos, challenges, and rewards", icon: "heartbeat", id: "dashboardActivityVolume" },
      ]);
      setActivity(buildRecentActivityEntries({ users, companies, consultations, liveSessions: sessions, videos, challenges, rewards }));
      setError("");
    } catch (loadError) {
      if (!silent) setError(loadError.message || "Could not load dashboard data.");
    }
  }, []);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);
  useAutoRefresh(() => loadDashboard(true), "admin-dashboard");

  if (!stylesReady) return <RouteLoadingScreen />;

  return (
    <main className="container">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Overview</p>
          <h1>Dashboard overview</h1>
        </div>
      </div>

      {error && <p className="placeholder-text" role="alert">{error}</p>}

      <section className="stats">
        {stats.map((stat) => (
          <div className="card" key={stat.label}>
            <div className="card-header">
              <span>{stat.label}</span>
              <i className={`fa fa-${stat.icon}`} />
            </div>
            <h2 className="placeholder-value" id={stat.id}>{stat.value}</h2>
            <p className="placeholder-text">{stat.detail}</p>
          </div>
        ))}
      </section>

      <section className="grid">
        <div className="panel">
          <h3>Quick Actions</h3>
          {quickActions.map((action) => (
            <div
              className="action"
              data-href={action.target}
              key={action.title}
              onClick={() => navigate(action.target)}
              onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") navigate(action.target); }}
              role="link"
              tabIndex={0}
            >
              <i className={`fa fa-${action.icon}`} />
              <div>
                <strong>{action.title}</strong>
                <span>{action.detail}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="panel">
          <h3>Recent Activity</h3>
          <ul className="activity" id="dashboardActivityList">
            {activity.length ? activity.map((item) => (
              <li key={item.id}>
                <strong><span className={`dot ${item.tone}`} />{item.title}</strong>
                <small>{item.details} | {item.time}</small>
              </li>
            )) : <li className="placeholder-text">No workspace activity has been created yet.</li>}
          </ul>
        </div>
      </section>
    </main>
  );
}

export default AdminDashboard;
