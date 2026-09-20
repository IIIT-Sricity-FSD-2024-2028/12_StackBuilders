import { useEffect, useMemo, useState } from "react";
import { nextAvailableDate } from "../expertData.js";
import ExpertIcon from "./ExpertIcon.jsx";

const availabilityTimes = ["09:00", "09:15", "09:30", "09:45", "10:00", "10:15", "10:30", "10:45", "11:00", "11:15", "14:00", "14:15", "14:30", "14:45", "15:00", "15:15"];

export const videoCategories = [
  ["Health Related", "Nutrition, sleep, and healthy daily habits.", "heart", "coral"],
  ["Mind Relaxation", "Calming routines, mindfulness, and stress relief.", "brain", "violet"],
  ["Physical Wellness", "Movement, mobility, stretching, and fitness routines.", "dumbbell", "mint"],
];

function initials(name) {
  return name.split(" ").map((part) => part[0]).join("").slice(0, 2);
}

function formatSubmittedAt(value) {
  return new Intl.DateTimeFormat(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

function formatSessionDate(session) {
  return new Intl.DateTimeFormat(undefined, { weekday: "short", month: "short", day: "numeric" }).format(new Date(`${session.date}T12:00:00`));
}

export function AvailabilityGrid({ savedSlots, onSave }) {
  const [slots, setSlots] = useState(savedSlots);
  const [saved, setSaved] = useState(false);
  const days = useMemo(() => {
    const today = new Date();
    return [0, 1].map((offset) => {
      const date = new Date(today);
      date.setDate(today.getDate() + offset);
      return { key: offset === 0 ? "today" : "tomorrow", label: offset === 0 ? "Today" : "Tomorrow", date: new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(date) };
    });
  }, []);
  const toggleSlot = (slot) => {
    setSaved(false);
    setSlots((current) => current.includes(slot) ? current.filter((entry) => entry !== slot) : [...current, slot]);
  };
  const save = () => { onSave(slots); setSaved(true); };

  return <section className="expert-panel expert-availability-panel"><div className="expert-panel-head"><div className="expert-title-with-icon"><span><ExpertIcon name="calendar" /></span><div><h2>Manage Availability</h2><p>Select your free 15-minute slots for today and tomorrow.</p></div></div><button className="expert-primary-button" type="button" onClick={save}>Save availability</button></div><div className="expert-availability-grid">{days.map((day) => <div className="expert-day-column" key={day.key}><header><strong>{day.label}</strong><small>{day.date}</small></header><div>{availabilityTimes.map((time) => { const slot = `${day.key}-${time}`; return <button type="button" key={slot} className={slots.includes(slot) ? "selected" : ""} onClick={() => toggleSlot(slot)}>{time}</button>; })}</div></div>)}</div>{saved && <p className="expert-inline-success" role="status">Availability saved for this workspace.</p>}</section>;
}

export function CheckinCard({ checkin, onOpen }) {
  return <button className={`expert-checkin-card ${checkin.priority}`} type="button" onClick={() => onOpen(checkin.id)}><div className="expert-person-row"><span className="expert-avatar">{initials(checkin.employee)}</span><span><strong>{checkin.employee}</strong><small>{checkin.department} · {formatSubmittedAt(checkin.submittedAt)}</small></span><em>{checkin.priority}</em></div><p>{checkin.reason}</p><span className="expert-metric-row">{checkin.metrics.map(([label, value]) => <i key={label}>{label}: {value}</i>)}</span><small className="expert-checkin-notes">{checkin.notes}</small><span className="expert-card-link">Review details <ExpertIcon name="chevron" size={15} /></span></button>;
}

export function CheckinDetailModal({ checkin, onClose, onSendResponse, onRequestFollowUp, onNavigate }) {
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");
  useEffect(() => { setMessage(""); setStatus(""); }, [checkin?.id]);
  useEffect(() => { const closeOnEscape = (event) => event.key === "Escape" && onClose(); window.addEventListener("keydown", closeOnEscape); return () => window.removeEventListener("keydown", closeOnEscape); }, [onClose]);
  if (!checkin) return null;
  const send = (event) => { event.preventDefault(); if (!message.trim()) { setStatus("Write a practical suggestion before sending."); return; } onSendResponse(checkin.id, message.trim()); setMessage(""); setStatus("Suggestion message sent successfully."); };
  const requestFollowUp = () => { onRequestFollowUp(checkin); onClose(); onNavigate("consultations"); };

  return <div className="expert-modal-backdrop" role="presentation" onMouseDown={(event) => event.currentTarget === event.target && onClose()}><section className="expert-detail-modal" role="dialog" aria-modal="true" aria-labelledby="expert-checkin-detail-title"><button className="expert-modal-close" type="button" aria-label="Close employee check-in details" onClick={onClose}><ExpertIcon name="close" /></button><header className="expert-detail-hero"><div className="expert-person-row"><span className="expert-avatar large">{initials(checkin.employee)}</span><span><small>Employee check-in</small><h2 id="expert-checkin-detail-title">{checkin.employee}</h2><p>{checkin.department} · Submitted {formatSubmittedAt(checkin.submittedAt)}</p></span></div><span className={`expert-status ${checkin.priority}`}>{checkin.priority} priority</span></header><div className="expert-detail-layout"><div className="expert-detail-main"><section><header><h3>Complete submitted details</h3><p>All values entered by the employee for this check-in.</p></header><div className="expert-detail-metrics">{checkin.metrics.map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div></section><section><header><h3>Additional notes</h3><p>Extra context shared with this submission.</p></header><p className="expert-detail-notes">{checkin.notes}</p></section><section><header><h3>Expert response history</h3><p>Suggestion messages sent for this employee check-in.</p></header>{checkin.responses.length ? <ul className="expert-response-list">{checkin.responses.map((response, index) => <li key={`${response}-${index}`}>{response}</li>)}</ul> : <p className="expert-empty">No suggestions have been sent yet.</p>}</section></div><aside className="expert-detail-side"><section><h3>Review summary</h3><dl><div><dt>Priority reason</dt><dd>{checkin.reason}</dd></div><div><dt>Consultation status</dt><dd>{checkin.followUpStatus}</dd></div><div><dt>Suggested action</dt><dd>{checkin.priority === "high" ? "Offer a follow-up consultation" : "Send a supportive suggestion"}</dd></div></dl><button className="expert-primary-button full" type="button" onClick={requestFollowUp}>{checkin.followUpStatus === "Not requested" ? "Request follow-up consultation" : "Open consultations"}</button><button className="expert-secondary-button full" type="button" onClick={() => { onClose(); onNavigate("consultations"); }}>Consultations</button></section><section><h3>Send suggestion message</h3><p>Share guidance, suggestions, or next steps for the employee.</p><form onSubmit={send}><label><span>Message</span><textarea rows="5" value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Write practical suggestions or supportive guidance for the employee." /></label>{status && <p className="expert-form-status" role="status">{status}</p>}<button className="expert-primary-button full" type="submit"><ExpertIcon name="send" size={16} /> Send message</button></form></section></aside></div></section></div>;
}

export function SessionCard({ session, completed = false }) {
  return <article className="expert-session-card"><div className={`expert-session-art ${session.category.includes("Mind") ? "violet" : "mint"}`}><ExpertIcon name={session.category.includes("Mind") ? "brain" : "broadcast"} size={26} /></div><div className="expert-session-content"><div><span className="expert-video-category">{session.category}</span><h3>{session.title}</h3><p>{session.description}</p></div><div className="expert-session-meta"><span><ExpertIcon name="calendar" size={14} /> {formatSessionDate(session)}</span><span><ExpertIcon name="clock" size={14} /> {session.startTime} · {session.duration}</span><span><ExpertIcon name="users" size={14} /> {session.attendees || 0}/{session.maxParticipants} participants</span></div><div className="expert-session-actions">{completed ? <span className="expert-rating">★ {session.rating || "—"} average rating</span> : <a className="expert-primary-button" href={session.meetingLink} target="_blank" rel="noreferrer">Open session <ExpertIcon name="external" size={15} /></a>}<span className={`expert-status ${completed ? "stable" : "medium"}`}>{completed ? "Completed" : "Scheduled"}</span></div></div></article>;
}

export function PagedSessions({ sessions, completed }) {
  const [page, setPage] = useState(1);
  const count = Math.max(Math.ceil(sessions.length / 3), 1);
  const items = sessions.slice((page - 1) * 3, page * 3);
  return <>{items.length ? <div className="expert-session-list">{items.map((session) => <SessionCard session={session} completed={completed} key={session.id} />)}</div> : <p className="expert-empty">{completed ? "No completed sessions have been recorded yet." : "No live sessions are scheduled yet."}</p>}{count > 1 && <div className="expert-pagination"><button type="button" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</button><span>{page}</span><button type="button" disabled={page === count} onClick={() => setPage(page + 1)}>Next</button></div>}</>;
}

export function SessionModal({ expert, onClose, onCreate }) {
  const [error, setError] = useState("");
  const submit = (event) => { event.preventDefault(); const value = Object.fromEntries(new FormData(event.currentTarget).entries()); if (Object.values(value).some((item) => !String(item).trim())) { setError("Please complete every session field."); return; } if (new Date(`${value.date}T${value.startTime}`) < new Date()) { setError("Live sessions cannot be scheduled in the past."); return; } try { new URL(value.meetingLink); } catch { setError("Enter a valid meeting link that starts with http:// or https://."); return; } onCreate({ ...value, maxParticipants: Number(value.maxParticipants), attendees: 0, status: "scheduled" }); onClose(); };
  return <div className="expert-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><section className="expert-form-modal" role="dialog" aria-modal="true" aria-labelledby="expert-session-modal-title"><button className="expert-modal-close" type="button" aria-label="Close live session form" onClick={onClose}><ExpertIcon name="close" /></button><header><p className="expert-eyebrow">Live session setup</p><h2 id="expert-session-modal-title">Create Live Session</h2><p>Add the title, schedule, and details for your next session. The category is assigned from your expert profile.</p></header><form onSubmit={submit}><div className="expert-form-grid"><label className="wide"><span>Session title</span><input name="title" placeholder="Enter session title" required /></label><label><span>Category</span><input name="category" value={expert.track} readOnly /></label><label><span>Session type</span><select name="sessionType" defaultValue="Video Session"><option>Video Session</option><option>Workshop</option><option>Webinar</option></select></label><label><span>Date</span><input name="date" type="date" defaultValue={nextAvailableDate()} required /></label><label><span>Start time</span><input name="startTime" type="time" defaultValue="10:00" required /></label><label><span>Duration</span><select name="duration" defaultValue="45 Minutes"><option>30 Minutes</option><option>45 Minutes</option><option>60 Minutes</option><option>90 Minutes</option></select></label><label><span>Max participants</span><input name="maxParticipants" type="number" min="1" defaultValue="50" required /></label><label className="wide"><span>Meeting link</span><input name="meetingLink" type="url" placeholder="https://meet.google.com/..." required /></label><label className="wide"><span>Description</span><textarea name="description" rows="4" placeholder="Describe what this session covers." required /></label></div>{error && <p className="expert-form-error" role="alert">{error}</p>}<div className="expert-modal-actions"><button className="expert-secondary-button" type="button" onClick={onClose}>Cancel</button><button className="expert-primary-button" type="submit">Create session</button></div></form></section></div>;
}

export function VideoCard({ video }) {
  return <article className="expert-video-card"><a href={video.videoLink} target="_blank" rel="noreferrer" aria-label={`Watch ${video.title}`}><div className={`expert-video-art ${video.accent || "mint"}`}><span className="expert-video-badge">{video.category}</span><span className="expert-video-play"><ExpertIcon name="play" size={25} /></span><span className="expert-video-duration">{video.duration}</span></div><div className="expert-video-copy"><h3>{video.title}</h3><p>{video.description}</p><span>Uploaded by Wellness Expert <ExpertIcon name="external" size={13} /></span></div></a></article>;
}

export function VideoCategory({ category, videos }) {
  const [index, setIndex] = useState(0);
  const [name, description, icon, color] = category;
  const maxIndex = Math.max(videos.length - 3, 0);
  useEffect(() => setIndex((current) => Math.min(current, maxIndex)), [maxIndex]);
  if (!videos.length) return null;
  return <section className="expert-video-category"><header><div className="expert-title-with-icon"><span className={color}><ExpertIcon name={icon} /></span><div><h2>{name} Videos</h2><p>{description}</p></div></div><div className="expert-carousel-controls"><button type="button" aria-label={`Show earlier ${name.toLowerCase()} videos`} disabled={index === 0} onClick={() => setIndex(index - 1)}><ExpertIcon name="arrowLeft" size={17} /></button><button type="button" aria-label={`Show later ${name.toLowerCase()} videos`} disabled={index >= maxIndex} onClick={() => setIndex(index + 1)}><ExpertIcon name="chevron" size={17} /></button></div></header><div className="expert-video-grid">{videos.slice(index, index + 3).map((video) => <VideoCard video={video} key={video.id} />)}</div></section>;
}

export function VideoModal({ onClose, onCreate }) {
  const [error, setError] = useState("");
  const submit = (event) => { event.preventDefault(); const values = Object.fromEntries(new FormData(event.currentTarget).entries()); if (Object.values(values).some((value) => !String(value).trim())) { setError("Please add content for every highlighted field."); return; } try { new URL(values.videoLink); new URL(values.thumbnailLink); } catch { setError("Enter valid video and thumbnail links starting with http:// or https://."); return; } onCreate({ ...values, accent: values.category === "Mind Relaxation" ? "violet" : values.category === "Health Related" ? "coral" : "mint" }); onClose(); };
  return <div className="expert-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><section className="expert-form-modal" role="dialog" aria-modal="true" aria-labelledby="expert-video-modal-title"><button className="expert-modal-close" type="button" aria-label="Close video form" onClick={onClose}><ExpertIcon name="close" /></button><header><p className="expert-eyebrow">Video library</p><h2 id="expert-video-modal-title">Add New Video</h2><p>Add details for a new wellness video without leaving this page.</p></header><form onSubmit={submit}><div className="expert-form-grid"><label className="wide"><span>Video title</span><input name="title" placeholder="Enter video title" required /></label><label><span>Category</span><select name="category" defaultValue=""><option value="" disabled>Select category</option>{videoCategories.map(([name]) => <option key={name}>{name}</option>)}</select></label><label><span>Duration</span><input name="duration" placeholder="12:45" required /></label><label className="wide"><span>Video link</span><input name="videoLink" type="url" placeholder="Paste YouTube or video URL" required /></label><label className="wide"><span>Thumbnail link</span><input name="thumbnailLink" type="url" placeholder="Paste thumbnail image URL" required /></label><label className="wide"><span>Description</span><textarea name="description" rows="4" placeholder="Write a short summary for this video." required /></label></div>{error && <p className="expert-form-error" role="alert">{error}</p>}<div className="expert-modal-actions"><button className="expert-secondary-button" type="button" onClick={onClose}>Cancel</button><button className="expert-primary-button" type="submit">Save video</button></div></form></section></div>;
}
