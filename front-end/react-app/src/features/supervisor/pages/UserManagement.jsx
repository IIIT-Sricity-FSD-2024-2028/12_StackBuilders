import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import SupervisorIcon from "../components/SupervisorIcon.jsx";
import SupervisorModal from "../components/SupervisorModal.jsx";
import SupervisorTable from "../components/SupervisorTable.jsx";
import useAutoRefresh from "../../../hooks/useAutoRefresh.js";
import { loadSupervisorCompanies } from "../companyManagementSlice.js";
import { createSupervisorUser, loadSupervisorUsers } from "../usersSlice.js";

const INDIAN_PHONE_PATTERN = "(?:\\+?91[\\s()-]*)?[6-9](?:[\\s()-]*[0-9]){9}";

function normalizeIndianPhoneNumber(value) {
  const phone = String(value ?? "").trim();
  if (!phone || !/^\+?[\d\s()-]+$/.test(phone)) return null;
  const digits = phone.replace(/\D/g, "");
  const number = digits.length === 10 ? digits : digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : "";
  return /^[6-9]\d{9}$/.test(number) ? `+91 ${number.slice(0, 5)} ${number.slice(5)}` : null;
}

const emptyForm = { name: "", email: "", password: "", role: "Employee", companyId: "", phone: "", department: "", specialization: "", experience: "" };

function UserManagement() {
  const dispatch = useDispatch();
  const users = useSelector((state) => state.supervisor.users.items);
  const companies = useSelector((state) => state.supervisor.companyManagement.companies);
  const loading = useSelector((state) => state.supervisor.users.loading || state.supervisor.companyManagement.loading);
  const saving = useSelector((state) => state.supervisor.users.saving);
  const error = useSelector((state) => state.supervisor.users.error || state.supervisor.companyManagement.error);
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("All roles");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");

  const loadData = useCallback(() => Promise.all([
    dispatch(loadSupervisorUsers()),
    dispatch(loadSupervisorCompanies()),
  ]), [dispatch]);

  useEffect(() => { void loadData(); }, [loadData]);
  useAutoRefresh(loadData, "supervisor-users");

  const filteredUsers = useMemo(() => users.filter((user) => (role === "All roles" || user.role === role) && `${user.name} ${user.email} ${user.company}`.toLowerCase().includes(query.toLowerCase())), [users, query, role]);
  const submit = async (event) => {
    event.preventDefault();
    if (saving) return;
    setFormError("");
    const phone = form.phone.trim() ? normalizeIndianPhoneNumber(form.phone) : "";
    if (form.phone.trim() && !phone) {
      setFormError("Enter a valid Indian mobile number with 10 digits starting from 6–9, optionally prefixed by +91.");
      return;
    }
    const company = companies.find((entry) => entry.id === form.companyId);
    try {
      await dispatch(createSupervisorUser({ user: { ...form, phone }, company })).unwrap();
      setForm(emptyForm);
      setShowModal(false);
    } catch (submitError) {
      setFormError(submitError.message || "The user could not be created.");
    }
  };
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const columns = [{ key: "name", label: "User", render: (row) => <div className="table-user"><span>{row.name.slice(0, 1)}</span><div><strong>{row.name}</strong><small>{row.email}</small></div></div> }, { key: "role", label: "Role", render: (row) => <span className="role-pill">{row.role}</span> }, { key: "company", label: "Company" }, { key: "status", label: "Status", render: (row) => <span className={`status-pill status-${row.status.toLowerCase()}`}>{row.status}</span> }, { key: "lastActive", label: "Last active" }];
  return <>
    <div className="supervisor-page-heading"><div><p className="supervisor-eyebrow">User Directory</p><h1>User Management</h1><p className="supervisor-subtitle">Manage the people who keep each wellness workspace moving.</p></div><button className="supervisor-primary-button" type="button" onClick={() => setShowModal(true)}><SupervisorIcon name="plus" size={17} /> Add User</button></div>
    {error && <p className="supervisor-empty-state" role="alert">{error}</p>}
    <section className="supervisor-toolbar supervisor-panel"><div className="supervisor-search"><SupervisorIcon name="user" size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search users" aria-label="Search users" /></div><select value={role} onChange={(event) => setRole(event.target.value)} aria-label="Filter by role"><option>All roles</option><option>Employee</option><option>HR</option><option>Wellness Expert</option></select><span className="toolbar-count">{filteredUsers.length} users</span></section>
    <section className="supervisor-panel supervisor-table-panel"><div className="supervisor-panel-heading"><div><p className="supervisor-eyebrow">Accounts</p><h2>Workspace users</h2></div><button className="supervisor-outline-button" type="button" onClick={() => { setQuery(""); setRole("All roles"); }}>Clear filters</button></div><SupervisorTable columns={columns} rows={filteredUsers} emptyMessage={loading ? "Loading users…" : "No users match your filters."} /></section>
    {showModal && <SupervisorModal title="Add User" description="Create an account with the role and company details used across the workspace." onClose={() => !saving && setShowModal(false)}><form className="supervisor-form" onSubmit={submit}>{formError && <p className="form-error" role="alert">{formError}</p>}<div className="form-grid"><label>Name<input required value={form.name} onChange={(event) => update("name", event.target.value)} placeholder="Enter full name" /></label><label>Email<input required type="email" value={form.email} onChange={(event) => update("email", event.target.value)} placeholder="Enter Gmail address" /></label><label>Password<input required minLength={6} type="password" value={form.password} onChange={(event) => update("password", event.target.value)} placeholder="At least 6 characters" /></label><label>Role<select value={form.role} onChange={(event) => update("role", event.target.value)}><option>Employee</option><option>HR</option><option>Wellness Expert</option></select></label><label>Company<select required value={form.companyId} onChange={(event) => update("companyId", event.target.value)}><option value="">Select company</option>{companies.map((company) => <option value={company.id} key={company.id}>{company.name}</option>)}</select></label><label>Phone<input type="tel" inputMode="tel" autoComplete="tel" maxLength="18" pattern={INDIAN_PHONE_PATTERN} title="Enter a 10-digit Indian mobile number starting with 6–9, optionally prefixed by +91." value={form.phone} onChange={(event) => update("phone", event.target.value)} placeholder="Optional · +91 98765 43210" /></label>{form.role === "Employee" && <label>Department<input required value={form.department} onChange={(event) => update("department", event.target.value)} placeholder="Engineering, HR, etc." /></label>}{form.role === "Wellness Expert" && <><label>Expert Type<select required value={form.specialization} onChange={(event) => update("specialization", event.target.value)}><option value="">Select expert type</option><option>Physical Trainer</option><option>Nutritionist</option><option>Psychologist</option></select></label><label>Experience<input required type="number" min="0" max="60" value={form.experience} onChange={(event) => update("experience", event.target.value)} placeholder="Years of experience" /></label></>}</div><div className="form-actions"><button className="supervisor-outline-button" type="button" disabled={saving} onClick={() => setShowModal(false)}>Cancel</button><button className="supervisor-primary-button" type="submit" disabled={saving}>{saving ? "Adding…" : "Add User"}</button></div></form></SupervisorModal>}
  </>;
}

export default UserManagement;
