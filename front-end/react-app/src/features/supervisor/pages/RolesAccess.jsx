import { useState } from "react";
import SupervisorIcon from "../components/SupervisorIcon.jsx";

const roleData = {
  HR: ["User Management", "Company Management", "Reports & Analytics", "Challenge Management", "Wellness Programs"],
  Employee: ["User Management", "Consultations", "Reports & Analytics", "Challenge Management", "Video Library"],
  "Wellness Expert": ["User Management", "Consultations", "Reports & Analytics", "Live Sessions", "Video Library"],
};
const operations = ["Create", "Read", "Update", "Delete"];

function RolesAccess() {
  const [activeRole, setActiveRole] = useState("HR");
  const [permissions, setPermissions] = useState(() => Object.fromEntries(roleData.HR.flatMap((resource) => operations.map((operation) => [`${resource}-${operation}`, true]))));
  const togglePermission = (key) => setPermissions((current) => ({ ...current, [key]: !current[key] }));
  return <>
    <div className="supervisor-page-heading"><div><p className="supervisor-eyebrow">Access Center</p><h1>Roles & Access Control</h1><p className="supervisor-subtitle">Manage role-based permissions and access levels.</p></div><button className="supervisor-primary-button" type="button" onClick={() => setPermissions((current) => Object.fromEntries(Object.keys(current).map((key) => [key, true])))}><SupervisorIcon name="shield" size={17} /> Enable all</button></div>
    <div className="roles-layout"><section className="supervisor-panel role-selector"><div className="supervisor-panel-heading"><div><p className="supervisor-eyebrow">Workspace roles</p><h2>Roles</h2></div><SupervisorIcon name="users" /></div>{Object.keys(roleData).map((role) => <button className={`role-selector-item${activeRole === role ? " active" : ""}`} type="button" key={role} onClick={() => setActiveRole(role)}><span className="role-selector-icon"><SupervisorIcon name={role === "HR" ? "shield" : role === "Employee" ? "user" : "heart"} size={18} /></span><span><strong>{role}</strong><small>Modules configurable</small></span><SupervisorIcon name="chevron" size={16} /></button>)}</section><section className="supervisor-panel permissions-panel"><div className="supervisor-panel-heading"><div><p className="supervisor-eyebrow">Permissions for {activeRole}</p><h2>Permission Matrix</h2></div><span className="role-pill">{activeRole}</span></div><div className="permission-table-wrap"><table className="permission-table"><thead><tr><th>Module</th>{operations.map((operation) => <th key={operation}>{operation}</th>)}</tr></thead><tbody>{roleData[activeRole].map((resource) => <tr key={resource}><td><strong>{resource}</strong></td>{operations.map((operation) => { const key = `${resource}-${operation}`; const enabled = permissions[key] ?? true; return <td key={key}><button className={`permission-toggle${enabled ? " active" : ""}`} type="button" onClick={() => togglePermission(key)} aria-label={`${resource} ${operation} permission`}><span /></button></td>; })}</tr>)}</tbody></table></div><p className="permission-note"><SupervisorIcon name="shield" size={15} /> Changes are applied to new sessions after saving the permission matrix.</p></section></div>
  </>;
}

export default RolesAccess;
