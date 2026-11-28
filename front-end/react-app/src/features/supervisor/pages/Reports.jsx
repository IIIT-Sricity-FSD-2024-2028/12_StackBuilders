import { useCallback, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { SupervisorBarChart, SupervisorDonutChart, SupervisorLineChart } from "../components/SupervisorCharts.jsx";
import useAutoRefresh from "../../../hooks/useAutoRefresh.js";
import { loadSupervisorReports } from "../reportsSlice.js";

function monthBuckets(records, dateKey) {
  const now = new Date();
  const buckets = Array.from({ length: 6 }, (_, index) => new Date(now.getFullYear(), now.getMonth() - (5 - index), 1));
  return {
    labels: buckets.map((date) => new Intl.DateTimeFormat(undefined, { month: "short" }).format(date)),
    values: buckets.map((bucket) => records.filter((record) => {
      const date = new Date(record[dateKey] || "");
      return !Number.isNaN(date.valueOf()) && date.getFullYear() === bucket.getFullYear() && date.getMonth() === bucket.getMonth();
    }).length),
  };
}

function Reports() {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.supervisor.reports);
  const users = useSelector((state) => state.supervisor.users.items);
  const companies = useSelector((state) => state.supervisor.companyManagement.companies);
  const activityData = useSelector((state) => state.supervisor.activity);

  const loadReports = useCallback(() => dispatch(loadSupervisorReports()), [dispatch]);

  useEffect(() => { void loadReports(); }, [loadReports]);
  useAutoRefresh(loadReports, "supervisor-reports");

  const stats = useMemo(() => [
    { label: "Total Companies", value: String(companies.length), detail: "Managed from the supervisor workspace" },
    { label: "Consultations", value: String(activityData.consultations.length), detail: "Requested and accepted sessions" },
    { label: "Scheduled Live Sessions", value: String(activityData.liveSessions.length), detail: "Upcoming expert-led sessions" },
    { label: "Video Library Items", value: String(activityData.videos.length), detail: "Expert content in the library" },
  ], [companies.length, activityData]);

  const chartData = useMemo(() => ({
    monthlyUsers: monthBuckets(users, "createdAt"),
    roleDistribution: ["Employee", "HR", "Wellness Expert"].map((role) => users.filter((user) => user.role === role).length),
    weeklyActivity: [activityData.consultations, activityData.liveSessions, activityData.videos, activityData.challenges, activityData.rewards].map((records) => records.length),
  }), [users, activityData]);

  return <>
    <div className="supervisor-page-heading"><div><p className="supervisor-eyebrow">Analytics</p><h1>Reports &amp; analytics</h1><p className="supervisor-subtitle">View shared workspace insights and live product trends.</p></div></div>
    {error && <p className="supervisor-empty-state" role="alert">{error}</p>}
    {loading && !users.length && !companies.length ? <p className="supervisor-empty-state" role="status">Loading report data…</p> : <>
      <div className="supervisor-report-grid"><section className="supervisor-panel chart-wide"><div className="supervisor-panel-heading"><div><p className="supervisor-eyebrow">Growth</p><h2>Monthly user growth</h2></div><span className="chart-trend">Live data</span></div><SupervisorLineChart values={chartData.monthlyUsers.values} labels={chartData.monthlyUsers.labels} /></section><section className="supervisor-panel"><div className="supervisor-panel-heading"><div><p className="supervisor-eyebrow">Mix</p><h2>Role distribution</h2></div></div><SupervisorDonutChart values={chartData.roleDistribution} labels={["Employees", "HR", "Experts"]} /></section></div>
      <section className="supervisor-panel" style={{ marginTop: 18 }}><div className="supervisor-panel-heading"><div><p className="supervisor-eyebrow">Engagement</p><h2>Workspace activity</h2></div></div><SupervisorBarChart values={chartData.weeklyActivity} labels={["Consultations", "Sessions", "Videos", "Challenges", "Rewards"]} /></section>
      <div className="supervisor-stat-grid report-stats">{stats.map((stat) => <div className="supervisor-report-stat" key={stat.label}><span>{stat.label}</span><strong>{stat.value}</strong><small>{stat.detail}</small></div>)}</div>
    </>}
  </>;
}

export default Reports;
