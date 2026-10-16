import { useEffect, useMemo, useState } from "react";

const PAGE_SIZE = 3;
const SLOT_OPTIONS = Array.from({ length: 32 }, (_, index) => {
  const hour = 9 + Math.floor(index / 4);
  const minute = (index % 4) * 15;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
});

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

function dayKey(offset) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + offset);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function slotValue(offset, time) {
  const [year, month, day] = dayKey(offset).split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  return new Date(year, month - 1, day, hour, minute).toISOString();
}

function legacySlotValue(value) {
  const match = /^(today|tomorrow)-(\d{2}:\d{2})$/.exec(value);
  if (!match) return null;
  return slotValue(match[1] === "today" ? 0 : 1, match[2]);
}

function consultationInterval(item) {
  const status = String(item.status || "").toLowerCase();
  if (item.completed || ["completed", "rejected", "cancelled", "canceled"].includes(status)) return null;

  const date = String(item.sessionDate || item.date || "");
  const time = String(item.sessionTime || item.time || "");
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const timeMatch = /^(\d{2}):([0-5]\d)(?::[0-5]\d)?$/.exec(time);
  if (!dateMatch || !timeMatch) return null;

  const [, year, month, day] = dateMatch;
  const [, hour, minute] = timeMatch;
  const start = new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute));
  if (Number.isNaN(start.valueOf())) return null;
  const parsedDuration = Number.parseInt(String(item.sessionDuration || ""), 10);
  const duration = Number.isFinite(parsedDuration) && parsedDuration > 0 ? parsedDuration : 15;
  return { start: start.valueOf(), end: start.valueOf() + duration * 60_000 };
}

function dateFromDayKey(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function slotLabel(value) {
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? value : new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(date);
}

function avatarClass(name = "") {
  return ["avatar-emily", "avatar-sarah", "avatar-aarush", "avatar-michael", "avatar-sudeep"][name.length % 5];
}

function EmptyState({ children, colSpan }) {
  return colSpan
    ? <tr><td colSpan={colSpan}><div className="empty-panel">{children}</div></td></tr>
    : <div className="empty-panel">{children}</div>;
}

function SectionTitle({ icon, title, description, danger = false }) {
  return <div className="section-title">
    <div className={`icon-box${danger ? " red-box" : ""}`}>{icon}</div>
    <div><h2>{title}</h2><p>{description}</p></div>
  </div>;
}

function ExpertConsultations({ data, onUpdate, onUpdateConsultation, onSaveAvailability, canUpdate = true }) {
  const [availability, setAvailability] = useState(data.availability || []);
  const [saved, setSaved] = useState(false);
  const [page, setPage] = useState(1);
  const [notice, setNotice] = useState("");
  const [savingAvailability, setSavingAvailability] = useState(false);
  const [currentTime, setCurrentTime] = useState(() => Date.now());
  const [scheduleTarget, setScheduleTarget] = useState(null);
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [scheduleError, setScheduleError] = useState("");

  useEffect(() => {
    setAvailability(Array.isArray(data.availability) ? data.availability : []);
  }, [data.availability]);

  useEffect(() => {
    const timer = window.setInterval(() => setCurrentTime(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const upcoming = useMemo(() => data.consultations.filter((item) => item.status === "accepted" && !item.completed), [data.consultations]);
  const scheduledIntervals = useMemo(
    () => data.consultations.map(consultationInterval).filter(Boolean),
    [data.consultations],
  );
  const requests = data.consultations.filter((item) => item.status === "pending" || item.status === "requested");
  const accepted = data.consultations.filter((item) => item.status === "accepted" && !item.completed);
  const rejected = data.consultations.filter((item) => item.status === "rejected");
  const history = data.consultations.filter((item) => item.completed);
  const totalPages = Math.max(1, Math.ceil(upcoming.length / PAGE_SIZE));
  const pagedUpcoming = upcoming.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function slotUnavailableReason(slot, checkedAt = currentTime) {
    const start = new Date(slot).valueOf();
    if (!Number.isFinite(start) || start <= checkedAt) return "This time has already passed.";
    const overlapsConsultation = scheduledIntervals.some(
      (interval) => start < interval.end && start + 15 * 60_000 > interval.start,
    );
    return overlapsConsultation ? "A consultation is already scheduled during this time." : "";
  }

  function toggleSlot(offset, time) {
    const slot = slotValue(offset, time);
    const legacy = `${offset === 0 ? "today" : "tomorrow"}-${time}`;
    if (slotUnavailableReason(slot)) return;
    setAvailability((current) => current.includes(slot) || current.includes(legacy)
      ? current.filter((item) => item !== slot && item !== legacy)
      : [...current, slot].sort());
    setSaved(false);
  }

  async function saveAvailability() {
    if (!canUpdate) return;
    setSavingAvailability(true);
    try {
      const normalizedSlots = [...new Set(availability.map((slot) => {
        if (/^\d{4}-\d{2}-\d{2}T/.test(slot)) return slot;
        return legacySlotValue(slot);
      }).filter(Boolean))];
      const checkedAt = Date.now();
      const unavailableCount = normalizedSlots.filter((slot) => slotUnavailableReason(slot, checkedAt)).length;
      const availableSlots = normalizedSlots.filter((slot) => !slotUnavailableReason(slot, checkedAt));
      const updated = onSaveAvailability
        ? await onSaveAvailability(availableSlots)
        : onUpdate({ availability: availableSlots });
      const savedSlots = Array.isArray(updated?.availableSlots)
        ? updated.availableSlots
        : Array.isArray(updated?.availability)
          ? updated.availability
          : availableSlots;
      setAvailability(savedSlots);
      setSaved(true);
      setNotice(unavailableCount
        ? "Past or booked slots were removed; the remaining availability was saved."
        : "Availability saved successfully.");
    } catch (error) {
      setSaved(false);
      setNotice(error.message || "Availability could not be saved.");
    } finally {
      setSavingAvailability(false);
    }
  }

  async function updateStatus(id, status) {
    if (!canUpdate) return;
    try {
      let updated;
      if (onUpdateConsultation) updated = await onUpdateConsultation(id, { status });
      else onUpdate({ consultations: data.consultations.map((item) => item.id === id ? { ...item, status } : item) });
      const request = data.consultations.find((item) => item.id === id);
      if (status === "accepted" && request && !request.sessionDate && onUpdateConsultation) {
        setScheduleError("");
        setScheduleTarget({
          ...request,
          ...(updated || {}),
          employee: updated?.employeeName || request.employee,
          status: "accepted",
        });
        setNotice("");
      } else {
        setNotice(status === "accepted" ? "Consultation request accepted." : "Consultation request rejected.");
      }
    } catch (error) {
      setNotice(error.message || "The consultation could not be updated.");
    }
  }

  async function saveConsultationSchedule(event) {
    event.preventDefault();
    if (!canUpdate || !scheduleTarget || !onUpdateConsultation) return;
    const form = new FormData(event.currentTarget);
    setSavingSchedule(true);
    setScheduleError("");
    try {
      await onUpdateConsultation(scheduleTarget.id, {
        status: "accepted",
        sessionTitle: `Consultation with ${scheduleTarget.employee || "Employee"}`,
        sessionDate: String(form.get("date") || ""),
        sessionTime: String(form.get("time") || ""),
        sessionDuration: String(form.get("duration") || ""),
        sessionMeetingLink: String(form.get("meetingLink") || "").trim(),
        sessionCreatedAt: new Date().toISOString(),
      });
      setScheduleTarget(null);
      setNotice("Consultation session scheduled.");
    } catch (error) {
      setScheduleError(error.message || "The consultation session could not be scheduled.");
    } finally {
      setSavingSchedule(false);
    }
  }

  function slotIsSelected(offset, time) {
    const iso = slotValue(offset, time);
    const legacy = `${offset === 0 ? "today" : "tomorrow"}-${time}`;
    return availability.includes(iso) || availability.includes(legacy);
  }

  return <div>
    <section className="panel">
      <SectionTitle icon="Availability" title="Manage Availability" description="Select your free 15-minute slots for today and tomorrow" />
      <div className="availability-controls">
        <div className="availability-grid" id="availabilityGrid">{[0, 1].map((offset) => <div className="availability-day" key={offset}>
          <h3>{offset === 0 ? "Today" : "Tomorrow"} ({dateFromDayKey(dayKey(offset)).toLocaleDateString()})</h3>
          <div className="slots-container">{SLOT_OPTIONS.map((time) => {
            const slot = slotValue(offset, time);
            const unavailableReason = slotUnavailableReason(slot);
            const selected = slotIsSelected(offset, time) && !unavailableReason;
            return <button
              key={slot}
              type="button"
              className={`slot-btn${selected ? " selected" : ""}`}
              disabled={Boolean(unavailableReason)}
              title={unavailableReason || undefined}
              aria-label={`${time}${unavailableReason ? ` — ${unavailableReason}` : ""}`}
              onClick={() => toggleSlot(offset, time)}
            >{time}</button>;
          })}</div>
        </div>)}</div>
        {canUpdate && <div style={{ marginTop: 20, textAlign: "right" }}><button className="btn btn-primary" type="button" onClick={saveAvailability} disabled={savingAvailability}>{savingAvailability ? "Saving…" : "Save Availability"}</button>{saved && <span id="availabilityStatus" style={{ marginLeft: 10, color: "green" }}>Saved!</span>}</div>}
      </div>
    </section>

    <section className="panel">
      <SectionTitle icon="Upcoming" title="Upcoming Consultations" description="Approved wellness sessions ready to run" />
      <div className="upcoming-grid" id="upcomingConsultationsGrid">{pagedUpcoming.length ? pagedUpcoming.map((item) => <article className="mini-card" key={item.id}>
        <div className="mini-header"><div className="person"><div className={`avatar ${avatarClass(item.employee)}`}>{initials(item.employee)}</div><div><h3>{item.employee}</h3><span>{item.category || item.purpose}</span></div></div><span className="status green">Scheduled</span></div>
        <ul className="meta"><li>{formatDate(item.date)}</li><li>{item.time ? `${slotLabel(item.time)}${item.sessionDuration ? ` (${item.sessionDuration})` : ""}` : "Time to be scheduled"}</li><li>{item.sessionTitle || item.purpose}</li></ul>
        <button className="primary-btn" type="button" onClick={() => { if (item.sessionMeetingLink) window.open(item.sessionMeetingLink, "_blank", "noopener,noreferrer"); else setNotice("Session details are not available yet."); }}>Open Session</button>
      </article>) : <EmptyState>No upcoming consultations scheduled.</EmptyState>}</div>
      {upcoming.length > PAGE_SIZE && <div className="pager"><button className="pager-btn" type="button" disabled={page === 1} onClick={() => setPage((value) => value - 1)}>Previous</button><span className="pager-btn page-total">{page}</span><button className="pager-btn" type="button" disabled={page === totalPages} onClick={() => setPage((value) => value + 1)}>Next</button></div>}
    </section>

    <section className="panel">
      <SectionTitle icon="Requests" title="Consultation Requests" description="Pending consultation requests awaiting approval" />
      <table><thead><tr><th>S.No</th><th>Employee name</th><th>Purpose of request</th><th>Action</th></tr></thead><tbody>{requests.length ? requests.map((item, index) => <tr key={item.id}><td>{index + 1}</td><td><div className="table-person"><div className={`avatar small ${avatarClass(item.employee)}`}>{initials(item.employee)}</div>{item.employee}</div></td><td>{item.purpose}</td><td className="actions"><button className="badge accept" type="button" onClick={() => updateStatus(item.id, "accepted")}>Accept</button><button className="badge reject" type="button" onClick={() => updateStatus(item.id, "rejected")}>Reject</button></td></tr>) : <EmptyState colSpan={4}>No consultation requests pending.</EmptyState>}</tbody></table>
    </section>

    <div className="split"><section className="panel"><SectionTitle icon="Accepted" title="Accepted Consultations" description="Requests that were approved successfully" /><div id="acceptedConsultationsList">{accepted.length ? accepted.map((item) => <article className="list-card" key={item.id}><div className="list-head"><div className="table-person"><div className={`avatar small ${avatarClass(item.employee)}`}>{initials(item.employee)}</div><div><strong>{item.employee}</strong><span>{item.purpose} · {formatDateTime(item.requestedAt)}</span></div></div><span className="status green">Accepted</span></div><button className="primary-btn full" type="button" onClick={() => setScheduleTarget(item)}>{item.sessionDate ? "Edit Session" : "Create Session"}</button></article>) : <EmptyState>No accepted consultations yet.</EmptyState>}</div></section>
      <section className="panel"><SectionTitle icon="Rejected" title="Rejected Consultations" description="Requests that were declined" danger /><div id="rejectedConsultationsList">{rejected.length ? rejected.map((item) => <article className="reject-card" key={item.id}><div className="table-person"><div className={`avatar small ${avatarClass(item.employee)}`}>{initials(item.employee)}</div><div><strong>{item.employee}</strong><span>{item.purpose}</span></div></div><span className="status red">Rejected</span></article>) : <EmptyState>No rejected consultations.</EmptyState>}</div></section></div>

    <section className="panel previous-consultations"><SectionTitle icon="History" title="Previous Client Consultations" description="Your completed wellness session history" /><table><thead><tr><th>Client</th><th>Purpose</th><th>Date</th><th>Rating</th></tr></thead><tbody>{history.length ? history.map((item) => <tr key={item.id}><td>{item.employee}</td><td>{item.purpose}</td><td>{formatDate(item.date)}</td><td>{item.rating ? `${item.rating}/5` : "Not captured"}</td></tr>) : <EmptyState colSpan={4}>No completed consultation history is available yet.</EmptyState>}</tbody></table></section>
    {notice && <p role="status" style={{ color: "#0ba364", fontWeight: 700 }}>{notice}</p>}
    {scheduleTarget && <div className="session-modal-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !savingSchedule) setScheduleTarget(null); }}><section className="session-modal" role="dialog" aria-modal="true" aria-labelledby="consultationScheduleTitle"><div className="session-modal-header"><div><p className="session-modal-eyebrow">CONSULTATION SCHEDULING</p><h2 id="consultationScheduleTitle">Schedule session with {scheduleTarget.employee}</h2><p className="session-modal-copy">Set a date, time, duration, and meeting link for this accepted consultation.</p></div><button className="session-close-btn" type="button" onClick={() => setScheduleTarget(null)} disabled={savingSchedule}>Close</button></div><form className="session-modal-form" onSubmit={saveConsultationSchedule}><div className="session-form-grid"><label className="session-field"><span>Date</span><input type="date" name="date" min={dayKey(0)} defaultValue={scheduleTarget.sessionDate || ""} required /></label><label className="session-field"><span>Time</span><input type="time" name="time" defaultValue={scheduleTarget.sessionTime || ""} required /></label><label className="session-field"><span>Duration</span><select name="duration" defaultValue={scheduleTarget.sessionDuration || "30 min"} required><option>15 min</option><option>30 min</option><option>45 min</option><option>60 min</option></select></label><label className="session-field session-field-wide"><span>Meeting link</span><input type="url" name="meetingLink" defaultValue={scheduleTarget.sessionMeetingLink || ""} placeholder="https://…" required /></label></div>{scheduleError && <p role="alert" className="session-form-error">{scheduleError}</p>}<div className="session-modal-actions"><button className="session-secondary-btn" type="button" onClick={() => setScheduleTarget(null)} disabled={savingSchedule}>Cancel</button><button className="session-primary-btn" type="submit" disabled={savingSchedule}>{savingSchedule ? "Saving…" : "Save Session"}</button></div></form></section></div>}
  </div>;
}

export default ExpertConsultations;
