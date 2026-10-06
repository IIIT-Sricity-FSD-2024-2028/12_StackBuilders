import { useMemo, useState } from "react";
import "../admin-role-access.css";

const permissionGroups = [
  { title: "User Management", items: ["View users", "Invite users", "Edit user profiles", "Remove users"] },
  { title: "Wellness Programs", items: ["View programs", "Create programs", "Review check-ins", "Manage consultations"] },
  { title: "Reports & Billing", items: ["View reports", "Export reports", "View revenue", "Manage subscriptions"] },
];

const initialPermissions = {
  Admin: ["View users", "Invite users", "Edit user profiles", "Remove users", "View programs", "Create programs", "Review check-ins", "Manage consultations", "View reports", "Export reports", "View revenue"],
  HR: ["View users", "View programs", "Review check-ins", "View reports"],
  Expert: ["View programs", "Review check-ins", "Manage consultations"],
  Employee: ["View programs"],
};

function RolesAccess() {
  const [selectedRole, setSelectedRole] = useState("Admin");
  const [permissions, setPermissions] = useState(initialPermissions);
  const selectedPermissions = permissions[selectedRole];
  const permissionCount = selectedPermissions.length;
  const totalPermissions = permissionGroups.reduce((total, group) => total + group.items.length, 0);

  const roleDescription = useMemo(() => ({
    Admin: "Full platform access for administrators.",
    HR: "Manage workplace wellness activity and employee programs.",
    Expert: "Support consultations and wellness check-ins.",
    Employee: "Access personal wellness programs and resources.",
  }[selectedRole]), [selectedRole]);

  function togglePermission(permission) {
    setPermissions((current) => {
      const currentRolePermissions = current[selectedRole];
      const nextRolePermissions = currentRolePermissions.includes(permission)
        ? currentRolePermissions.filter((item) => item !== permission)
        : [...currentRolePermissions, permission];
      return { ...current, [selectedRole]: nextRolePermissions };
    });
  }

  return (
    <main className="admin-role-page">
      <header className="admin-role-heading">
        <div>
          <p className="admin-eyebrow">Security Center</p>
          <h1>Roles &amp; Access</h1>
          <p>Review permissions by role and keep access aligned with each workspace responsibility.</p>
        </div>
        <button className="admin-primary-button" type="button">+ Create Role</button>
      </header>

      <section className="admin-role-layout">
        <aside className="admin-role-list" aria-label="Available roles">
          <div className="admin-role-list-heading"><span>Roles</span><strong>4</strong></div>
          {Object.keys(initialPermissions).map((role) => (
            <button className={`admin-role-option${selectedRole === role ? " selected" : ""}`} key={role} type="button" onClick={() => setSelectedRole(role)}>
              <span className="admin-role-avatar">{role.slice(0, 1)}</span>
              <span><strong>{role}</strong><small>{permissions[role].length} permissions</small></span>
              <span aria-hidden="true">›</span>
            </button>
          ))}
        </aside>

        <section className="admin-permission-panel">
          <div className="admin-permission-heading">
            <div><p className="admin-eyebrow">Selected role</p><h2>{selectedRole} permissions</h2><p>{roleDescription}</p></div>
            <span className="admin-permission-count">{permissionCount}/{totalPermissions} enabled</span>
          </div>

          <div className="admin-permission-groups">
            {permissionGroups.map((group) => (
              <div className="admin-permission-group" key={group.title}>
                <h3>{group.title}</h3>
                {group.items.map((permission) => {
                  const enabled = selectedPermissions.includes(permission);
                  return (
                    <label className="admin-permission-row" key={permission}>
                      <input type="checkbox" checked={enabled} onChange={() => togglePermission(permission)} />
                      <span className="admin-checkmark" aria-hidden="true">{enabled ? "✓" : ""}</span>
                      <span>{permission}</span>
                    </label>
                  );
                })}
              </div>
            ))}
          </div>
          <p className="admin-role-note">Changes are currently previewed locally. They will be saved through the permissions API during backend integration.</p>
        </section>
      </section>
    </main>
  );
}

export default RolesAccess;
