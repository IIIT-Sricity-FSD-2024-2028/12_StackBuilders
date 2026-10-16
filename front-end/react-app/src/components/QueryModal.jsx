import { useEffect, useState } from "react";
import queryApi from "../features/shared/queryApi.js";

export default function QueryModal({ open, onClose, user, userType }) {
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

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

    setSubmitting(true);
    setError("");
    setStatus("");
    try {
      await queryApi.create({
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
      });
      setDescription("");
      setStatus("Query submitted successfully. We will get back to you soon.");
    } catch (submitError) {
      setError(submitError.message || "The query could not be submitted. Please try again.");
    } finally {
      setSubmitting(false);
    }
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
          {error && <p className="query-modal-message is-error" role="alert">{error}</p>}
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
