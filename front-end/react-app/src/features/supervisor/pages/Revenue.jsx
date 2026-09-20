import { SupervisorBarChart } from "../components/SupervisorCharts.jsx";
import SupervisorIcon from "../components/SupervisorIcon.jsx";
import SupervisorTable from "../components/SupervisorTable.jsx";

function Revenue({ payments, subscriptions, chartData }) {
  const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const activeSubscriptions = subscriptions.filter((subscription) => subscription.status === "active").length;
  const columns = [{ key: "company", label: "Company" }, { key: "plan", label: "Plan", render: (row) => <span className="role-pill">{row.plan}</span> }, { key: "amount", label: "Amount", render: (row) => <strong>₹{row.amount.toLocaleString()}</strong> }, { key: "date", label: "Payment date" }, { key: "status", label: "Status", render: (row) => <span className={`status-pill status-${row.status.toLowerCase()}`}>{row.status}</span> }];
  const planLabels = chartData.planRevenue.map((entry) => entry.label);
  const planValues = chartData.planRevenue.map((entry) => entry.value);
  return <>
    <div className="supervisor-page-heading"><div><p className="supervisor-eyebrow">Revenue Center</p><h1>Revenue Dashboard</h1><p className="supervisor-subtitle">Track active plans, payments, and the health of company subscriptions.</p></div><button className="supervisor-outline-button" type="button"><SupervisorIcon name="file" size={16} /> Download statement</button></div>
    <section className="revenue-stat-grid"><article className="revenue-stat"><span>Total Revenue</span><strong>₹{totalRevenue.toLocaleString()}</strong><small>Across all active plans</small></article><article className="revenue-stat"><span>Active Subscriptions</span><strong>{activeSubscriptions}</strong><small>Companies with a live plan</small></article><article className="revenue-stat"><span>Average Revenue</span><strong>₹{activeSubscriptions ? Math.round(totalRevenue / activeSubscriptions).toLocaleString() : 0}</strong><small>Per subscribed company</small></article><article className="revenue-stat"><span>Total Payments</span><strong>{payments.length}</strong><small>Completed transactions</small></article></section>
    <section className="supervisor-content-grid revenue-grid"><article className="supervisor-panel chart-panel"><div className="supervisor-panel-heading"><div><p className="supervisor-eyebrow">Plans</p><h2>Revenue by Plan</h2></div></div><SupervisorBarChart values={planValues} labels={planLabels} color="blue" /></article><article className="supervisor-panel chart-panel"><div className="supervisor-panel-heading"><div><p className="supervisor-eyebrow">Trend</p><h2>Monthly Revenue</h2></div></div><SupervisorBarChart values={chartData.monthlyRevenue.values} labels={chartData.monthlyRevenue.labels} /></article></section>
    <section className="supervisor-panel supervisor-table-panel"><div className="supervisor-panel-heading"><div><p className="supervisor-eyebrow">Transactions</p><h2>Payment History</h2></div></div><SupervisorTable columns={columns} rows={payments} emptyMessage="No payments recorded yet." /></section>
  </>;
}

export default Revenue;
