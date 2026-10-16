import { useMemo, useState } from "react";
import ExpertIcon from "../components/ExpertIcon.jsx";

const PAGE_SIZE = 3;
const SLOT_OPTIONS = ["09:00", "09:15", "10:00", "10:15", "11:00", "11:15", "14:00", "14:15"];

function initials(name = "") {
  return name.split(" ").filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

function formatDate(value) {
  if (!value) return "Date to be scheduled";
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

function formatDateTime(value) {
  if (!value) return "Requested recently";
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(new Date(value));
}

function EmptyState({ children, colSpan }) {
  return colSpan ? <tr><td colSpan={colSpan}><div className="expert-consultation-empty">{children}</div></td></tr> : <div className="expert-consultation-empty">{children}</div>;
}

function SectionTitle({ icon, title, description, danger = false }) {
  return <div className="expert-consultation-section-title">
    <span className={`expert-consultation-icon-box${danger ? " danger" : ""}`}>{icon}</span>
    <div><h2>{title}</h2><p>{description}</p></div>
  </div>;
}

function ExpertConsultations({ data, onUpdate }) {
  const [availability, setAvailability] = useState(data.availability || []);
  const [saved, setSaved] = useState(false);
  const [page, setPage] = useState(1);
  const [notice, setNotice] = useState("");

  const upcoming = useMemo(() => data.consultations.filter((item) => item.status === "accepted" && !item.completed), [data.consultations]);
  const requests = data.consultations.filter((item) => item.status === "pending" || item.status === "requested");
  const accepted = data.consultations.filter((item) => item.status === "accepted" && !item.completed);
  const rejected = data.consultations.filter((item) => item.status === "rejected");
  const history = data.consultations.filter((item) => item.completed);
  const totalPages = Math.max(1, Math.ceil(upcoming.length / PAGE_SIZE));
  const pagedUpcoming = upcoming.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function toggleSlot(slot) {
    setAvailability((current) => current.includes(slot) ? current.filter((item) => item !== slot) : [...current, slot]);
    setSaved(false);
  }

  function saveAvailability() {
    onUpdate({ availability });
    setSaved(true);
  }

  function updateStatus(id, status) {
    onUpdate({ consultations: data.consultations.map((item) => item.id === id ? { ...item, status } : item) });
    setNotice(status === "accepted" ? "Consultation request accepted." : "Consultation request rejected.");
  }

  return <div className="expert-consultation-page">
    <section className="expert-consultation-panel">
      <SectionTitle icon={<ExpertIcon name="calendar" size={16} />} title="Manage Availability" description="Select your free 15-minute slots for today and tomorrow" />
      <div className="expert-availability-days">
        {[['today', "Today"], ['tomorrow', "Tomorrow"]].map(([day, label]) => <div className="expert-availability-day" key={day}>
          <div><strong>{label}</strong><small>{availability.filter((slot) => slot.startsWith(`${day}-`)).length} slots selected</small></div>
          <div className="expert-slot-grid">{SLOT_OPTIONS.map((time) => { const slot = `${day}-${time}`; return <button key={slot} type="button" className={availability.includes(slot) ? "selected" : ""} onClick={() => toggleSlot(slot)}>{time}</button>; })}</div>
        </div>)}
      </div>
      <div className="expert-consultation-actions"><button className="expert-primary-button" type="button" onClick={saveAvailability}>Save Availability</button>{saved && <span className="expert-consultation-success">Saved!</span>}</div>
    </section>

    <section className="expert-consultation-panel">
      <SectionTitle icon={<ExpertIcon name="clock" size={16} />} title="Upcoming Consultations" description="Approved wellness sessions ready to run" />
      <div className="expert-upcoming-grid">{pagedUpcoming.length ? pagedUpcoming.map((item) => <article className="expert-consultation-card" key={item.id}>
        <div className="expert-consultation-card-head"><div className="expert-consultation-person"><span className="expert-avatar">{initials(item.employee)}</span><div><h3>{item.employee}</h3><span>{item.purpose}</span></div></div><span className="expert-consultation-status accepted">Scheduled</span></div>
        <ul><li>{formatDate(item.date)}</li><li>{item.time || "Time to be scheduled"}</li><li>{item.purpose}</li></ul>
        <button className="expert-primary-button" type="button" onClick={() => setNotice("Session details will be available when the consultation is scheduled.")}>Open Session</button>
      </article>) : <EmptyState>No upcoming consultations scheduled.</EmptyState>}</div>
      {upcoming.length > PAGE_SIZE && <div className="expert-consultation-pager"><button type="button" disabled={page === 1} onClick={() => setPage((value) => value - 1)}>Previous</button><span>{page}</span><button type="button" disabled={page === totalPages} onClick={() => setPage((value) => value + 1)}>Next</button></div>}
    </section>

    <section className="expert-consultation-panel">
      <SectionTitle icon={<ExpertIcon name="users" size={16} />} title="Consultation Requests" description="Pending consultation requests awaiting approval" />
      <div className="expert-consultation-table-wrap"><table className="expert-consultation-table"><thead><tr><th>S.No</th><th>Employee name</th><th>Purpose of request</th><th>Action</th></tr></thead><tbody>{requests.length ? requests.map((item, index) => <tr key={item.id}><td>{index + 1}</td><td><span className="expert-table-person"><span className="expert-avatar">{initials(item.employee)}</span>{item.employee}</span></td><td>{item.purpose}</td><td><div className="expert-request-actions"><button type="button" className="expert-request-accept" onClick={() => updateStatus(item.id, "accepted")}>Accept</button><button type="button" className="expert-request-reject" onClick={() => updateStatus(item.id, "rejected")}>Reject</button></div></td></tr>) : <EmptyState colSpan={4}>No consultation requests pending.</EmptyState>}</tbody></table></div>
    </section>

    <div className="expert-consultation-split"><section className="expert-consultation-panel"><SectionTitle icon={<ExpertIcon name="checkins" size={16} />} title="Accepted Consultations" description="Requests that were approved successfully" />{accepted.length ? accepted.map((item) => <article className="expert-consultation-list-card" key={item.id}><div><strong>{item.employee}</strong><span>{item.purpose} · {formatDateTime(item.requestedAt)}</span></div><span className="expert-consultation-status accepted">Accepted</span></article>) : <EmptyState>No accepted consultations yet.</EmptyState>}</section><section className="expert-consultation-panel"><SectionTitle icon={<ExpertIcon name="close" size={16} />} title="Rejected Consultations" description="Requests that were declined" danger />{rejected.length ? rejected.map((item) => <article className="expert-consultation-list-card" key={item.id}><div><strong>{item.employee}</strong><span>{item.purpose}</span></div><span className="expert-consultation-status rejected">Rejected</span></article>) : <EmptyState>No rejected consultations.</EmptyState>}</section></div>

    <section className="expert-consultation-panel"><SectionTitle icon={<ExpertIcon name="activity" size={16} />} title="Previous Client Consultations" description="Your completed wellness session history" /><div className="expert-consultation-table-wrap"><table className="expert-consultation-table"><thead><tr><th>Client</th><th>Purpose</th><th>Date</th><th>Rating</th></tr></thead><tbody>{history.length ? history.map((item) => <tr key={item.id}><td>{item.employee}</td><td>{item.purpose}</td><td>{formatDate(item.date)}</td><td>{item.rating ? `${item.rating}/5` : "Not captured"}</td></tr>) : <EmptyState colSpan={4}>No completed consultation history is available yet.</EmptyState>}</tbody></table></div></section>
    {notice && <p className="expert-consultation-notice" role="status">{notice}</p>}
  </div>;
}

export default ExpertConsultations;
