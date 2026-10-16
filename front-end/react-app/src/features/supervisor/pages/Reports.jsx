import { SupervisorBarChart, SupervisorDonutChart, SupervisorLineChart } from "../components/SupervisorCharts.jsx";

function Reports({ stats, chartData }) {
  return <>
    <div className="supervisor-page-heading"><div><p className="supervisor-eyebrow">Analytics</p><h1>Reports &amp; analytics</h1><p className="supervisor-subtitle">View shared workspace insights and live product trends.</p></div></div>
    <div className="supervisor-report-grid"><section className="supervisor-panel chart-wide"><div className="supervisor-panel-heading"><div><p className="supervisor-eyebrow">Growth</p><h2>Monthly user growth</h2></div><span className="chart-trend">Live data</span></div><SupervisorLineChart values={chartData.monthlyUsers.values} labels={chartData.monthlyUsers.labels} /></section><section className="supervisor-panel"><div className="supervisor-panel-heading"><div><p className="supervisor-eyebrow">Mix</p><h2>Role distribution</h2></div></div><SupervisorDonutChart values={chartData.roleDistribution} labels={["Employees", "HR", "Experts"]} /></section></div>
    <section className="supervisor-panel" style={{ marginTop: 18 }}><div className="supervisor-panel-heading"><div><p className="supervisor-eyebrow">Engagement</p><h2>Workspace activity</h2></div></div><SupervisorBarChart values={chartData.weeklyActivity} labels={["Consultations", "Sessions", "Videos", "Challenges", "Rewards"]} /></section>
    <div className="supervisor-stat-grid report-stats">{stats.map((stat) => <div className="supervisor-report-stat" key={stat.label}><span>{stat.label}</span><strong>{stat.value}</strong><small>{stat.detail}</small></div>)}</div>
  </>;
}

export default Reports;
