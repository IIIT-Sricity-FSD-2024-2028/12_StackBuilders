import { SupervisorBarChart, SupervisorDonutChart, SupervisorLineChart } from "../components/SupervisorCharts.jsx";
import SupervisorIcon from "../components/SupervisorIcon.jsx";

function Reports({ stats, chartData }) {
  const roleLabels = ["Employees", "HR", "Experts"];
  return <>
    <div className="supervisor-page-heading"><div><p className="supervisor-eyebrow">Analytics Hub</p><h1>Reports & Analytics</h1><p className="supervisor-subtitle">A live view of growth, roles, and wellness workspace activity.</p></div><button className="supervisor-outline-button" type="button"><SupervisorIcon name="file" size={16} /> Export report</button></div>
    <section className="supervisor-report-grid"><article className="supervisor-panel chart-panel chart-wide"><div className="supervisor-panel-heading"><div><p className="supervisor-eyebrow">Growth</p><h2>Monthly User Growth</h2></div><span className="chart-trend">Live data</span></div><SupervisorLineChart values={chartData.monthlyUsers.values} labels={chartData.monthlyUsers.labels} /></article><article className="supervisor-panel chart-panel"><div className="supervisor-panel-heading"><div><p className="supervisor-eyebrow">Distribution</p><h2>Role Distribution</h2></div></div><SupervisorDonutChart values={chartData.roleDistribution} labels={roleLabels} /></article><article className="supervisor-panel chart-panel chart-wide"><div className="supervisor-panel-heading"><div><p className="supervisor-eyebrow">Workspace activity</p><h2>Activity by resource</h2></div><span className="supervisor-muted-label">Live data</span></div><SupervisorBarChart values={chartData.weeklyActivity} labels={["Consultations", "Sessions", "Videos", "Challenges", "Rewards"]} /></article></section>
    <section className="supervisor-stat-grid report-stats">{stats.map((stat) => <article className="supervisor-report-stat" key={stat.label}><span>{stat.label}</span><strong>{stat.value}</strong><small>{stat.detail}</small></article>)}</section>
  </>;
}

export default Reports;
