import { useState } from "react";
import SupervisorIcon from "../components/SupervisorIcon.jsx";
import SupervisorModal from "../components/SupervisorModal.jsx";

function CompanyManagement({ companies, users = [], requests = [], onAddCompany, onApproveRequest, onRejectRequest }) {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", address: "", hrName: "", hrPhoneNumber: "", hrEmail: "", hrPassword: "" });
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [processingRequest, setProcessingRequest] = useState(null);
  const [requestError, setRequestError] = useState("");
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const countFor = (company, role) => users.filter((user) => (user.companyId === company.id || user.company?.toLowerCase() === company.name?.toLowerCase()) && user.role === role).length;
  async function submit(event) {
    event.preventDefault();
    setFormError("");
    setSaving(true);
    try { await onAddCompany(form); setForm({ name: "", email: "", phone: "", address: "", hrName: "", hrPhoneNumber: "", hrEmail: "", hrPassword: "" }); setShowModal(false); } catch (error) { setFormError(error.message || "The company and HR account could not be created."); } finally { setSaving(false); }
  }

  async function approve(id) {
    setProcessingRequest({ id, action: "approve" });
    setRequestError("");
    try { await onApproveRequest(id); } catch (error) { setRequestError(error.message || "The company request could not be approved."); } finally { setProcessingRequest(null); }
  }

  async function reject(request) {
    const companyName = request.companyName || request.name || "this company";
    if (!window.confirm(`Are you sure you want to reject the company request for ${companyName}?`)) return;
    setProcessingRequest({ id: request.id, action: "reject" });
    setRequestError("");
    try { await onRejectRequest(request.id); } catch (error) { setRequestError(error.message || "The company request could not be rejected."); } finally { setProcessingRequest(null); }
  }

  return <>
    <div className="supervisor-page-heading"><div><p className="supervisor-eyebrow">Organizations</p><h1>Company management</h1><p className="supervisor-subtitle">Review company workspaces, onboarding requests, and linked users from one place.</p></div><button className="supervisor-primary-button" type="button" onClick={() => setShowModal(true)}><SupervisorIcon name="plus" size={17} /> Add company</button></div>
    <section className="supervisor-panel supervisor-table-panel"><div className="supervisor-panel-heading"><div><p className="supervisor-eyebrow">Approvals</p><h2>Company onboarding requests</h2><p className="supervisor-subtitle">Accepting a request creates the company and HR account automatically.</p></div><span className="supervisor-muted-label">{requests.length} pending</span></div>{requestError && <p className="supervisor-empty-state" role="alert">{requestError}</p>}<div className="supervisor-table-wrap"><table className="supervisor-table"><thead><tr><th>Company</th><th>HR contact</th><th>Requested</th><th>Status</th><th>Actions</th></tr></thead><tbody>{requests.length ? requests.map((request) => { const busy = processingRequest?.id === request.id; return <tr key={request.id}><td><div className="table-user"><span className="company-avatar"><SupervisorIcon name="building" size={16} /></span><div><strong>{request.companyName || request.name || "—"}</strong><small>{request.companyEmail || request.email || "—"}</small></div></div></td><td>{request.hrName || request.requestedBy || request.email || "—"}</td><td>{request.createdAt || "—"}</td><td><span className={`status-pill status-${String(request.status || "pending").toLowerCase()}`}>{request.status || "Pending"}</span></td><td><div className="company-request-actions"><button className="table-action" type="button" disabled={processingRequest !== null} onClick={() => approve(request.id)}>{busy && processingRequest.action === "approve" ? "Approving…" : "Approve"}</button><button className="table-action table-action-danger" type="button" disabled={processingRequest !== null} onClick={() => reject(request)}>{busy && processingRequest.action === "reject" ? "Rejecting…" : "Reject"}</button></div></td></tr>; }) : <tr><td className="table-empty" colSpan="5">No company approval requests are pending.</td></tr>}</tbody></table></div></section>
    <section className="supervisor-panel supervisor-table-panel"><div className="supervisor-panel-heading"><div><p className="supervisor-eyebrow">Directory</p><h2>Company workspaces</h2></div><span className="supervisor-muted-label">{companies.length} companies</span></div><div className="supervisor-table-wrap"><table className="supervisor-table"><thead><tr><th>Company</th><th>Employees</th><th>Experts</th><th>HR</th><th>Created</th><th>Status</th></tr></thead><tbody>{companies.length ? companies.map((company) => <tr key={company.id}><td><div className="table-user"><span className="company-avatar"><SupervisorIcon name="building" size={16} /></span><div><strong>{company.name}</strong><small>{company.id || company.email || "—"}</small></div></div></td><td>{countFor(company, "Employee") || company.employees || 0}</td><td>{countFor(company, "Wellness Expert")}</td><td>{countFor(company, "HR")}</td><td>{company.createdAt ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(company.createdAt)) : "—"}</td><td><span className="status-pill status-active">{company.status || "Active"}</span></td></tr>) : <tr><td className="table-empty" colSpan="6">No company records are available yet.</td></tr>}</tbody></table></div></section>
    {showModal && <SupervisorModal title="Add company and HR" description="Create the company workspace and its first HR login together." onClose={() => !saving && setShowModal(false)}><form className="supervisor-form" onSubmit={submit}>{formError && <p className="supervisor-empty-state" role="alert">{formError}</p>}<div><p className="supervisor-eyebrow">Company details</p><div className="form-grid"><label>Company name<input required value={form.name} onChange={(event) => update("name", event.target.value)} placeholder="Enter company name" /></label><label>Company email<input required type="email" value={form.email} onChange={(event) => update("email", event.target.value)} placeholder="company@example.com" /></label><label>Company phone<input required type="tel" value={form.phone} onChange={(event) => update("phone", event.target.value)} placeholder="Contact number" /></label><label>Address<input required value={form.address} onChange={(event) => update("address", event.target.value)} placeholder="Company address" /></label></div></div><div><p className="supervisor-eyebrow">Initial HR account</p><div className="form-grid"><label>HR name<input required value={form.hrName} onChange={(event) => update("hrName", event.target.value)} placeholder="HR full name" /></label><label>HR phone (optional)<input type="tel" value={form.hrPhoneNumber} onChange={(event) => update("hrPhoneNumber", event.target.value)} placeholder="Contact number" /></label><label>HR Gmail<input required type="email" value={form.hrEmail} onChange={(event) => update("hrEmail", event.target.value)} placeholder="hr@gmail.com" /></label><label>HR password<input required type="password" minLength="6" autoComplete="new-password" value={form.hrPassword} onChange={(event) => update("hrPassword", event.target.value)} placeholder="At least 6 characters" /></label></div></div><div className="form-actions"><button className="supervisor-outline-button" type="button" disabled={saving} onClick={() => setShowModal(false)}>Cancel</button><button className="supervisor-primary-button" type="submit" disabled={saving}>{saving ? "Creating…" : "Create company and HR"}</button></div></form></SupervisorModal>}
  </>;
}

export default CompanyManagement;
