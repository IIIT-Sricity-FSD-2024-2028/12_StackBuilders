import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import RouteLoadingScreen from "../../../components/RouteLoadingScreen.jsx";
import usePageStylesheets from "../../../hooks/usePageStylesheets.js";
import usePersistedTab from "../../../hooks/usePersistedTab.js";
import { fetchRolePermissions, resetRolePermissions, saveRolePermissions } from "../../shared/roleAccessSlice.js";
import {
  ROLE_ACCESS_ACTIONS,
  ROLE_ACCESS_RESOURCES,
  ROLE_ACCESS_ROLES,
} from "../../shared/roleAccessConfig.js";

const roleLabels = ROLE_ACCESS_ROLES.map(({ label }) => label);

function RolesAccess() {
  const stylesReady = usePageStylesheets("/admin-roles-legacy.css");
  const dispatch = useDispatch();
  const [selectedRole, setSelectedRole] = usePersistedTab("stackbuilders.admin.rolesAccessTab", "HR", roleLabels);
  const [notice, setNotice] = useState("Changes save automatically");

  const selectedRoleConfig = ROLE_ACCESS_ROLES.find(({ label }) => label === selectedRole) || ROLE_ACCESS_ROLES[0];
  const resources = ROLE_ACCESS_RESOURCES[selectedRoleConfig.group];
  const roleState = useSelector((state) => state.roleAccess.groups[selectedRoleConfig.group]);
  const permissions = roleState?.permissions || {};
  const loading = !roleState || roleState.status === "loading";
  const saving = roleState?.status === "saving";
  const error = roleState?.error || "";

  useEffect(() => {
    setNotice("Loading permissions…");
    dispatch(fetchRolePermissions({ group: selectedRoleConfig.group, role: "Admin" }))
      .unwrap().then(() => setNotice("Changes save automatically"))
      .catch(() => setNotice("Permissions could not be loaded"));
  }, [dispatch, selectedRoleConfig.group]);

  async function savePermissions(nextPermissions) {
    if (saving || loading || error) return;

    setNotice("Saving changes…");

    try {
      await dispatch(saveRolePermissions({ group: selectedRoleConfig.group, role: "Admin", permissions: nextPermissions })).unwrap();
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
      await dispatch(resetRolePermissions({ group: selectedRoleConfig.group, role: "Admin" })).unwrap();
      setNotice("Defaults restored from the backend");
    } catch {
      setNotice("Defaults could not be restored");
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
              <button className="reset" type="button" onClick={() => dispatch(fetchRolePermissions({ group: selectedRoleConfig.group, role: "Admin" }))}>Retry</button>
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
