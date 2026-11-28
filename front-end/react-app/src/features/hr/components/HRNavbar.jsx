import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { NavLink, useNavigate } from "react-router-dom";
import { signOut } from "../../shared/authSlice.js";
import DashboardProfileOverlay from "../../../components/DashboardProfileOverlay.jsx";
import QueryNotifications from "../../../components/QueryNotifications.jsx";
import { findActiveCompanySubscription, getHrCompanyContext } from "../hrUtils.js";
import { loadHrSubscriptions } from "../subscriptionsSlice.js";
import useAutoRefresh from "../../../hooks/useAutoRefresh.js";
import { useRoleAccess } from "../../shared/roleAccessContext.jsx";

function HRNavbar({ activeSection = "home", onProfileClick }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [profileOpen, setProfileOpen] = useState(false);
  const profile = useSelector((state) => state.auth.session?.profile || null);
  const subscriptions = useSelector((state) => state.hr.subscriptions.items);
  const { hasPermission } = useRoleAccess();
  const profileName = profile?.name || "";
  const firstName = profileName.split(/\s+/).filter(Boolean)[0] || "";

  const companyContext = useMemo(() => getHrCompanyContext(profile), [profile]);
  const refreshSubscriptions = useCallback(() => dispatch(loadHrSubscriptions()), [dispatch]);
  useEffect(() => { void refreshSubscriptions(); }, [refreshSubscriptions]);
  useAutoRefresh(refreshSubscriptions, `${companyContext.companyId || companyContext.companyName || "hr"}:plan`);
  const subscription = useMemo(
    () => findActiveCompanySubscription(subscriptions, companyContext),
    [subscriptions, companyContext],
  );
  const planId = String(subscription?.planId || subscription?.planName || "").trim().toLowerCase();
  const planActionLabel = subscription ? (planId.includes("enterprise") ? "Change Plan" : "Upgrade Plan") : "Select Plan";

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
            void dispatch(signOut());
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
