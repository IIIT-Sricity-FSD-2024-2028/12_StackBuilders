import { useMemo, useState } from "react";
import StatCard from "../../../components/StatCard.jsx";
import ExpertIcon from "../components/ExpertIcon.jsx";
import { PagedSessions, SessionModal } from "../components/ExpertFeatureComponents.jsx";

function LiveSessions({ data, onCreateSession }) {
  const [modalOpen, setModalOpen] = useState(false);
  const upcoming = data.sessions.filter((session) => session.status !== "completed");
  const completed = data.sessions.filter((session) => session.status === "completed");
  const averageRating = useMemo(() => completed.length ? (completed.reduce((total, session) => total + (session.rating || 0), 0) / completed.length).toFixed(1) : "0.0", [completed]);

  return <><section className="expert-page-heading expert-session-heading"><div><p className="expert-eyebrow">Interactive wellbeing</p><h1>Live Sessions</h1><p>Schedule expert-led sessions and keep an eye on engagement after every event.</p></div><button className="expert-primary-button" type="button" onClick={() => setModalOpen(true)}><ExpertIcon name="plus" size={17} /> Create live session</button></section><section className="expert-stats-grid three" aria-label="Live session statistics"><StatCard label="Upcoming sessions" value={String(upcoming.length)} tone="teal" /><StatCard label="Completed sessions" value={String(completed.length)} tone="coral" /><StatCard label="Average rating" value={averageRating} tone="violet" /></section><section className="expert-panel"><div className="expert-panel-head"><div className="expert-title-with-icon"><span><ExpertIcon name="calendar" /></span><div><h2>Upcoming Sessions</h2><p>{upcoming.length ? `${upcoming.length} sessions scheduled for your audience.` : "No sessions scheduled."}</p></div></div></div><PagedSessions sessions={upcoming} completed={false} /></section><section className="expert-panel"><div className="expert-panel-head"><div className="expert-title-with-icon"><span><ExpertIcon name="clock" /></span><div><h2>Session History</h2><p>{completed.length ? `${completed.length} completed sessions.` : "No completed sessions."}</p></div></div></div><PagedSessions sessions={completed} completed /></section>{modalOpen && <SessionModal expert={data.expert} onClose={() => setModalOpen(false)} onCreate={onCreateSession} />}</>;
}

export default LiveSessions;
