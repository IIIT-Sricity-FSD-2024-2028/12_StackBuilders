import { useEffect, useMemo, useState } from "react";
import { makeId } from "../expertData.js";

const PAGE_SIZE = 3;

function formatDate(value) {
  if (!value) return "Date to be scheduled";
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.valueOf()) ? value : new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(date);
}

function formatTime(value) {
  if (!value) return "Time to be scheduled";
  const [hours, minutes] = String(value).split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return value;
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(date);
}

function initials(value = "Wellness") {
  return value.split(/\s+/).filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

function isCompleted(session) {
  return String(session.status || "").toLowerCase() === "completed";
}

function SessionCard({ session, showActions, onNotice, onEdit }) {
  const ongoing = String(session.status || "").toLowerCase() === "ongoing";

  function joinSession() {
    const meetingLink = String(session.meetingLink || "").trim();
    if (!meetingLink) {
      onNotice("Meeting link is not available for this session yet.");
      return;
    }
    window.open(meetingLink, "_blank", "noopener,noreferrer");
  }

  return <article className="session-card">
    <div className="session-top">
      <div className="session-left">
        <div className="session-avatar green">{initials(session.category)}</div>
        <div>
          <h3>{session.title}</h3>
          <p>{session.description}</p>
        </div>
      </div>
    </div>
    <span className="tag">{session.category}</span>
    <div className="session-meta">
      <span><i className="fa-regular fa-calendar" /> {formatDate(session.date)}</span>
      <span><i className="fa-regular fa-clock" /> {formatTime(session.startTime)} ({session.duration})</span>
      <span><i className="fa-solid fa-video" /> {session.sessionType}</span>
    </div>
    {showActions && <div className="session-actions">
      <button className="primary-btn" type="button" onClick={joinSession}>{ongoing ? "Join Now" : "Join Session"}</button>
      <button className="secondary-btn" type="button"><i className="fa-solid fa-users" /> Max {session.maxParticipants} Participants</button>
      {onEdit && <button className="secondary-btn" type="button" onClick={() => onEdit(session)} aria-label={`Edit ${session.title}`}><i className="fa-solid fa-pen-to-square" /> Edit</button>}
    </div>}
  </article>;
}

function ExpertLiveSessions({ data, onUpdate, onCreateSession, onUpdateSession, canCreate = true, canUpdate = true }) {
  const [upcomingPage, setUpcomingPage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [notice, setNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [today, setToday] = useState(() => new Date().toISOString().slice(0, 10));

  useEffect(() => {
    if (!notice) return undefined;
    const timer = window.setTimeout(() => setNotice(""), 3500);
    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    document.body.classList.toggle("session-modal-open", modalOpen);
    return () => document.body.classList.remove("session-modal-open");
  }, [modalOpen]);

  const upcoming = useMemo(() => data.sessions.filter((session) => !isCompleted(session)), [data.sessions]);
  const history = useMemo(() => data.sessions.filter(isCompleted), [data.sessions]);
  const upcomingPages = Math.max(1, Math.ceil(upcoming.length / PAGE_SIZE));
  const historyPages = Math.max(1, Math.ceil(history.length / PAGE_SIZE));
  const visibleUpcoming = upcoming.slice((upcomingPage - 1) * PAGE_SIZE, upcomingPage * PAGE_SIZE);
  const visibleHistory = history.slice((historyPage - 1) * PAGE_SIZE, historyPage * PAGE_SIZE);
  const averageRating = history.filter((session) => Number.isFinite(Number(session.rating))).map((session) => Number(session.rating));

  useEffect(() => {
    setUpcomingPage((page) => Math.min(page, upcomingPages));
    setHistoryPage((page) => Math.min(page, historyPages));
  }, [upcomingPages, historyPages]);

  function openModal(session = null) {
    if (session ? !canUpdate : !canCreate) return;
    setToday(new Date().toISOString().slice(0, 10));
    setEditingSession(session);
    setModalOpen(true);
  }

  function closeModal() {
    if (submitting) return;
    setModalOpen(false);
    setEditingSession(null);
  }

  async function submitSession(event) {
    event.preventDefault();
    if (editingSession ? !canUpdate : !canCreate) return;
    const form = event.currentTarget;
    const formData = new FormData(form);
    const session = {
      ...(editingSession || { id: makeId("session") }),
      title: String(formData.get("title") || "").trim(),
      category: editingSession?.category || data.expert.track || data.expert.specialization || "Wellness",
      sessionType: String(formData.get("sessionType") || "").trim(),
      date: String(formData.get("date") || "").trim(),
      startTime: String(formData.get("startTime") || "").trim(),
      duration: String(formData.get("duration") || "").trim(),
      maxParticipants: Number(formData.get("maxParticipants") || 0),
      attendees: 0,
      meetingLink: String(formData.get("meetingLink") || "").trim(),
      description: String(formData.get("description") || "").trim(),
      status: "scheduled",
    };
    setSubmitting(true);
    try {
      if (editingSession && onUpdateSession) await onUpdateSession(editingSession.id, session);
      else if (editingSession) onUpdate({ sessions: data.sessions.map((item) => item.id === editingSession.id ? session : item) });
      else if (onCreateSession) await onCreateSession(session);
      else onUpdate({ sessions: [session, ...data.sessions] });
      form.reset();
      setModalOpen(false);
      setEditingSession(null);
      setUpcomingPage(1);
      setNotice(editingSession ? "Live session updated successfully." : "Live session created successfully.");
    } catch (error) {
      setNotice(error.message || "The live session could not be created.");
    } finally {
      setSubmitting(false);
    }
  }

  return <>
    <section className="stats-row">
      <div className="stat-card"><div className="stat-icon blue"><i className="fa-regular fa-calendar" /></div><div><p>Upcoming Sessions</p><h2>{upcoming.length}</h2></div></div>
      <div className="stat-card"><div className="stat-icon mint"><i className="fa-regular fa-calendar-check" /></div><div><p>Completed Sessions</p><h2>{history.length}</h2></div></div>
      <div className="stat-card"><div className="stat-icon yellow"><i className="fa-regular fa-star" /></div><div><p>Average Rating</p><h2>{averageRating.length ? (averageRating.reduce((sum, value) => sum + value, 0) / averageRating.length).toFixed(1) : "--"}</h2></div></div>
      {canCreate && <div className="create-wrap"><button className="create-btn" type="button" onClick={() => openModal()}>+ Create Live Session</button></div>}
    </section>

    <section className="panel">
      <div className="panel-header"><div className="panel-title"><div className="panel-icon"><i className="fa-regular fa-calendar" /></div><div><h2>Upcoming Sessions</h2><p>{upcoming.length ? `${upcoming.filter((session) => session.status === "ongoing").length} ongoing, ${upcoming.filter((session) => session.status !== "ongoing").length} scheduled` : "No sessions scheduled"}</p></div></div></div>
      <div className="session-list" id="expertUpcomingSessionList">{visibleUpcoming.length ? visibleUpcoming.map((session) => <SessionCard key={session.id} session={session} showActions onNotice={setNotice} onEdit={canUpdate && (session.status === "scheduled" || session.status === "ongoing") ? openModal : undefined} />) : <div className="empty-session-state">No live sessions created yet.</div>}</div>
      {upcoming.length > PAGE_SIZE && <div className="pagination"><button type="button" disabled={upcomingPage === 1} onClick={() => setUpcomingPage((page) => page - 1)}>Previous</button><span className="page-number active">{upcomingPage}</span><button type="button" disabled={upcomingPage === upcomingPages} onClick={() => setUpcomingPage((page) => page + 1)}>Next</button></div>}
    </section>

    <section className="panel">
      <div className="panel-header"><div className="panel-title"><div className="panel-icon"><i className="fa-regular fa-calendar" /></div><div><h2>Session History</h2><p>{history.length ? `${history.length} completed session${history.length === 1 ? "" : "s"}` : "No completed sessions"}</p></div></div></div>
      <div className="session-list" id="expertSessionHistoryList">{visibleHistory.length ? visibleHistory.map((session) => <SessionCard key={session.id} session={session} showActions={false} onNotice={setNotice} />) : <div className="empty-session-state">No completed live sessions yet.</div>}</div>
      {history.length > PAGE_SIZE && <div className="pagination"><button type="button" disabled={historyPage === 1} onClick={() => setHistoryPage((page) => page - 1)}>Previous</button><span className="page-number active">{historyPage}</span><button type="button" disabled={historyPage === historyPages} onClick={() => setHistoryPage((page) => page + 1)}>Next</button></div>}
    </section>

    {notice && <p role="status" style={{ color: "#0f9d8a", fontWeight: 700 }}>{notice}</p>}

    {modalOpen && <div className="session-modal-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) closeModal(); }}>
      <div className="session-modal" role="dialog" aria-modal="true" aria-labelledby="sessionModalTitle">
        <div className="session-modal-header"><div><p className="session-modal-eyebrow">LIVE SESSION SETUP</p><h2 id="sessionModalTitle">{editingSession ? "Edit Live Session" : "Create Live Session"}</h2><p className="session-modal-copy">{editingSession ? "Update the schedule and details for this live session." : "Add the title, schedule, and details for your next session."} The category is assigned from your expert profile.</p></div><button className="session-close-btn" type="button" onClick={closeModal} disabled={submitting}>Close</button></div>
        <form className="session-modal-form" onSubmit={submitSession}>
          <div className="session-form-grid">
            <label className="session-field session-field-wide"><span>Session Title</span><input type="text" name="title" defaultValue={editingSession?.title || ""} placeholder="Enter session title" required /></label>
            <label className="session-field"><span>Category</span><input type="text" name="categoryLabel" value={editingSession?.category || data.expert.track || data.expert.specialization || "Wellness"} readOnly /><small className="session-field-note">Assigned automatically from your wellness category.</small></label>
            <label className="session-field"><span>Session Type</span><select name="sessionType" defaultValue={editingSession?.sessionType || "Video Session"} required>{!["Video Session", "Workshop", "Webinar"].includes(editingSession?.sessionType) && editingSession?.sessionType && <option>{editingSession.sessionType}</option>}<option>Video Session</option><option>Workshop</option><option>Webinar</option></select></label>
            <label className="session-field"><span>Date</span><input type="date" name="date" min={today} defaultValue={editingSession?.date || ""} required /></label>
            <label className="session-field"><span>Start Time</span><input type="time" name="startTime" defaultValue={editingSession?.startTime || ""} required /></label>
            <label className="session-field"><span>Duration</span><select name="duration" defaultValue={editingSession?.duration || "30 Minutes"} required>{!["30 Minutes", "45 Minutes", "60 Minutes", "90 Minutes"].includes(editingSession?.duration) && editingSession?.duration && <option>{editingSession.duration}</option>}<option>30 Minutes</option><option>45 Minutes</option><option>60 Minutes</option><option>90 Minutes</option></select></label>
            <label className="session-field"><span>Max Participants</span><input type="number" name="maxParticipants" min="1" defaultValue={editingSession?.maxParticipants || ""} placeholder="50" required /></label>
            <label className="session-field"><span>Meeting Link</span><input type="url" name="meetingLink" defaultValue={editingSession?.meetingLink || ""} placeholder="Paste session link" required /></label>
            <label className="session-field session-field-wide"><span>Description</span><textarea rows="4" name="description" defaultValue={editingSession?.description || ""} placeholder="Describe what this session covers." required /></label>
          </div>
          <div className="session-modal-actions"><button className="session-secondary-btn" type="button" onClick={closeModal} disabled={submitting}>Cancel</button><button className="session-primary-btn" type="submit" disabled={submitting}>{submitting ? "Saving…" : editingSession ? "Save Changes" : "Create Session"}</button></div>
        </form>
      </div>
    </div>}
  </>;
}

export default ExpertLiveSessions;
