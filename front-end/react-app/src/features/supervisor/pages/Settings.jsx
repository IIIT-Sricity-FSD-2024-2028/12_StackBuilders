import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuthSession, logout } from "../../homepage/authService.js";
import SupervisorIcon from "../components/SupervisorIcon.jsx";
import usePersistedTab from "../../../hooks/usePersistedTab.js";

const tabs = [["profile", "Profile"], ["security", "Security"]];

function readSetting(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "null");
    if (Array.isArray(fallback)) return Array.isArray(value) ? value : fallback;
    return value && typeof value === "object" && !Array.isArray(value) ? { ...fallback, ...value } : fallback;
  } catch {
    return fallback;
  }
}

function Settings() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = usePersistedTab("stackbuilders.supervisor.settingsTab", "profile", tabs.map(([id]) => id));
  const session = getAuthSession();
  const [profile, setProfile] = useState(() => ({ name: session?.profile?.name || "", age: "", gender: "", email: session?.profile?.email || session?.username || "", phone: "", ...readSetting("stack-builders-supervisor-profile", {}) }));
  const [status, setStatus] = useState("");
  const [security, setSecurity] = useState({ current: "", next: "", confirm: "" });

  function selectTab(tab) {
    setStatus("");
    setActiveTab(tab);
  }

  function saveSetting(key, value, label) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      setStatus(label);
    } catch {
      setStatus("Changes could not be saved in this browser.");
    }
  }

  function updateProfile(event) {
    event.preventDefault();
    if (!profile.name.trim()) return setStatus("Enter your profile name before saving.");
    if (profile.age && (Number(profile.age) < 18 || Number(profile.age) > 99)) return setStatus("Enter an age between 18 and 99.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) return setStatus("Enter a valid profile email address.");
    const normalized = { ...profile, name: profile.name.trim(), email: profile.email.trim().toLowerCase(), phone: profile.phone.trim() };
    setProfile(normalized);
    saveSetting("stack-builders-supervisor-profile", normalized, "Profile changes saved in Settings.");
  }

  function updatePassword() {
    if (!security.current || !security.next || !security.confirm) return setStatus("Complete all password fields.");
    if (security.next.length < 6) return setStatus("The new password must be at least 6 characters.");
    if (security.next !== security.confirm) return setStatus("The new password and confirmation do not match.");
    setStatus("Password changes are not supported by the current authentication service.");
  }

  function handleLogout() {
    logout();
    navigate("/");
  }

  return <>
    <div className="supervisor-page-heading"><div><p className="supervisor-eyebrow">Account</p><h1>Settings</h1><p className="supervisor-subtitle">Manage your supervisor profile and account security.</p></div></div>
    <div className="settings-layout"><aside className="supervisor-panel settings-tabs"><div className="settings-nav-heading"><strong>Settings</strong><span>Profile and security</span></div>{tabs.map(([id, label]) => <button className={activeTab === id ? "active" : ""} type="button" key={id} onClick={() => selectTab(id)}><SupervisorIcon name={id === "profile" ? "user" : "shield"} size={17} /><span>{label}</span></button>)}</aside><section className="supervisor-panel settings-content">
      {activeTab === "profile" && <form onSubmit={updateProfile}><div className="profile-header"><div className="profile-avatar"><SupervisorIcon name="user" size={22} /></div><div><strong>Supervisor profile</strong><p>Keep your account details up to date.</p></div></div><div className="settings-form-list" style={{ marginTop: 22 }}><label>Name<input type="text" value={profile.name} onChange={(event) => setProfile({ ...profile, name: event.target.value })} placeholder="Supervisor" /></label><label>Age<input type="number" min="18" max="99" value={profile.age} onChange={(event) => setProfile({ ...profile, age: event.target.value })} placeholder="Add age" /></label><label>Gender<select value={profile.gender} onChange={(event) => setProfile({ ...profile, gender: event.target.value })}><option value="">Select gender</option><option>Male</option><option>Female</option><option>Other</option></select></label><label>Gmail ID<input type="email" value={profile.email} onChange={(event) => setProfile({ ...profile, email: event.target.value })} placeholder="supervisor@gmail.com" /></label><label>Phone number<input type="tel" value={profile.phone} onChange={(event) => setProfile({ ...profile, phone: event.target.value })} placeholder="Add phone number" /></label></div><div className="form-actions" style={{ marginTop: 22 }}><button className="supervisor-outline-button" type="button" onClick={handleLogout}>Log out</button><button className="supervisor-primary-button" type="submit">Save changes</button></div>{status && <p className="save-message" role="status">{status}</p>}</form>}
      {activeTab === "security" && <div><div className="supervisor-panel-heading"><div><p className="supervisor-eyebrow">Protection</p><h2>Security settings</h2></div></div><div className="settings-form-list"><label>Current password<input type="password" value={security.current} onChange={(event) => setSecurity({ ...security, current: event.target.value })} placeholder="Enter current password" /></label><label>New password<input type="password" value={security.next} onChange={(event) => setSecurity({ ...security, next: event.target.value })} placeholder="At least 6 characters" /></label><label>Confirm password<input type="password" value={security.confirm} onChange={(event) => setSecurity({ ...security, confirm: event.target.value })} placeholder="Repeat new password" /></label></div><div className="form-actions" style={{ marginTop: 22 }}><button className="supervisor-primary-button" type="button" onClick={updatePassword}>Update password</button></div>{status && <p className="save-message" role="status">{status}</p>}</div>}
    </section></div>
  </>;
}

export default Settings;
