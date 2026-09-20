import SupervisorIcon from "./SupervisorIcon.jsx";

const navigation = [
  ["dashboard", "Dashboard", "chart"],
  ["users", "User Management", "users"],
  ["roles", "Roles & Access", "shield"],
  ["companies", "Company Management", "building"],
  ["reports", "Reports", "file"],
  ["revenue", "Revenue", "dollar"],
  ["queries", "Queries", "mail"],
  ["settings", "Settings", "gear"],
];

function SupervisorSidebar({ activeView, onSelect, isOpen = false }) {
  return (
    <aside className={`supervisor-sidebar${isOpen ? " is-open" : ""}`}>
      <div className="supervisor-brand-lockup">
        <div className="supervisor-brand-mark"><SupervisorIcon name="layer" size={23} /></div>
        <div>
          <strong>Stack Builders</strong>
          <span>Supervisor Console</span>
        </div>
      </div>

      <div className="supervisor-sidebar-label">Workspace</div>
      <nav className="supervisor-sidebar-nav" aria-label="Supervisor workspace">
        {navigation.map(([id, label, icon]) => (
          <button
            className={`supervisor-sidebar-link${activeView === id ? " active" : ""}`}
            key={id}
            type="button"
            onClick={() => onSelect(id)}
          >
            <SupervisorIcon name={icon} size={18} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      <div className="supervisor-sidebar-card">
        <h3>Workspace Overview</h3>
        <p>Connect your project data here to surface activity, alerts, and the most important workflows.</p>
        <button type="button" onClick={() => onSelect("reports")}>
          <SupervisorIcon name="file" size={15} /> Open reports
        </button>
      </div>
    </aside>
  );
}

export default SupervisorSidebar;
