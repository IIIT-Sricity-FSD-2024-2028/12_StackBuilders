import { useEffect, useState } from "react";
import RouteLoadingScreen from "../../../components/RouteLoadingScreen.jsx";
import usePageStylesheets from "../../../hooks/usePageStylesheets.js";
import useAutoRefresh from "../../../hooks/useAutoRefresh.js";
import adminApi from "../adminApi.js";
import "../admin-user-management.css";

const emptyForm = { role: "employee", name: "", companyId: "", department: "", experience: "", email: "", password: "", specialization: "", phoneNumber: "" };

const roleConfig = {
  employee: { title: "Add Employee", subtitle: "Create an employee account with department, Gmail, and password details.", button: "Add Employee", nameLabel: "Employee Name", namePlaceholder: "Enter employee name" },
  hr: { title: "Add HR User", subtitle: "Create an HR account with full name, company name, Gmail, and password.", button: "Add HR", nameLabel: "Full Name", namePlaceholder: "Enter full name" },
  expert: { title: "Add Wellness Expert", subtitle: "Create a wellness expert profile with experience, Gmail, password, and specialization.", button: "Add Expert", nameLabel: "Expert Name", namePlaceholder: "Enter expert name" },
};

function UserManagement() {
  const stylesReady = usePageStylesheets("/admin-users-legacy.css");
  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [formMessage, setFormMessage] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  async function loadUsers(silent = false) {
    if (!silent) setLoading(true);
    try {
      const [employees, experts, hrProfiles, companyList] = await Promise.all([adminApi.getUsers(), adminApi.getExperts(), adminApi.getHrProfiles(), adminApi.getCompanies()]);
      setUsers([
        ...(employees || []).map((user) => ({ ...user, role: "Employee", source: "employee", company: user.companyName || "—" })),
        ...(hrProfiles || []).map((user) => ({ ...user, role: "HR", source: "hr", company: user.companyName || "—" })),
        ...(experts || []).map((user) => ({ ...user, role: "Wellness Expert", source: "expert", company: user.companyName || "—" })),
      ]);
      setCompanies(companyList || []);
      setError("");
    } catch (loadError) {
      if (!silent) setError(loadError.message || "Could not load users.");
    } finally {
      if (!silent) setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);
  useAutoRefresh(() => loadUsers(true), "admin-users");

  function openForm() {
    setForm(emptyForm);
    setFormError(companies.length ? "" : "Add a company first in Company Management before creating users.");
    setFormMessage("");
    setIsModalOpen(true);
  }

  function updateForm(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
    setFormError("");
  }

  async function submitForm(event) {
    event.preventDefault();
    setFormError("");
    setFormMessage("");
    const company = companies.find((item) => item.id === form.companyId);
    if (!company) return setFormError("Select a valid company name that already exists.");
    if (!/^.+@gmail\.com$/i.test(form.email.trim())) return setFormError("Enter a valid Gmail address.");
    if (form.password.length < 6) return setFormError("Password must be at least 6 characters long.");
    try {
      if (form.role === "employee") await adminApi.createEmployee({ name: form.name, email: form.email, password: form.password, department: form.department, companyId: company.id, companyName: company.name, phoneNumber: form.phoneNumber, status: "Active" });
      else if (form.role === "expert") await adminApi.createExpert({ name: form.name, email: form.email, password: form.password, specialization: form.specialization, experience: form.experience, companyId: company.id, companyName: company.name, phoneNumber: form.phoneNumber, status: "Active" });
      else await adminApi.createHrProfile({ name: form.name, email: form.email, password: form.password, companyId: company.id, companyName: company.name, phoneNumber: form.phoneNumber, department: "HR", designation: "HR Admin", status: "Active", createdBySuperUser: true });
      setFormMessage("User added successfully.");
      await loadUsers();
      window.setTimeout(() => setIsModalOpen(false), 450);
    } catch (submitError) {
      setFormError(submitError.message || "The user could not be created.");
    }
  }

  async function removeUser(user) {
    if (!user.id) return;
    try {
      if (user.source === "employee") await adminApi.deleteEmployee(user.id);
      else if (user.source === "expert") await adminApi.deleteExpert(user.id);
      else await adminApi.deleteHrProfile(user.id);
      await loadUsers();
    } catch (removeError) {
      setError(removeError.message || "The user could not be removed.");
    }
  }

  const config = roleConfig[form.role];
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredUsers = users.filter((user) => {
    if (roleFilter !== "all" && user.role !== roleFilter) return false;
    if (!normalizedSearch) return true;
    const searchableFields = [user.name, user.email, user.company, user.companyName, user.companyId, user.phoneNumber];
    return searchableFields.some((value) => String(value || "").toLowerCase().includes(normalizedSearch));
  });
  if (!stylesReady) return <RouteLoadingScreen />;

  return <>
    <main className="container">
      <div className="page-heading"><div><p className="eyebrow">Users</p><h1>User Management</h1><p className="subtitle">Manage user accounts and permissions</p></div></div>
      <div className="toolbar user-management-toolbar">
        <div className="user-management-filters">
          <label className="search-box" htmlFor="adminUserSearch">
            <i className="fa fa-search" aria-hidden="true" />
            <input id="adminUserSearch" type="search" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search name, email, company, or phone" />
          </label>
          <label className="user-role-filter" htmlFor="adminUserRoleFilter">
            <span>Role</span>
            <select id="adminUserRoleFilter" value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
              <option value="all">All roles</option>
              <option value="Employee">Employee</option>
              <option value="HR">HR</option>
              <option value="Wellness Expert">Wellness Expert</option>
            </select>
          </label>
        </div>
        <button className="add-btn" type="button" onClick={openForm}><i className="fa fa-plus" /> Add User</button>
      </div>
      <div className="table-container"><table><thead><tr><th>Company ID</th><th>User Name</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead><tbody>{filteredUsers.length ? filteredUsers.map((user, index) => { const status = user.status || "Active"; return <tr key={`${user.id || user.email}-${index}`}><td>{user.companyId || user.company || "—"}</td><td><span className="cell-title">{user.name || "Unnamed user"}</span><span className="cell-meta">{user.company || "—"}</span></td><td><span className="cell-title">{user.email || "—"}</span><span className="cell-meta">{user.phoneNumber || "—"}</span></td><td><span className={`badge ${user.role === "Wellness Expert" ? "expert" : String(user.role).toLowerCase()}`}>{user.role}</span></td><td><span className={`badge ${String(status).toLowerCase()}`}>{status}</span></td><td><button className="action-button delete" type="button" onClick={() => removeUser(user)}>Remove</button></td></tr>; }) : <tr className="empty-row"><td colSpan="6">{loading ? "Loading users…" : users.length ? "No users match your search and role filter." : "No users added yet. Use Add User to create the first account."}</td></tr>}</tbody></table><div className="footer" id="userTableFooter" aria-live="polite">{error || `Showing ${filteredUsers.length} of ${users.length} users`}</div></div>
    </main>

    {isModalOpen && <div className="page-modal is-open" aria-hidden="false"><div className="page-modal-backdrop" onClick={() => setIsModalOpen(false)} /><div className="page-modal-panel admin-user-modal-panel" role="dialog" aria-modal="true" aria-label="Add User"><button className="page-modal-close" type="button" onClick={() => setIsModalOpen(false)} aria-label="Close add user form"><i className="fa fa-xmark" /></button><section className="admin-user-form-shell"><div className="admin-user-brand">StackBuilders</div><header className="admin-user-page-copy"><h2>{config.title}</h2><p>{config.subtitle}</p></header><form className="admin-user-form" onSubmit={submitForm} noValidate><div className="role-chips" aria-label="Role quick selection">{[["employee", "fa-user", "Employee"], ["hr", "fa-users-gear", "HR"], ["expert", "fa-heart-pulse", "Wellness Expert"]].map(([role, icon, label]) => <button className={`role-chip${form.role === role ? " active" : ""}`} type="button" key={role} onClick={() => updateForm("role", role)}><i className={`fa-solid ${icon}`} />{label}</button>)}</div><div className="field-group"><label htmlFor="adminUserName">{config.nameLabel}</label><input id="adminUserName" required value={form.name} onChange={(event) => updateForm("name", event.target.value)} placeholder={config.namePlaceholder} /></div><div className="field-group"><label htmlFor="adminUserCompany">Company Name</label><select id="adminUserCompany" required value={form.companyId} onChange={(event) => updateForm("companyId", event.target.value)}><option value="">Select Company</option>{companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}</select></div>{form.role === "employee" && <div className="field-group"><label htmlFor="adminUserDepartment">Department Name</label><select id="adminUserDepartment" required value={form.department} onChange={(event) => updateForm("department", event.target.value)}><option value="">Select Department</option>{["Engineering", "Marketing", "Sales", "Finance", "Operations", "Advertising", "Social Media"].map((department) => <option key={department}>{department}</option>)}</select></div>}{form.role === "expert" && <><div className="field-group"><label htmlFor="adminUserExperience">Experience (Years)</label><input id="adminUserExperience" required type="number" min="0" max="60" value={form.experience} onChange={(event) => updateForm("experience", event.target.value)} placeholder="Enter years of experience" /></div><div className="field-group"><label htmlFor="adminUserSpecialization">Specialization</label><select id="adminUserSpecialization" required value={form.specialization} onChange={(event) => updateForm("specialization", event.target.value)}><option value="">Select Specialization</option><option>Physical Trainer</option><option>Nutritionist</option><option>Psychologist</option></select></div></>}<div className="field-group"><label htmlFor="adminUserEmail">Gmail Address</label><input id="adminUserEmail" required type="email" value={form.email} onChange={(event) => updateForm("email", event.target.value)} placeholder="Enter Gmail" /></div><div className="field-group"><label htmlFor="adminUserPassword">Password</label><input id="adminUserPassword" required minLength="6" type="password" value={form.password} onChange={(event) => updateForm("password", event.target.value)} placeholder="Enter Password" /></div><div className="field-group"><label htmlFor="adminUserPhone">Phone Number</label><input id="adminUserPhone" value={form.phoneNumber} onChange={(event) => updateForm("phoneNumber", event.target.value)} placeholder="Optional phone number" /></div>{formError && <p className="form-message">{formError}</p>}{formMessage && <p className="form-message is-success">{formMessage}</p>}<div className="form-actions"><button className="submit-btn" type="submit">{config.button}</button><button className="back-btn" type="button" onClick={() => setIsModalOpen(false)}>Back</button></div></form></section></div></div>}
  </>;
}

export default UserManagement;
