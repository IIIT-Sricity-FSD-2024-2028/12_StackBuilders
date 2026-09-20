import { useEffect, useState } from "react";
import SupervisorIcon from "../components/SupervisorIcon.jsx";
import supervisorApi from "../supervisorApi.js";

const roles = ["HR", "Employee", "Wellness Expert"];
const operations = ["Create", "Read", "Update", "Delete"];
const resources = [["User Management", "user-management"], ["Company Management", "client-management"], ["Reports & Analytics", "reports"], ["Challenge Management", "challenge-management"]];
const permissionGroups = { HR: "hr", Employee: "employee", "Wellness Expert": "wellness-expert" };

function RolesAccess() {
  const [activeRole, setActiveRole] = useState("HR");
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const loadPermissions = async (role) => { setLoading(true); setError(""); try { const result = await supervisorApi.getPermissions(permissionGroups[role]); setPermissions(result?.permissions || {}); } catch (requestError) { setPermissions({}); setError(requestError.message || "Permissions could not be loaded."); } finally { setLoading(false); } };
  useEffect(() => { loadPermissions(activeRole); }, [activeRole]);
  const togglePermission = async (key) => { const next = { ...permissions, [key]: !permissions[key] }; setPermissions(next); try { const result = await supervisorApi.updatePermissions(permissionGroups[activeRole], next); setPermissions(result?.permissions || next); } catch (requestError) { setError(requestError.message || "Permission changes could not be saved."); setPermissions(permissions); } };
  const enableAll = async () => { const next = Object.fromEntries(resources.flatMap(([, prefix]) => operations.map((operation) => [`${prefix}-${operation.toLowerCase()}`, true]))); setPermissions(next); try { const result = await supervisorApi.updatePermissions(permissionGroups[activeRole], next); setPermissions(result?.permissions || next); } catch (requestError) { setError(requestError.message || "Permission changes could not be saved."); } };
  return <>
    <div className="supervisor-page-heading"><div><p className="supervisor-eyebrow">Access Center</p><h1>Roles & Access Control</h1><p className="supervisor-subtitle">Manage role-based permissions and access levels.</p></div><button className="supervisor-primary-button" type="button" onClick={enableAll}><SupervisorIcon name="shield" size={17} /> Enable all</button></div>
    <div className="roles-layout"><section className="supervisor-panel role-selector"><div className="supervisor-panel-heading"><div><p className="supervisor-eyebrow">Workspace roles</p><h2>Roles</h2></div><SupervisorIcon name="users" /></div>{roles.map((role) => <button className={`role-selector-item${activeRole === role ? " active" : ""}`} type="button" key={role} onClick={() => setActiveRole(role)}><span className="role-selector-icon"><SupervisorIcon name={role === "HR" ? "shield" : role === "Employee" ? "user" : "heart"} size={18} /></span><span><strong>{role}</strong><small>Modules configurable</small></span><SupervisorIcon name="chevron" size={16} /></button>)}</section><section className="supervisor-panel permissions-panel"><div className="supervisor-panel-heading"><div><p className="supervisor-eyebrow">Permissions for {activeRole}</p><h2>Permission Matrix</h2></div><span className="role-pill">{activeRole}</span></div>{error && <p className="form-error">{error}</p>}{loading ? <div className="supervisor-loading compact"><span className="supervisor-spinner" />Loading permissions…</div> : <div className="permission-table-wrap"><table className="permission-table"><thead><tr><th>Module</th>{operations.map((operation) => <th key={operation}>{operation}</th>)}</tr></thead><tbody>{resources.map(([resource, prefix]) => <tr key={resource}><td><strong>{resource}</strong></td>{operations.map((operation) => { const key = `${prefix}-${operation.toLowerCase()}`; const enabled = Boolean(permissions[key]); return <td key={key}><button className={`permission-toggle${enabled ? " active" : ""}`} type="button" onClick={() => togglePermission(key)} aria-label={`${resource} ${operation} permission`}><span /></button></td>; })}</tr>)}</tbody></table></div>}<p className="permission-note"><SupervisorIcon name="shield" size={15} /> Changes are saved to the role-permissions API.</p></section></div>
  </>;
}

export default RolesAccess;
