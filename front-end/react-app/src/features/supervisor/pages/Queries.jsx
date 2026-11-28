import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import SupervisorIcon from "../components/SupervisorIcon.jsx";
import SupervisorModal from "../components/SupervisorModal.jsx";
import useAutoRefresh from "../../../hooks/useAutoRefresh.js";
import { loadSupervisorQueries, replyToSupervisorQuery } from "../queriesSlice.js";

function Queries() {
  const dispatch = useDispatch();
  const { items: queries, loading, saving: sending, error: sliceError } = useSelector((state) => state.supervisor.queries);
  const [activeQuery, setActiveQuery] = useState(null);
  const [reply, setReply] = useState("");
  const [error, setError] = useState("");

  const loadQueries = useCallback(() => dispatch(loadSupervisorQueries()), [dispatch]);

  useEffect(() => { void loadQueries(); }, [loadQueries]);
  useAutoRefresh(loadQueries, "supervisor-queries");

  function openReply(query) { setActiveQuery(query); setReply(query.reply || ""); setError(""); }
  async function submit(event) {
    event.preventDefault();
    if (!activeQuery || sending) return;
    const trimmedReply = reply.trim();
    if (!trimmedReply) { setError("Please enter a reply before sending."); return; }
    setError("");
    try {
      await dispatch(replyToSupervisorQuery({ id: activeQuery.id, reply: trimmedReply })).unwrap();
      setActiveQuery(null);
      setReply("");
    } catch (requestError) {
      setError(requestError.message || "The reply could not be sent.");
    }
  }

  return <>
    <div className="supervisor-page-heading"><div><p className="supervisor-eyebrow">Support</p><h1>User queries</h1><p className="supervisor-subtitle">Review questions from employees, HR teams, and wellness experts.</p></div></div>
    {sliceError && <p className="supervisor-empty-state" role="alert">{sliceError}</p>}
    <section className="supervisor-panel supervisor-table-panel"><div className="supervisor-panel-heading"><div><p className="supervisor-eyebrow">Inbox</p><h2>Workspace questions</h2></div><span className="supervisor-muted-label">{queries.length} queries</span></div><div className="supervisor-table-wrap"><table className="supervisor-table"><thead><tr><th>User</th><th>Role</th><th>Company</th><th>Question</th><th>Status</th><th>Action</th></tr></thead><tbody>{queries.length ? queries.map((query) => { const replied = String(query.status).toLowerCase() === "replied"; return <tr key={query.id}><td><div className="table-user"><span>{String(query.user || "U").slice(0, 1).toUpperCase()}</span><div><strong>{query.user || "Unknown user"}</strong><small>{query.email || "—"}</small></div></div></td><td><span className="role-pill">{query.userType || query.role || "User"}</span></td><td>{query.companyName || query.company || "—"}</td><td><span className="query-copy">{query.description || "No description"}</span></td><td><span className={`status-pill ${replied ? "status-replied" : "status-open"}`}>{query.status || "Open"}</span></td><td><button className="table-action" type="button" disabled={replied} onClick={() => openReply(query)}><SupervisorIcon name="mail" size={14} /> {replied ? "Replied" : "Reply"}</button></td></tr>; }) : <tr><td className="table-empty" colSpan="6">{loading ? "Loading queries…" : "No queries have been submitted yet."}</td></tr>}</tbody></table></div></section>
    {activeQuery && <SupervisorModal title="Reply to query" description={activeQuery.description} onClose={() => !sending && setActiveQuery(null)}><form className="supervisor-form" onSubmit={submit}>{error && <p className="supervisor-form-error" id="supervisor-reply-error" role="alert">{error}</p>}<label>Reply<textarea rows="6" value={reply} onChange={(event) => { setReply(event.target.value); setError(""); }} placeholder="Write a helpful response" aria-describedby={error ? "supervisor-reply-error" : undefined} /></label><div className="form-actions"><button className="supervisor-outline-button" type="button" disabled={sending} onClick={() => setActiveQuery(null)}>Cancel</button><button className="supervisor-primary-button" type="submit" disabled={sending}>{sending ? "Sending…" : "Send reply"}</button></div></form></SupervisorModal>}
  </>;
}

export default Queries;
