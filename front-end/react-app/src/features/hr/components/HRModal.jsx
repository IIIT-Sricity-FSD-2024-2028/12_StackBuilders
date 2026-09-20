function HRModal({ children, onClose, title }) {
  return (
    <div className="hr-modal-overlay" onMouseDown={onClose}>
      <div
        aria-labelledby="hrModalTitle"
        aria-modal="true"
        className="hr-modal-card"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <button
          aria-label="Close form"
          className="hr-modal-close"
          onClick={onClose}
          type="button"
        >
          x
        </button>
        <section className="hr-modal-shell">
          <div className="hr-modal-brand">StackBuilders</div>
          <header className="hr-page-copy">
            <h1 id="hrModalTitle">{title}</h1>
            <p>A centralized platform to plan, manage, and track employee wellness.</p>
          </header>
          <section className="hr-form-card">{children}</section>
        </section>
      </div>
    </div>
  );
}

export default HRModal;
