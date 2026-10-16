import { useCallback, useEffect, useState } from "react";
import RouteLoadingScreen from "../../../components/RouteLoadingScreen.jsx";
import usePageStylesheets from "../../../hooks/usePageStylesheets.js";
import useAutoRefresh from "../../../hooks/useAutoRefresh.js";
import adminApi from "../adminApi.js";

function CompanyManagement() {
  const stylesReady = usePageStylesheets("/admin-companies-legacy.css");
  const [companies, setCompanies] = useState([]);
  const [users, setUsers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [companyToRemove, setCompanyToRemove] = useState(null);
  const [form, setForm] = useState({ name: "", phone: "", address: "", email: "", hrName: "", hrPhoneNumber: "", hrEmail: "", hrPassword: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");

  const loadCompanies = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [records, employees, experts, hrProfiles] = await Promise.all([adminApi.getCompanies(), adminApi.getUsers(), adminApi.getExperts(), adminApi.getHrProfiles()]);
      setCompanies(records || []);
      setUsers([
        ...(employees || []).map((user) => ({ ...user, role: "Employee" })),
        ...(experts || []).map((user) => ({ ...user, role: "Wellness Expert" })),
        ...(hrProfiles || []).map((user) => ({ ...user, role: "HR" })),
      ]);
      setError("");
    } catch (loadError) {
      if (!silent) setError(loadError.message || "Could not load companies.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => { loadCompanies(); }, [loadCompanies]);
  useAutoRefresh(() => loadCompanies(true), "admin-companies");

  async function createCompany(event) {
    event.preventDefault();
    setSaving(true);
    setFormError("");
    try {
      const result = await adminApi.createCompanyWithHr({
        companyName: form.name,
        companyPhone: form.phone,
        companyAddress: form.address,
        companyEmail: form.email,
        hrName: form.hrName,
        hrPhoneNumber: form.hrPhoneNumber,
        hrEmail: form.hrEmail,
        hrPassword: form.hrPassword,
      });
      setCompanies((current) => [result.company, ...current]);
      setUsers((current) => [{ ...result.hrProfile, role: "HR" }, ...current]);
      setForm({ name: "", phone: "", address: "", email: "", hrName: "", hrPhoneNumber: "", hrEmail: "", hrPassword: "" });
      setIsModalOpen(false);
    } catch (saveError) {
      setFormError(saveError.message || "Could not create the company and HR account.");
    } finally {
      setSaving(false);
    }
  }

  function requestCompanyRemoval(company) {
    const linkedUsers = users.filter((user) => belongsToCompany(user, company));
    setCompanyToRemove({ ...company, linkedUserCount: linkedUsers.length });
  }

  async function confirmCompanyRemoval() {
    if (!companyToRemove?.id || removing) return;
    const company = companyToRemove;
    setRemoving(true);
    setError("");
    try {
      await adminApi.deleteCompany(company.id);
      setCompanies((current) => current.filter((entry) => entry.id !== company.id));
      setUsers((current) => current.filter((user) => !belongsToCompany(user, company)));
      setCompanyToRemove(null);
    } catch (removeError) {
      try {
        const latestCompanies = await adminApi.getCompanies();
        if (!latestCompanies.some((entry) => entry.id === company.id)) {
          setCompanies(latestCompanies);
          setUsers((current) => current.filter((user) => !belongsToCompany(user, company)));
          setCompanyToRemove(null);
          return;
        }
      } catch {
        // Preserve the original error when the directory cannot be reloaded.
      }
      setError(removeError.message && removeError.message !== "[object Object]"
        ? removeError.message
        : "Could not confirm company removal. Refresh the directory before retrying.");
    } finally {
      setRemoving(false);
    }
  }

  function countUsers(company, role) {
    return users.filter((user) => user.role === role && belongsToCompany(user, company)).length;
  }

  if (!stylesReady) return <RouteLoadingScreen />;

  return (
    <>
      <main className="container">
        <div className="page-heading">
          <div>
            <p className="eyebrow">Companies</p>
            <h1>Company Management</h1>
            <p className="subtitle">Manage company profiles and records</p>
          </div>
        </div>

        <div className="actions actions-only">
          <div>
            <button className="btn-primary" type="button" onClick={() => { setFormError(""); setIsModalOpen(true); }}>+ Add Company</button>
          </div>
        </div>

        <div className="table-card">
          <table className="company-table">
            <thead>
              <tr>
                <th>Company ID</th>
                <th>Company Name</th>
                <th>Number of Employees</th>
                <th>Number of Wellness Experts</th>
                <th>Number of HR</th>
                <th>Created Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {companies.length ? companies.map((company, index) => (
                <tr key={`${company.id || company.name || "company"}-${index}`}>
                  <td>{company.id || "—"}</td>
                  <td><span className="cell-title">{company.name || "Unnamed company"}</span></td>
                  <td>{countUsers(company, "Employee")}</td>
                  <td>{countUsers(company, "Wellness Expert")}</td>
                  <td>{countUsers(company, "HR")}</td>
                  <td>{company.createdAt ? new Date(company.createdAt).toLocaleDateString() : "—"}</td>
                  <td><button className="delete action-button" type="button" onClick={() => requestCompanyRemoval(company)}>Remove</button></td>
                </tr>
              )) : (
                <tr className="empty-row"><td colSpan="7">{loading ? "Loading companies…" : "No company records are hardcoded. Render this table from your project data."}</td></tr>
              )}
            </tbody>
          </table>
          <p className="footer-text" id="companyTableFooter">{error || `Showing ${companies.length} entries`}</p>
        </div>
      </main>

      <div className={`page-modal${isModalOpen ? " is-open" : ""}`} id="companyFormModal" aria-hidden={!isModalOpen}>
        <div className="page-modal-backdrop" onClick={() => !saving && setIsModalOpen(false)} />
        <div className="page-modal-panel admin-company-modal-panel" role="dialog" aria-modal="true" aria-label="Add Company and HR">
          <button className="page-modal-close" type="button" onClick={() => !saving && setIsModalOpen(false)} aria-label="Close add company form"><i className="fa fa-xmark" /></button>
          <form className="admin-company-form" onSubmit={createCompany}>
            <h2>Add Company and HR</h2>
            <p>Create a company workspace together with its first HR login.</p>
            <label>Company Name<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
            <label>Phone Number<input required value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></label>
            <label>Address<input required value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} /></label>
            <label>Company Email<input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
            <h3>Initial HR Account</h3>
            <label>HR Name<input required value={form.hrName} onChange={(event) => setForm({ ...form, hrName: event.target.value })} /></label>
            <label>HR Phone (optional)<input type="tel" value={form.hrPhoneNumber} onChange={(event) => setForm({ ...form, hrPhoneNumber: event.target.value })} /></label>
            <label>HR Gmail<input required type="email" placeholder="hr@gmail.com" value={form.hrEmail} onChange={(event) => setForm({ ...form, hrEmail: event.target.value })} /></label>
            <label>HR Password<input required type="password" minLength="6" autoComplete="new-password" value={form.hrPassword} onChange={(event) => setForm({ ...form, hrPassword: event.target.value })} /></label>
            {formError && <p className="form-message" role="alert">{formError}</p>}
            <div className="form-actions"><button className="btn-primary" type="submit" disabled={saving}>{saving ? "Creating…" : "Create Company and HR"}</button><button className="btn-outline" type="button" disabled={saving} onClick={() => setIsModalOpen(false)}>Back</button></div>
          </form>
        </div>
      </div>
      {companyToRemove && <div className="page-modal is-open" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !removing) setCompanyToRemove(null); }}>
        <section className="page-modal-panel" role="alertdialog" aria-modal="true" aria-labelledby="removeCompanyTitle" aria-describedby="removeCompanyDescription">
          <div className="admin-company-form">
            <h2 id="removeCompanyTitle">Remove company?</h2>
            <p id="removeCompanyDescription">{companyToRemove.linkedUserCount
              ? `Removing ${companyToRemove.name} will delete ${companyToRemove.linkedUserCount} linked account${companyToRemove.linkedUserCount === 1 ? "" : "s"} and cancel its subscription. Historical wellness records will be retained.`
              : `Remove ${companyToRemove.name} and cancel its subscription? Historical wellness records will be retained.`}</p>
            <div className="form-actions">
              <button className="btn-outline" type="button" disabled={removing} onClick={() => setCompanyToRemove(null)}>Cancel</button>
              <button className="delete action-button" type="button" disabled={removing} onClick={confirmCompanyRemoval}>{removing ? "Removing…" : "Remove Company"}</button>
            </div>
          </div>
        </section>
      </div>}
    </>
  );
}

function belongsToCompany(user, company) {
  const userCompanyId = String(user.companyId || "").trim();
  if (company.id && userCompanyId) return userCompanyId === String(company.id).trim();
  return Boolean(
    company.name &&
      String(user.companyName || "").trim().toLowerCase() ===
        String(company.name).trim().toLowerCase(),
  );
}

export default CompanyManagement;
