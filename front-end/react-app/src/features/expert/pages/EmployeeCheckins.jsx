import { useEffect, useMemo, useState } from "react";
import StatCard from "../../../components/StatCard.jsx";
import ExpertIcon from "../components/ExpertIcon.jsx";
import { CheckinCard, CheckinDetailModal } from "../components/ExpertFeatureComponents.jsx";

const pageSize = 6;

function EmployeeCheckins({ data, selectedCheckinId, onSelectCheckin, onSendResponse, onRequestFollowUp, onNavigate }) {
  const [page, setPage] = useState(1);
  const highPriority = data.checkins.filter((checkin) => checkin.priority === "high");
  const employeeCount = useMemo(() => new Set(data.checkins.map((checkin) => checkin.employee)).size, [data.checkins]);
  const pageCount = Math.max(Math.ceil(data.checkins.length / pageSize), 1);
  const visibleCheckins = data.checkins.slice((page - 1) * pageSize, page * pageSize);
  const selectedCheckin = data.checkins.find((checkin) => checkin.id === selectedCheckinId) || null;
  useEffect(() => setPage((current) => Math.min(current, pageCount)), [pageCount]);

  return <><section className="expert-page-heading expert-checkins-heading"><div><p className="expert-eyebrow">Employee wellbeing</p><h1>Employee Check-ins</h1><p>Review multiple wellness check-ins over time and respond when practical support is needed.</p></div><button className="expert-secondary-button" type="button" onClick={() => onNavigate("consultations")}>Open consultations <ExpertIcon name="chevron" size={15} /></button></section><section className="expert-checkin-schedule"><ExpertIcon name="clock" /><p>{data.expert.schedule}</p></section><section className="expert-stats-grid three" aria-label="Employee check-in statistics"><StatCard label="Total check-ins" value={String(data.checkins.length)} tone="teal" /><StatCard label="High priority" value={String(highPriority.length)} tone="coral" /><StatCard label="Employees tracked" value={String(employeeCount)} tone="violet" /></section><section className="expert-panel"><div className="expert-panel-head"><div><p className="expert-eyebrow">Priority queue</p><h2>High Priority Check-ins</h2><p>Employees who may need immediate follow-up based on their latest submitted details.</p></div><span className="expert-panel-pill">Priority queue</span></div><div className="expert-checkin-grid">{highPriority.length ? highPriority.map((checkin) => <CheckinCard checkin={checkin} key={checkin.id} onOpen={onSelectCheckin} />) : <p className="expert-empty">No high-priority check-ins right now.</p>}</div></section><section className="expert-panel"><div className="expert-panel-head"><div><p className="expert-eyebrow">Full activity</p><h2>All Employee Check-ins</h2><p>Every employee check-in for your specialization, including multiple entries over time.</p></div><span className="expert-panel-pill">Page {page} of {pageCount}</span></div><div className="expert-checkin-grid">{visibleCheckins.map((checkin) => <CheckinCard checkin={checkin} key={checkin.id} onOpen={onSelectCheckin} />)}</div>{pageCount > 1 && <div className="expert-pagination"><button type="button" disabled={page === 1} onClick={() => setPage((current) => current - 1)}>Previous</button><span>{page}</span><button type="button" disabled={page === pageCount} onClick={() => setPage((current) => current + 1)}>Next</button></div>}</section><CheckinDetailModal checkin={selectedCheckin} onClose={() => onSelectCheckin(null)} onSendResponse={onSendResponse} onRequestFollowUp={onRequestFollowUp} onNavigate={onNavigate} /></>;
}

export default EmployeeCheckins;
