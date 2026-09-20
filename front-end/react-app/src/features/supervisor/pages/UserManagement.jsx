import { useMemo, useState } from "react";
import SupervisorIcon from "../components/SupervisorIcon.jsx";
import SupervisorModal from "../components/SupervisorModal.jsx";
import SupervisorTable from "../components/SupervisorTable.jsx";

function UserManagement({ users, onAddUser }) {
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("All roles");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", role: "Employee", company: "" });
  const filteredUsers = useMemo(() => users.filter((user) => (role === "All roles" || user.role === role) && `${user.name} ${user.email} ${user.company}`.toLowerCase().includes(query.toLowerCase())), [users, query, role]);
  const submit = (event) => { event.preventDefault(); if (!form.name || !form.email) return; onAddUser({ ...form, id: `USR-${Date.now()}`, status: "Active" }); setForm({ name: "", email: "", role: "Employee", company: "" }); setShowModal(false); };

  const columns = [
    { key: "name", label: "User", render: (row) => <div className="table-user"><span>{row.name.slice(0, 1)}</span><div><strong>{row.name}</strong><small>{row.email}</small></div></div> },
    { key: "role", label: "Role", render: (row) => <span className="role-pill">{row.role}</span> },
    { key: "company", label: "Company" },
    { key: "status", label: "Status", render: (row) => <span className={`status-pill status-${row.status.toLowerCase()}`}>{row.status}</span> },
    { key: "lastActive", label: "Last active" },
  ];

  return <>
    <div className="supervisor-page-heading"><div><p className="supervisor-eyebrow">User Directory</p><h1>User Management</h1><p className="supervisor-subtitle">Manage the people who keep each wellness workspace moving.</p></div><button className="supervisor-primary-button" type="button" onClick={() => setShowModal(true)}><SupervisorIcon name="plus" size={17} /> Add User</button></div>
    <section className="supervisor-toolbar supervisor-panel"><div className="supervisor-search"><SupervisorIcon name="user" size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search users" aria-label="Search users" /></div><select value={role} onChange={(event) => setRole(event.target.value)} aria-label="Filter by role"><option>All roles</option><option>Employee</option><option>HR</option><option>Wellness Expert</option></select><span className="toolbar-count">{filteredUsers.length} users</span></section>
    <section className="supervisor-panel supervisor-table-panel"><div className="supervisor-panel-heading"><div><p className="supervisor-eyebrow">Accounts</p><h2>Workspace users</h2></div><button className="supervisor-outline-button" type="button" onClick={() => setQuery("")}>Clear filters</button></div><SupervisorTable columns={columns} rows={filteredUsers} emptyMessage="No users match your filters." /></section>
    {showModal && <SupervisorModal title="Add User" description="Create an account with the role and company details used across the workspace." onClose={() => setShowModal(false)}><form className="supervisor-form" onSubmit={submit}><div className="form-grid"><label>Name<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Enter full name" /></label><label>Email<input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="Enter Gmail address" /></label><label>Role<select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}><option>Employee</option><option>HR</option><option>Wellness Expert</option></select></label><label>Company<input value={form.company} onChange={(event) => setForm({ ...form, company: event.target.value })} placeholder="Enter company" /></label></div><div className="form-actions"><button className="supervisor-outline-button" type="button" onClick={() => setShowModal(false)}>Cancel</button><button className="supervisor-primary-button" type="submit">Add User</button></div></form></SupervisorModal>}
  </>;
}

export default UserManagement;
