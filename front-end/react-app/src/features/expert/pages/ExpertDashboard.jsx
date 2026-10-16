import StatCard from "../../../components/StatCard.jsx";
import ExpertIcon from "../components/ExpertIcon.jsx";

function formatSubmittedAt(value) {
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

function initials(name) {
  return name.split(" ").map((part) => part[0]).join("").slice(0, 2);
}

function ExpertDashboard({ data, onNavigate, onOpenCheckin }) {
  const { expert, checkins, sessions, consultations } = data;
  const priorityCheckins = checkins.filter((checkin) => checkin.priority !== "stable");
  const upcomingSessions = sessions.filter((session) => session.status !== "completed");
  const upcomingConsultations = consultations.filter((consultation) => consultation.status === "accepted" && !consultation.completed);

  return (
    <>
      <section className="expert-hero">
        <div>
          <p className="expert-eyebrow">{expert.specialization}</p>
          <h1>{expert.specialization} Dashboard</h1>
          <p>Welcome back, {expert.name.split(" ").slice(-1)}. Review employee wellness updates and plan the support that comes next.</p>
        </div>
        <aside>
          <span className="expert-hero-icon"><ExpertIcon name="checkins" /></span>
          <div>
            <h2>When employees should enter details</h2>
            <p>{expert.schedule}</p>
          </div>
        </aside>
      </section>

      <section className="expert-stats-grid" aria-label="Expert dashboard statistics">
        <StatCard label="Total check-ins" value={String(checkins.length)} tone="teal" />
        <StatCard label="Need follow-up" value={String(priorityCheckins.length)} tone="coral" />
        <StatCard label="Upcoming consultations" value={String(upcomingConsultations.length)} tone="violet" />
        <StatCard label="Upcoming live sessions" value={String(upcomingSessions.length)} tone="teal" />
      </section>

      <section className="expert-panel">
        <div className="expert-panel-head">
          <div>
            <p className="expert-eyebrow">Priority queue</p>
            <h2>Employees who may need faster follow-up</h2>
            <p>Latest check-ins with a higher-priority signal.</p>
          </div>
          <button className="expert-text-button" type="button" onClick={() => onNavigate("checkins")}>View all <ExpertIcon name="chevron" size={15} /></button>
        </div>
        <div className="expert-priority-list">
          {priorityCheckins.length ? priorityCheckins.slice(0, 3).map((checkin) => (
            <button className={`expert-priority-card ${checkin.priority}`} key={checkin.id} type="button" onClick={() => onOpenCheckin(checkin.id)}>
              <div className="expert-person-row">
                <span className="expert-avatar">{initials(checkin.employee)}</span>
                <span><strong>{checkin.employee}</strong><small>{checkin.department} · {formatSubmittedAt(checkin.submittedAt)}</small></span>
                <em>{checkin.priority} priority</em>
              </div>
              <p>{checkin.reason}</p>
              <span className="expert-metric-row">{checkin.metrics.slice(0, 3).map(([label, value]) => <i key={label}>{label}: {value}</i>)}</span>
            </button>
          )) : <p className="expert-empty">No employee currently needs immediate follow-up.</p>}
        </div>
      </section>

      <section className="expert-panel">
        <div className="expert-panel-head">
          <div>
            <p className="expert-eyebrow">Employee details</p>
            <h2>Latest wellness details by employee</h2>
            <p>Open any card to review submitted values, notes, and response history.</p>
          </div>
          <button className="expert-text-button" type="button" onClick={() => onNavigate("checkins")}>Employee check-ins <ExpertIcon name="chevron" size={15} /></button>
        </div>
        <div className="expert-latest-grid">
          {checkins.slice(0, 3).map((checkin) => (
            <article className="expert-latest-card" key={checkin.id}>
              <div className="expert-person-row">
                <span className="expert-avatar muted">{initials(checkin.employee)}</span>
                <span><strong>{checkin.employee}</strong><small>{checkin.department}</small></span>
                <em className={checkin.priority}>{checkin.priority}</em>
              </div>
              <div className="expert-metric-row">{checkin.metrics.map(([label, value]) => <i key={label}>{label}: {value}</i>)}</div>
              <p>{checkin.notes}</p>
              <button type="button" onClick={() => onOpenCheckin(checkin.id)}>Open details <ExpertIcon name="chevron" size={15} /></button>
            </article>
          ))}
        </div>
      </section>

      <section className="expert-panel">
        <div className="expert-panel-head">
          <div><p className="expert-eyebrow">Activity log</p><h2>Recent wellness submissions</h2><p>Employee check-ins appear here in reverse chronological order.</p></div>
          <span className="expert-panel-pill">Latest {Math.min(checkins.length, 12)} rows</span>
        </div>
        <div className="expert-table-wrap">
          <table className="expert-table">
            <thead><tr><th>Employee</th><th>Submitted</th><th>Summary</th><th>Status</th></tr></thead>
            <tbody>
              {checkins.slice(0, 12).map((checkin) => <tr key={checkin.id}><td><strong>{checkin.employee}</strong><span>{checkin.department}</span></td><td>{formatSubmittedAt(checkin.submittedAt)}</td><td>{checkin.metrics.map(([label, value]) => `${label}: ${value}`).join(" · ")}</td><td><span className={`expert-status ${checkin.priority}`}>{checkin.priority}</span></td></tr>)}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

export default ExpertDashboard;
