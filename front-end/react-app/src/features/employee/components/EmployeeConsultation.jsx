import { useState, useEffect, useRef } from 'react';
import { getCurrentEmployee, getCompanyContext } from '../services/employeeAuth';
import {
  formatScheduleDate,
  formatScheduleTime,
  splitRequestedOn,
} from '../services/storageServices';
import employeeApi from '../services/employeeApi';
import useAutoRefresh from '../../../hooks/useAutoRefresh.js';
import { useRoleAccess } from '../../shared/roleAccessContext.jsx';

const TERMINAL_CONSULTATION_STATUSES = new Set(['completed', 'rejected', 'cancelled', 'canceled']);

function slotKeyFromDate(dateValue) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.valueOf())) return '';
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}|${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function consultationSlotKey(consultation) {
  const date = String(consultation.sessionDate || '').trim();
  const match = String(consultation.sessionTime || '').trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!date || !match) return '';
  return `${date}|${match[1].padStart(2, '0')}:${match[2]}`;
}

export default function EmployeeConsultation() {
  const { hasPermission } = useRoleAccess();
  const canCreateConsultations = hasPermission('user-management-create');
  const employee = getCurrentEmployee();
  const companyCtx = getCompanyContext(employee);

  const [consultations, setConsultations] = useState([]);
  const [experts, setExperts] = useState([]);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [formState, setFormState] = useState({ purpose: '', expertId: '', slotTime: '' });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const purposeRef = useRef(null);
  const selectedExpert = experts.find((expert) => expert.id === formState.expertId);
  const bookedSlotKeys = new Set(consultations
    .filter((consultation) => !TERMINAL_CONSULTATION_STATUSES.has(String(consultation.status || '').trim().toLowerCase()))
    .map(consultationSlotKey)
    .filter(Boolean));
  const futureSlots = (selectedExpert?.availableSlots || [])
    .filter((slot) => !Number.isNaN(new Date(slot).valueOf()) && new Date(slot).getTime() > Date.now())
    .sort((left, right) => new Date(left) - new Date(right));
  const bookableSlots = futureSlots.filter((slot) => !bookedSlotKeys.has(slotKeyFromDate(slot)));

  async function loadData() {
    const [consultationList, expertList] = await Promise.all([
      employeeApi.getConsultations(employee, companyCtx),
      employeeApi.getExperts(companyCtx),
    ]);
    setConsultations(consultationList || []);
    setExperts(expertList || []);
  }

  useEffect(() => {
    if (!employee) return;
    loadData().catch((error) => setFormError(error.message || 'Could not load consultations.'));
  }, [employee?.id, companyCtx.companyId, companyCtx.companyName]);
  useAutoRefresh(loadData, `${employee?.id || ''}:${companyCtx.companyId || companyCtx.companyName || ''}`);

  const upcoming = consultations.filter((c) => c.status === 'accepted' || c.status === 'approved');
  const requested = consultations.filter((c) => c.status === 'requested');
  const rejected  = consultations.filter((c) => c.status === 'rejected');
  const previous  = consultations.filter((c) => c.status === 'completed');

  function openModal() {
    if (!canCreateConsultations) return;
    setFormState({ purpose: '', expertId: '', slotTime: '' });
    setFormError('');
    setModalOpen(true);
    setTimeout(() => purposeRef.current?.focus(), 100);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canCreateConsultations) return;
    if (!formState.purpose.trim()) { setFormError('Please describe the purpose.'); return; }
    if (!formState.expertId)       { setFormError('Please select an expert.'); return; }
    if (formState.slotTime && bookedSlotKeys.has(slotKeyFromDate(formState.slotTime))) {
      setFormError('You already have a consultation booked for this time slot. Please choose another time.');
      return;
    }

    const expert = experts.find(
      (ex) => ex.id === formState.expertId || ex.name === formState.expertId,
    );

    const record = {
      employeeId:  employee?.id,
      employeeName: employee?.name,
      expertId:    expert?.id   || formState.expertId,
      expertName:  expert?.name || formState.expertId,
      purpose:     formState.purpose,
    };

    setSubmitting(true);
    try {
      if (formState.slotTime) {
        await employeeApi.bookConsultationSlot({ ...record, slotTime: formState.slotTime });
      } else {
        await employeeApi.createConsultation(record);
      }
      setModalOpen(false);
      await loadData();
    } catch (error) {
      setFormError(error.message || 'Could not submit the consultation request.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="container">
        <div className="consultation-header">
          <h1>Consultation Dashboard</h1>
          {canCreateConsultations && <button className="btn" id="requestConsultationBtn" onClick={openModal}>
            + Request Consultation
          </button>}
        </div>

        <div className="main-layout">
          <div className="left">
            <div className="upcoming-scroll-container section-panel">
              <h3>Upcoming Consultations</h3>
              <div id="upcomingConsultationsList">
                {upcoming.length === 0 ? (
                  <div className="empty-state">No upcoming consultations.</div>
                ) : (
                  upcoming.map((c) => <UpcomingCard key={c.id} c={c} />)
                )}
              </div>
            </div>
          </div>

          <div className="right">
            <div className="rejected-scroll-container section-panel">
              <h3>Rejected</h3>
              <div id="rejectedConsultationsList">
                {rejected.length === 0 ? (
                  <div className="empty-state">No rejected consultations.</div>
                ) : (
                  rejected.map((c) => <RejectedCard key={c.id} c={c} />)
                )}
              </div>
            </div>

            <div className="requested-scroll-container section-panel">
              <h3>Requested</h3>
              <div id="requestedConsultationsList">
                {requested.length === 0 ? (
                  <div className="empty-state">No requested consultations.</div>
                ) : (
                  requested.map((c) => <RequestedCard key={c.id} c={c} />)
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="card section-panel previous-consultations-panel">
          <h3>Previous Consultations</h3>
          <div id="previousConsultationsList">
            {previous.length === 0 ? (
              <div className="empty-state">No previous consultations found.</div>
            ) : (
              previous.map((c) => <PreviousCard key={c.id} c={c} />)
            )}
          </div>
        </div>
      </div>

      {/* Request Consultation Modal */}
      <div
        className="request-modal-overlay"
        id="requestModalOverlay"
        hidden={!modalOpen}
        onClick={(e) => { if (e.target.id === 'requestModalOverlay') setModalOpen(false); }}
      >
        <div className="request-modal" role="dialog" aria-modal="true" aria-labelledby="requestModalTitle">
          <div className="request-modal-header">
            <div>
              <span className="request-modal-tag">NEW REQUEST</span>
              <h2 id="requestModalTitle">Request For Consultation</h2>
              <p>Describe your purpose and we'll match you with the right wellness expert.</p>
            </div>
            <button
              className="request-close-btn"
              id="requestModalCloseBtn"
              type="button"
              onClick={() => setModalOpen(false)}
            >
              Close
            </button>
          </div>

          <form id="consultationModalForm" className="request-modal-form" onSubmit={handleSubmit}>
            {formError && (
              <p style={{ color: '#ef4444', marginBottom: '10px' }}>{formError}</p>
            )}

            <label htmlFor="modalPurpose">Purpose</label>
            <textarea
              id="modalPurpose"
              name="purpose"
              placeholder="Describe the purpose of your request."
              required
              ref={purposeRef}
              value={formState.purpose}
              onChange={(e) => setFormState((s) => ({ ...s, purpose: e.target.value }))}
            />

            <label htmlFor="modalExpertName">Wellness Expert</label>
            <select
              id="modalExpertName"
              name="expertId"
              required
              value={formState.expertId}
              onChange={(e) => setFormState((s) => ({ ...s, expertId: e.target.value, slotTime: '' }))}
            >
              <option value="">Select a wellness expert</option>
              {experts.length === 0 ? (
                <option disabled>No experts available yet</option>
              ) : (
                experts.map((ex) => (
                  <option key={ex.id || ex.name} value={ex.id || ex.name}>
                    {ex.name}{ex.category ? ` — ${ex.category}` : ''}
                    {ex.specialization ? ` (${ex.specialization})` : ''}
                  </option>
                ))
              )}
            </select>

            {selectedExpert && <>
              <label htmlFor="modalConsultationSlot">Available time slot (optional)</label>
              <select id="modalConsultationSlot" value={formState.slotTime} onChange={(event) => setFormState((current) => ({ ...current, slotTime: event.target.value }))}>
                <option value="">Submit a request without booking a time</option>
                {bookableSlots.map((slot) => <option key={slot} value={slot}>{new Date(slot).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</option>)}
              </select>
              {!futureSlots.length && <small>No future slots are available; you can still submit a regular request.</small>}
              {futureSlots.length > 0 && !bookableSlots.length && <small>You already have consultations during all of this expert’s available slots.</small>}
            </>}

            <div className="request-modal-actions">
              <button
                className="request-secondary-btn"
                type="button"
                onClick={() => setModalOpen(false)}
              >
                Back
              </button>
              <button className="request-primary-btn" type="submit" disabled={submitting}>
                {submitting ? 'Submitting…' : formState.slotTime ? 'Book Slot' : 'Submit Request'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

/* ── Card sub-components ───────────────────────────────────────────────────── */

function DoctorNameWithMeta({ name, subtitle, iconVariant }) {
  return (
    <div className={`doctor-name${subtitle ? ' doctor-name-large' : ''}`}>
      <span className={`doctor-icon${iconVariant ? ` ${iconVariant}` : ''}`} aria-hidden="true">
        <i className="fa-regular fa-user" />
      </span>
      <div className="doctor-meta">
        <h4>{name}</h4>
        {subtitle && <p>{subtitle}</p>}
      </div>
    </div>
  );
}

function UpcomingCard({ c }) {
  const date    = formatScheduleDate(c.sessionDate);
  const time    = formatScheduleTime(c.sessionTime);
  const details = (date || time)
    ? `${date}${time ? ` @ ${time}` : ''}${c.sessionDuration ? ` (${c.sessionDuration})` : ''}`
    : 'Session details will be shared by your expert soon.';

  return (
    <div className="card">
      <div className="card-header">
        <DoctorNameWithMeta name={c.expertName} />
        <span className="badge green">{c.category}</span>
      </div>
      <p>{details}</p>
      <button
        className="join"
        type="button"
        disabled={!c.sessionMeetingLink}
        onClick={() => c.sessionMeetingLink && window.open(c.sessionMeetingLink, '_blank')}
      >
        {c.sessionMeetingLink ? 'Join Session' : 'Awaiting Link'}
      </button>
    </div>
  );
}

function RequestedCard({ c }) {
  const timing = splitRequestedOn(c.requestedOn);
  return (
    <div className="card status-card requested-card">
      <div className="requested-card-top">
        <DoctorNameWithMeta
          name={c.expertName}
          subtitle={c.category || 'Requested Consultation'}
          iconVariant="requested-icon"
        />
      </div>
      <p className="status-date"><i className="fa-regular fa-calendar" /> {timing.date}</p>
      <p className="status-time"><i className="fa-regular fa-clock" /> {timing.time || 'Time to be scheduled'}</p>
      <div className="status-message requested-message">Pending Approval</div>
    </div>
  );
}

function RejectedCard({ c }) {
  const timing = splitRequestedOn(c.requestedOn);
  return (
    <div className="card status-card rejected-card">
      <div className="rejected-card-top">
        <DoctorNameWithMeta
          name={c.expertName}
          subtitle={c.category || 'Rejected Consultation'}
          iconVariant="rejected-icon"
        />
      </div>
      <p className="status-date"><i className="fa-regular fa-calendar" /> {timing.date}</p>
      <div className="status-message rejected-message">
        {c.rejectionReason || 'Request could not be accommodated at this time.'}
      </div>
    </div>
  );
}

function PreviousCard({ c }) {
  const date = formatScheduleDate(c.sessionDate) || c.sessionDate;
  return (
    <div className="card consultation-card">
      <div className="card-header">
        <DoctorNameWithMeta name={c.expertName} />
        <span className="badge">{c.category}</span>
      </div>
      {date && (
        <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
          <i className="fa-regular fa-calendar" /> {date}
        </p>
      )}
      <p>{c.purpose}</p>
    </div>
  );
}
