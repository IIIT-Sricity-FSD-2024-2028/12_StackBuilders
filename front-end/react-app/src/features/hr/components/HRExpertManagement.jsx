const badgeClasses = ["violet", "magenta", "purple", "blue", "teal", "green"];

function HRExpertManagement({ experts, onAddExpert, onDeleteExpert, onSearch, searchTerm }) {
  return (
    <section className="hr-section-block">
      <div className="hr-section-header">
        <div>
          <h3>Wellness Expert Management</h3>
          <p>Manage consultations and expert availability.</p>
        </div>
        <div className="hr-section-actions">
          <button className="hr-import-button" type="button">
            Import Excel
          </button>
          <button className="hr-primary-button" onClick={onAddExpert} type="button">
            Add Expert
          </button>
        </div>
      </div>

      <div className="hr-panel hr-wide-panel">
        <div className="hr-import-note">
          Upload the first sheet of an Excel or CSV file with columns like{" "}
          <strong>Full Name</strong>, <strong>Specialization</strong>,{" "}
          <strong>Experience (Years)</strong>, <strong>Gmail Address</strong>, and{" "}
          <strong>Password</strong>.
        </div>
        <div className="hr-search-bar">
          <input
            onChange={(event) => onSearch(event.target.value)}
            placeholder="Search wellness experts..."
            type="search"
            value={searchTerm}
          />
        </div>

        <div className="hr-expert-grid">
          {experts.length ? (
            experts.map((expert) => (
              <article className="hr-expert-card" key={expert.id}>
                <div className="hr-expert-top">
                  <span className={`hr-person-badge ${getExpertBadgeClass(expert.name)}`}>
                    {getInitials(expert.name)}
                  </span>
                  <div>
                    <h4>{expert.name}</h4>
                    <p>{expert.specialization || "Wellness Expert"}</p>
                  </div>
                </div>
                <div className="hr-expert-stats">
                  <span>Experience</span>
                  <strong>{expert.experience}</strong>
                  <span>Email</span>
                  <strong>{expert.email}</strong>
                </div>
                <div className="hr-expert-actions">
                  <a className="hr-secondary-button" href={`mailto:${expert.email}`}>
                    Contact
                  </a>
                  <button
                    className="hr-danger-button"
                    onClick={() => onDeleteExpert(expert.id)}
                    type="button"
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))
          ) : (
            <div className="hr-empty-state">No wellness experts match your search right now.</div>
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
    0
  );

  return badgeClasses[seed % badgeClasses.length];
}

export default HRExpertManagement;
