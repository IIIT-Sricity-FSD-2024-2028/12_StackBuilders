import { useState } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import Sidebar from "../components/Sidebar.jsx";

function DashboardLayout({ roles }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-shell">
      <Navbar onMenuToggle={() => setSidebarOpen((open) => !open)} />
      <div className="workspace-shell">
        <Sidebar
          roles={roles}
          isOpen={sidebarOpen}
          onNavigate={() => setSidebarOpen(false)}
        />
        <main className="workspace-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
