import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./dashboard-profile-overlay.css";

const PROFILE_ROLES = new Set(["employee", "wellness", "hr"]);

export default function DashboardProfileOverlay({ role = "employee", open, onClose }) {
  const frameRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const profileRole = PROFILE_ROLES.has(role) ? role : "employee";

  useEffect(() => {
    if (open) document.body.classList.add("profile-open");
    else document.body.classList.remove("profile-open");

    function handleKeyDown(event) {
      if (event.key === "Escape" && open) onClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.classList.remove("profile-open");
    };
  }, [open, onClose]);

  useEffect(() => {
    function handleProfileNavigation(event) {
      if (
        event.origin !== window.location.origin ||
        event.source !== frameRef.current?.contentWindow ||
        event.data?.type !== "stackbuilders:edit-profile"
      ) return;

      onClose();
      navigate(`/profile/edit?returnTo=${encodeURIComponent(location.pathname)}`);
    }

    window.addEventListener("message", handleProfileNavigation);
    return () => window.removeEventListener("message", handleProfileNavigation);
  }, [location.pathname, navigate, onClose]);

  if (!open) return null;

  return (
    <div
      className="profile-overlay dashboard-profile-overlay"
      id="profileOverlay"
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <div className="profile-frame-shell" role="dialog" aria-modal="true" aria-label="My Profile">
        <button
          className="profile-overlay-close"
          id="profileDrawerBackBtn"
          type="button"
          aria-label="Close profile panel"
          onClick={onClose}
        >
          Back
        </button>
        <iframe
          ref={frameRef}
          className="profile-frame"
          src={`/profile.html?role=${profileRole}`}
          title="My Profile"
        />
      </div>
    </div>
  );
}
