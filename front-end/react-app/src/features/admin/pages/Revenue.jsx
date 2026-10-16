import { useMemo, useState } from "react";
import "../admin-revenue.css";

const revenueByPeriod = {
  "This month": { total: "$48,620", change: "+14.6%", subscriptions: "$32,400", sessions: "$16,220" },
  "Last month": { total: "$42,440", change: "+8.2%", subscriptions: "$29,100", sessions: "$13,340" },
  "This quarter": { total: "$136,780", change: "+11.9%", subscriptions: "$91,600", sessions: "$45,180" },
};

const transactions = [
  { company: "Greenfield Labs", plan: "Enterprise", amount: "$12,800", date: "Jun 28, 2026", status: "Paid" },
  { company: "Northstar Health", plan: "Growth", amount: "$7,400", date: "Jun 25, 2026", status: "Paid" },
  { company: "Brightpath Finance", plan: "Growth", amount: "$5,200", date: "Jun 21, 2026", status: "Processing" },
  { company: "Orbit Learning", plan: "Starter", amount: "$2,100", date: "Jun 18, 2026", status: "Paid" },
];

function Revenue() {
  const [period, setPeriod] = useState("This month");
  const metrics = useMemo(() => revenueByPeriod[period], [period]);

  return (
    <main className="admin-revenue-page">
      <header className="admin-revenue-heading">
        <div>
          <p className="admin-eyebrow">Finance Overview</p>
          <h1>Revenue</h1>
          <p>Monitor subscription income, consultation payments, and recent company transactions.</p>
        </div>
        <div className="admin-revenue-actions">
          <select value={period} onChange={(event) => setPeriod(event.target.value)} aria-label="Revenue period">
            <option>This month</option>
            <option>Last month</option>
            <option>This quarter</option>
          </select>
          <button className="admin-primary-button" type="button">Download CSV</button>
        </div>
      </header>

      <section className="admin-revenue-overview">
        <div className="admin-revenue-total"><span>Total revenue</span><strong>{metrics.total}</strong><small><b>{metrics.change}</b> from the previous period</small></div>
        <div className="admin-revenue-source"><span>Subscriptions</span><strong>{metrics.subscriptions}</strong><div className="admin-revenue-bar"><i style={{ width: "67%" }} /></div><small>67% of total revenue</small></div>
        <div className="admin-revenue-source"><span>Consultation sessions</span><strong>{metrics.sessions}</strong><div className="admin-revenue-bar orange"><i style={{ width: "33%" }} /></div><small>33% of total revenue</small></div>
      </section>

      <section className="admin-revenue-panel">
        <div className="admin-revenue-panel-heading"><div><p className="admin-eyebrow">Payment activity</p><h2>Recent transactions</h2></div><span className="admin-revenue-count">{transactions.length} transactions</span></div>
        <div className="admin-revenue-table-wrap">
          <table className="admin-revenue-table">
            <thead><tr><th>Company</th><th>Plan</th><th>Amount</th><th>Date</th><th>Status</th></tr></thead>
            <tbody>{transactions.map((transaction) => (
              <tr key={`${transaction.company}-${transaction.date}`}>
                <td><strong>{transaction.company}</strong></td><td>{transaction.plan}</td><td>{transaction.amount}</td><td>{transaction.date}</td>
                <td><span className={`admin-revenue-status admin-revenue-${transaction.status.toLowerCase()}`}>{transaction.status}</span></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

export default Revenue;
