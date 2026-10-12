import { useState } from "react";
import HRProfileDrawer from "./HRProfileDrawer.jsx";
import "./hr-profile-drawer.css";

function HRNavbar({ activeSection = "home" }) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    <>
      <nav className="hr-navbar">
        <div className="hr-logo">Stack Builders</div>

        <div className="hr-nav-links">
          <a className={activeSection === "home" ? "active" : ""} href="/hr">
            <span>⌂</span> Home
          </a>
          <a className={activeSection === "challenges" ? "active" : ""} href="/hr/challenges">
            <span>□</span> Challenges
          </a>
          <a href="#videos">
            <span>▶</span> Video Library
          </a>
        </div>

        <div className="hr-nav-right">
          <a className="hr-upgrade" href="/hr/pricing">
            <span aria-hidden="true">↗</span>
            Upgrade Plan
          </a>
          <span className="hr-round-icon">!</span>
          <span>Welcome, HR</span>
          <button
            className="hr-round-icon hr-profile-trigger"
            type="button"
            aria-label="Open HR profile"
            onClick={() => setIsProfileOpen(true)}
          >
            U
          </button>
        </div>
      </nav>
      <HRProfileDrawer isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
    </>
  );
}

export default HRNavbar;
