import { useRef } from "react";

const badgeClasses = ["violet", "magenta", "purple", "blue", "teal", "green"];

function HRExpertManagement({
  experts,
  onAddExpert,
  onDeleteExpert,
  onImportExperts,
  importFeedback,
  importing,
  onSearch,
  searchTerm,
  canCreate = true,
  canDelete = true,
}) {
  const fileInputRef = useRef(null);

  return (
    <section className="section-block">
      <div className="section-header">
        <div>
          <h3>Wellness Expert Management</h3>
          <p>Manage consultations and expert availability.</p>
        </div>
        <div className="section-actions">
          {canCreate && (
            <>
              <button
                className="import-button"
                disabled={importing}
                onClick={() => fileInputRef.current?.click()}
                type="button"
              >
                {importing ? "Importing…" : "Import Excel"}
              </button>
              <input
                accept=".xlsx,.xls,.csv"
                hidden
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) onImportExperts(file);
                  event.target.value = "";
                }}
                ref={fileInputRef}
                type="file"
              />
              <button
                className="primary-button"
                onClick={onAddExpert}
                type="button"
              >
                Add Expert
              </button>
            </>
          )}
        </div>
      </div>

      <div className="panel wide-panel">
        <div className="import-note">
          Upload the first sheet of an Excel or CSV file with columns like{" "}
          <strong>Full Name</strong>, <strong>Specialization</strong>,{" "}
          <strong>Experience (Years)</strong>, <strong>Gmail Address</strong>,
          and <strong>Password</strong>.
        </div>
        {importFeedback && (
          <p
            className={`import-feedback ${importFeedback.type === "error" ? "is-error" : "is-success"}`}
          >
            {importFeedback.message}
          </p>
        )}
        <div className="search-bar">
          <input
            onChange={(event) => onSearch(event.target.value)}
            placeholder="Search wellness experts..."
            type="search"
            value={searchTerm}
          />
        </div>

        <div className="expert-grid">
          {experts.length ? (
            experts.map((expert) => (
              <article className="expert-card" key={expert.id}>
                <div className="expert-top">
                  <span
                    className={`person-badge ${getExpertBadgeClass(expert.name)}`}
                  >
                    {getInitials(expert.name)}
                  </span>
                  <div>
                    <h4>{expert.name}</h4>
                    <p>{expert.specialization || "Wellness Expert"}</p>
                  </div>
                </div>
                <div className="expert-stats">
                  <span>Experience</span>
                  <strong>{expert.experience}</strong>
                  <span>Email</span>
                  <strong>{expert.email}</strong>
                </div>
                <div className="expert-actions">
                  <a
                    className="secondary-button"
                    href={`mailto:${expert.email}`}
                  >
                    Contact
                  </a>
                  {canDelete && (
                    <button
                      className="danger-button"
                      onClick={() => onDeleteExpert(expert.id)}
                      aria-label={`Delete ${expert.name}`}
                      title={`Delete ${expert.name}`}
                      type="button"
                    >
                      <i
                        className="fa-regular fa-trash-can"
                        aria-hidden="true"
                      />
                    </button>
                  )}
                </div>
              </article>
            ))
          ) : (
            <div className="empty-state">
              No wellness experts match your search right now.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function getInitials(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

function getExpertBadgeClass(value) {
  const seed = [...String(value || "expert")].reduce(
    (total, character) => total + character.charCodeAt(0),
    0,
  );

  return badgeClasses[seed % badgeClasses.length];
}

export default HRExpertManagement;
