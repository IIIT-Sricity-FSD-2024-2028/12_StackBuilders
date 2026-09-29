import { useState, useEffect } from 'react';
import { getCurrentEmployee, getCompanyContext } from '../services/employeeAuth';
import {
  readLiveSessions,
  formatScheduleDate as formatDate,
  formatScheduleTime as formatTime,
} from '../services/storageServices';

const SESSIONS_PER_PAGE = 9;

export default function LiveSessions() {
  const employee   = getCurrentEmployee();
  const companyCtx = getCompanyContext(employee);

  const [sessions,    setSessions]    = useState([]);
  const [activeTab,   setActiveTab]   = useState('scheduled');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (!employee) return;
    setSessions(readLiveSessions(companyCtx));
  }, []);

  const getStatusForTab = (tab) =>
    tab === 'ongoing' ? 'ongoing' : tab === 'attended' ? 'completed' : 'scheduled';

  const currentStatus  = getStatusForTab(activeTab);
  const scheduledCount = sessions.filter((s) => s.status === 'scheduled').length;
  const ongoingCount   = sessions.filter((s) => s.status === 'ongoing').length;
  const attendedCount  = sessions.filter((s) => s.status === 'completed').length;

  const filtered    = sessions.filter((s) => s.status === currentStatus);
  const totalPages  = Math.max(Math.ceil(filtered.length / SESSIONS_PER_PAGE), 1);
  const page        = Math.min(currentPage, totalPages);
  const paginated   = filtered.slice((page - 1) * SESSIONS_PER_PAGE, page * SESSIONS_PER_PAGE);

  function getPresentation(status) {
    if (status === 'ongoing')   return { label: 'Ongoing',   cls: 'live',      btnText: 'Join Now', actionType: 'join' };
    if (status === 'completed') return { label: 'Attended',  cls: 'attended',  btnText: '',         actionType: '' };
    return                             { label: 'Scheduled', cls: 'scheduled', btnText: '',         actionType: '' };
  }

  function switchTab(tab) { setActiveTab(tab); setCurrentPage(1); }

  return (
    <div className="sessions-page">
      <header className="sessions-header">
        <div className="icon-box">📹</div>
        <div>
          <h1>Wellness Sessions</h1>
          <p>Join live wellness classes and view your session history</p>
        </div>
      </header>

      <div className="tabs">
        <button className={`tab ${activeTab === 'scheduled' ? 'active' : ''}`} onClick={() => switchTab('scheduled')}>
          Scheduled <span>{scheduledCount}</span>
        </button>
        <button className={`tab ${activeTab === 'ongoing' ? 'active' : ''}`} onClick={() => switchTab('ongoing')}>
          Ongoing <span className="red">{ongoingCount}</span>
        </button>
        <button className={`tab ${activeTab === 'attended' ? 'active' : ''}`} onClick={() => switchTab('attended')}>
          Attended <span className="green">{attendedCount}</span>
        </button>
      </div>

      <section className="sessions-panel">
        <section className="cards-grid" id="liveSessionsGrid">
          {filtered.length === 0 ? (
            <div className="empty-live-state">
              {activeTab === 'scheduled' ? 'No scheduled sessions available right now.'
               : activeTab === 'ongoing'  ? 'No sessions are currently ongoing.'
               : 'No attended sessions yet.'}
            </div>
          ) : (
            paginated.map((s) => {
              const pres = getPresentation(s.status);
              return (
                <div key={s.id} className="session-card session-card-no-image">
                  <div className="card-content no-image-content">
                    <div className="card-top-row">
                      <span className="tag">{s.category}</span>
                      <span className={`status ${pres.cls}`}>{pres.label}</span>
                    </div>
                    <h2>{s.title || s.name}</h2>
                    <p><i className="fa-regular fa-user" /> {s.hostName || s.expertName}, Wellness Expert</p>
                    <p><i className="fa-regular fa-calendar" /> {formatDate(s.date)}</p>
                    <p><i className="fa-regular fa-clock" /> {formatTime(s.startTime)} ({s.duration})</p>
                    <p><i className="fa-solid fa-users" /> Max {s.maxParticipants} participants</p>
                    {pres.actionType === 'join' && (
                      <button
                        className="action-btn join"
                        disabled={!s.meetingLink}
                        onClick={() => s.meetingLink && window.open(s.meetingLink, '_blank')}
                      >
                        {pres.btnText}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </section>

        {filtered.length > 0 && (
          <div className="sessions-pager" id="liveSessionsPager">
            <button className="sessions-pager-btn" disabled={page === 1} onClick={() => setCurrentPage((p) => p - 1)}>Previous</button>
            <span className="sessions-pager-btn sessions-pager-indicator">{page}</span>
            <button className="sessions-pager-btn" disabled={page >= totalPages} onClick={() => setCurrentPage((p) => p + 1)}>Next</button>
          </div>
        )}
      </section>
    </div>
  );
}
