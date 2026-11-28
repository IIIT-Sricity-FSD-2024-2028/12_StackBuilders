import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import ExpertIcon from "./components/ExpertIcon.jsx";
import ExpertNavigation from "./components/ExpertNavigation.jsx";
import { signOut } from "../shared/authSlice.js";
import ExpertDashboard from "./pages/ExpertDashboard.jsx";
import ExpertConsultations from "./pages/ExpertConsultations.jsx";
import ExpertLiveSessions from "./pages/ExpertLiveSessions.jsx";
import ExpertCheckins from "./pages/ExpertCheckins.jsx";
import ExpertVideoLibrary from "./pages/ExpertVideoLibrary.jsx";
import DashboardProfileOverlay from "../../components/DashboardProfileOverlay.jsx";
import RouteLoadingScreen from "../../components/RouteLoadingScreen.jsx";
import VideoPlayerModal from "../shared/VideoPlayerModal.jsx";
import QueryModal from "../../components/QueryModal.jsx";
import QueryNotifications from "../../components/QueryNotifications.jsx";
import usePersistedTab from "../../hooks/usePersistedTab.js";
import usePageStylesheets from "../../hooks/usePageStylesheets.js";
import { RolePermissionsProvider, RolePermissionGate, useRoleAccess } from "../shared/roleAccessContext.jsx";
import "./expert.css";

function ExpertWorkspace() {
  return <RolePermissionsProvider group="wellness-expert" role="Wellness Expert"><RolePermissionGate anyOf={["reports-read", "user-management-read", "client-management-read"]}><ExpertWorkspaceContent /></RolePermissionGate></RolePermissionsProvider>;
}

function ExpertWorkspaceContent() {
  const { hasPermission } = useRoleAccess();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [activeView, setActiveView] = usePersistedTab("stackbuilders.expert.activeView", "dashboard", ["dashboard", "consultations", "checkins", "sessions", "videos"]);
  const [profileOpen, setProfileOpen] = useState(false);
  const [queryOpen, setQueryOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const expertProfile = useSelector((state) => state.auth.session?.profile || null);
  const consultationProfile = useSelector((state) => state.expert.consultations.profile);
  const canReadConsultations = hasPermission("user-management-read");
  const canReadClientFeatures = hasPermission("client-management-read");
  const availableViews = ["dashboard", ...(canReadConsultations ? ["consultations", "checkins"] : []), ...(canReadClientFeatures ? ["sessions", "videos"] : [])];
  const currentView = availableViews.includes(activeView) ? activeView : "dashboard";
  const navigateToView = (view) => { if (availableViews.includes(view)) setActiveView(view); };
  const expertName = expertProfile?.name || expertProfile?.fullName || consultationProfile?.name;
  const welcomeName = formatExpertWelcomeName(expertName);
  const legacyDashboard = currentView === "dashboard";
  const legacyConsultations = currentView === "consultations";
  const legacySessions = currentView === "sessions";
  const legacyCheckins = currentView === "checkins";
  const legacyVideos = currentView === "videos";

  useEffect(() => {
    if (activeView !== currentView) setActiveView(currentView);
  }, [activeView, currentView, setActiveView]);

  const pageStylesheets = legacyDashboard || legacyCheckins
    ? ["/expert-dashboard-legacy.css", "/expert-dashboard-nav-legacy.css", ...(legacyCheckins ? ["/expert-checkins-legacy.css"] : [])]
    : legacyConsultations
      ? ["/expert-consultations-legacy.css", "/expert-dashboard-nav-legacy.css"]
      : legacySessions
        ? ["/expert-live-session-legacy.css", "/expert-dashboard-nav-legacy.css"]
        : legacyVideos
          ? ["/expert-video-library-legacy.css", "/expert-dashboard-nav-legacy.css"]
          : [];
  const stylesReady = usePageStylesheets(pageStylesheets);

  function handleLogout() {
    void dispatch(signOut());
    navigate("/");
  }
  if (legacyDashboard || legacyConsultations || legacySessions || legacyCheckins || legacyVideos) {
    if (!stylesReady) return <RouteLoadingScreen />;
    return (
      <div className={legacyVideos ? "shell expert-video-library-shell" : legacyConsultations ? "wrapper" : "shell"}>
        <nav className="navbar" aria-label="Expert workspace navigation">
          <div className="logo">Stack Builders</div>
          <ExpertNavigation activeView={currentView} legacy availableViews={availableViews} onNavigate={navigateToView} />
          <div className="nav-right">
            <span>Welcome back, {welcomeName}!</span>
            <QueryNotifications user={expertProfile || consultationProfile} userType="Wellness Expert" />
            <button className="dashboard-profile-trigger" type="button" aria-label="Open profile" onClick={() => setProfileOpen(true)}>
              <i className="fa-regular fa-user" aria-hidden="true" />
            </button>
            <button type="button" onClick={handleLogout} style={{ display: "none" }}>Logout</button>
          </div>
        </nav>
        <main className={legacyDashboard || legacyCheckins ? "dashboard" : legacySessions ? "page" : legacyVideos ? "library-page" : undefined}>
          {legacyDashboard
            ? <ExpertDashboard canReadReports={hasPermission("reports-read")} canReadConsultations={canReadConsultations} canReadClientFeatures={canReadClientFeatures} onNavigate={navigateToView} onOpenCheckin={() => navigateToView("checkins")} onPlayVideo={setSelectedVideo} />
            : legacyConsultations
              ? <ExpertConsultations canUpdate={hasPermission("user-management-update")} />
              : legacySessions
                ? <ExpertLiveSessions canCreate={hasPermission("client-management-create")} canUpdate={hasPermission("client-management-update")} />
                : legacyCheckins
                  ? <ExpertCheckins canUpdate={hasPermission("user-management-update")} canCreateFollowUp={hasPermission("user-management-create")} onNavigate={navigateToView} />
                  : <ExpertVideoLibrary canCreate={hasPermission("client-management-create")} canDelete={hasPermission("client-management-delete")} />}
        </main>
        <footer className="footer"><div className="footer-links"><a href="/#about" target="_blank" rel="noopener noreferrer">About us</a><a className="contact-us-trigger" href="#contact" onClick={(event) => { event.preventDefault(); setQueryOpen(true); }}>Contact us</a></div><p>© 2026 Stack Builders. Built with wellness in mind.</p></footer>
        <QueryModal open={queryOpen} onClose={() => setQueryOpen(false)} user={expertProfile || consultationProfile} userType="Wellness Expert" />
        <DashboardProfileOverlay role="wellness" open={profileOpen} onClose={() => setProfileOpen(false)} />
        <VideoPlayerModal video={selectedVideo} onClose={() => setSelectedVideo(null)} />
      </div>
    );
  }

  return (
    <div className="expert-workspace">
      <nav className="expert-navbar" aria-label="Expert workspace navigation">
        <div className="expert-logo">Stack Builders</div>
        <ExpertNavigation activeView={currentView} availableViews={availableViews} onNavigate={navigateToView} />
        <div className="expert-nav-right"><span>Welcome back, {welcomeName}!</span><QueryNotifications user={expertProfile || consultationProfile} userType="Wellness Expert" /><button className="dashboard-profile-trigger" type="button" aria-label="Open profile" onClick={() => setProfileOpen(true)}><ExpertIcon name="user" size={18} /></button><button type="button" onClick={handleLogout}>Logout</button></div>
      </nav>
      <main className="expert-content">{currentView === "checkins" ? <ExpertCheckins canUpdate={hasPermission("user-management-update")} canCreateFollowUp={hasPermission("user-management-create")} onNavigate={navigateToView} /> : currentView === "sessions" ? <ExpertLiveSessions canCreate={hasPermission("client-management-create")} canUpdate={hasPermission("client-management-update")} /> : currentView === "consultations" ? <ExpertConsultations canUpdate={hasPermission("user-management-update")} /> : <ExpertVideoLibrary canCreate={hasPermission("client-management-create")} canDelete={hasPermission("client-management-delete")} />}</main>
      <footer className="expert-footer"><div className="expert-footer-links"><a href="/#about" target="_blank" rel="noopener noreferrer">About us</a><a className="contact-us-trigger" href="#contact" onClick={(event) => { event.preventDefault(); setQueryOpen(true); }}>Contact us</a></div><p>© 2026 Stack Builders. Built with wellness in mind.</p></footer>
      <QueryModal open={queryOpen} onClose={() => setQueryOpen(false)} user={expertProfile || consultationProfile} userType="Wellness Expert" />
      <DashboardProfileOverlay role="wellness" open={profileOpen} onClose={() => setProfileOpen(false)} />
      <VideoPlayerModal video={selectedVideo} onClose={() => setSelectedVideo(null)} />
    </div>
  );
}

function formatExpertWelcomeName(value) {
  const name = String(value || "Wellness Expert").trim();
  if (name === "Wellness Expert") return name;
  return /^dr\.?\s/i.test(name) ? name.replace(/^dr\.?\s*/i, "Dr. ") : `Dr. ${name}`;
}

export default ExpertWorkspace;
