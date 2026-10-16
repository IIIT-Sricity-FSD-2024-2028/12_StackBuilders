import { useCallback, useEffect, useState } from "react";
import RouteLoadingScreen from "../../../components/RouteLoadingScreen.jsx";
import usePageStylesheets from "../../../hooks/usePageStylesheets.js";
import useAutoRefresh from "../../../hooks/useAutoRefresh.js";
import { SupervisorBarChart } from "../../supervisor/components/SupervisorCharts.jsx";
import adminApi from "../adminApi.js";
import { buildPlanRevenue } from "../../../utils/planRevenue.js";

function money(value) {
  return `₹${(Number(value) || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function monthBuckets(payments) {
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, index) => new Date(now.getFullYear(), now.getMonth() - (5 - index), 1));
  return {
    labels: months.map((month) => new Intl.DateTimeFormat(undefined, { month: "short" }).format(month)),
    values: months.map((month) => payments.filter((payment) => {
      const date = new Date(payment.paidAt || payment.createdAt || "");
      return !Number.isNaN(date.valueOf()) && date.getFullYear() === month.getFullYear() && date.getMonth() === month.getMonth();
    }).reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0)),
  };
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? "—" : new Intl.DateTimeFormat(undefined, { year: "numeric", month: "short", day: "numeric" }).format(date);
}

function Revenue() {
  const stylesReady = usePageStylesheets("/admin-analytics-legacy.css");
  const [payments, setPayments] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const loadRevenue = useCallback(async (silent = false) => {
    try {
      const [nextPayments, nextSubscriptions] = await Promise.all([adminApi.getPayments(), adminApi.getSubscriptions()]);
      setPayments(nextPayments || []);
      setSubscriptions(nextSubscriptions || []);
      setError("");
    } catch (loadError) {
      if (!silent) setError(loadError.message || "Could not load revenue data.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => { loadRevenue(); }, [loadRevenue]);
  useAutoRefresh(() => loadRevenue(true), "admin-revenue");

  if (!stylesReady) return <RouteLoadingScreen />;

  const totalRevenue = payments.reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0);
  const activeSubscriptions = subscriptions.filter((subscription) => String(subscription.status || "").trim().toLowerCase() === "active").length;
  const averageRevenue = activeSubscriptions ? totalRevenue / activeSubscriptions : 0;
  const planRevenue = buildPlanRevenue(payments);
  const monthlyRevenue = monthBuckets(payments);

  return (
    <main className="admin-analytics">
      <div className="admin-analytics-heading">
        <div><p className="admin-analytics-eyebrow">Finance</p><h1>Revenue dashboard</h1><p className="admin-analytics-subtitle">Track subscription revenue and payment history across every company.</p></div>
      </div>

      {error && <p className="admin-analytics-error" role="alert">{error}</p>}
      {loading && <p className="admin-analytics-empty" role="status">Loading revenue data…</p>}

      {!loading && <>
        <section className="admin-revenue-stats">
          <div className="admin-revenue-stat"><span>Total revenue</span><strong>{money(totalRevenue)}</strong><small>All-time earnings</small></div>
          <div className="admin-revenue-stat"><span>Active subscriptions</span><strong>{activeSubscriptions.toLocaleString()}</strong><small>Currently active plans</small></div>
          <div className="admin-revenue-stat"><span>Average per company</span><strong>{money(averageRevenue)}</strong><small>Per active subscription</small></div>
          <div className="admin-revenue-stat"><span>Total payments</span><strong>{payments.length.toLocaleString()}</strong><small>Recorded transactions</small></div>
        </section>

        <section className="admin-revenue-grid">
          <div className="admin-analytics-panel">
            <div className="admin-analytics-panel-heading"><div><p className="admin-analytics-eyebrow">Plans</p><h2>Revenue by plan</h2></div></div>
            <SupervisorBarChart values={planRevenue.map((plan) => plan.value)} labels={planRevenue.map((plan) => plan.label)} color="admin" />
          </div>
          <div className="admin-analytics-panel">
            <div className="admin-analytics-panel-heading"><div><p className="admin-analytics-eyebrow">Trend</p><h2>Monthly revenue</h2></div></div>
            <SupervisorBarChart values={monthlyRevenue.values} labels={monthlyRevenue.labels} color="orange" />
          </div>
        </section>

        <section className="admin-analytics-panel admin-payment-panel">
          <div className="admin-analytics-panel-heading"><div><p className="admin-analytics-eyebrow">Transactions</p><h2>Payment history</h2></div><span className="admin-analytics-count">{payments.length.toLocaleString()} payments</span></div>
          <div className="admin-payment-table-wrap"><table className="admin-payment-table">
            <thead><tr><th>Payment ID</th><th>Company</th><th>Plan</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
            <tbody>{payments.length ? payments.map((payment, index) => {
              const status = String(payment.status || "Unknown");
              const statusClass = status.toLowerCase() === "completed" || status.toLowerCase() === "paid" ? "is-paid" : status.toLowerCase() === "pending" || status.toLowerCase() === "processing" ? "is-pending" : "is-other";
              return <tr key={`${payment.id || payment.companyName || "payment"}-${index}`}>
                <td>{payment.id || "—"}</td>
                <td>{payment.companyName || payment.company || "—"}</td>
                <td><span className="admin-payment-plan">{payment.planName || payment.planId || payment.plan || "—"}</span></td>
                <td><strong>{money(payment.amount)}</strong></td>
                <td><span className={`admin-payment-status ${statusClass}`}>{status}</span></td>
                <td>{formatDate(payment.paidAt || payment.createdAt)}</td>
              </tr>;
            }) : <tr><td colSpan="6" className="admin-payment-empty">No payments recorded yet.</td></tr>}</tbody>
          </table></div>
        </section>
      </>}
    </main>
  );
}

export default Revenue;
