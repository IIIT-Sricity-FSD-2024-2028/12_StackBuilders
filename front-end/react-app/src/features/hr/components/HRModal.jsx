function HRModal({ children, onClose, title }) {
  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div
        aria-labelledby="hrModalTitle"
        aria-modal="true"
        className={`modal-card ${title.includes("Expert") ? "modal-card-expert" : "modal-card-employee"}`}
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <button
          aria-label="Close form"
          className="modal-close"
          onClick={onClose}
          type="button"
        >
          <i className="fa-solid fa-xmark" />
        </button>
        <section className="modal-shell">
          <div className="brand">StackBuilders</div>
          <header className="page-copy">
            <h1 id="hrModalTitle">{title}</h1>
            <p>
              A centralized platform to plan, manage, and track employee
              wellness.
            </p>
          </header>
          <section className="form-card">{children}</section>
        </section>
      </div>
    </div>
  );
}

export default HRModal;
