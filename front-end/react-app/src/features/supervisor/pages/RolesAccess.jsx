import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import useAutoRefresh from "../../../hooks/useAutoRefresh.js";
import usePersistedTab from "../../../hooks/usePersistedTab.js";
import {
  ROLE_ACCESS_ACTIONS,
  ROLE_ACCESS_RESOURCES,
  ROLE_ACCESS_ROLES,
} from "../../shared/roleAccessConfig.js";
import { fetchRolePermissions, resetRolePermissions, saveRolePermissions } from "../../shared/roleAccessSlice.js";
import SupervisorIcon from "../components/SupervisorIcon.jsx";

const roleLabels = ROLE_ACCESS_ROLES.map(({ label }) => label);

function RolesAccess() {
  const dispatch = useDispatch();
  const [activeRole, setActiveRole] = usePersistedTab("stackbuilders.supervisor.rolesAccessTab", "HR", roleLabels);
  const [notice, setNotice] = useState("Changes save automatically");

  const activeRoleConfig = ROLE_ACCESS_ROLES.find(({ label }) => label === activeRole) || ROLE_ACCESS_ROLES[0];
  const resources = ROLE_ACCESS_RESOURCES[activeRoleConfig.group];
  const roleState = useSelector((state) => state.roleAccess.groups[activeRoleConfig.group]);
  const permissions = roleState?.permissions || {};
  const loading = !roleState || roleState.status === "loading";
  const saving = roleState?.status === "saving";
  const error = roleState?.error || "";

  useEffect(() => {
    setNotice("Loading permissions…");
    dispatch(fetchRolePermissions({ group: activeRoleConfig.group, role: "Supervisor" }))
      .unwrap().then(() => setNotice("Changes save automatically"))
      .catch(() => setNotice("Permissions could not be loaded"));
  }, [dispatch, activeRoleConfig.group]);

  useAutoRefresh(async () => {
    if (saving || loading) return;
    await dispatch(fetchRolePermissions({ group: activeRoleConfig.group, role: "Supervisor" })).unwrap();
  }, saving || loading ? "" : `supervisor-permissions:${activeRoleConfig.group}`);

  async function savePermissions(nextPermissions) {
    if (saving || loading || error) return;

    setNotice("Saving changes…");
    try {
      await dispatch(saveRolePermissions({ group: activeRoleConfig.group, role: "Supervisor", permissions: nextPermissions })).unwrap();
      setNotice("Changes saved to the backend");
    } catch {
      setNotice("Changes were not saved");
    }
  }

  function togglePermission(prefix, action) {
    const key = `${prefix}-${action.toLowerCase()}`;
    void savePermissions({ ...permissions, [key]: !permissions[key] });
  }

  async function resetPermissions() {
    if (saving || loading || error) return;

    setNotice("Restoring defaults…");
    try {
      await dispatch(resetRolePermissions({ group: activeRoleConfig.group, role: "Supervisor" })).unwrap();
      setNotice("Defaults restored from the backend");
    } catch {
      setNotice("Defaults could not be restored");
    }
  }

  return (
    <>
      <div className="supervisor-page-heading">
        <div>
          <p className="supervisor-eyebrow">Permissions</p>
          <h1>Roles &amp; access control</h1>
          <p className="supervisor-subtitle">Manage role-based permissions and access levels across the wellness platform.</p>
        </div>
      </div>

      <div className="roles-layout">
        <aside className="supervisor-panel role-selector">
          <div className="supervisor-panel-heading">
            <div><p className="supervisor-eyebrow">Directory</p><h2>Roles</h2></div>
          </div>
          {ROLE_ACCESS_ROLES.map(({ label, icon }) => (
            <button
              aria-pressed={activeRole === label}
              className={`role-selector-item${activeRole === label ? " active" : ""}`}
              disabled={saving}
              key={label}
              onClick={() => setActiveRole(label)}
              type="button"
            >
              <span className="role-selector-icon">
                <SupervisorIcon name={icon === "fa-user-shield" ? "shield" : icon === "fa-heart-pulse" ? "heart" : "user"} size={18} />
              </span>
              <span><strong>{label}</strong><small>Modules configurable</small></span>
              <SupervisorIcon name="chevron" size={16} />
            </button>
          ))}
        </aside>

        <section className="supervisor-panel permissions">
          <div className="supervisor-panel-heading">
            <div>
              <p className="supervisor-eyebrow">Access matrix</p>
              <h2>Permissions for {activeRole}</h2>
              <p className="supervisor-subtitle">Toggle individual permissions for each workflow.</p>
            </div>
          </div>

          {error && <p className="supervisor-empty-state" role="alert">{error}</p>}
          {loading ? <p className="supervisor-empty-state" role="status">Loading permissions…</p> : !error && (
            <div className="permission-table-wrap">
              <table className="permission-table">
                <thead><tr><th>Module</th>{ROLE_ACCESS_ACTIONS.map((action) => <th key={action}>{action}</th>)}</tr></thead>
                <tbody>
                  {resources.map(([resource, prefix]) => (
                    <tr key={prefix}>
                      <td>{resource}</td>
                      {ROLE_ACCESS_ACTIONS.map((action) => {
                        const key = `${prefix}-${action.toLowerCase()}`;
                        const enabled = Boolean(permissions[key]);
                        return (
                          <td key={key}>
                            <button
                              aria-label={`${resource} ${action} permission ${enabled ? "enabled" : "disabled"}`}
                              aria-pressed={enabled}
                              className={`permission-toggle${enabled ? " active" : ""}`}
                              disabled={saving}
                              onClick={() => togglePermission(prefix, action)}
                              type="button"
                            ><span /></button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="form-actions">
            <span className="permission-note" role="status">
              <SupervisorIcon name="check" size={15} /> {loading ? "Loading permissions…" : saving ? "Saving permissions…" : notice}
            </span>
            <button
              className="supervisor-outline-button"
              disabled={loading || saving || Boolean(error)}
              onClick={resetPermissions}
              type="button"
            >Reset to default</button>
            {error && <button className="supervisor-outline-button" disabled={loading || saving} onClick={() => dispatch(fetchRolePermissions({ group: activeRoleConfig.group, role: "Supervisor" }))} type="button">Retry</button>}
          </div>
        </section>
      </div>
    </>
  );
}

export default RolesAccess;
