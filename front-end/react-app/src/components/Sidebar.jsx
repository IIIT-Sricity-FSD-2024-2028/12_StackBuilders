import { NavLink } from "react-router-dom";

function Sidebar({ roles, isOpen, onNavigate }) {
  return (
    <aside className={`sidebar ${isOpen ? "is-open" : ""}`} aria-label="Role navigation">
      <div className="sidebar-heading">
        <span className="sidebar-kicker">Workspaces</span>
        <strong>Choose a role</strong>
      </div>
      <nav className="sidebar-links">
        {roles.map(([role, path]) => (
          <NavLink
            className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
            key={path}
            onClick={onNavigate}
            to={path}
          >
            <span className="role-mark" aria-hidden="true">{role.slice(0, 1)}</span>
            <span>{role}</span>
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">Shared React foundation</div>
    </aside>
  );
}

export default Sidebar;
