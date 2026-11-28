import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import SupervisorDashboard from "./pages/SupervisorDashboard.jsx";
import UserManagement from "./pages/UserManagement.jsx";
import CompanyManagement from "./pages/CompanyManagement.jsx";
import RolesAccess from "./pages/RolesAccess.jsx";
import Reports from "./pages/Reports.jsx";
import Revenue from "./pages/Revenue.jsx";
import Queries from "./pages/Queries.jsx";
import Settings from "./pages/Settings.jsx";
import SupervisorSidebar from "./components/SupervisorSidebar.jsx";
import SupervisorIcon from "./components/SupervisorIcon.jsx";
import { signOut } from "../shared/authSlice.js";
import usePersistedTab from "../../hooks/usePersistedTab.js";
import "./supervisor.css";

const navigationItems = [["chart-pie", "Dashboard", "dashboard"], ["users", "User Management", "users"], ["user-shield", "Roles & Access", "roles"], ["database", "Company Management", "companies"], ["chart-column", "Reports", "reports"], ["dollar-sign", "Revenue", "revenue"], ["envelope", "Queries", "queries"], ["gear", "Settings", "settings"]];

function SupervisorWorkspace() {
  const dispatch = useDispatch();
  const navigateHome = useNavigate();
  const [activeView, setActiveView] = usePersistedTab("stackbuilders.supervisor.activeView", "dashboard", navigationItems.map(([, , view]) => view));
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    document.body.classList.add("app-body");
    return () => document.body.classList.remove("app-body");
  }, []);

  const navigate = (view) => { setActiveView(view); setSidebarOpen(false); };

  const page = {
    dashboard: <SupervisorDashboard navigate={navigate} />,
    users: <UserManagement />,
    companies: <CompanyManagement />,
    roles: <RolesAccess />,
    reports: <Reports />,
    revenue: <Revenue />,
    queries: <Queries />,
    settings: <Settings />,
  }[activeView];

  const session = useSelector((state) => state.auth.session);
  const profileName = session?.profile?.name || session?.username || "Supervisor";
  const initials = profileName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "SB";
  const activeLabel = navigationItems.find(([, label, view]) => view === activeView)?.[1] || "Dashboard";
  return <div className="supervisor-workspace">
    <SupervisorSidebar activeView={activeView} onSelect={navigate} isOpen={sidebarOpen} />
    <main className="supervisor-main">
      <header className="supervisor-topbar">
        <button className="supervisor-mobile-menu" type="button" onClick={() => setSidebarOpen((open) => !open)} aria-label="Toggle supervisor navigation">
          <span /><span /><span />
        </button>
        <div className="supervisor-breadcrumb"><SupervisorIcon name="layer" size={16} /><span>Workspace</span><span>/</span><strong>{activeLabel}</strong></div>
        <div className="supervisor-topbar-actions"><span className="supervisor-avatar" title={profileName}>{initials}</span><button className="supervisor-logout-button" type="button" onClick={() => { void dispatch(signOut()); navigateHome("/"); }}>Log out</button></div>
      </header>
      <div className="supervisor-content">
        {page}
      </div>
    </main>
  </div>;
}

export default SupervisorWorkspace;
