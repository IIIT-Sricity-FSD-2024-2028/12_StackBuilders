import { useEffect, useState } from "react";
import useAutoRefresh from "../../../hooks/useAutoRefresh.js";
import usePersistedTab from "../../../hooks/usePersistedTab.js";
import {
  makeDefaultRolePermissions,
  ROLE_ACCESS_ACTIONS,
  ROLE_ACCESS_RESOURCES,
  ROLE_ACCESS_ROLES,
} from "../../shared/roleAccessConfig.js";
import { cacheRolePermissions } from "../../shared/roleAccessContext.jsx";
import SupervisorIcon from "../components/SupervisorIcon.jsx";
import supervisorApi from "../supervisorApi.js";

const roleLabels = ROLE_ACCESS_ROLES.map(({ label }) => label);

function RolesAccess() {
  const [activeRole, setActiveRole] = usePersistedTab("stackbuilders.supervisor.rolesAccessTab", "HR", roleLabels);
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("Changes save automatically");
  const [reloadCount, setReloadCount] = useState(0);

  const activeRoleConfig = ROLE_ACCESS_ROLES.find(({ label }) => label === activeRole) || ROLE_ACCESS_ROLES[0];
  const resources = ROLE_ACCESS_RESOURCES[activeRoleConfig.group];

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    setNotice("Loading permissions…");

    supervisorApi.getPermissions(activeRoleConfig.group)
      .then((result) => {
        if (!active) return;
        setPermissions(cacheRolePermissions(activeRoleConfig.group, result?.permissions || makeDefaultRolePermissions()));
        setNotice("Changes save automatically");
      })
      .catch((loadError) => {
        if (!active) return;
        setError(loadError.message || "Permissions could not be loaded.");
        setNotice("Permissions could not be loaded");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [activeRoleConfig.group, reloadCount]);

  useAutoRefresh(async () => {
    if (saving || loading) return;
    try {
      const result = await supervisorApi.getPermissions(activeRoleConfig.group);
      setPermissions(cacheRolePermissions(activeRoleConfig.group, result?.permissions || makeDefaultRolePermissions()));
      setError("");
    } catch (refreshError) {
      setError(refreshError.message || "Permissions could not be refreshed.");
    }
  }, saving || loading ? "" : `supervisor-permissions:${activeRoleConfig.group}`);

  async function savePermissions(nextPermissions) {
    if (saving || loading || error) return;

    const previousPermissions = permissions;
    setSaving(true);
    setError("");
    setNotice("Saving changes…");
    setPermissions(nextPermissions);

    try {
      const result = await supervisorApi.updatePermissions(activeRoleConfig.group, nextPermissions);
      setPermissions(cacheRolePermissions(activeRoleConfig.group, result?.permissions || nextPermissions));
      setNotice("Changes saved to the backend");
    } catch (saveError) {
      setPermissions(previousPermissions);
      setNotice("Changes were not saved");
      setError(saveError.message || "Permission changes could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  function togglePermission(prefix, action) {
    const key = `${prefix}-${action.toLowerCase()}`;
    void savePermissions({ ...permissions, [key]: !permissions[key] });
  }

  async function resetPermissions() {
    if (saving || loading || error) return;

    setSaving(true);
    setError("");
    setNotice("Restoring defaults…");
    try {
      const result = await supervisorApi.resetPermissions(activeRoleConfig.group);
      setPermissions(cacheRolePermissions(activeRoleConfig.group, result?.permissions || makeDefaultRolePermissions()));
      setNotice("Defaults restored from the backend");
    } catch (resetError) {
      setNotice("Defaults could not be restored");
      setError(resetError.message || "Permissions could not be reset.");
    } finally {
      setSaving(false);
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
            {error && <button className="supervisor-outline-button" disabled={loading || saving} onClick={() => setReloadCount((count) => count + 1)} type="button">Retry</button>}
          </div>
        </section>
      </div>
    </>
  );
}

export default RolesAccess;
