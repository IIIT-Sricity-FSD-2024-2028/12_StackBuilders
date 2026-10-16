import { useCallback, useEffect, useState } from "react";
import RouteLoadingScreen from "../../../components/RouteLoadingScreen.jsx";
import usePageStylesheets from "../../../hooks/usePageStylesheets.js";
import useAutoRefresh from "../../../hooks/useAutoRefresh.js";
import { SupervisorBarChart, SupervisorDonutChart, SupervisorLineChart } from "../../supervisor/components/SupervisorCharts.jsx";
import adminApi from "../adminApi.js";

function monthlyCounts(records) {
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, index) => new Date(now.getFullYear(), now.getMonth() - (5 - index), 1));
  return {
    labels: months.map((month) => new Intl.DateTimeFormat(undefined, { month: "short" }).format(month)),
    values: months.map((month) => records.filter((record) => {
      const date = new Date(record.createdAt || record.updatedAt || "");
      return !Number.isNaN(date.valueOf()) && date.getFullYear() === month.getFullYear() && date.getMonth() === month.getMonth();
    }).length),
  };
}

function Reports() {
  const stylesReady = usePageStylesheets("/admin-analytics-legacy.css");
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const loadReport = useCallback(async (silent = false) => {
    try {
      const [companies, consultations, sessions, videos, employees, experts, hrProfiles, challenges, rewards] = await Promise.all([
        adminApi.getCompanies(), adminApi.getConsultations(), adminApi.getLiveSessions(), adminApi.getVideos(),
        adminApi.getUsers(), adminApi.getExperts(), adminApi.getHrProfiles(), adminApi.getChallenges(), adminApi.getRewards(),
      ]);
      const users = [...(employees || []), ...(experts || []), ...(hrProfiles || [])];
      const companyRecords = companies || [];
      const consultationRecords = consultations || [];
      const sessionRecords = sessions || [];
      const videoRecords = videos || [];
      const challengeRecords = challenges || [];
      const rewardRecords = rewards || [];
      setReport({
        monthlyUsers: monthlyCounts(users),
        roleDistribution: [(employees || []).length, (hrProfiles || []).length, (experts || []).length],
        weeklyActivity: [consultationRecords.length, sessionRecords.length, videoRecords.length, challengeRecords.length, rewardRecords.length],
        stats: [
          { label: "Total Companies", value: companyRecords.length, detail: "Managed company workspaces" },
          { label: "Consultations", value: consultationRecords.length, detail: "Recorded employee requests" },
          { label: "Scheduled Live Sessions", value: sessionRecords.length, detail: "Expert-led company sessions" },
          { label: "Video Library Items", value: videoRecords.length, detail: "Wellness videos in the library" },
        ],
      });
      setError("");
    } catch (loadError) {
      if (!silent) setError(loadError.message || "Could not load report data.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => { loadReport(); }, [loadReport]);
  useAutoRefresh(() => loadReport(true), "admin-reports");

  if (!stylesReady) return <RouteLoadingScreen />;

  return (
    <main className="admin-analytics">
      <div className="admin-analytics-heading">
        <div><p className="admin-analytics-eyebrow">Analytics</p><h1>Reports &amp; analytics</h1><p className="admin-analytics-subtitle">View shared workspace insights and live product trends.</p></div>
      </div>

      {error && <p className="admin-analytics-error" role="alert">{error}</p>}
      {loading && <p className="admin-analytics-empty" role="status">Loading report data…</p>}

      {!loading && report && <>
        <div className="admin-report-grid">
          <section className="admin-analytics-panel chart-wide">
            <div className="admin-analytics-panel-heading"><div><p className="admin-analytics-eyebrow">Growth</p><h2>Monthly user growth</h2></div><span className="admin-analytics-live">Live data</span></div>
            <SupervisorLineChart values={report.monthlyUsers.values} labels={report.monthlyUsers.labels} color="#1565d8" />
          </section>
          <section className="admin-analytics-panel">
            <div className="admin-analytics-panel-heading"><div><p className="admin-analytics-eyebrow">Mix</p><h2>Role distribution</h2></div></div>
            <SupervisorDonutChart values={report.roleDistribution} labels={["Employees", "HR", "Experts"]} colors={["#1565d8", "#f19b72", "#1d9b63"]} />
          </section>
        </div>

        <section className="admin-analytics-panel admin-activity-panel">
          <div className="admin-analytics-panel-heading"><div><p className="admin-analytics-eyebrow">Engagement</p><h2>Workspace activity</h2></div></div>
          <SupervisorBarChart values={report.weeklyActivity} labels={["Consultations", "Sessions", "Videos", "Challenges", "Rewards"]} color="admin" />
        </section>

        <div className="admin-analytics-stats">
          {report.stats.map((stat) => <div className="admin-analytics-stat" key={stat.label}><span>{stat.label}</span><strong>{stat.value.toLocaleString()}</strong><small>{stat.detail}</small></div>)}
        </div>
      </>}
    </main>
  );
}

export default Reports;
