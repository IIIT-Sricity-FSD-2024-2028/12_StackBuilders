import { useEffect } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import RouteLoadingScreen from "../../components/RouteLoadingScreen.jsx";
import usePageStylesheets from "../../hooks/usePageStylesheets.js";
import { logout } from "../homepage/authService.js";

const navigationItems = [
  ["chart-pie", "Dashboard", "/admin"],
  ["users", "User Management", "/admin/users"],
  ["user-shield", "Roles & Access", "/admin/roles-access"],
  ["database", "Company Management", "/admin/companies"],
  ["chart-column", "Reports", "/admin/reports"],
  ["dollar-sign", "Revenue", "/admin/revenue"],
  ["gear", "Settings", "/admin/settings"],
];

function AdminConsoleLayout() {
  const stylesReady = usePageStylesheets("/admin-layout-legacy.css");
  const navigate = useNavigate();

  useEffect(() => {
    document.body.classList.add("app-body");
    return () => {
      document.body.classList.remove("app-body");
    };
  }, []);

  function handleLogout() {
    logout();
    navigate("/");
  }

  if (!stylesReady) return <RouteLoadingScreen />;

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="brand-lockup">
          <div className="brand-mark"><i className="fa fa-layer-group" /></div>
          <div className="brand-copy">
            <strong>Stack Builders</strong>
            <span>Admin Console</span>
          </div>
        </div>

        <div className="sidebar-section-label">Workspace</div>
        <nav className="sidebar-nav" aria-label="Admin workspace">
          {navigationItems.map(([icon, label, path]) => (
            <NavLink
              className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}
              end={path === "/admin"}
              key={path}
              to={path}
            >
              <i className={`fa fa-${icon}`} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-card">
          <h3>Workspace Overview</h3>
          <p>Connect your project data here to surface activity, alerts, and the most important workflows.</p>
          <NavLink className="mini-button" to="/admin/reports"><i className="fa fa-arrow-up-right-from-square" />Open reports</NavLink>
          <button type="button" onClick={handleLogout} aria-label="Log out">Log out</button>
        </div>
      </aside>

      <div className="app-main">
        <Outlet />
      </div>
    </div>
  );
}

export default AdminConsoleLayout;
