import { Outlet } from "react-router-dom";
import "./admin-dashboard.css";

function AdminIcon({ name }) {
  const paths = {
    layer: "M12 3 3 8l9 5 9-5-9-5Zm-9 9 9 5 9-5M3 16l9 5 9-5",
    chart: "M4 19V5 M4 19h17 M8 16v-4 M12 16V8 M16 16v-6 M20 16v-9",
    users: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M22 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75",
    shield: "M12 3 20 6v5c0 5-3.4 8.4-8 10-4.6-1.6-8-5-8-10V6l8-3Zm-3 9 2 2 4-4",
    database: "M4 5c0-1.1 3.6-2 8-2s8 .9 8 2-3.6 2-8 2-8-.9-8-2Zm0 0v7c0 1.1 3.6 2 8 2s8-.9 8-2V5m-16 7v7c0 1.1 3.6 2 8 2s8-.9 8-2v-7",
    report: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Zm0 0v6h6 M8 18h8 M8 14h4",
    dollar: "M12 2v20 M17 6.5c-.8-.9-2.1-1.5-3.8-1.5-2.1 0-3.7 1.1-3.7 2.8 0 4.2 8.2 1.8 8.2 6.4 0 1.8-1.6 3.2-4 3.2-1.8 0-3.3-.6-4.2-1.7",
    settings: "M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-1.7 1.7-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V20h-2.4v-.2a1.7 1.7 0 0 0-1.03-1.56 1.7 1.7 0 0 0-1.88.34l-.06.06-1.7-1.7.06-.06A1.7 1.7 0 0 0 8.4 15a1.7 1.7 0 0 0-1.56-1.03H6v-2.4h.2A1.7 1.7 0 0 0 7.76 10a1.7 1.7 0 0 0-.34-1.88l-.06-.06 1.7-1.7.06.06A1.7 1.7 0 0 0 11 6.76 1.7 1.7 0 0 0 12.03 5.2V5h2.4v.2A1.7 1.7 0 0 0 15.46 6.76a1.7 1.7 0 0 0 1.88-.34l.06-.06 1.7 1.7-.06.06A1.7 1.7 0 0 0 18.7 10a1.7 1.7 0 0 0 1.56 1.03h.2v2.4h-.2A1.7 1.7 0 0 0 19.4 15Z",
  };

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d={paths[name] || paths.chart} />
    </svg>
  );
}

const navigationItems = [
  ["chart", "Dashboard"],
  ["users", "User Management"],
  ["shield", "Roles & Access"],
  ["database", "Company Management"],
  ["report", "Reports"],
  ["dollar", "Revenue"],
  ["settings", "Settings"],
];

function AdminConsoleLayout() {
  return (
    <div className="admin-console-shell">
      <aside className="admin-console-sidebar">
        <div className="admin-brand-lockup">
          <div className="admin-brand-mark"><AdminIcon name="layer" /></div>
          <div className="admin-brand-copy">
            <strong>Stack Builders</strong>
            <span>Super User Console</span>
          </div>
        </div>

        <div className="admin-sidebar-label">Workspace</div>
        <nav className="admin-sidebar-nav" aria-label="Admin workspace">
          {navigationItems.map(([icon, label], index) => (
            <a
              className={`admin-sidebar-link${index === 0 ? " active" : ""}`}
              href={index === 0 ? "/admin" : index === 1 ? "/admin/users" : `#${label.toLowerCase().replaceAll(" ", "-")}`}
              key={label}
            >
              <AdminIcon name={icon} />
              {label}
            </a>
          ))}
        </nav>

        <div className="admin-sidebar-card">
          <h3>Workspace Overview</h3>
          <p>Connect your project data here to surface activity, alerts, and the most important workflows.</p>
          <a href="#reports"><AdminIcon name="report" />Open reports</a>
        </div>
      </aside>

      <div className="admin-console-main">
        <Outlet />
      </div>
    </div>
  );
}

export default AdminConsoleLayout;
