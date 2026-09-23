function AdminModal({ title, children, onClose }) {
  return (
    <div className="admin-modal-backdrop" role="presentation" onClick={onClose}>
      <section className="admin-modal" role="dialog" aria-modal="true" aria-label={title} onClick={(event) => event.stopPropagation()}>
        <header><h2>{title}</h2><button type="button" onClick={onClose} aria-label="Close">×</button></header>
        {children}
      </section>
    </div>
  );
}

export default AdminModal;
