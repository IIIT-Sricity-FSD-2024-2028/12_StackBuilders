import ExpertIcon from "../components/ExpertIcon.jsx";
import { AvailabilityGrid } from "../components/ExpertFeatureComponents.jsx";

function formatDate(value) {
  return new Intl.DateTimeFormat(undefined, { weekday: "short", month: "short", day: "numeric" }).format(new Date(`${value}T12:00:00`));
}

function formatRequestedAt(value) {
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

function Consultations({ data, onUpdateConsultation, onSaveAvailability }) {
  const pending = data.consultations.filter((item) => item.status === "pending");
  const upcoming = data.consultations.filter((item) => item.status === "accepted" && !item.completed);
  const accepted = data.consultations.filter((item) => item.status === "accepted" && !item.completed);
  const rejected = data.consultations.filter((item) => item.status === "rejected");
  const history = data.consultations.filter((item) => item.completed);

  return <>
    <section className="expert-page-heading"><div><p className="expert-eyebrow">One-to-one support</p><h1>Consultations</h1><p>Manage availability, act on requests, and keep a clear record of your client sessions.</p></div></section>
    <AvailabilityGrid savedSlots={data.availability} onSave={onSaveAvailability} />
    <section className="expert-panel"><div className="expert-panel-head"><div className="expert-title-with-icon"><span><ExpertIcon name="calendar" /></span><div><h2>Upcoming Consultations</h2><p>Approved wellness sessions ready to run.</p></div></div><span className="expert-panel-pill">{upcoming.length} scheduled</span></div><div className="expert-consultation-cards">{upcoming.length ? upcoming.map((consultation) => <article className="expert-consultation-card" key={consultation.id}><span className="expert-avatar">{consultation.employee.split(" ").map((part) => part[0]).join("")}</span><div><h3>{consultation.employee}</h3><p>{consultation.purpose}</p><small><ExpertIcon name="calendar" size={14} /> {formatDate(consultation.date)} · {consultation.time}</small></div><span className="expert-status stable">Approved</span></article>) : <p className="expert-empty">No approved consultations are scheduled yet.</p>}</div></section>
    <section className="expert-panel"><div className="expert-panel-head"><div className="expert-title-with-icon"><span><ExpertIcon name="activity" /></span><div><h2>Consultation Requests</h2><p>Pending requests awaiting approval.</p></div></div><span className="expert-panel-pill">{pending.length} pending</span></div><div className="expert-table-wrap"><table className="expert-table expert-requests-table"><thead><tr><th>Employee</th><th>Purpose of request</th><th>Requested</th><th>Action</th></tr></thead><tbody>{pending.length ? pending.map((consultation) => <tr key={consultation.id}><td><strong>{consultation.employee}</strong></td><td>{consultation.purpose}</td><td>{formatRequestedAt(consultation.requestedAt)}</td><td><div className="expert-row-actions"><button className="expert-approve-button" type="button" onClick={() => onUpdateConsultation(consultation.id, "accepted")}>Accept</button><button className="expert-decline-button" type="button" onClick={() => onUpdateConsultation(consultation.id, "rejected")}>Decline</button></div></td></tr>) : <tr><td colSpan="4" className="expert-table-empty">All consultation requests have been reviewed.</td></tr>}</tbody></table></div></section>
    <section className="expert-two-columns"><section className="expert-panel"><div className="expert-panel-head"><div><p className="expert-eyebrow">Accepted</p><h2>Accepted Consultations</h2><p>Requests that were approved successfully.</p></div></div><div className="expert-compact-list">{accepted.length ? accepted.map((item) => <article key={item.id}><span className="expert-avatar muted">{item.employee[0]}</span><div><strong>{item.employee}</strong><p>{item.purpose}</p></div><span className="expert-status stable">Approved</span></article>) : <p className="expert-empty">No accepted consultations yet.</p>}</div></section><section className="expert-panel"><div className="expert-panel-head"><div><p className="expert-eyebrow">Rejected</p><h2>Rejected Consultations</h2><p>Requests that were declined.</p></div></div><div className="expert-compact-list">{rejected.length ? rejected.map((item) => <article key={item.id}><span className="expert-avatar muted">{item.employee[0]}</span><div><strong>{item.employee}</strong><p>{item.purpose}</p></div><span className="expert-status high">Declined</span></article>) : <p className="expert-empty">No declined consultations.</p>}</div></section></section>
    <section className="expert-panel"><div className="expert-panel-head"><div className="expert-title-with-icon"><span><ExpertIcon name="clock" /></span><div><h2>Previous Client Consultations</h2><p>Your completed wellness session history.</p></div></div></div><div className="expert-table-wrap"><table className="expert-table"><thead><tr><th>Client</th><th>Purpose</th><th>Date</th><th>Rating</th></tr></thead><tbody>{history.map((item) => <tr key={item.id}><td><strong>{item.employee}</strong></td><td>{item.purpose}</td><td>{formatDate(item.date)}</td><td><span className="expert-rating">★ {item.rating || "—"}</span></td></tr>)}</tbody></table></div></section>
  </>;
}

export default Consultations;
