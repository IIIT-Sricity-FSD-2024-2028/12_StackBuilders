import { useCallback, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { SupervisorBarChart } from "../components/SupervisorCharts.jsx";
import useAutoRefresh from "../../../hooks/useAutoRefresh.js";
import { buildPlanRevenue } from "../../../utils/planRevenue.js";
import { loadSupervisorRevenue } from "../revenueSlice.js";

function amountBuckets(records) {
  const now = new Date();
  const buckets = Array.from({ length: 6 }, (_, index) => new Date(now.getFullYear(), now.getMonth() - (5 - index), 1));
  return {
    labels: buckets.map((date) => new Intl.DateTimeFormat(undefined, { month: "short" }).format(date)),
    values: buckets.map((bucket) => records.filter((record) => {
      const date = new Date(record.paidAt || record.createdAt || "");
      return !Number.isNaN(date.valueOf()) && date.getFullYear() === bucket.getFullYear() && date.getMonth() === bucket.getMonth();
    }).reduce((sum, record) => sum + (Number(record.amount) || 0), 0)),
  };
}

function Revenue() {
  const dispatch = useDispatch();
  const { payments, subscriptions, loading, error } = useSelector((state) => state.supervisor.revenue);

  const loadRevenue = useCallback(() => dispatch(loadSupervisorRevenue()), [dispatch]);

  useEffect(() => { void loadRevenue(); }, [loadRevenue]);
  useAutoRefresh(loadRevenue, "supervisor-revenue");

  const planRevenue = useMemo(() => buildPlanRevenue(payments), [payments]);
  const monthlyRevenue = useMemo(() => amountBuckets(payments), [payments]);
  const totalRevenue = payments.reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0);
  const activeSubscriptions = subscriptions.filter((subscription) => String(subscription.status || "").toLowerCase() === "active").length;
  const planLabels = planRevenue.map((entry) => entry.label);
  const planValues = planRevenue.map((entry) => entry.value);

  return <>
    <div className="supervisor-page-heading"><div><p className="supervisor-eyebrow">Finance</p><h1>Revenue dashboard</h1><p className="supervisor-subtitle">Track subscription revenue and payment history across every company.</p></div></div>
    {error && <p className="supervisor-empty-state" role="alert">{error}</p>}
    {loading && !payments.length && !subscriptions.length ? <p className="supervisor-empty-state" role="status">Loading revenue data…</p> : <>
      <section className="revenue-stat-grid"><div className="revenue-stat"><span>Total revenue</span><strong>₹{totalRevenue.toLocaleString()}</strong><small>All-time earnings</small></div><div className="revenue-stat"><span>Active subscriptions</span><strong>{activeSubscriptions}</strong><small>Currently active plans</small></div><div className="revenue-stat"><span>Average per company</span><strong>₹{(activeSubscriptions ? Math.round(totalRevenue / activeSubscriptions) : 0).toLocaleString()}</strong><small>Per subscribing company</small></div><div className="revenue-stat"><span>Total payments</span><strong>{payments.length}</strong><small>Completed transactions</small></div></section>
      <section className="supervisor-content-grid revenue-grid"><div className="supervisor-panel"><div className="supervisor-panel-heading"><div><p className="supervisor-eyebrow">Plans</p><h2>Revenue by plan</h2></div></div><SupervisorBarChart values={planValues} labels={planLabels} color="blue" /></div><div className="supervisor-panel"><div className="supervisor-panel-heading"><div><p className="supervisor-eyebrow">Trend</p><h2>Monthly revenue</h2></div></div><SupervisorBarChart values={monthlyRevenue.values} labels={monthlyRevenue.labels} /></div></section>
      <section className="supervisor-panel" style={{ marginTop: 18 }}><div className="supervisor-panel-heading"><div><p className="supervisor-eyebrow">Transactions</p><h2>Payment history</h2></div></div><div className="supervisor-table-wrap"><table className="supervisor-table"><thead><tr><th>Payment ID</th><th>Company</th><th>Plan</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead><tbody>{payments.length ? payments.map((payment) => <tr key={payment.id}><td>{payment.id || "—"}</td><td>{payment.company}</td><td><span className="role-pill">{payment.plan}</span></td><td>₹{Number(payment.amount || 0).toLocaleString()}</td><td><span className={`status-pill status-${String(payment.status || "unknown").toLowerCase()}`}>{payment.status}</span></td><td>{payment.date}</td></tr>) : <tr><td colSpan="6" className="table-empty">No payments recorded yet.</td></tr>}</tbody></table></div></section>
    </>}
  </>;
}

export default Revenue;
