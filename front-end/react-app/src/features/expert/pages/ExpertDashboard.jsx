import VideoThumbnail from "../../shared/VideoThumbnail.jsx";

function formatDate(value) {
  if (!value) return "Date to be scheduled";
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

function formatSubmittedAt(value) {
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

function initials(name = "") {
  return name.split(" ").filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

function ExpertDashboard({ data, onNavigate, onOpenCheckin, onPlayVideo, canReadReports = true, canReadConsultations = true, canReadClientFeatures = true }) {
  const { checkins, sessions, consultations, videos } = data;
  const upcomingSessions = sessions.filter((session) => session.status !== "completed");
  const upcomingConsultations = consultations.filter((consultation) => consultation.status === "accepted" && !consultation.completed);
  const priorityCheckins = checkins.filter((checkin) => checkin.priority !== "stable");

  return (
    <>
      {canReadReports && <section className="stats-grid">
        <article className="stat-card"><div className="stat-icon mint"><span aria-hidden="true">◉</span></div><div><p className="eyebrow">Upcoming Live Sessions</p><h2 id="upcomingLiveSessionsCount">{upcomingSessions.length}</h2></div></article>
        <article className="stat-card"><div className="stat-icon coral"><span aria-hidden="true">▣</span></div><div><p className="eyebrow">Upcoming Consultations</p><h2 id="upcomingConsultationsCount">{upcomingConsultations.length}</h2></div></article>
        <article className="stat-card"><div className="stat-icon violet"><span aria-hidden="true">▶</span></div><div><p className="eyebrow">Video Library</p><h2 id="dashboardVideoLibraryCount">{videos.length}</h2></div></article>
      </section>}

      {canReadClientFeatures && <section className="panel">
        <div className="panel-head"><div><h3>Upcoming Live Sessions</h3><p>Join our wellness experts for live interactive sessions</p></div><a className="view-all" href="#sessions" onClick={(event) => { event.preventDefault(); onNavigate("sessions"); }}>View All <span>&gt;</span></a></div>
        <div className="cards three-col">{upcomingSessions.slice(0, 3).map((session) => <article className="session-card" key={session.id}><div className="session-top"><div className="session-icon-box green">◉</div><div><h4>{session.title}</h4><span className="pill aqua">{session.category}</span></div></div><ul className="meta-list"><li>{formatDate(session.date)}</li><li>{session.startTime} · {session.duration}</li><li>{session.attendees || 0} attendees</li></ul><div className="action-row"><button className="primary-btn" type="button" onClick={() => onNavigate("sessions")}>Join Session</button><button className="ghost-btn" type="button" onClick={() => onNavigate("sessions")}>Details</button></div></article>)}</div>
      </section>}

      {canReadConsultations && <section className="panel">
        <div className="panel-head"><div><h3>Upcoming Consultations</h3><p>Schedule one-on-one sessions with our experts</p></div><a className="view-all" href="#consultations" onClick={(event) => { event.preventDefault(); onNavigate("consultations"); }}>View All <span>&gt;</span></a></div>
        <div className="cards three-col">{upcomingConsultations.slice(0, 3).map((consultation) => <article className="consult-card" key={consultation.id}><div className="consult-top"><div className="avatar purple">{initials(consultation.employee)}</div><div><h4>{consultation.employee}</h4><span className="pill mint-pill">Accepted</span></div></div><p>{consultation.purpose}</p><ul className="meta-list compact"><li>{formatDate(consultation.date)}</li><li>{consultation.time || "Time to be scheduled"}</li></ul><button className="primary-btn full" type="button" onClick={() => onNavigate("consultations")}>Open Consultation</button></article>)}</div>
      </section>}

      {canReadConsultations && <section className="panel" id="employeeCheckinsSection">
        <div className="panel-head"><div><h3>Employee Check-ins</h3><p>View the latest employee wellness updates relevant to your specialization</p></div><a className="view-all" href="#checkins" onClick={(event) => { event.preventDefault(); onNavigate("checkins"); }}>View All <span>&gt;</span></a></div>
        <div className="cards three-col">{checkins.slice(0, 3).map((checkin) => <article className="mini-card dashboard-checkin-card" key={checkin.id}><div className="mini-header"><div className="person"><div className="avatar blue">{initials(checkin.employee)}</div><div><h3>{checkin.employee}</h3><span>{checkin.department}</span></div></div><span className={`status ${checkin.priority === "high" ? "red" : checkin.priority === "medium" ? "amber" : "green"}`}>{checkin.priority}</span></div><p className="dashboard-checkin-subtitle">{checkin.reason}</p><p className="dashboard-checkin-note">{checkin.notes}</p><div className="dashboard-checkin-actions"><button className="primary-btn full" type="button" onClick={() => onOpenCheckin(checkin.id)}>View Details</button></div></article>)}</div>
        {!checkins.length && <div className="consult-empty-state">No employee check-ins are available yet.</div>}
      </section>}

      {canReadClientFeatures && <section className="panel">
        <div className="panel-head"><div><h3>Video Library</h3><p>Watch our curated wellness videos</p></div><a className="view-all" href="#videos" onClick={(event) => { event.preventDefault(); onNavigate("videos"); }}>View All <span>&gt;</span></a></div>
        <div className="cards three-col">{videos.slice(0, 3).map((video) => {
          const content = <><div className={`expert-video-art ${video.accent || "mint"}`}><VideoThumbnail className="expert-dashboard-video-thumbnail" video={video} /><span className="expert-video-play" aria-hidden="true">▶</span><span className="expert-video-duration">{video.duration}</span></div><div className="expert-video-copy"><h4>{video.title}</h4><p>{video.description}</p><span>{video.category}</span></div></>;
          return <article className="video-card" key={video.id}>{video.videoFileUrl
            ? <button className="expert-dashboard-video-button" type="button" onClick={() => onPlayVideo?.(video)} aria-label={`Play ${video.title}`}>{content}</button>
            : <a href={video.videoLink} target="_blank" rel="noreferrer">{content}</a>}
          </article>;
        })}</div>
      </section>}
    </>
  );
}

export default ExpertDashboard;
