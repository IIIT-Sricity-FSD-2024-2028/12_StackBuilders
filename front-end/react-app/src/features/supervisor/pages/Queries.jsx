import { useState } from "react";
import SupervisorIcon from "../components/SupervisorIcon.jsx";
import SupervisorModal from "../components/SupervisorModal.jsx";
import SupervisorTable from "../components/SupervisorTable.jsx";

function Queries({ queries, onReply }) {
  const [activeQuery, setActiveQuery] = useState(null);
  const [reply, setReply] = useState("");
  const submitReply = (event) => { event.preventDefault(); if (!reply.trim()) return; onReply(activeQuery.id, reply.trim()); setActiveQuery(null); setReply(""); };
  const columns = [{ key: "user", label: "User", render: (row) => <div className="table-user"><span>{row.user.slice(0, 1)}</span><div><strong>{row.user}</strong><small>{row.email}</small></div></div> }, { key: "description", label: "Query", render: (row) => <span className="query-copy">{row.description}</span> }, { key: "createdAt", label: "Received" }, { key: "status", label: "Status", render: (row) => <span className={`status-pill status-${row.status.toLowerCase()}`}>{row.status}</span> }, { key: "id", label: "Action", render: (row) => <button className="table-action" type="button" onClick={() => { setActiveQuery(row); setReply(row.reply || ""); }} disabled={row.status === "Replied"}>{row.status === "Replied" ? "Replied" : <><SupervisorIcon name="mail" size={15} /> Reply</>}</button> }];
  return <>
    <div className="supervisor-page-heading"><div><p className="supervisor-eyebrow">User Directory</p><h1>User Queries</h1><p className="supervisor-subtitle">Respond to questions from employees, HR, and wellness experts.</p></div><span className="supervisor-live-badge"><i /> {queries.filter((query) => query.status === "Open").length} open queries</span></div>
    <section className="supervisor-panel supervisor-table-panel"><div className="supervisor-panel-heading"><div><p className="supervisor-eyebrow">Inbox</p><h2>Incoming queries</h2></div><span className="supervisor-muted-label">Updated just now</span></div><SupervisorTable columns={columns} rows={queries} emptyMessage="No queries have been submitted." /></section>
    {activeQuery && <SupervisorModal title="Reply to Query" description={`Responding to ${activeQuery.user} · ${activeQuery.email}`} onClose={() => setActiveQuery(null)}><form className="supervisor-form" onSubmit={submitReply}><label>Reply<textarea required rows="5" value={reply} onChange={(event) => setReply(event.target.value)} placeholder="Type your reply..." /></label><div className="form-actions"><button className="supervisor-outline-button" type="button" onClick={() => setActiveQuery(null)}>Cancel</button><button className="supervisor-primary-button" type="submit">Send Reply</button></div></form></SupervisorModal>}
  </>;
}

export default Queries;
