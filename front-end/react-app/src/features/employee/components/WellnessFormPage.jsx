import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getCurrentEmployee, getCompanyContext } from '../services/employeeAuth';
import {
  getTrackConfig,
  formatDateTime,
  formatFieldValue,
  getCheckinUrgency,
} from '../services/storageServices';
import employeeApi from '../services/employeeApi';
import useAutoRefresh from '../../../hooks/useAutoRefresh.js';
import { useRoleAccess } from '../../shared/roleAccessContext.jsx';

function getResponseHistory(responses, checkinId) {
  return responses
    .filter((item) => String(item.checkinId) === String(checkinId))
    .sort((left, right) => new Date(left.createdAt).valueOf() - new Date(right.createdAt).valueOf());
}

/**
 * Shared wellness form page used by Mental Wellness, Physical Wellness, and Diet Plan.
 * @param {{ trackKey: 'mental' | 'physical' | 'nutrition' }} props
 */
export default function WellnessFormPage({ trackKey }) {
  const { hasPermission } = useRoleAccess();
  const canSubmitCheckins = hasPermission('client-management-create');
  const navigate   = useNavigate();
  const employee   = getCurrentEmployee();
  const companyCtx = getCompanyContext(employee);

  const [config,        setConfig]        = useState(null);
  const [history,       setHistory]       = useState([]);
  const [responses,      setResponses]      = useState([]);
  const [formData,      setFormData]      = useState({});
  const [statusMessage, setStatusMessage] = useState(null);

  useEffect(() => {
    if (!employee) return;
    const cfg = getTrackConfig(trackKey);
    setConfig(cfg);
    loadHistory(cfg).catch((error) => setStatusMessage(error.message || 'Could not load check-in history.'));

    document.body.dataset.checkinType = trackKey;
    document.body.classList.add('form-only-page');
    return () => {
      delete document.body.dataset.checkinType;
      document.body.classList.remove('form-only-page');
    };
  }, [trackKey, employee?.id, companyCtx.companyId, companyCtx.companyName]);

  async function loadHistory(cfg) {
    if (!cfg) return;
    const [records, responseRecords] = await Promise.all([
      employeeApi.getCheckins(employee, companyCtx, cfg.key),
      employeeApi.getCheckinResponses(companyCtx, undefined, employee?.id),
    ]);
    setHistory(records || []);
    setResponses(responseRecords || []);
  }

  useAutoRefresh(() => loadHistory(config), `${employee?.id || ''}:${trackKey}:${companyCtx.companyId || companyCtx.companyName || ''}`);

  function handleChange(name, value) {
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!config || !canSubmitCheckins) return;
    const record = {
      employeeId:  employee?.id,
      employeeName: employee?.name,
      checkinType: config.key,
      companyId:   companyCtx.companyId,
      companyName: companyCtx.companyName,
      ...formData,
    };

    try {
      await employeeApi.createCheckin(record);
      setStatusMessage('Check-in submitted successfully!');
      setFormData({});
      await loadHistory(config);
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (error) {
      setStatusMessage(error.message || 'Could not submit this check-in.');
    }
  }

  if (!config) return null;

  return (
    <div className="page-shell form-page-shell">
      <main className="page">
        <div className="form-page-top">
          <Link className="back-link" to="/wellness-checkins">
            <i className="fa-solid fa-arrow-left" /> Back to wellness check-ins
          </Link>
        </div>

        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">{config.expertLabel} Review</p>
            <h1>{config.label}</h1>
            <p>{config.intro}</p>
          </div>
          <aside className="schedule-card">
            <h2>When to enter details</h2>
            <p>{config.schedule}</p>
          </aside>
        </section>

        <section className="content-grid">
          <section className="panel">
            <h2>Submit your update</h2>
            <p className="panel-copy">
              Fill in the fields below so your wellness expert can review your
              latest {config.key} wellness status.
            </p>

            {statusMessage && <p className="status-message success-status">{statusMessage}</p>}

            {canSubmitCheckins ? <form id="wellnessCheckinForm" onSubmit={handleSubmit} noValidate>
              <div className="form-grid" id="wellnessCheckinFields">
                {config.fields.map((field) => (
                  <label key={field.name} className="form-field">
                    <span>{field.label}</span>
                    {field.inputType === 'select' ? (
                      <select
                        name={field.name}
                        required={field.required}
                        value={formData[field.name] || ''}
                        onChange={(e) => handleChange(field.name, e.target.value)}
                      >
                        <option value="">Select an option</option>
                        {field.options.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={field.inputType || 'text'}
                        name={field.name}
                        placeholder={field.placeholder || ''}
                        min={field.min}
                        max={field.max}
                        step={field.step}
                        required={field.required}
                        value={formData[field.name] || ''}
                        onChange={(e) => handleChange(field.name, e.target.value)}
                      />
                    )}
                    {field.helper && <small className="field-helper">{field.helper}</small>}
                  </label>
                ))}
              </div>

              <label className="form-field form-field-wide">
                <span>Additional notes</span>
                <textarea
                  name="notes"
                  rows="5"
                  placeholder="Add anything else your wellness expert should know."
                  value={formData.notes || ''}
                  onChange={(e) => handleChange('notes', e.target.value)}
                />
                <small className="field-helper">
                  Use this for context that does not fit inside the score-based fields.
                </small>
              </label>

              <div className="form-actions">
                <button className="primary-btn" type="submit">Save Check-in</button>
                <Link className="secondary-btn" to="/wellness-checkins">Back to wellness check-ins</Link>
              </div>
            </form> : <p className="status-message" role="status">Your role does not currently have permission to submit wellness updates.</p>}
          </section>

          <aside className="panel">
            <h2>Recent submissions</h2>
            <p className="panel-copy">Your recent {config.key} wellness updates appear here after each save.</p>
            <div className="history-list" id="employeeTrackHistory">
              {history.length === 0 ? (
                <div className="history-empty">
                  No {config.label.toLowerCase()} updates submitted yet.
                  Save your first check-in to start building a history your{' '}
                  {config.expertLabel.toLowerCase()} can review.
                </div>
              ) : (
                history.slice(0, 5).map((record) => {
                  const urgency  = getCheckinUrgency(record);
                  const responseHistory = getResponseHistory(responses, record.id);
                  return (
                    <article key={record.id} className="history-card">
                      <div className="history-card-head">
                        <time>{formatDateTime(record.submittedAt)}</time>
                        <span className="panel-pill">{urgency.label}</span>
                      </div>
                      <p className="history-summary">
                        {config.fields.slice(0, 3)
                          .map((f) => record[f.name] ? `${f.label}: ${formatFieldValue(f, record[f.name])}` : null)
                          .filter(Boolean)
                          .join(' • ')}
                      </p>
                      <div className="detail-chips">
                        {config.fields.map((f) =>
                          record[f.name] ? (
                            <span key={f.name} className="detail-chip">
                              {f.label}: {formatFieldValue(f, record[f.name])}
                            </span>
                          ) : null,
                        )}
                        {record.notes && (
                          <div style={{ width: '100%', marginTop: '6px' }}>
                            <strong>Notes:</strong> {record.notes}
                          </div>
                        )}
                      </div>
                      {responseHistory.map((response) => (
                        <div className="expert-response-box" key={response.id || `${response.createdAt}-${response.message}`}>
                          <div className="expert-response-head">
                            <strong>{response.expertName}</strong>
                            <span>{formatDateTime(response.createdAt)}</span>
                          </div>
                          <p>{response.message}</p>
                        </div>
                      ))}
                    </article>
                  );
                })
              )}
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}
