import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import ExpertIcon from "./components/ExpertIcon.jsx";
import ExpertNavigation from "./components/ExpertNavigation.jsx";
import { saveExpertWorkspaceData } from "./expertData.js";
import { signOut } from "../shared/authSlice.js";
import { loadExpertDashboard } from "./dashboardSlice.js";
import { updateExpertConsultation, createExpertFollowUp, saveExpertAvailability } from "./consultationsSlice.js";
import { createExpertLiveSession, updateExpertLiveSession } from "./liveSessionsSlice.js";
import { sendExpertCheckinResponse } from "./checkinsSlice.js";
import { createExpertVideo, registerExpertVideoFiles, removeExpertVideo } from "./videosSlice.js";
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
import useAutoRefresh from "../../hooks/useAutoRefresh.js";
import { RolePermissionsProvider, RolePermissionGate, useRoleAccess } from "../shared/roleAccessContext.jsx";
import "./expert.css";

function normalizeCheckinType(value) {
  const type = String(value || "").trim().toLowerCase();
  return ["diet", "diet plan", "dietplan"].includes(type) ? "nutrition" : type;
}

function getCheckinPriority(record) {
  const value = (field) => record[field] === "" || record[field] == null ? Number.NaN : Number(record[field]);
  const type = normalizeCheckinType(record.checkinType);
  const supportNeeded = String(record.supportNeeded || "").toLowerCase();

  if (supportNeeded.includes("as soon as possible")) {
    return { priority: "high", urgencyReason: "The employee requested support as soon as possible." };
  }

  if (type === "mental") {
    if (value("stressScore") >= 8 || value("moodScore") <= 3) {
      return { priority: "high", urgencyReason: "Stress is high, mood is very low, or urgent support was requested." };
    }
    if (value("stressScore") >= 6 || value("moodScore") <= 5 || value("sleepHours") < 6) {
      return { priority: "medium", urgencyReason: "Mood, stress, or sleep may benefit from follow-up." };
    }
  }

  if (type === "nutrition") {
    if (value("mealConsistency") <= 3 || value("waterIntakeLiters") < 1.2 || value("energyScore") <= 3) {
      return { priority: "high", urgencyReason: "Hydration, energy, or meal consistency is low." };
    }
    if (value("mealConsistency") <= 5 || value("waterIntakeLiters") < 2 || value("energyScore") <= 5) {
      return { priority: "medium", urgencyReason: "Nutrition habits may benefit from adjustment or coaching." };
    }
  }

  if (type === "physical") {
    if (value("painScore") >= 8 || value("mobilityScore") <= 3 || value("recoveryScore") <= 3) {
      return { priority: "high", urgencyReason: "Pain, mobility, or recovery suggests a need for prompt follow-up." };
    }
    if (value("painScore") >= 6 || value("mobilityScore") <= 5 || value("recoveryScore") <= 5) {
      return { priority: "medium", urgencyReason: "Movement or recovery may benefit from coaching." };
    }
  }

  if (supportNeeded.includes("follow-up")) {
    return { priority: "medium", urgencyReason: "The employee requested a follow-up this week." };
  }
  return { priority: "stable", urgencyReason: "No immediate concern detected in the submitted check-in." };
}

function mapExpertConsultations(records) {
  return records.map((record) => ({
    ...record,
    employee: record.employeeName || record.employee || "Employee",
    requestedAt: record.requestedOn || record.requestedAt || record.createdAt,
    date: record.sessionDate || record.date,
    time: record.sessionTime || record.time,
    completed: String(record.status || "").toLowerCase() === "completed" || Boolean(record.completed),
  }));
}

function mapExpertCheckins(records, responses, specialization) {
  const specialty = String(specialization || "").toLowerCase();
  const checkinType = specialty.includes("nutrition") ? "nutrition" : specialty.includes("psych") || specialty.includes("mental") ? "mental" : "physical";
  return records.filter((record) => normalizeCheckinType(record.checkinType) === checkinType).map((record) => {
    const responseHistory = responses.filter((response) => response.checkinId === record.id).map((response) => ({ text: response.message, createdAt: response.createdAt, expertId: response.expertId, expertName: response.expertName }));
    const recordType = normalizeCheckinType(record.checkinType);
    const { priority, urgencyReason } = getCheckinPriority(record);
    const typeFields = recordType === "mental"
      ? [["Mood", record.moodScore], ["Stress", record.stressScore], ["Sleep", record.sleepHours], ["Focus", record.focusScore], ["Support", record.supportNeeded]]
      : recordType === "nutrition"
        ? [["Meal consistency", record.mealConsistency], ["Water", record.waterIntakeLiters], ["Energy", record.energyScore], ["Servings", record.servingsCount], ["Goal", record.nutritionGoal]]
        : [["Active minutes", record.activityMinutes], ["Steps", record.stepCount], ["Pain", record.painScore], ["Mobility", record.mobilityScore], ["Recovery", record.recoveryScore]];
    return {
      ...record,
      employee: record.employeeName || "Employee",
      department: "",
      submittedAt: record.submittedAt,
      priority,
      urgencyReason,
      reason: record.supportNeeded || record.nutritionGoal || record.workoutFocus || "Wellness check-in submitted.",
      metrics: typeFields.filter(([, value]) => value !== undefined && value !== "").map(([label, value]) => [label, value]),
      responses: responseHistory,
      followUpStatus: responseHistory.length ? "Suggestion sent" : String(record.supportNeeded || "").toLowerCase().includes("follow-up") ? "Follow-up requested" : "Not requested",
    };
  });
}

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
  const consultationState = useSelector((state) => state.expert.consultations);
  const sessions = useSelector((state) => state.expert.liveSessions.items);
  const checkins = useSelector((state) => state.expert.checkins.items);
  const videos = useSelector((state) => state.expert.videos.items);
  const data = useMemo(() => ({
    expert: { ...expertProfile, ...consultationState.profile, track: consultationState.profile.specialization || consultationState.profile.track || expertProfile?.specialization },
    availability: consultationState.availability,
    consultations: consultationState.items,
    sessions,
    checkins,
    videos,
  }), [expertProfile, consultationState, sessions, checkins, videos]);
  const canReadConsultations = hasPermission("user-management-read");
  const canReadClientFeatures = hasPermission("client-management-read");
  const availableViews = ["dashboard", ...(canReadConsultations ? ["consultations", "checkins"] : []), ...(canReadClientFeatures ? ["sessions", "videos"] : [])];
  const currentView = availableViews.includes(activeView) ? activeView : "dashboard";
  const navigateToView = (view) => { if (availableViews.includes(view)) setActiveView(view); };
  const expertSpecialization = expertProfile?.specialization || data.expert?.specialization || data.expert?.track;
  const expertName = expertProfile?.name || expertProfile?.fullName || data.expert?.name;
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

  const refresh = useCallback(async () => {
    if (!expertProfile?.id) return;
    try { await dispatch(loadExpertDashboard(expertProfile)).unwrap(); } catch { /* Feature slices retain their own errors and cached data. */ }
  }, [dispatch, expertProfile?.id, expertProfile?.companyId, expertProfile?.companyName, expertProfile?.specialization]);

  useEffect(() => { void refresh(); }, [refresh]);
  useAutoRefresh(refresh, (expertProfile?.id || "") + ":" + (expertProfile?.companyId || expertProfile?.companyName || "") + ":" + (expertProfile?.specialization || ""));
  useEffect(() => { saveExpertWorkspaceData(data); }, [data]);

  const createLiveSession = (session) => dispatch(createExpertLiveSession({ session, expert: expertProfile })).unwrap();
  const updateLiveSession = (id, session) => dispatch(updateExpertLiveSession({ id, session })).unwrap();
  const saveAvailability = (availableSlots) => dispatch(saveExpertAvailability({ expertId: expertProfile?.id, availableSlots })).unwrap();
  const sendCheckinResponse = (checkin, message) => dispatch(sendExpertCheckinResponse({ checkin, message, expert: expertProfile })).unwrap();
  const createFollowUpConsultation = (checkin) => dispatch(createExpertFollowUp({ checkin, expert: expertProfile })).unwrap();
  const updateConsultation = (id, changes) => dispatch(updateExpertConsultation({ id, changes })).unwrap();

  async function createVideo(video) {
    const { videoFile, thumbnailFile, generatedThumbnailFile, ...serializableVideo } = video;
    const filesToken = registerExpertVideoFiles({ videoFile, thumbnailFile, generatedThumbnailFile });
    return dispatch(createExpertVideo({ video: serializableVideo, expert: expertProfile, filesToken })).unwrap();
  }

  const deleteVideo = (videoId) => dispatch(removeExpertVideo({ id: videoId, expertId: expertProfile?.id })).unwrap();
  const updateExpertData = () => {};

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
            <QueryNotifications user={expertProfile || data.expert} userType="Wellness Expert" />
            <button className="dashboard-profile-trigger" type="button" aria-label="Open profile" onClick={() => setProfileOpen(true)}>
              <i className="fa-regular fa-user" aria-hidden="true" />
            </button>
            <button type="button" onClick={handleLogout} style={{ display: "none" }}>Logout</button>
          </div>
        </nav>
        <main className={legacyDashboard || legacyCheckins ? "dashboard" : legacySessions ? "page" : legacyVideos ? "library-page" : undefined}>
          {legacyDashboard
            ? <ExpertDashboard data={data} canReadReports={hasPermission("reports-read")} canReadConsultations={canReadConsultations} canReadClientFeatures={canReadClientFeatures} onNavigate={navigateToView} onOpenCheckin={() => navigateToView("checkins")} onPlayVideo={setSelectedVideo} />
            : legacyConsultations
              ? <ExpertConsultations data={data} canUpdate={hasPermission("user-management-update")} onUpdate={updateExpertData} onUpdateConsultation={updateConsultation} onSaveAvailability={saveAvailability} />
              : legacySessions
                ? <ExpertLiveSessions data={data} canCreate={hasPermission("client-management-create")} canUpdate={hasPermission("client-management-update")} onUpdate={updateExpertData} onCreateSession={createLiveSession} onUpdateSession={updateLiveSession} />
                : legacyCheckins
                  ? <ExpertCheckins data={data} canUpdate={hasPermission("user-management-update")} canCreateFollowUp={hasPermission("user-management-create")} onUpdate={updateExpertData} onSendSuggestion={sendCheckinResponse} onCreateFollowUp={createFollowUpConsultation} onNavigate={navigateToView} />
                  : <ExpertVideoLibrary data={data} expertId={expertProfile?.id} canCreate={hasPermission("client-management-create")} canDelete={hasPermission("client-management-delete")} specialization={expertSpecialization} onUpdate={updateExpertData} onCreateVideo={createVideo} onDeleteVideo={deleteVideo} />}
        </main>
        <footer className="footer"><div className="footer-links"><a href="/#about" target="_blank" rel="noopener noreferrer">About us</a><a className="contact-us-trigger" href="#contact" onClick={(event) => { event.preventDefault(); setQueryOpen(true); }}>Contact us</a></div><p>© 2026 Stack Builders. Built with wellness in mind.</p></footer>
        <QueryModal open={queryOpen} onClose={() => setQueryOpen(false)} user={expertProfile || data.expert} userType="Wellness Expert" />
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
        <div className="expert-nav-right"><span>Welcome back, {welcomeName}!</span><QueryNotifications user={expertProfile || data.expert} userType="Wellness Expert" /><button className="dashboard-profile-trigger" type="button" aria-label="Open profile" onClick={() => setProfileOpen(true)}><ExpertIcon name="user" size={18} /></button><button type="button" onClick={handleLogout}>Logout</button></div>
      </nav>
      <main className="expert-content">{currentView === "checkins" ? <ExpertCheckins data={data} canUpdate={hasPermission("user-management-update")} canCreateFollowUp={hasPermission("user-management-create")} onUpdate={updateExpertData} onSendSuggestion={sendCheckinResponse} onCreateFollowUp={createFollowUpConsultation} /> : currentView === "sessions" ? <ExpertLiveSessions data={data} canCreate={hasPermission("client-management-create")} canUpdate={hasPermission("client-management-update")} onUpdate={updateExpertData} onCreateSession={createLiveSession} onUpdateSession={updateLiveSession} /> : currentView === "consultations" ? <ExpertConsultations data={data} canUpdate={hasPermission("user-management-update")} onUpdate={updateExpertData} onUpdateConsultation={updateConsultation} onSaveAvailability={saveAvailability} /> : <ExpertVideoLibrary data={data} expertId={expertProfile?.id} canCreate={hasPermission("client-management-create")} canDelete={hasPermission("client-management-delete")} specialization={expertSpecialization} onUpdate={updateExpertData} onCreateVideo={createVideo} onDeleteVideo={deleteVideo} />}</main>
      <footer className="expert-footer"><div className="expert-footer-links"><a href="/#about" target="_blank" rel="noopener noreferrer">About us</a><a className="contact-us-trigger" href="#contact" onClick={(event) => { event.preventDefault(); setQueryOpen(true); }}>Contact us</a></div><p>© 2026 Stack Builders. Built with wellness in mind.</p></footer>
      <QueryModal open={queryOpen} onClose={() => setQueryOpen(false)} user={expertProfile || data.expert} userType="Wellness Expert" />
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
