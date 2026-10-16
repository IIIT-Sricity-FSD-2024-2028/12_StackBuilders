import { useEffect, useState } from "react";
import RouteLoadingScreen from "../../../components/RouteLoadingScreen.jsx";
import usePageStylesheets from "../../../hooks/usePageStylesheets.js";
import usePersistedTab from "../../../hooks/usePersistedTab.js";
import { cacheRolePermissions } from "../../shared/roleAccessContext.jsx";
import {
  makeDefaultRolePermissions,
  ROLE_ACCESS_ACTIONS,
  ROLE_ACCESS_RESOURCES,
  ROLE_ACCESS_ROLES,
} from "../../shared/roleAccessConfig.js";
import adminApi from "../adminApi.js";

const roleLabels = ROLE_ACCESS_ROLES.map(({ label }) => label);

function RolesAccess() {
  const stylesReady = usePageStylesheets("/admin-roles-legacy.css");
  const [selectedRole, setSelectedRole] = usePersistedTab("stackbuilders.admin.rolesAccessTab", "HR", roleLabels);
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("Changes save automatically");
  const [reloadCount, setReloadCount] = useState(0);

  const selectedRoleConfig = ROLE_ACCESS_ROLES.find(({ label }) => label === selectedRole) || ROLE_ACCESS_ROLES[0];
  const resources = ROLE_ACCESS_RESOURCES[selectedRoleConfig.group];

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    setNotice("Loading permissions…");

    adminApi.getPermissions(selectedRoleConfig.group)
      .then((result) => {
        if (!active) return;
        setPermissions(cacheRolePermissions(selectedRoleConfig.group, result?.permissions || makeDefaultRolePermissions()));
        setNotice("Changes save automatically");
      })
      .catch((loadError) => {
        if (!active) return;
        setError(loadError.message || "Could not load permissions.");
        setNotice("Permissions could not be loaded");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [selectedRoleConfig.group, reloadCount]);

  async function savePermissions(nextPermissions) {
    if (saving || loading || error) return;

    const previousPermissions = permissions;
    setSaving(true);
    setError("");
    setNotice("Saving changes…");
    setPermissions(nextPermissions);

    try {
      const result = await adminApi.updatePermissions(selectedRoleConfig.group, nextPermissions);
      setPermissions(cacheRolePermissions(selectedRoleConfig.group, result?.permissions || nextPermissions));
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
      const result = await adminApi.resetPermissions(selectedRoleConfig.group);
      setPermissions(cacheRolePermissions(selectedRoleConfig.group, result?.permissions || makeDefaultRolePermissions()));
      setNotice("Defaults restored from the backend");
    } catch (resetError) {
      setNotice("Defaults could not be restored");
      setError(resetError.message || "Permissions could not be reset.");
    } finally {
      setSaving(false);
    }
  }

  if (!stylesReady) return <RouteLoadingScreen />;

  return (
    <main className="container">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Permissions</p>
          <h1>Roles &amp; Access Control</h1>
          <p className="subtitle">Manage role-based permissions and access levels</p>
        </div>
      </div>

      <div className="layout">
        <div className="roles">
          <h3>Roles</h3>
          {ROLE_ACCESS_ROLES.map(({ label, icon }) => (
            <div
              aria-disabled={saving}
              aria-pressed={selectedRole === label}
              className={`role${selectedRole === label ? " active" : ""}`}
              key={label}
              onClick={() => !saving && setSelectedRole(label)}
              onKeyDown={(event) => {
                if (!saving && (event.key === "Enter" || event.key === " ")) setSelectedRole(label);
              }}
              role="button"
              tabIndex={saving ? -1 : 0}
            >
              <i className={`fa ${icon}`} />
              <div><strong>{label}</strong><span>Modules configurable</span></div>
            </div>
          ))}
        </div>

        <div className="permissions" data-permission-group={selectedRoleConfig.group}>
          <h3>Permissions for {selectedRole}</h3>
          <p className="subtitle small">Toggle individual permissions for each workflow</p>
          {error && (
            <div role="alert">
              <p className="permission-status">{error}</p>
              <button className="reset" type="button" onClick={() => setReloadCount((count) => count + 1)}>Retry</button>
            </div>
          )}
          {loading ? <p className="permission-status" role="status">Loading permissions…</p> : !error && (
            <table className="permission-matrix">
              <thead><tr><th>Module</th>{ROLE_ACCESS_ACTIONS.map((action) => <th key={action}>{action}</th>)}</tr></thead>
              <tbody>
                {resources.map(([label, prefix]) => (
                  <tr key={prefix}>
                    <td>{label}</td>
                    {ROLE_ACCESS_ACTIONS.map((action) => {
                      const key = `${prefix}-${action.toLowerCase()}`;
                      const enabled = Boolean(permissions[key]);
                      return (
                        <td className="permission-cell" key={key}>
                          <button
                            aria-label={`${label} ${action} permission ${enabled ? "enabled" : "disabled"}`}
                            aria-pressed={enabled}
                            className={`toggle${enabled ? " active" : ""}`}
                            disabled={saving}
                            onClick={() => togglePermission(prefix, action)}
                            type="button"
                          >
                            <span className="toggle-symbol">{enabled ? "✓" : "✕"}</span>
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div className="actions">
            <span className="permission-status small" role="status">{loading ? "Loading permissions…" : saving ? "Saving changes…" : notice}</span>
            <button className="reset" disabled={loading || saving || Boolean(error)} type="button" onClick={resetPermissions}>Reset to Default</button>
          </div>
        </div>
      </div>
    </main>
  );
}

export default RolesAccess;
