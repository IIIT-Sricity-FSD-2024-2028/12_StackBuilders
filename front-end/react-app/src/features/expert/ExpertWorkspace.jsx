import { useEffect, useState } from "react";
import ExpertIcon from "./components/ExpertIcon.jsx";
import ExpertNavigation from "./components/ExpertNavigation.jsx";
import { loadExpertWorkspaceData, makeId, saveExpertWorkspaceData } from "./expertData.js";
import Consultations from "./pages/Consultations.jsx";
import EmployeeCheckins from "./pages/EmployeeCheckins.jsx";
import ExpertDashboard from "./pages/ExpertDashboard.jsx";
import LiveSessions from "./pages/LiveSessions.jsx";
import VideoLibrary from "./pages/VideoLibrary.jsx";
import "./expert.css";

function ExpertWorkspace() {
  const [activeView, setActiveView] = useState("dashboard");
  const [data, setData] = useState(loadExpertWorkspaceData);
  const [selectedCheckinId, setSelectedCheckinId] = useState(null);

  useEffect(() => {
    saveExpertWorkspaceData(data);
  }, [data]);

  const openCheckin = (id) => {
    setSelectedCheckinId(id);
    setActiveView("checkins");
  };

  const createSession = (session) => {
    setData((current) => ({
      ...current,
      sessions: [{ ...session, id: makeId("session") }, ...current.sessions],
    }));
  };

  const createVideo = (video) => {
    setData((current) => ({
      ...current,
      videos: [{ ...video, id: makeId("video") }, ...current.videos],
    }));
  };

  const saveAvailability = (availability) => {
    setData((current) => ({ ...current, availability }));
  };

  const updateConsultation = (id, decision) => {
    setData((current) => ({
      ...current,
      consultations: current.consultations.map((consultation) => consultation.id !== id ? consultation : {
        ...consultation,
        status: decision,
        ...(decision === "accepted" ? { date: new Date(Date.now() + 86400000).toISOString().slice(0, 10), time: "10:00" } : { reason: "This request needs additional information before it can be scheduled." }),
      }),
    }));
  };

  const sendCheckinResponse = (id, message) => {
    setData((current) => ({
      ...current,
      checkins: current.checkins.map((checkin) => checkin.id === id ? { ...checkin, responses: [...checkin.responses, message] } : checkin),
    }));
  };

  const requestFollowUp = (checkin) => {
    setData((current) => {
      const alreadyRequested = checkin.followUpStatus !== "Not requested";
      return {
        ...current,
        checkins: current.checkins.map((entry) => entry.id === checkin.id ? { ...entry, followUpStatus: "Consultation requested" } : entry),
        consultations: alreadyRequested ? current.consultations : [{ id: makeId("consult"), employee: checkin.employee, purpose: `Follow up on ${checkin.reason.toLowerCase()}`, requestedAt: new Date().toISOString(), status: "pending" }, ...current.consultations],
      };
    });
  };

  const navigate = (view) => {
    setActiveView(view);
    if (view !== "checkins") setSelectedCheckinId(null);
  };

  const page = {
    dashboard: <ExpertDashboard data={data} onNavigate={navigate} onOpenCheckin={openCheckin} />,
    consultations: <Consultations data={data} onUpdateConsultation={updateConsultation} onSaveAvailability={saveAvailability} />,
    checkins: <EmployeeCheckins data={data} selectedCheckinId={selectedCheckinId} onSelectCheckin={setSelectedCheckinId} onSendResponse={sendCheckinResponse} onRequestFollowUp={requestFollowUp} onNavigate={navigate} />,
    sessions: <LiveSessions data={data} onCreateSession={createSession} />,
    videos: <VideoLibrary data={data} onCreateVideo={createVideo} />,
  }[activeView];

  return <div className="expert-workspace">
    <nav className="expert-navbar" aria-label="Expert workspace navigation">
      <div className="expert-logo">Stack Builders</div>
      <ExpertNavigation activeView={activeView} onNavigate={navigate} />
      <div className="expert-nav-right">
        <span>Welcome back, Wellness Expert!</span>
        <button type="button" aria-label="Notifications"><ExpertIcon name="bell" size={18} /></button>
        <button type="button" aria-label="Profile"><ExpertIcon name="user" size={18} /></button>
      </div>
    </nav>
    <main className="expert-content">{page}</main>
    <footer className="expert-footer">
      <div className="expert-footer-links"><a href="#">About us</a><a href="#">Contact us</a></div>
      <p>© 2026 Stack Builders. Built with wellness in mind.</p>
    </footer>
  </div>;
}

export default ExpertWorkspace;
