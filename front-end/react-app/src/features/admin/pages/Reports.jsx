import { useMemo, useState } from "react";
import "../admin-reports.css";

const reportData = {
  "This month": { checkins: "1,284", consultations: "326", satisfaction: "92%", participation: "78%" },
  "Last month": { checkins: "1,146", consultations: "301", satisfaction: "89%", participation: "74%" },
  "This quarter": { checkins: "3,518", consultations: "891", satisfaction: "91%", participation: "76%" },
};

const reportCards = [
  { title: "Wellness activity", description: "Check-ins completed across all company workspaces.", valueKey: "checkins", color: "blue" },
  { title: "Consultations", description: "Employee sessions requested and completed.", valueKey: "consultations", color: "orange" },
  { title: "Satisfaction score", description: "Average feedback from completed wellness sessions.", valueKey: "satisfaction", color: "green" },
  { title: "Program participation", description: "Active members participating in a wellness program.", valueKey: "participation", color: "purple" },
];

function Reports() {
  const [period, setPeriod] = useState("This month");
  const metrics = useMemo(() => reportData[period], [period]);

  return (
    <main className="admin-reports-page">
      <header className="admin-reports-heading">
        <div>
          <p className="admin-eyebrow">Insights Center</p>
          <h1>Reports</h1>
          <p>Track platform activity and understand how teams are using their wellness programs.</p>
        </div>
        <div className="admin-report-actions">
          <select value={period} onChange={(event) => setPeriod(event.target.value)} aria-label="Report period">
            <option>This month</option>
            <option>Last month</option>
            <option>This quarter</option>
          </select>
          <button className="admin-primary-button" type="button">Export report</button>
        </div>
      </header>

      <section className="admin-report-highlight">
        <div>
          <p className="admin-eyebrow">Platform overview</p>
          <h2>{period} activity is trending positively</h2>
          <p>Use these indicators to identify engagement gaps and plan the next wellness initiative.</p>
        </div>
        <div className="admin-report-trend"><span>+12.8%</span><small>vs. previous period</small></div>
      </section>

      <section className="admin-report-grid" aria-label={`${period} report metrics`}>
        {reportCards.map((card) => (
          <article className={`admin-report-card admin-report-${card.color}`} key={card.title}>
            <div className="admin-report-card-top"><span className="admin-report-dot" /><span>{period}</span></div>
            <strong>{metrics[card.valueKey]}</strong>
            <h3>{card.title}</h3>
            <p>{card.description}</p>
          </article>
        ))}
      </section>

      <section className="admin-report-table-panel">
        <div className="admin-report-panel-heading"><div><p className="admin-eyebrow">Workspace comparison</p><h2>Company engagement</h2></div><button className="admin-outline-button" type="button">View details</button></div>
        <div className="admin-report-table-wrap">
          <table className="admin-report-table">
            <thead><tr><th>Company</th><th>Members</th><th>Participation</th><th>Trend</th></tr></thead>
            <tbody>
              <tr><td><strong>Greenfield Labs</strong></td><td>248</td><td>84%</td><td><span className="admin-report-up">+8.4%</span></td></tr>
              <tr><td><strong>Northstar Health</strong></td><td>124</td><td>79%</td><td><span className="admin-report-up">+5.1%</span></td></tr>
              <tr><td><strong>Brightpath Finance</strong></td><td>86</td><td>65%</td><td><span className="admin-report-neutral">+1.2%</span></td></tr>
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

export default Reports;
