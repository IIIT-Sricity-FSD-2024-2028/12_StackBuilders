import SupervisorIcon from "./SupervisorIcon.jsx";

function SupervisorModal({ title, description, onClose, children }) {
  return (
    <div className="supervisor-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="supervisor-modal" role="dialog" aria-modal="true" aria-labelledby="supervisor-modal-title">
        <div className="supervisor-modal-header">
          <div>
            <p className="supervisor-eyebrow">Supervisor workspace</p>
            <h2 id="supervisor-modal-title">{title}</h2>
            {description && <p>{description}</p>}
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close dialog">
            <SupervisorIcon name="close" size={18} />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}

export default SupervisorModal;
