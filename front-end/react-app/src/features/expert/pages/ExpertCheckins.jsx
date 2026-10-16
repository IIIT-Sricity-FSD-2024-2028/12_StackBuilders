import { useLayoutEffect, useMemo, useState } from "react";

const PAGE_SIZE = 6;

function initials(name = "") {
  return name.split(/\s+/).filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "EE";
}

function formatDate(value) {
  if (!value) return "Recently submitted";
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

function priorityInfo(priority, urgencyReason) {
  if (priority === "high") return { className: "red", label: "High Priority", reason: urgencyReason || "This check-in may need immediate follow-up." };
  if (priority === "medium") return { className: "yellow", label: "Medium Priority", reason: urgencyReason || "This check-in may benefit from a timely review." };
  return { className: "green", label: "Stable", reason: "Wellness indicators are steady." };
}

function CheckinCard({ record, onOpen, onNavigate }) {
  const status = priorityInfo(record.priority, record.urgencyReason);
  return <article className="mini-card employee-checkin-card" tabIndex="0" role="button" onClick={() => onOpen(record.id)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") onOpen(record.id); }}>
    <div className="mini-header"><div className="person"><div className="avatar dashboard-consultation-avatar">{initials(record.employee)}</div><div><h3>{record.employee}</h3><span>{formatDate(record.submittedAt)}</span></div></div><span className={`status ${status.className}`}>{status.label}</span></div>
    <div className="employee-checkin-subtitle">{record.priority === "stable" ? record.reason : status.reason}</div>
    <div className="employee-checkin-metrics">{(record.metrics?.length ? record.metrics : [["Update", "Employee check-in submitted"]]).map(([label, value]) => <div className="employee-checkin-metric" key={label}><span className="employee-checkin-metric-label">{label}</span><strong className="employee-checkin-metric-value">{value}</strong></div>)}</div>
    {record.notes && <p className="employee-checkin-summary"><strong>Notes:</strong> {record.notes}</p>}
    <div className="action-row employee-checkin-actions"><button className="primary-btn" type="button" onClick={(event) => { event.stopPropagation(); onOpen(record.id); }}>Open Details</button><a className="ghost-btn" href="#consultations" onClick={(event) => { event.preventDefault(); event.stopPropagation(); onNavigate("consultations"); }}>Consultations</a></div>
  </article>;
}

function EmptyState({ children }) {
  return <div className="consult-empty-state"><p>{children}</p></div>;
}

function ExpertCheckins({ data, onUpdate, onSendSuggestion, onCreateFollowUp, onNavigate, canUpdate = true, canCreateFollowUp = true }) {
  const [selectedId, setSelectedId] = useState(null);
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState("");
  const [responseStatus, setResponseStatus] = useState("");
  const [creatingFollowUp, setCreatingFollowUp] = useState(false);
  const selected = data.checkins.find((record) => record.id === selectedId) || null;
  const highPriority = data.checkins.filter((record) => record.priority === "high");
  const totalPages = Math.max(1, Math.ceil(data.checkins.length / PAGE_SIZE));
  const pageRecords = data.checkins.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const trackedEmployees = useMemo(() => new Set(data.checkins.map((record) => record.employee)).size, [data.checkins]);

  useLayoutEffect(() => {
    const dialog = document.querySelector(".checkin-detail-dialog");
    if (!dialog) return;
    const followUpButton = dialog.querySelector(".checkin-detail-sidebar .checkin-detail-sidecard:first-child button.primary-btn");
    const responseCard = dialog.querySelector(".checkin-detail-sidebar form")?.closest(".checkin-detail-sidecard");
    if (followUpButton) followUpButton.hidden = !canCreateFollowUp;
    if (responseCard) responseCard.hidden = !canUpdate;
  }, [selectedId, canCreateFollowUp, canUpdate]);

  function closeDetails() {
    setSelectedId(null);
    setMessage("");
    setResponseStatus("");
  }

  async function createFollowUp() {
    if (!canCreateFollowUp) return;
    if (!selected || !onCreateFollowUp) {
      onNavigate("consultations");
      return;
    }
    setCreatingFollowUp(true);
    setResponseStatus("");
    try {
      await onCreateFollowUp(selected);
      closeDetails();
      onNavigate("consultations");
    } catch (error) {
      setResponseStatus(error.message || "The follow-up consultation could not be created.");
    } finally {
      setCreatingFollowUp(false);
    }
  }

  async function sendSuggestion(event) {
    event.preventDefault();
    if (!canUpdate) return;
    if (!selected || !message.trim()) {
      setResponseStatus("Write a message before sending.");
      return;
    }
    try {
      if (onSendSuggestion) await onSendSuggestion(selected, message.trim());
      else {
        const response = { text: message.trim(), createdAt: new Date().toISOString() };
        onUpdate({ checkins: data.checkins.map((record) => record.id === selected.id ? { ...record, responses: [...(record.responses || []), response], followUpStatus: "Suggestion sent" } : record) });
      }
      setMessage("");
      setResponseStatus("Suggestion sent successfully.");
    } catch (error) {
      setResponseStatus(error.message || "The suggestion could not be sent.");
    }
  }

  return <>
    <section className="panel checkins-hero-panel"><div className="panel-head"><div><h3>Employee Check-ins</h3><p>Review multiple employee wellness check-ins shared over time.</p></div><a className="view-all" href="#consultations" onClick={(event) => { event.preventDefault(); onNavigate("consultations"); }}>Consultations <span>&gt;</span></a></div><div className="checkins-hero-note">Employees can submit their physical wellness check-in anytime. Review the latest entries to spot follow-up needs.</div></section>
    <section className="stats-grid"><article className="stat-card"><div className="stat-icon mint"><span aria-hidden="true"><i className="fa-solid fa-notes-medical" /></span></div><div><p className="eyebrow">Total Check-ins</p><h2>{data.checkins.length}</h2></div></article><article className="stat-card"><div className="stat-icon coral"><span aria-hidden="true"><i className="fa-solid fa-triangle-exclamation" /></span></div><div><p className="eyebrow">High Priority</p><h2>{highPriority.length}</h2></div></article><article className="stat-card"><div className="stat-icon violet"><span aria-hidden="true"><i className="fa-solid fa-users" /></span></div><div><p className="eyebrow">Employees Tracked</p><h2>{trackedEmployees}</h2></div></article></section>
    <section className="panel"><div className="panel-head"><div><h3>High Priority Check-ins</h3><p>Employees who may need immediate follow-up based on the latest submitted details</p></div><span className="checkins-panel-tag">Priority Queue</span></div><div className="cards three-col">{highPriority.length ? highPriority.slice(0, 3).map((record) => <CheckinCard key={record.id} record={record} onOpen={setSelectedId} onNavigate={onNavigate} />) : <EmptyState>No high-priority employee check-ins are waiting right now.</EmptyState>}</div></section>
    <section className="panel"><div className="panel-head"><div><h3>All Employee Check-ins</h3><p>Every submitted employee check-in for your specialization, including multiple entries over time</p></div><span className="checkins-panel-tag">Full Activity</span></div><div className="cards three-col">{pageRecords.length ? pageRecords.map((record) => <CheckinCard key={record.id} record={record} onOpen={setSelectedId} onNavigate={onNavigate} />) : <EmptyState>No employee check-ins have been submitted yet for this specialization.</EmptyState>}</div>{data.checkins.length > PAGE_SIZE && <div className="dashboard-pager"><button className="dashboard-pager-btn" type="button" disabled={page === 1} onClick={() => setPage((value) => value - 1)}>Previous</button><span className="dashboard-pager-btn dashboard-pager-indicator">{page}</span><button className="dashboard-pager-btn" type="button" disabled={page === totalPages} onClick={() => setPage((value) => value + 1)}>Next</button></div>}</section>

    {selected && <div className="checkin-detail-overlay" role="presentation" onClick={(event) => { if (event.target === event.currentTarget && !creatingFollowUp) closeDetails(); }}><section className="checkin-detail-dialog" role="dialog" aria-modal="true" aria-labelledby="checkinDetailTitle"><button className="checkin-detail-close" type="button" onClick={closeDetails} disabled={creatingFollowUp}>Close</button><div className="checkin-detail-hero"><div className="checkin-detail-person"><div className="avatar dashboard-consultation-avatar">{initials(selected.employee)}</div><div><p className="checkin-detail-eyebrow">Employee Check-in</p><h2 id="checkinDetailTitle">{selected.employee}</h2><p className="checkin-detail-meta">Submitted {formatDate(selected.submittedAt)}{selected.department ? ` | ${selected.department}` : ""}</p></div></div><span className={`status ${priorityInfo(selected.priority, selected.urgencyReason).className}`}>{priorityInfo(selected.priority, selected.urgencyReason).label}</span></div><div className="checkin-detail-layout"><section className="checkin-detail-main"><div className="checkin-detail-section"><div className="checkin-detail-section-head"><h3>Complete submitted details</h3><p>All values entered by the employee for this check-in.</p></div><div className="checkin-detail-metrics">{(selected.metrics || []).map(([label, value]) => <div className="checkin-detail-metric" key={label}><span className="checkin-detail-metric-label">{label}</span><strong className="checkin-detail-metric-value">{value}</strong></div>)}</div></div><div className="checkin-detail-section"><div className="checkin-detail-section-head"><h3>Additional notes</h3></div><div className="checkin-detail-notes">{selected.notes || "No additional notes were shared with this check-in."}</div></div><div className="checkin-detail-section"><div className="checkin-detail-section-head"><h3>Expert response history</h3></div><div className="checkin-detail-responses">{selected.responses?.length ? selected.responses.map((response, index) => <article className="checkin-detail-response-card" key={index}><div className="checkin-detail-response-head"><strong>{typeof response === "string" ? "Wellness Expert" : response.expertName || "Wellness Expert"}</strong><span>{formatDate(response.createdAt)}</span></div><p>{typeof response === "string" ? response : response.text}</p></article>) : <div className="checkin-detail-empty">No expert suggestion messages have been sent for this check-in yet.</div>}</div></div></section><aside className="checkin-detail-sidebar"><div className="checkin-detail-sidecard"><h3>Review summary</h3><div className="checkin-detail-summary-list"><div className="checkin-detail-summary-item"><span>Priority reason</span><strong>{priorityInfo(selected.priority, selected.urgencyReason).reason}</strong></div><div className="checkin-detail-summary-item"><span>Follow-up status</span><strong>{selected.followUpStatus || "Not requested"}</strong></div><div className="checkin-detail-summary-item"><span>Suggested action</span><strong>{selected.priority === "high" ? "Review and respond soon." : "Continue monitoring this employee."}</strong></div></div><div className="checkin-detail-sidebar-actions">{selected.priority === "high" && <button className="primary-btn" type="button" onClick={createFollowUp} disabled={creatingFollowUp}>{creatingFollowUp ? "Creating…" : "Create Follow-up Consultation"}</button>}<a className="ghost-btn" href="#consultations" onClick={(event) => { event.preventDefault(); closeDetails(); onNavigate("consultations"); }}>Open Consultations</a></div></div><div className="checkin-detail-sidecard"><h3>Send suggestion message</h3><p className="checkin-detail-helper">Share guidance, suggestions, or next steps for this employee.</p><form onSubmit={sendSuggestion}><label className="checkin-response-field" htmlFor="checkinResponseMessage"><span>Message</span><textarea id="checkinResponseMessage" value={message} onChange={(event) => setMessage(event.target.value)} rows="5" placeholder="Write practical suggestions or supportive guidance." /></label>{responseStatus && <p className="checkin-response-status">{responseStatus}</p>}<button className="primary-btn full" type="submit">Send Message</button></form></div></aside></div></section></div>}
  </>;
}

export default ExpertCheckins;
