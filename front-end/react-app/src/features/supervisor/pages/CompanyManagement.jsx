import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import SupervisorIcon from "../components/SupervisorIcon.jsx";
import SupervisorModal from "../components/SupervisorModal.jsx";
import useAutoRefresh from "../../../hooks/useAutoRefresh.js";
import { approveSupervisorRequest, createSupervisorCompany, loadSupervisorCompanies, rejectSupervisorRequest } from "../companyManagementSlice.js";
import { loadSupervisorRevenue } from "../revenueSlice.js";
import { addSupervisorUser, loadSupervisorUsers, normalizeUsers } from "../usersSlice.js";

const INDIAN_PHONE_PATTERN = "(?:\\+?91[\\s()-]*)?[6-9](?:[\\s()-]*[0-9]){9}";

function normalizeIndianPhoneNumber(value) {
  const phone = String(value ?? "").trim();
  if (!phone || !/^\+?[\d\s()-]+$/.test(phone)) return null;
  const digits = phone.replace(/\D/g, "");
  const number = digits.length === 10 ? digits : digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : "";
  return /^[6-9]\d{9}$/.test(number) ? `+91 ${number.slice(0, 5)} ${number.slice(5)}` : null;
}

function CompanyManagement() {
  const dispatch = useDispatch();
  const rawCompanies = useSelector((state) => state.supervisor.companyManagement.companies);
  const requests = useSelector((state) => state.supervisor.companyManagement.requests);
  const loading = useSelector((state) => state.supervisor.companyManagement.loading);
  const saving = useSelector((state) => state.supervisor.companyManagement.saving);
  const sliceError = useSelector((state) => state.supervisor.companyManagement.error);
  const users = useSelector((state) => state.supervisor.users.items);
  const subscriptions = useSelector((state) => state.supervisor.revenue.subscriptions);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", address: "", hrName: "", hrPhoneNumber: "", hrEmail: "", hrPassword: "" });
  const [formError, setFormError] = useState("");
  const [processingRequest, setProcessingRequest] = useState(null);
  const [requestError, setRequestError] = useState("");

  const loadData = useCallback(() => Promise.all([
    dispatch(loadSupervisorCompanies()),
    dispatch(loadSupervisorUsers()),
    dispatch(loadSupervisorRevenue()),
  ]), [dispatch]);

  useEffect(() => { void loadData(); }, [loadData]);
  useAutoRefresh(loadData, "supervisor-companies");

  const companies = useMemo(() => rawCompanies.map((company) => {
    const subscription = subscriptions.find((entry) => entry.companyId === company.id || entry.companyName?.toLowerCase() === company.name?.toLowerCase());
    return {
      ...company,
      plan: subscription?.planName || subscription?.planId || "No plan",
      employees: users.filter((user) => user.companyId === company.id || user.company?.toLowerCase() === company.name?.toLowerCase()).length,
      status: subscription?.status || "Unsubscribed",
    };
  }), [rawCompanies, users, subscriptions]);

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const countFor = (company, role) => users.filter((user) => (user.companyId === company.id || user.company?.toLowerCase() === company.name?.toLowerCase()) && user.role === role).length;
  async function submit(event) {
    event.preventDefault();
    if (saving) return;
    setFormError("");
    const phone = normalizeIndianPhoneNumber(form.phone);
    const hrPhoneNumber = form.hrPhoneNumber.trim() ? normalizeIndianPhoneNumber(form.hrPhoneNumber) : "";
    if (!phone) {
      setFormError("Enter a valid Indian company mobile number with 10 digits starting from 6–9, optionally prefixed by +91.");
      return;
    }
    if (form.hrPhoneNumber.trim() && !hrPhoneNumber) {
      setFormError("Enter a valid Indian HR mobile number with 10 digits starting from 6–9, optionally prefixed by +91.");
      return;
    }
    try {
      const result = await dispatch(createSupervisorCompany({ ...form, phone, hrPhoneNumber })).unwrap();
      if (result?.hrProfile) {
        const hrUser = normalizeUsers({ hrProfiles: [result.hrProfile] })[0];
        if (hrUser) dispatch(addSupervisorUser(hrUser));
      }
      setForm({ name: "", email: "", phone: "", address: "", hrName: "", hrPhoneNumber: "", hrEmail: "", hrPassword: "" });
      setShowModal(false);
    } catch (error) {
      setFormError(error.message || "The company and HR account could not be created.");
    }
  }

  async function approve(id) {
    setProcessingRequest({ id, action: "approve" });
    setRequestError("");
    try {
      await dispatch(approveSupervisorRequest(id)).unwrap();
      void dispatch(loadSupervisorCompanies());
      void dispatch(loadSupervisorUsers());
    } catch (error) {
      setRequestError(error.message || "The company request could not be approved.");
    } finally {
      setProcessingRequest(null);
    }
  }

  async function reject(request) {
    const companyName = request.companyName || request.name || "this company";
    if (!window.confirm(`Are you sure you want to reject the company request for ${companyName}?`)) return;
    setProcessingRequest({ id: request.id, action: "reject" });
    setRequestError("");
    try {
      await dispatch(rejectSupervisorRequest(request.id)).unwrap();
    } catch (error) {
      setRequestError(error.message || "The company request could not be rejected.");
    } finally {
      setProcessingRequest(null);
    }
  }

  return <>
    <div className="supervisor-page-heading"><div><p className="supervisor-eyebrow">Organizations</p><h1>Company management</h1><p className="supervisor-subtitle">Review company workspaces, onboarding requests, and linked users from one place.</p></div><button className="supervisor-primary-button" type="button" onClick={() => setShowModal(true)}><SupervisorIcon name="plus" size={17} /> Add company</button></div>
    {sliceError && <p className="supervisor-empty-state" role="alert">{sliceError}</p>}
    <section className="supervisor-panel supervisor-table-panel"><div className="supervisor-panel-heading"><div><p className="supervisor-eyebrow">Approvals</p><h2>Company onboarding requests</h2><p className="supervisor-subtitle">Accepting a request creates the company and HR account automatically.</p></div><span className="supervisor-muted-label">{requests.length} pending</span></div>{requestError && <p className="supervisor-empty-state" role="alert">{requestError}</p>}<div className="supervisor-table-wrap"><table className="supervisor-table"><thead><tr><th>Company</th><th>HR contact</th><th>Requested</th><th>Status</th><th>Actions</th></tr></thead><tbody>{requests.length ? requests.map((request) => { const busy = processingRequest?.id === request.id; return <tr key={request.id}><td><div className="table-user"><span className="company-avatar"><SupervisorIcon name="building" size={16} /></span><div><strong>{request.companyName || request.name || "—"}</strong><small>{request.companyEmail || request.email || "—"}</small></div></div></td><td>{request.hrName || request.requestedBy || request.email || "—"}</td><td>{request.createdAt || "—"}</td><td><span className={`status-pill status-${String(request.status || "pending").toLowerCase()}`}>{request.status || "Pending"}</span></td><td><div className="company-request-actions"><button className="table-action" type="button" disabled={processingRequest !== null} onClick={() => approve(request.id)}>{busy && processingRequest.action === "approve" ? "Approving…" : "Approve"}</button><button className="table-action table-action-danger" type="button" disabled={processingRequest !== null} onClick={() => reject(request)}>{busy && processingRequest.action === "reject" ? "Rejecting…" : "Reject"}</button></div></td></tr>; }) : <tr><td className="table-empty" colSpan="5">{loading ? "Loading onboarding requests…" : "No company approval requests are pending."}</td></tr>}</tbody></table></div></section>
    <section className="supervisor-panel supervisor-table-panel"><div className="supervisor-panel-heading"><div><p className="supervisor-eyebrow">Directory</p><h2>Company workspaces</h2></div><span className="supervisor-muted-label">{companies.length} companies</span></div><div className="supervisor-table-wrap"><table className="supervisor-table"><thead><tr><th>Company</th><th>Employees</th><th>Experts</th><th>HR</th><th>Created</th><th>Status</th></tr></thead><tbody>{companies.length ? companies.map((company) => <tr key={company.id}><td><div className="table-user"><span className="company-avatar"><SupervisorIcon name="building" size={16} /></span><div><strong>{company.name}</strong><small>{company.id || company.email || "—"}</small></div></div></td><td>{countFor(company, "Employee") || company.employees || 0}</td><td>{countFor(company, "Wellness Expert")}</td><td>{countFor(company, "HR")}</td><td>{company.createdAt ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(company.createdAt)) : "—"}</td><td><span className="status-pill status-active">{company.status || "Active"}</span></td></tr>) : <tr><td className="table-empty" colSpan="6">{loading ? "Loading companies…" : "No company records are available yet."}</td></tr>}</tbody></table></div></section>
    {showModal && <SupervisorModal title="Add company and HR" description="Create the company workspace and its first HR login together." onClose={() => !saving && setShowModal(false)}><form className="supervisor-form" onSubmit={submit}>{formError && <p className="supervisor-empty-state" role="alert">{formError}</p>}<div><p className="supervisor-eyebrow">Company details</p><div className="form-grid"><label>Company name<input required value={form.name} onChange={(event) => update("name", event.target.value)} placeholder="Enter company name" /></label><label>Company email<input required type="email" value={form.email} onChange={(event) => update("email", event.target.value)} placeholder="company@example.com" /></label><label>Company phone<input type="tel" inputMode="tel" autoComplete="tel" maxLength="18" pattern={INDIAN_PHONE_PATTERN} title="Enter a 10-digit Indian mobile number starting with 6–9, optionally prefixed by +91." required value={form.phone} onChange={(event) => update("phone", event.target.value)} placeholder="+91 98765 43210" /></label><label>Address<input required value={form.address} onChange={(event) => update("address", event.target.value)} placeholder="Company address" /></label></div></div><div><p className="supervisor-eyebrow">Initial HR account</p><div className="form-grid"><label>HR name<input required value={form.hrName} onChange={(event) => update("hrName", event.target.value)} placeholder="HR full name" /></label><label>HR phone (optional)<input type="tel" inputMode="tel" autoComplete="tel" maxLength="18" pattern={INDIAN_PHONE_PATTERN} title="Enter a 10-digit Indian mobile number starting with 6–9, optionally prefixed by +91." value={form.hrPhoneNumber} onChange={(event) => update("hrPhoneNumber", event.target.value)} placeholder="+91 98765 43210" /></label><label>HR Gmail<input required type="email" value={form.hrEmail} onChange={(event) => update("hrEmail", event.target.value)} placeholder="hr@gmail.com" /></label><label>HR password<input required type="password" minLength="6" autoComplete="new-password" value={form.hrPassword} onChange={(event) => update("hrPassword", event.target.value)} placeholder="At least 6 characters" /></label></div></div><div className="form-actions"><button className="supervisor-outline-button" type="button" disabled={saving} onClick={() => setShowModal(false)}>Cancel</button><button className="supervisor-primary-button" type="submit" disabled={saving}>{saving ? "Creating…" : "Create company and HR"}</button></div></form></SupervisorModal>}
  </>;
}

export default CompanyManagement;
