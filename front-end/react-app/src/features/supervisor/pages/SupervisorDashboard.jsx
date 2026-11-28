import { useCallback, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import SupervisorIcon from "../components/SupervisorIcon.jsx";
import useAutoRefresh from "../../../hooks/useAutoRefresh.js";
import { buildRecentActivityEntries } from "../../../utils/recentActivity.js";
import { loadSupervisorDashboard } from "../dashboardSlice.js";

function SupervisorDashboard({ navigate }) {
  const dispatch = useDispatch();
  const users = useSelector((state) => state.supervisor.users.items);
  const companies = useSelector((state) => state.supervisor.companyManagement.companies);
  const activityData = useSelector((state) => state.supervisor.activity);
  const { loading, error } = useSelector((state) => state.supervisor.dashboard);

  const loadDashboard = useCallback(() => dispatch(loadSupervisorDashboard()), [dispatch]);

  useEffect(() => { void loadDashboard(); }, [loadDashboard]);
  useAutoRefresh(loadDashboard, "supervisor-dashboard");

  const stats = useMemo(() => [
    { label: "Total Users", value: String(users.length), detail: "Synced from employee, expert, and HR accounts" },
    { label: "Active Users", value: String(users.filter((user) => String(user.status || "").toLowerCase() === "active").length), detail: "Live enabled accounts across the workspace" },
    { label: "System Activity", value: String(activityData.consultations.length + activityData.liveSessions.length + activityData.videos.length + activityData.challenges.length + activityData.rewards.length), detail: "Consultations, sessions, videos, challenges, and rewards" },
  ], [users, activityData]);

  const activities = useMemo(() => buildRecentActivityEntries({
    users,
    companies,
    consultations: activityData.consultations,
    liveSessions: activityData.liveSessions,
    videos: activityData.videos,
    challenges: activityData.challenges,
    rewards: activityData.rewards,
  }), [users, companies, activityData]);

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
    {error && <p className="supervisor-empty-state" role="alert">{error} <button className="supervisor-outline-button" type="button" onClick={loadDashboard}>Retry</button></p>}
    {loading && !users.length ? <p className="supervisor-empty-state">Loading supervisor data…</p> : <>
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
    </>}
  </>;
}

export default SupervisorDashboard;
