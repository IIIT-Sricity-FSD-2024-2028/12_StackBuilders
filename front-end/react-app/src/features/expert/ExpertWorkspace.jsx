import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ExpertIcon from "./components/ExpertIcon.jsx";
import ExpertNavigation from "./components/ExpertNavigation.jsx";
import { loadExpertWorkspaceData, saveExpertWorkspaceData } from "./expertData.js";
import { getAuthSession, logout } from "../homepage/authService.js";
import expertApi from "./expertApi.js";
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
  const navigate = useNavigate();
  const [data, setData] = useState(loadExpertWorkspaceData);
  const [activeView, setActiveView] = usePersistedTab("stackbuilders.expert.activeView", "dashboard", ["dashboard", "consultations", "checkins", "sessions", "videos"]);
  const [profileOpen, setProfileOpen] = useState(false);
  const [queryOpen, setQueryOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const expertProfile = getAuthSession()?.profile;
  const canReadConsultations = hasPermission("user-management-read");
  const canReadClientFeatures = hasPermission("client-management-read");
  const availableViews = ["dashboard", ...(canReadConsultations ? ["consultations", "checkins"] : []), ...(canReadClientFeatures ? ["sessions", "videos"] : [])];
  const currentView = availableViews.includes(activeView) ? activeView : "dashboard";
  const navigateToView = (view) => {
    if (availableViews.includes(view)) setActiveView(view);
  };
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

  useAutoRefresh(async () => {
    if (!expertProfile?.id) return;
    const safely = (request) => request.catch(() => null);
    const [consultations, profile, videos, checkinData, sessions] = await Promise.all([
      safely(expertApi.getConsultations(expertProfile)),
      safely(expertApi.getExpert(expertProfile.id)),
      safely(expertApi.getVideos(expertProfile)),
      Promise.all([expertApi.getCheckins(expertProfile), expertApi.getCheckinResponses(expertProfile)]).catch(() => null),
      safely(expertApi.getLiveSessions(expertProfile)),
    ]);
    setData((current) => ({
      ...current,
      ...(Array.isArray(consultations) ? { consultations: mapExpertConsultations(consultations) } : {}),
      ...(profile ? {
        availability: Array.isArray(profile.availableSlots) ? profile.availableSlots : [],
        expert: { ...current.expert, ...profile, track: profile.specialization || current.expert.track },
      } : {}),
      ...(Array.isArray(videos) ? { videos } : {}),
      ...(Array.isArray(checkinData?.[0]) && Array.isArray(checkinData?.[1])
        ? { checkins: mapExpertCheckins(checkinData[0], checkinData[1], expertProfile.specialization) }
        : {}),
      ...(Array.isArray(sessions) ? { sessions } : {}),
    }));
  }, `${expertProfile?.id || ""}:${expertProfile?.companyId || expertProfile?.companyName || ""}:${expertProfile?.specialization || ""}`);

  useEffect(() => {
    saveExpertWorkspaceData(data);
  }, [data]);

  useEffect(() => {
    if (!expertProfile?.id) return undefined;
    let cancelled = false;
    expertApi.getConsultations(expertProfile).then((records) => {
      if (cancelled || !Array.isArray(records)) return;
      setData((current) => ({ ...current, consultations: mapExpertConsultations(records) }));
    }).catch((error) => {
      console.error("Unable to load expert consultations from the backend.", error);
    });
    return () => { cancelled = true; };
  }, [expertProfile?.id, expertProfile?.companyId, expertProfile?.companyName]);

  useEffect(() => {
    if (!expertProfile?.id) return undefined;
    let cancelled = false;
    expertApi.getExpert(expertProfile.id).then((profile) => {
      if (cancelled || !profile) return;
      setData((current) => ({
        ...current,
        availability: Array.isArray(profile.availableSlots) ? profile.availableSlots : [],
        expert: { ...current.expert, ...profile, track: profile.specialization || current.expert.track },
      }));
    }).catch((error) => {
      console.error("Unable to load expert availability from the backend.", error);
    });
    return () => { cancelled = true; };
  }, [expertProfile?.id]);

  useEffect(() => {
    if (!expertProfile?.id) return undefined;
    let cancelled = false;
    expertApi.getVideos(expertProfile).then((records) => {
      if (cancelled || !Array.isArray(records)) return;
      setData((current) => ({ ...current, videos: records }));
    }).catch((error) => {
      console.error("Unable to load expert videos from the backend.", error);
    });
    return () => { cancelled = true; };
  }, [expertProfile?.id, expertProfile?.companyId, expertProfile?.companyName]);

  useEffect(() => {
    if (!expertProfile?.id) return undefined;
    let cancelled = false;
    Promise.all([expertApi.getCheckins(expertProfile), expertApi.getCheckinResponses(expertProfile)]).then(([checkins, responses]) => {
      if (cancelled || !Array.isArray(checkins) || !Array.isArray(responses)) return;
      setData((current) => ({ ...current, checkins: mapExpertCheckins(checkins, responses, expertProfile.specialization) }));
    }).catch((error) => {
      console.error("Unable to load expert check-ins from the backend.", error);
    });
    return () => { cancelled = true; };
  }, [expertProfile?.id, expertProfile?.companyId, expertProfile?.companyName, expertProfile?.specialization]);

  useEffect(() => {
    if (!expertProfile?.id) return undefined;
    let cancelled = false;
    expertApi.getLiveSessions(expertProfile).then((records) => {
      if (cancelled || !Array.isArray(records)) return;
      setData((current) => ({ ...current, sessions: records }));
    }).catch((error) => {
      console.error("Unable to load expert live sessions from the backend.", error);
    });
    return () => { cancelled = true; };
  }, [expertProfile?.id, expertProfile?.companyId, expertProfile?.companyName]);

  async function createLiveSession(session) {
    const created = await expertApi.createLiveSession({
      title: session.title,
      category: session.category,
      sessionType: session.sessionType,
      date: session.date,
      startTime: session.startTime,
      duration: session.duration,
      maxParticipants: String(session.maxParticipants),
      meetingLink: session.meetingLink,
      description: session.description,
      expertId: expertProfile?.id,
      hostName: expertProfile?.name,
      companyId: expertProfile?.companyId,
      companyName: expertProfile?.companyName,
    });
    setData((current) => ({ ...current, sessions: [created, ...current.sessions] }));
    return created;
  }

  async function updateLiveSession(id, session) {
    const updated = await expertApi.updateLiveSession(id, {
      title: session.title,
      category: session.category,
      sessionType: session.sessionType,
      date: session.date,
      startTime: session.startTime,
      duration: session.duration,
      maxParticipants: String(session.maxParticipants),
      meetingLink: session.meetingLink,
      description: session.description,
    });
    setData((current) => ({
      ...current,
      sessions: current.sessions.map((record) => record.id === id ? updated : record),
    }));
    return updated;
  }

  async function saveAvailability(availableSlots) {
    const updated = await expertApi.updateExpert(expertProfile.id, { availableSlots });
    setData((current) => ({
      ...current,
      availability: Array.isArray(updated.availableSlots) ? updated.availableSlots : availableSlots,
      expert: { ...current.expert, ...updated },
    }));
    return updated;
  }

  async function sendCheckinResponse(checkin, message) {
    const response = await expertApi.createCheckinResponse({
      checkinId: checkin.id,
      checkinType: checkin.checkinType,
      employeeId: checkin.employeeId,
      employeeName: checkin.employeeName || checkin.employee,
      expertId: expertProfile?.id,
      expertName: expertProfile?.name,
      companyId: checkin.companyId || expertProfile?.companyId,
      companyName: checkin.companyName || expertProfile?.companyName,
      message,
    });
    setData((current) => ({ ...current, checkins: current.checkins.map((record) => record.id === checkin.id
      ? { ...record, responses: [...(record.responses || []), { text: response.message, createdAt: response.createdAt, expertId: response.expertId, expertName: response.expertName }], followUpStatus: "Suggestion sent" }
      : record) }));
    return response;
  }

  async function createVideo(video) {
    const thumbnailFile = video.thumbnailSource === "upload"
      ? video.thumbnailFile || (video.videoSource === "upload" ? video.generatedThumbnailFile : null)
      : video.thumbnailLink.trim()
        ? null
        : video.videoSource === "upload" ? video.generatedThumbnailFile : null;
    const created = await expertApi.createVideo({
      title: video.title,
      category: video.category,
      duration: video.duration,
      videoLink: video.videoSource === "upload" ? "" : video.videoLink,
      thumbnailLink: video.thumbnailSource === "link" ? video.thumbnailLink : "",
      description: video.description,
      creatorExpertId: expertProfile?.id,
      creatorExpertName: expertProfile?.name,
      companyId: expertProfile?.companyId,
      companyName: expertProfile?.companyName,
    }, { videoFile: video.videoSource === "upload" ? video.videoFile : null, thumbnailFile });
    setData((current) => ({ ...current, videos: [...current.videos, created] }));
    return created;
  }

  async function deleteVideo(videoId) {
    await expertApi.deleteVideo(videoId, expertProfile?.id);
    setData((current) => ({ ...current, videos: current.videos.filter((video) => video.id !== videoId) }));
  }

  async function updateConsultation(id, changes) {
    const updated = await expertApi.updateConsultation(id, changes);
    setData((current) => ({
      ...current,
      consultations: current.consultations.map((record) => record.id === id
        ? { ...record, ...updated, employee: updated.employeeName || record.employee, requestedAt: updated.requestedOn || record.requestedAt, date: updated.sessionDate || record.date, time: updated.sessionTime || record.time, completed: String(updated.status || "").toLowerCase() === "completed" }
        : record),
    }));
    return updated;
  }

  async function createFollowUpConsultation(checkin) {
    const result = await expertApi.createFollowUpConsultation({
      employeeId: checkin.employeeId,
      employeeName: checkin.employeeName || checkin.employee,
      expertId: expertProfile?.id,
      expertName: expertProfile?.name,
      purpose: `Follow-up for ${checkin.checkinType} wellness check-in: ${checkin.reason}`,
      sourceCheckinId: checkin.id,
      followUpPriority: checkin.priority,
    });
    const record = result.consultation;
    const mapped = { ...record, employee: record.employeeName || "Employee", requestedAt: record.requestedOn || record.createdAt, completed: String(record.status || "").toLowerCase() === "completed" };
    setData((current) => ({ ...current, consultations: [mapped, ...current.consultations.filter((item) => item.id !== mapped.id)] }));
    return result;
  }

  function handleLogout() {
    logout();
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
              ? <ExpertConsultations data={data} canUpdate={hasPermission("user-management-update")} onUpdate={(changes) => setData((current) => ({ ...current, ...changes }))} onUpdateConsultation={updateConsultation} onSaveAvailability={saveAvailability} />
              : legacySessions
                ? <ExpertLiveSessions data={data} canCreate={hasPermission("client-management-create")} canUpdate={hasPermission("client-management-update")} onUpdate={(changes) => setData((current) => ({ ...current, ...changes }))} onCreateSession={createLiveSession} onUpdateSession={updateLiveSession} />
                : legacyCheckins
                  ? <ExpertCheckins data={data} canUpdate={hasPermission("user-management-update")} canCreateFollowUp={hasPermission("user-management-create")} onUpdate={(changes) => setData((current) => ({ ...current, ...changes }))} onSendSuggestion={sendCheckinResponse} onCreateFollowUp={createFollowUpConsultation} onNavigate={navigateToView} />
                  : <ExpertVideoLibrary data={data} expertId={expertProfile?.id} canCreate={hasPermission("client-management-create")} canDelete={hasPermission("client-management-delete")} specialization={expertSpecialization} onUpdate={(changes) => setData((current) => ({ ...current, ...changes }))} onCreateVideo={createVideo} onDeleteVideo={deleteVideo} />}
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
      <main className="expert-content">{currentView === "checkins" ? <ExpertCheckins data={data} canUpdate={hasPermission("user-management-update")} canCreateFollowUp={hasPermission("user-management-create")} onUpdate={(changes) => setData((current) => ({ ...current, ...changes }))} onSendSuggestion={sendCheckinResponse} onCreateFollowUp={createFollowUpConsultation} /> : currentView === "sessions" ? <ExpertLiveSessions data={data} canCreate={hasPermission("client-management-create")} canUpdate={hasPermission("client-management-update")} onUpdate={(changes) => setData((current) => ({ ...current, ...changes }))} onCreateSession={createLiveSession} onUpdateSession={updateLiveSession} /> : currentView === "consultations" ? <ExpertConsultations data={data} canUpdate={hasPermission("user-management-update")} onUpdate={(changes) => setData((current) => ({ ...current, ...changes }))} onUpdateConsultation={updateConsultation} onSaveAvailability={saveAvailability} /> : <ExpertVideoLibrary data={data} expertId={expertProfile?.id} canCreate={hasPermission("client-management-create")} canDelete={hasPermission("client-management-delete")} specialization={expertSpecialization} onUpdate={(changes) => setData((current) => ({ ...current, ...changes }))} onCreateVideo={createVideo} onDeleteVideo={deleteVideo} />}</main>
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
