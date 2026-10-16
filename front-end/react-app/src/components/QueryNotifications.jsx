import { useCallback, useEffect, useState } from "react";
import queryApi from "../features/shared/queryApi.js";
import "./QueryNotifications.css";

function formatDate(value) {
  if (!value) return "";
  const date = typeof value === "number" ? new Date(value) : new Date(value);
  if (Number.isNaN(date.valueOf())) return "";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export default function QueryNotifications({ user, userType }) {
  const [open, setOpen] = useState(false);
  const [queries, setQueries] = useState([]);
  const [error, setError] = useState("");
  const [markingId, setMarkingId] = useState(null);

  const refresh = useCallback(async () => {
    if (!user?.id && !user?.employeeId && !user?.expertId && !user?.hrId && !user?.email && !user?.username) {
      setQueries([]);
      return;
    }
    try {
      const records = await queryApi.getForUser(user, userType);
      setQueries(records.filter((query) => String(query.status || "").toLowerCase() === "replied" && String(query.reply || "").trim())
        .sort((left, right) => getTime(right.repliedAt || right.createdAt) - getTime(left.repliedAt || left.createdAt)));
      setError("");
    } catch (loadError) {
      setError(loadError.message || "Could not load notifications.");
    }
  }, [user?.id, user?.employeeId, user?.expertId, user?.hrId, user?.email, user?.username, userType]);

  useEffect(() => {
    refresh();
    const intervalId = window.setInterval(refresh, 20000);
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    window.addEventListener("focus", refreshWhenVisible);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", refreshWhenVisible);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [refresh]);

  const unreadCount = queries.filter((query) => query.readBySender !== true).length;

  async function markAsRead(query) {
    if (query.readBySender === true || markingId) return;
    setMarkingId(query.id);
    setError("");
    try {
      await queryApi.markRead(query.id, userType);
      setQueries((current) => current.map((item) => item.id === query.id ? { ...item, readBySender: true } : item));
    } catch (markError) {
      setError(markError.message || "Could not mark this reply as read.");
    } finally {
      setMarkingId(null);
    }
  }

  return (
    <div className="query-notifications">
      <button
        className="query-notifications-trigger"
        type="button"
        aria-label={unreadCount ? `Notifications, ${unreadCount} unread replies` : "Notifications"}
        aria-expanded={open}
        aria-controls="query-notifications-panel"
        onClick={() => { setOpen((current) => !current); refresh(); }}
      >
        <i className="fa-regular fa-bell" aria-hidden="true" />
        {unreadCount > 0 && <span className="query-notifications-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>}
      </button>
      {open && <section className="query-notifications-panel" id="query-notifications-panel" aria-label="Notifications">
        <header className="query-notifications-heading"><strong>Notifications</strong><span>{unreadCount ? `${unreadCount} unread` : "Replies from support"}</span></header>
        {error && <p className="query-notifications-error" role="alert">{error}</p>}
        {queries.length === 0 ? <p className="query-notifications-empty">No supervisor replies yet.</p> : <div className="query-notifications-list">
          {queries.map((query) => <article className={`query-notification${query.readBySender === true ? " is-read" : " is-unread"}`} key={query.id}>
            <div className="query-notification-title"><strong>Supervisor replied</strong><time>{formatDate(query.repliedAt || query.createdAt)}</time></div>
            <p className="query-notification-question">Your query: {query.description || "Support request"}</p>
            <p className="query-notification-reply">{query.reply}</p>
            {query.readBySender !== true && <button className="query-notification-mark-read" type="button" disabled={markingId !== null} onClick={() => markAsRead(query)}>{markingId === query.id ? "Marking…" : "Mark as read"}</button>}
          </article>)}
        </div>}
      </section>}
    </div>
  );
}

function getTime(value) {
  const time = typeof value === "number" ? value : new Date(value || 0).valueOf();
  return Number.isNaN(time) ? 0 : time;
}
