import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCurrentEmployee, getCompanyContext } from '../services/employeeAuth';
import {
  getTrackConfig,
  readCheckinsByTrack,
  readCheckinsByEmployee,
  getLatestResponseByCheckinId,
  formatDateTime,
  formatFieldValue,
  getCheckinUrgency,
} from '../services/storageServices';

const TRACKS = ['mental', 'physical', 'nutrition'];

export default function WellnessCheckins() {
  const employee = getCurrentEmployee();
  const companyCtx = getCompanyContext(employee);
  const [trackData, setTrackData] = useState({});
  const [recentCheckins, setRecentCheckins] = useState([]);

  useEffect(() => {
    if (!employee) return;
    loadData();
  }, []);

  function loadData() {
    const data = {};
    TRACKS.forEach((key) => {
      const entries = readCheckinsByTrack(key, employee?.id, companyCtx);
      data[key] = { entries, latest: entries[0] || null };
    });
    setTrackData(data);
    setRecentCheckins(readCheckinsByEmployee(employee?.id, companyCtx).slice(0, 6));
  }

  function createRecentSummary(record) {
    if (record.checkinType === 'mental')
      return record.mood ? `Mood was ${record.mood.toLowerCase()}.` : 'Mental wellness update.';
    if (record.checkinType === 'physical')
      return record.energyLevel ? `Energy level was ${record.energyLevel.toLowerCase()}.` : 'Physical wellness update.';
    if (record.checkinType === 'nutrition')
      return record.dietaryGoals ? `Goals: ${record.dietaryGoals.substring(0, 40)}...` : 'Diet plan update.';
    return 'Check-in submitted.';
  }

  return (
    <div className="page-shell">
      <main className="page">
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">Employee Wellness Updates</p>
            <h1>Share the right details with the right wellness expert.</h1>
            <p className="hero-text">
              Use these check-ins to send your latest mental wellness, physical
              wellness, and diet plan details to the psychologist,
              physical wellness instructor, and nutritionist.
            </p>
          </div>
          <aside className="hero-card">
            <h2>Quick reminder</h2>
            <p>
              These updates are designed for repeated use, so you can enter
              details from time to time and your wellness experts can track
              changes over time.
            </p>
          </aside>
        </section>

        <section className="track-switcher" aria-label="Wellness check-in options">
          <Link className="switch-pill mental" to="/mental-wellness">
            <i className="fa-solid fa-brain" /> Mental Wellness
          </Link>
          <Link className="switch-pill physical" to="/physical-wellness">
            <i className="fa-solid fa-dumbbell" /> Physical Wellness
          </Link>
          <Link className="switch-pill nutrition" to="/diet-plan">
            <i className="fa-solid fa-apple-whole" /> Diet Plan
          </Link>
        </section>

        <section className="track-grid">
          {TRACKS.map((key) => {
            const config = getTrackConfig(key);
            const { entries, latest } = trackData[key] || { entries: [], latest: null };
            const icons   = { mental: 'fa-brain', physical: 'fa-dumbbell', nutrition: 'fa-apple-whole' };
            const links   = { mental: '/mental-wellness', physical: '/physical-wellness', nutrition: '/diet-plan' };
            const labels  = { mental: 'Psychologist', physical: 'Physical Wellness Instructor', nutrition: 'Nutritionist' };
            return (
              <article key={key} className={`track-card ${key}`}>
                <div className="track-icon">
                  <i className={`fa-solid ${icons[key]}`} />
                </div>
                <div className="track-copy">
                  <p className="track-label">{labels[key]}</p>
                  <h2>{config?.label}</h2>
                  <p>{config?.intro}</p>
                </div>
                <div className="track-meta">
                  <p className="meta-title">When to enter details</p>
                  <p>{config?.schedule}</p>
                  <div className="meta-row"><span>Entries</span><strong>{entries.length}</strong></div>
                  <div className="meta-row">
                    <span>Last update</span>
                    <strong>{latest ? formatDateTime(latest.submittedAt) : 'Not submitted yet'}</strong>
                  </div>
                </div>
                <Link className="track-link" to={links[key]}>
                  Open {config?.label?.toLowerCase()} page
                </Link>
              </article>
            );
          })}
        </section>

        <section className="panel">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Recent Activity</p>
              <h2>Your latest wellness check-ins</h2>
            </div>
            <span className="panel-pill">Latest 6 submissions</span>
          </div>
          <div className="recent-list" id="employeeRecentCheckins">
            {recentCheckins.length === 0 ? (
              <div className="recent-empty">
                No check-ins submitted yet. Use the cards above to add your first
                mental wellness, physical wellness, or diet plan update.
              </div>
            ) : (
              recentCheckins.map((record) => {
                const config    = getTrackConfig(record.checkinType);
                const urgency   = getCheckinUrgency(record);
                const response  = getLatestResponseByCheckinId(record.id, companyCtx);
                const chips     = (config?.fields || []).slice(0, 4)
                  .map((f) => record[f.name]
                    ? <span key={f.name} className="detail-chip">{f.label}: {formatFieldValue(f, record[f.name])}</span>
                    : null)
                  .filter(Boolean);
                return (
                  <article key={record.id} className="recent-card">
                    <div className="recent-card-head">
                      <div>
                        <h3>{config?.label || 'Wellness'}</h3>
                        <time>{formatDateTime(record.submittedAt)}</time>
                      </div>
                      <span className="panel-pill">{urgency.label}</span>
                    </div>
                    <p className="recent-summary">{createRecentSummary(record)}</p>
                    <div className="detail-chips">{chips}</div>
                    {response && (
                      <div className="expert-response-box">
                        <div className="expert-response-head">
                          <strong>{response.expertName}</strong>
                          <span>{formatDateTime(response.createdAt)}</span>
                        </div>
                        <p>{response.message}</p>
                      </div>
                    )}
                  </article>
                );
              })
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
