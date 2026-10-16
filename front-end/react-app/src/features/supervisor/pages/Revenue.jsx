import { SupervisorBarChart } from "../components/SupervisorCharts.jsx";

function Revenue({ payments, subscriptions, chartData }) {
  const totalRevenue = payments.reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0);
  const activeSubscriptions = subscriptions.filter((subscription) => String(subscription.status || "").toLowerCase() === "active").length;
  const planLabels = chartData.planRevenue.map((entry) => entry.label);
  const planValues = chartData.planRevenue.map((entry) => entry.value);

  return <>
    <div className="supervisor-page-heading"><div><p className="supervisor-eyebrow">Finance</p><h1>Revenue dashboard</h1><p className="supervisor-subtitle">Track subscription revenue and payment history across every company.</p></div></div>
    <section className="revenue-stat-grid"><div className="revenue-stat"><span>Total revenue</span><strong>₹{totalRevenue.toLocaleString()}</strong><small>All-time earnings</small></div><div className="revenue-stat"><span>Active subscriptions</span><strong>{activeSubscriptions}</strong><small>Currently active plans</small></div><div className="revenue-stat"><span>Average per company</span><strong>₹{(activeSubscriptions ? Math.round(totalRevenue / activeSubscriptions) : 0).toLocaleString()}</strong><small>Per subscribing company</small></div><div className="revenue-stat"><span>Total payments</span><strong>{payments.length}</strong><small>Completed transactions</small></div></section>
    <section className="supervisor-content-grid revenue-grid"><div className="supervisor-panel"><div className="supervisor-panel-heading"><div><p className="supervisor-eyebrow">Plans</p><h2>Revenue by plan</h2></div></div><SupervisorBarChart values={planValues} labels={planLabels} color="blue" /></div><div className="supervisor-panel"><div className="supervisor-panel-heading"><div><p className="supervisor-eyebrow">Trend</p><h2>Monthly revenue</h2></div></div><SupervisorBarChart values={chartData.monthlyRevenue.values} labels={chartData.monthlyRevenue.labels} /></div></section>
    <section className="supervisor-panel" style={{ marginTop: 18 }}><div className="supervisor-panel-heading"><div><p className="supervisor-eyebrow">Transactions</p><h2>Payment history</h2></div></div><div className="supervisor-table-wrap"><table className="supervisor-table"><thead><tr><th>Payment ID</th><th>Company</th><th>Plan</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead><tbody>{payments.length ? payments.map((payment) => <tr key={payment.id}><td>{payment.id || "—"}</td><td>{payment.company}</td><td><span className="role-pill">{payment.plan}</span></td><td>₹{Number(payment.amount || 0).toLocaleString()}</td><td><span className={`status-pill status-${String(payment.status || "unknown").toLowerCase()}`}>{payment.status}</span></td><td>{payment.date}</td></tr>) : <tr><td colSpan="6" className="table-empty">No payments recorded yet.</td></tr>}</tbody></table></div></section>
  </>;
}

export default Revenue;
