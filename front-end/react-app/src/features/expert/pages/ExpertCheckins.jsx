import { useMemo, useState } from "react";
import StatCard from "../../../components/StatCard.jsx";
import ExpertIcon from "../components/ExpertIcon.jsx";

const PAGE_SIZE = 6;

function initials(name = "") {
  return name.split(" ").filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

function submittedAt(value) {
  return value ? new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value)) : "Recently submitted";
}

function CheckinCard({ record, onOpen }) {
  return <article className={`expert-checkin-card ${record.priority}`} tabIndex="0" role="button" onClick={() => onOpen(record.id)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") onOpen(record.id); }}>
    <div className="expert-checkin-card-head"><div className="expert-person-row"><span className="expert-avatar">{initials(record.employee)}</span><span><strong>{record.employee}</strong><small>{record.department} · {submittedAt(record.submittedAt)}</small></span></div><em className={record.priority}>{record.priority} priority</em></div>
    <p className="expert-checkin-subtitle">{record.reason}</p>
    <div className="expert-checkin-metrics">{record.metrics.map(([label, value]) => <div className="expert-checkin-metric" key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>
    <p className="expert-checkin-summary"><strong>Notes:</strong> {record.notes || "No additional notes shared."}</p>
    <button className="expert-primary-button" type="button" onClick={(event) => { event.stopPropagation(); onOpen(record.id); }}>Open Details <ExpertIcon name="chevron" size={14} /></button>
  </article>;
}

function ExpertCheckins({ data, onUpdate }) {
  const [selectedId, setSelectedId] = useState(null);
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState("");
  const [notice, setNotice] = useState("");
  const selected = data.checkins.find((record) => record.id === selectedId) || null;
  const priority = data.checkins.filter((record) => record.priority === "high");
  const totalPages = Math.max(1, Math.ceil(data.checkins.length / PAGE_SIZE));
  const pageRecords = data.checkins.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const trackedEmployees = useMemo(() => new Set(data.checkins.map((record) => record.employee)).size, [data.checkins]);

  function closeDetails() {
    setSelectedId(null);
    setMessage("");
    setNotice("");
  }

  function sendSuggestion(event) {
    event.preventDefault();
    if (!selected || !message.trim()) {
      setNotice("Write a message before sending.");
      return;
    }
    const response = { text: message.trim(), createdAt: new Date().toISOString() };
    onUpdate({ checkins: data.checkins.map((record) => record.id === selected.id ? { ...record, responses: [...(record.responses || []), response], followUpStatus: "Suggestion sent" } : record) });
    setNotice("Suggestion sent successfully.");
    setMessage("");
  }

  return <div className="expert-checkins-page">
    <section className="expert-panel expert-checkins-hero"><div className="expert-panel-head"><div><p className="expert-eyebrow">Employee check-ins</p><h2>Review employee wellness updates</h2><p>Review multiple employee wellness check-ins shared over time.</p></div><button className="expert-text-button" type="button">Consultations <ExpertIcon name="chevron" size={15} /></button></div><div className="expert-checkins-schedule"><ExpertIcon name="checkins" size={18} /> Employees can submit physical wellness check-ins anytime. Review the latest entries to spot follow-up needs.</div></section>
    <section className="expert-stats-grid expert-stats-grid-three" aria-label="Employee check-in statistics"><StatCard label="Total check-ins" value={String(data.checkins.length)} tone="teal" /><StatCard label="High priority" value={String(priority.length)} tone="coral" /><StatCard label="Employees tracked" value={String(trackedEmployees)} tone="violet" /></section>
    <section className="expert-panel"><div className="expert-panel-head"><div><p className="expert-eyebrow">Priority queue</p><h2>High Priority Check-ins</h2><p>Employees who may need immediate follow-up based on their latest details.</p></div><span className="expert-panel-pill">Priority Queue</span></div><div className="expert-checkin-grid">{priority.length ? priority.slice(0, 3).map((record) => <CheckinCard key={record.id} record={record} onOpen={setSelectedId} />) : <p className="expert-empty">No high-priority employee check-ins are waiting right now.</p>}</div></section>
    <section className="expert-panel"><div className="expert-panel-head"><div><p className="expert-eyebrow">Full activity</p><h2>All Employee Check-ins</h2><p>Every submitted employee check-in for your specialization, including multiple entries over time.</p></div><span className="expert-panel-pill">Full Activity</span></div><div className="expert-checkin-grid">{pageRecords.map((record) => <CheckinCard key={record.id} record={record} onOpen={setSelectedId} />)}</div>{data.checkins.length > PAGE_SIZE && <div className="expert-pagination"><button type="button" disabled={page === 1} onClick={() => setPage((value) => value - 1)}>Previous</button><span>{page}</span><button type="button" disabled={page === totalPages} onClick={() => setPage((value) => value + 1)}>Next</button></div>}</section>
    {selected && <div className="expert-modal-backdrop" role="presentation" onClick={(event) => { if (event.target === event.currentTarget) closeDetails(); }}><section className="expert-checkin-modal" role="dialog" aria-modal="true" aria-labelledby="checkin-detail-title"><button className="expert-modal-close" type="button" onClick={closeDetails} aria-label="Close employee check-in details"><ExpertIcon name="close" size={16} /></button><header className="expert-checkin-detail-hero"><div className="expert-person-row"><span className="expert-avatar large">{initials(selected.employee)}</span><span><small>Employee check-in</small><h2 id="checkin-detail-title">{selected.employee}</h2><p>{selected.department} · {submittedAt(selected.submittedAt)}</p></span></div><em className={selected.priority}>{selected.priority} priority</em></header><div className="expert-checkin-detail-layout"><main><section><h3>Complete submitted details</h3><p>All values entered by the employee for this check-in.</p><div className="expert-detail-metrics">{selected.metrics.map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div></section><section><h3>Additional notes</h3><p className="expert-detail-notes">{selected.notes || "No additional notes shared."}</p></section><section><h3>Expert response history</h3>{selected.responses?.length ? <ul className="expert-response-list">{selected.responses.map((response, index) => <li key={`${response.createdAt}-${index}`}>{typeof response === "string" ? response : response.text}</li>)}</ul> : <p className="expert-detail-muted">No suggestions have been sent yet.</p>}</section></main><aside><section><h3>Review summary</h3><dl><div><dt>Priority reason</dt><dd>{selected.reason}</dd></div><div><dt>Follow-up status</dt><dd>{selected.followUpStatus || "Not requested"}</dd></div><div><dt>Suggested action</dt><dd>{selected.priority === "high" ? "Review and respond soon." : "Continue monitoring this employee."}</dd></div></dl></section><section><h3>Send suggestion message</h3><p className="expert-detail-muted">Share guidance, suggestions, or next steps for this employee.</p><form onSubmit={sendSuggestion}><label>Message<textarea value={message} onChange={(event) => setMessage(event.target.value)} rows="5" placeholder="Write practical suggestions or supportive guidance." /></label>{notice && <p className="expert-form-status">{notice}</p>}<button className="expert-primary-button full" type="submit">Send Message</button></form></section></aside></div></section></div>}
  </div>;
}

export default ExpertCheckins;
