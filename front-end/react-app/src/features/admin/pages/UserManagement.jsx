import { useMemo, useState } from "react";
import "../admin-user-management.css";

const sampleUsers = [
  { id: "EMP-001", name: "Ravi Kumar", email: "ravi@example.com", role: "Employee", company: "Greenfield Labs", status: "Active" },
  { id: "HR-014", name: "Anita Sharma", email: "anita@example.com", role: "HR", company: "Northstar Health", status: "Active" },
  { id: "EXP-008", name: "Dr. Meera Rao", email: "meera@example.com", role: "Wellness Expert", company: "Greenfield Labs", status: "Pending" },
];

function UserManagement() {
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("All roles");

  const filteredUsers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return sampleUsers.filter((user) => {
      const matchesRole = role === "All roles" || user.role === role;
      const matchesQuery = !normalizedQuery || `${user.name} ${user.email} ${user.company}`.toLowerCase().includes(normalizedQuery);
      return matchesRole && matchesQuery;
    });
  }, [query, role]);

  return (
    <main className="admin-user-page">
      <header className="admin-user-heading">
        <div>
          <p className="admin-eyebrow">User Directory</p>
          <h1>User Management</h1>
          <p>Manage employee, HR, and wellness expert accounts across the platform.</p>
        </div>
        <button className="admin-primary-button" type="button">+ Add User</button>
      </header>

      <section className="admin-user-toolbar" aria-label="User filters">
        <label className="admin-search-field">
          <span aria-hidden="true">⌕</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search users" aria-label="Search users" />
        </label>
        <select value={role} onChange={(event) => setRole(event.target.value)} aria-label="Filter by role">
          <option>All roles</option>
          <option>Employee</option>
          <option>HR</option>
          <option>Wellness Expert</option>
        </select>
        <span className="admin-user-count">{filteredUsers.length} users</span>
      </section>

      <section className="admin-user-panel">
        <div className="admin-user-panel-heading">
          <div><p className="admin-eyebrow">Accounts</p><h2>Workspace users</h2></div>
          <button className="admin-outline-button" type="button" onClick={() => { setQuery(""); setRole("All roles"); }}>Clear filters</button>
        </div>

        <div className="admin-user-table-wrap">
          <table className="admin-user-table">
            <thead><tr><th>User</th><th>Role</th><th>Company</th><th>Status</th><th>ID</th></tr></thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr><td colSpan="5" className="admin-table-empty">No users match your filters.</td></tr>
              ) : filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td><div className="admin-user-cell"><span>{user.name.slice(0, 1)}</span><div><strong>{user.name}</strong><small>{user.email}</small></div></div></td>
                  <td><span className="admin-role-pill">{user.role}</span></td>
                  <td>{user.company}</td>
                  <td><span className={`admin-status-pill admin-status-${user.status.toLowerCase()}`}>{user.status}</span></td>
                  <td>{user.id}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

export default UserManagement;
