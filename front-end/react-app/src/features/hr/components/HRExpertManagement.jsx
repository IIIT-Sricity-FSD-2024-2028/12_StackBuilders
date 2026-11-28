import { useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRoleAccess } from "../../shared/roleAccessContext.jsx";
import HRModal from "./HRModal.jsx";
import {
  clearHrExpertsError,
  createHrExpert,
  loadHrExperts,
  removeHrExpert,
} from "../expertsSlice.js";
import { checkHrCapacity } from "../subscriptionsSlice.js";
import {
  filterHrRecords,
  getHrCompanyContext,
  hasHrCompanyContext,
  importHrDirectoryRecords,
} from "../hrUtils.js";

const badgeClasses = ["violet", "magenta", "purple", "blue", "teal", "green"];

function HRExpertManagement() {
  const { hasPermission } = useRoleAccess();
  const canCreate = hasPermission("user-management-create");
  const canDelete = hasPermission("user-management-delete");
  const dispatch = useDispatch();
  const profile = useSelector((state) => state.auth.session?.profile || null);
  const experts = useSelector((state) => state.hr.experts.items);
  const expertsError = useSelector((state) => state.hr.experts.error);
  const saving = useSelector(
    (state) =>
      state.hr.experts.saving || state.hr.subscriptions.capacityChecking,
  );
  const removing = useSelector((state) => state.hr.experts.removing);
  const company = useMemo(() => getHrCompanyContext(profile), [profile]);
  const [searchTerm, setSearchTerm] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importFeedback, setImportFeedback] = useState(null);
  const [formError, setFormError] = useState("");
  const [actionError, setActionError] = useState("");
  const fileInputRef = useRef(null);

  const filteredExperts = useMemo(
    () =>
      filterHrRecords(experts, searchTerm, [
        "name",
        "specialization",
        "experience",
        "email",
      ]),
    [experts, searchTerm],
  );

  function openAddModal() {
    setFormError("");
    setActionError("");
    dispatch(clearHrExpertsError());
    setModalOpen(true);
  }

  function closeAddModal() {
    setFormError("");
    setModalOpen(false);
  }

  async function addExpert(event) {
    event.preventDefault();
    if (!canCreate) return;
    const formData = new FormData(event.currentTarget);
    setActionError("");
    setFormError("");
    dispatch(clearHrExpertsError());
    try {
      if (!hasHrCompanyContext(company)) {
        throw new Error(
          "Your HR account is not linked to a company. Ask an administrator to assign one before adding wellness experts.",
        );
      }
      const capacity = await dispatch(
        checkHrCapacity({
          kind: "expert",
          company,
          currentCount: experts.length,
        }),
      ).unwrap();
      if (!capacity.allowed) throw new Error(capacity.reason);
      await dispatch(
        createHrExpert({
          name: String(formData.get("name") || "").trim(),
          specialization: formData.get("specialization"),
          experience: String(formData.get("experience") || "").trim(),
          email: String(formData.get("email") || "").trim(),
          password: formData.get("password"),
          status: "Active",
          companyId: company.companyId,
          companyName: company.companyName,
        }),
      ).unwrap();
      setModalOpen(false);
    } catch (saveError) {
      setFormError(saveError.message || "Unable to add the wellness expert.");
    }
  }

  async function deleteExpert(expertId) {
    if (!canDelete) return;
    setActionError("");
    dispatch(clearHrExpertsError());
    try {
      await dispatch(removeHrExpert(expertId)).unwrap();
    } catch (deleteError) {
      setActionError(deleteError.message || "Could not remove wellness expert.");
    }
  }

  async function importExperts(file) {
    if (!canCreate) return;
    setActionError("");
    dispatch(clearHrExpertsError());
    setImporting(true);
    const result = await importHrDirectoryRecords({
      kind: "expert",
      file,
      company,
      currentCount: experts.length,
      checkCapacity: () =>
        dispatch(
          checkHrCapacity({
            kind: "expert",
            company,
            currentCount: experts.length,
          }),
        ).unwrap(),
      createRecord: (payload) => dispatch(createHrExpert(payload)).unwrap(),
      onProgress: setImportFeedback,
    });
    setImportFeedback(result);
    setImporting(false);
  }

  return (
    <>
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
                    if (file) importExperts(file);
                    event.target.value = "";
                  }}
                  ref={fileInputRef}
                  type="file"
                />
                <button
                  className="primary-button"
                  onClick={openAddModal}
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
            <strong>Experience (Years)</strong>,{" "}
            <strong>Gmail Address</strong>, and <strong>Password</strong>.
          </div>
          {importFeedback && (
            <p
              className={`import-feedback ${importFeedback.type === "error" ? "is-error" : "is-success"}`}
            >
              {importFeedback.message}
            </p>
          )}
          {(actionError || expertsError) && (
            <p className="import-feedback is-error" role="alert">
              {actionError || expertsError}{" "}
              {expertsError && (
                <button
                  className="back-btn"
                  onClick={() => dispatch(loadHrExperts(company))}
                  type="button"
                >
                  Retry
                </button>
              )}
            </p>
          )}
          <div className="search-bar">
            <input
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search wellness experts..."
              type="search"
              value={searchTerm}
            />
          </div>

          <div className="expert-grid">
            {filteredExperts.length ? (
              filteredExperts.map((expert) => (
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
                        disabled={removing}
                        onClick={() => deleteExpert(expert.id)}
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

      {canCreate && modalOpen && (
        <HRModal onClose={closeAddModal} title="Add Wellness Expert">
          <form className="expert-form" onSubmit={addExpert}>
            {formError && (
              <p className="import-feedback is-error" role="alert">
                {formError}
              </p>
            )}
            <div className="field-group">
              <label htmlFor="expertName">Full Name</label>
              <input
                id="expertName"
                name="name"
                placeholder="Enter expert name"
                required
              />
            </div>
            <div className="field-group">
              <label htmlFor="expertExperience">Experience (Years)</label>
              <input
                id="expertExperience"
                name="experience"
                placeholder="e.g., 5 years"
                required
              />
            </div>
            <div className="field-group">
              <label htmlFor="expertEmail">Gmail Address</label>
              <input
                id="expertEmail"
                name="email"
                placeholder="Enter Gmail"
                required
                type="email"
              />
            </div>
            <div className="field-group">
              <label htmlFor="expertPassword">Password</label>
              <input
                id="expertPassword"
                minLength="6"
                name="password"
                placeholder="Enter Password"
                required
                type="password"
              />
            </div>
            <div className="field-group">
              <label htmlFor="expertSpecializationPhysical">
                Specialization
              </label>
              <div className="specialization-grid">
                <label className="special-card">
                  <input
                    id="expertSpecializationPhysical"
                    name="specialization"
                    required
                    type="radio"
                    value="Physical Trainer"
                  />
                  <span className="special-card-inner">
                    <i className="fa-solid fa-wave-square" />
                    <strong>Physical Trainer</strong>
                  </span>
                </label>
                <label className="special-card">
                  <input
                    name="specialization"
                    type="radio"
                    value="Nutritionist"
                  />
                  <span className="special-card-inner">
                    <i className="fa-solid fa-stethoscope" />
                    <strong>Nutritionist</strong>
                  </span>
                </label>
                <label className="special-card">
                  <input
                    name="specialization"
                    type="radio"
                    value="Psychologist"
                  />
                  <span className="special-card-inner">
                    <i className="fa-solid fa-brain" />
                    <strong>Psychologist</strong>
                  </span>
                </label>
              </div>
            </div>
            <div className="form-actions">
              <button className="submit-btn" disabled={saving} type="submit">
                {saving ? "Saving…" : "Add Expert"}
              </button>
              <button
                className="back-btn"
                onClick={closeAddModal}
                type="button"
              >
                Back
              </button>
            </div>
          </form>
        </HRModal>
      )}
    </>
  );
}

function getInitials(name = "") {
  return String(name)
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
