import { useState } from "react";
import { Outlet } from "react-router-dom";
import RouteLoadingScreen from "../../components/RouteLoadingScreen.jsx";
import usePageStylesheets from "../../hooks/usePageStylesheets.js";
import QueryModal from "../../components/QueryModal.jsx";
import { getAuthSession } from "../homepage/authService.js";
import { RolePermissionsProvider } from "../shared/roleAccessContext.jsx";

export default function HRLayout() {
  const stylesReady = usePageStylesheets("/hr-shared-layout.css");
  const [queryOpen, setQueryOpen] = useState(false);
  const profile = getAuthSession()?.profile;

  if (!stylesReady) return <RouteLoadingScreen />;

  return (
    <RolePermissionsProvider group="hr" role="HR">
    <div className="hr-workspace-layout">
      <div className="hr-route-content"><Outlet /></div>
      <footer className="hr-shared-footer">
        <div className="hr-shared-footer-links">
          <a href="/#about" target="_blank" rel="noopener noreferrer">About us</a>
          <a href="#contact" onClick={(event) => { event.preventDefault(); setQueryOpen(true); }}>Contact us</a>
        </div>
        <p>© 2026 Stack Builders. Built with wellness in mind.</p>
      </footer>
      <QueryModal open={queryOpen} onClose={() => setQueryOpen(false)} user={profile} userType="HR" />
    </div>
    </RolePermissionsProvider>
  );
}
