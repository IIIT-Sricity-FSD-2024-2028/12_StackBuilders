import { useState } from "react";
import "../admin-settings.css";

const settingSections = ["Workspace", "Notifications", "Security"];

function Settings() {
  const [activeSection, setActiveSection] = useState("Workspace");
  const [workspaceName, setWorkspaceName] = useState("Stack Builders Wellness");
  const [emailUpdates, setEmailUpdates] = useState(true);
  const [weeklySummary, setWeeklySummary] = useState(true);
  const [twoFactor, setTwoFactor] = useState(false);

  return (
    <main className="admin-settings-page">
      <header className="admin-settings-heading">
        <div>
          <p className="admin-eyebrow">Workspace Controls</p>
          <h1>Settings</h1>
          <p>Configure the administrator workspace and choose how platform updates are delivered.</p>
        </div>
        <button className="admin-primary-button" type="button">Save changes</button>
      </header>

      <section className="admin-settings-layout">
        <nav className="admin-settings-nav" aria-label="Settings sections">
          {settingSections.map((section) => (
            <button className={activeSection === section ? "active" : ""} key={section} type="button" onClick={() => setActiveSection(section)}>{section}<span>›</span></button>
          ))}
        </nav>

        <section className="admin-settings-panel">
          {activeSection === "Workspace" && (
            <>
              <div className="admin-settings-panel-heading"><div><p className="admin-eyebrow">General</p><h2>Workspace profile</h2><p>Keep the platform identity consistent for every actor.</p></div><span className="admin-settings-icon">W</span></div>
              <div className="admin-settings-form">
                <label>Workspace name<input value={workspaceName} onChange={(event) => setWorkspaceName(event.target.value)} /></label>
                <label>Default timezone<select defaultValue="Asia/Kolkata"><option>Asia/Kolkata</option><option>UTC</option><option>America/New_York</option></select></label>
                <label>Support email<input type="email" defaultValue="support@stackbuilders.example" /></label>
              </div>
            </>
          )}

          {activeSection === "Notifications" && (
            <>
              <div className="admin-settings-panel-heading"><div><p className="admin-eyebrow">Communication</p><h2>Notification preferences</h2><p>Choose which platform updates administrators receive.</p></div><span className="admin-settings-icon">N</span></div>
              <div className="admin-setting-toggles">
                <label><span><strong>Email updates</strong><small>Receive alerts when a company or user needs attention.</small></span><input type="checkbox" checked={emailUpdates} onChange={(event) => setEmailUpdates(event.target.checked)} /><i /></label>
                <label><span><strong>Weekly summary</strong><small>Send a weekly overview of participation and revenue.</small></span><input type="checkbox" checked={weeklySummary} onChange={(event) => setWeeklySummary(event.target.checked)} /><i /></label>
              </div>
            </>
          )}

          {activeSection === "Security" && (
            <>
              <div className="admin-settings-panel-heading"><div><p className="admin-eyebrow">Account Protection</p><h2>Security preferences</h2><p>Strengthen administrator access before backend authentication is connected.</p></div><span className="admin-settings-icon">S</span></div>
              <div className="admin-setting-toggles"><label><span><strong>Two-factor authentication</strong><small>Require an additional verification step for Admin accounts.</small></span><input type="checkbox" checked={twoFactor} onChange={(event) => setTwoFactor(event.target.checked)} /><i /></label></div>
              <button className="admin-outline-button admin-security-button" type="button">Review active sessions</button>
            </>
          )}
          <p className="admin-settings-note">These controls are currently stored in the page state and are ready to connect to the settings API later.</p>
        </section>
      </section>
    </main>
  );
}

export default Settings;
