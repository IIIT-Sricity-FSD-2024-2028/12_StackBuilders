import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { clearQueryError, submitUserQuery } from "../features/shared/querySlice.js";

export default function QueryModal({ open, onClose, user, userType }) {
  const dispatch = useDispatch();
  const submitting = useSelector((state) => state.queries.submitting);
  const requestError = useSelector((state) => state.queries.error);
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape" && !submitting) onClose();
    };
    document.body.classList.add("query-modal-open");
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.classList.remove("query-modal-open");
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose, submitting]);

  if (!open) return null;

  async function submitQuery(event) {
    event.preventDefault();
    const text = description.trim();
    if (!text) {
      setError("Please enter a description.");
      return;
    }

    setError("");
    setStatus("");
    dispatch(clearQueryError());
    try {
      await dispatch(submitUserQuery({
        userId: user?.id || user?.email,
        userEmail: user?.email || user?.username,
        userName: user?.name || user?.email || user?.username || "User",
        userType: userType || user?.role || "User",
        companyId: user?.companyId || "",
        companyName: user?.companyName || user?.company || "N/A",
        description: text,
        status: "Open",
        reply: "",
        readBySender: false,
      })).unwrap();
      setDescription("");
      setStatus("Query submitted successfully. We will get back to you soon.");
    } catch { /* The shared query feature stores the request error. */ }
  }

  return (
    <div
      className="query-modal-overlay"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !submitting) onClose();
      }}
    >
      <section className="query-modal" role="dialog" aria-modal="true" aria-labelledby="query-modal-title">
        <div className="query-modal-header">
          <div>
            <span className="query-modal-tag">Support</span>
            <h2 id="query-modal-title">Contact us / Submit query</h2>
            <p>Describe your query and our supervisor will get back to you.</p>
          </div>
          <button className="query-modal-close" type="button" onClick={onClose} disabled={submitting} aria-label="Close">
            ×
          </button>
        </div>

        <form onSubmit={submitQuery}>
          <label htmlFor="query-description">How can we help?</label>
          <textarea
            id="query-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Describe your query..."
            rows={5}
            autoFocus
            disabled={submitting}
          />
          {(error || requestError) && <p className="query-modal-message is-error" role="alert">{error || requestError}</p>}
          {status && <p className="query-modal-message is-success" role="status">{status}</p>}
          <div className="query-modal-actions">
            <button className="query-modal-secondary" type="button" onClick={onClose} disabled={submitting}>Cancel</button>
            <button className="query-modal-primary" type="submit" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit query"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
