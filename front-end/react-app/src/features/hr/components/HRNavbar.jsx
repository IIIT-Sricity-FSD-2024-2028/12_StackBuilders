import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { getAuthSession, logout } from "../../homepage/authService.js";
import DashboardProfileOverlay from "../../../components/DashboardProfileOverlay.jsx";
import QueryNotifications from "../../../components/QueryNotifications.jsx";
import hrApi from "../hrApi.js";
import { getCurrentHrCompanyContext } from "../hrUtils.js";
import useAutoRefresh from "../../../hooks/useAutoRefresh.js";
import { useRoleAccess } from "../../shared/roleAccessContext.jsx";

function HRNavbar({ activeSection = "home", onProfileClick }) {
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [planActionLabel, setPlanActionLabel] = useState("Select Plan");
  const profile = getAuthSession()?.profile;
  const { hasPermission } = useRoleAccess();
  const profileName = profile?.name || "";
  const firstName = profileName.split(/\s+/).filter(Boolean)[0] || "";

  const refreshPlanLabel = () => {
    const company = getCurrentHrCompanyContext();
    if (!company.companyId && !company.companyName) {
      setPlanActionLabel("Select Plan");
      return Promise.resolve();
    }

    return hrApi
      .getSubscriptions()
      .then((subscriptions) => {
        const companyName = company.companyName.toLowerCase();
        const subscription = (subscriptions || []).find(
          (item) =>
            String(item.status || "")
              .trim()
              .toLowerCase() === "active" &&
            ((company.companyId &&
              String(item.companyId || "").trim() === company.companyId) ||
              (companyName &&
                String(item.companyName || "")
                  .trim()
                  .toLowerCase() === companyName)),
        );
        if (!subscription) {
          setPlanActionLabel("Select Plan");
          return;
        }
        const planId = String(
          subscription.planId || subscription.planName || "",
        )
          .trim()
          .toLowerCase();
        setPlanActionLabel(
          planId.includes("enterprise") ? "Change Plan" : "Upgrade Plan",
        );
      })
      .catch(() => {});
  };

  const companyContext = getCurrentHrCompanyContext();
  useEffect(() => {
    refreshPlanLabel();
  }, []);
  useAutoRefresh(
    refreshPlanLabel,
    `${companyContext.companyId || companyContext.companyName || "hr"}:plan`,
  );

  function openProfile() {
    if (onProfileClick) {
      onProfileClick();
      return;
    }
    setProfileOpen(true);
  }
  return (
    <nav className="navbar">
      <div className="logo">Stack Builders</div>

      <div className="nav-links">
        <NavLink
          end
          className={activeSection === "home" ? "active" : undefined}
          to="/hr"
        >
          <i className="fa-solid fa-house" /> Home
        </NavLink>
        {hasPermission("challenge-management-read") && (
          <NavLink
            className={activeSection === "challenges" ? "active" : undefined}
            to="/hr/challenges"
          >
            <i className="fa-regular fa-calendar" /> Challenges
          </NavLink>
        )}
        {hasPermission("client-management-read") && (
          <NavLink
            className={activeSection === "videos" ? "active" : undefined}
            to="/hr/videos"
          >
            <i className="fa-solid fa-video" /> Video Library
          </NavLink>
        )}
      </div>

      <div className="nav-right">
        <NavLink
          to="/hr/pricing"
          style={{
            textDecoration: "none",
            padding: "8px 16px",
            borderRadius: "20px",
            fontWeight: 700,
            background: "#ff914d",
            color: "white",
            fontSize: "0.85rem",
            marginRight: "16px",
            boxShadow: "0 4px 10px rgba(255,145,77,0.3)",
            transition: "0.2s",
          }}
        >
          <i
            className={
              planActionLabel === "Change Plan"
                ? "fa fa-arrows-rotate"
                : "fa fa-arrow-up-right-dots"
            }
          />{" "}
          {planActionLabel}
        </NavLink>
        <QueryNotifications user={profile} userType="HR" />
        <span id="hrWelcomeMessage">
          {firstName ? `Welcome, ${firstName}` : "Welcome"}
        </span>
        <button
          className="dashboard-profile-trigger"
          id="profileNavIcon"
          type="button"
          aria-label="Open profile"
          onClick={openProfile}
        >
          <i className="fa-regular fa-user" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => {
            logout();
            navigate("/");
          }}
          aria-label="Logout"
          style={{ display: "none" }}
        >
          Logout
        </button>
      </div>
      <DashboardProfileOverlay
        role="hr"
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
      />
    </nav>
  );
}

export default HRNavbar;
