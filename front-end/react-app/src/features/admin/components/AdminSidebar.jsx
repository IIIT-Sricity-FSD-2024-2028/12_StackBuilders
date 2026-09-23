import AdminIcon from "./AdminIcon.jsx";

const navigation = [
  ["dashboard", "Dashboard", "chart"],
  ["users", "User Management", "users"],
  ["roles", "Roles & Access", "shield"],
  ["companies", "Company Management", "database"],
  ["reports", "Reports", "file"],
];

function AdminSidebar({ activeView = "dashboard", onSelect = () => {}, isOpen = false }) {
  return (
    <aside className={`admin-feature-sidebar${isOpen ? " is-open" : ""}`}>
      <div className="admin-feature-brand"><AdminIcon name="layer" /><span>Administrator Console</span></div>
      <nav aria-label="Administrator workspace">
        {navigation.map(([id, label, icon]) => (
          <button className={activeView === id ? "active" : ""} key={id} type="button" onClick={() => onSelect(id)}>
            <AdminIcon name={icon} size={18} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}

export default AdminSidebar;
