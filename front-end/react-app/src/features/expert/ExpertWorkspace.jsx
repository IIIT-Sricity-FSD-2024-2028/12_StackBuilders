import { useEffect, useState } from "react";
import ExpertIcon from "./components/ExpertIcon.jsx";
import ExpertNavigation from "./components/ExpertNavigation.jsx";
import { loadExpertWorkspaceData, saveExpertWorkspaceData } from "./expertData.js";
import ExpertDashboard from "./pages/ExpertDashboard.jsx";
import "./expert.css";

function ExpertWorkspace() {
  const [data, setData] = useState(loadExpertWorkspaceData);

  useEffect(() => {
    saveExpertWorkspaceData(data);
  }, [data]);

  return <div className="expert-workspace">
    <nav className="expert-navbar" aria-label="Expert workspace navigation">
      <div className="expert-logo">Stack Builders</div>
      <ExpertNavigation activeView="dashboard" onNavigate={() => {}} />
      <div className="expert-nav-right">
        <span>Welcome back, Wellness Expert!</span>
        <button type="button" aria-label="Notifications"><ExpertIcon name="bell" size={18} /></button>
        <button type="button" aria-label="Profile"><ExpertIcon name="user" size={18} /></button>
      </div>
    </nav>
    <main className="expert-content"><ExpertDashboard data={data} onNavigate={() => {}} onOpenCheckin={() => {}} /></main>
    <footer className="expert-footer">
      <div className="expert-footer-links"><a href="#">About us</a><a href="#">Contact us</a></div>
      <p>© 2026 Stack Builders. Built with wellness in mind.</p>
    </footer>
  </div>;
}

export default ExpertWorkspace;
