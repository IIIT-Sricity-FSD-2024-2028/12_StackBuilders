import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { signOut } from "../../shared/authSlice.js";
import { saveSupervisorProfile, updateSupervisorPassword } from "../settingsSlice.js";
import SupervisorIcon from "../components/SupervisorIcon.jsx";
import usePersistedTab from "../../../hooks/usePersistedTab.js";

const tabs = [["profile", "Profile"], ["security", "Security"]];
const INDIAN_PHONE_PATTERN = "(?:\\+?91[\\s()-]*)?[6-9](?:[\\s()-]*[0-9]){9}";

function normalizeIndianPhoneNumber(value) {
  const phone = String(value ?? "").trim();
  if (!phone || !/^\+?[\d\s()-]+$/.test(phone)) return null;
  const digits = phone.replace(/\D/g, "");
  const number = digits.length === 10 ? digits : digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : "";
  return /^[6-9]\d{9}$/.test(number) ? `+91 ${number.slice(0, 5)} ${number.slice(5)}` : null;
}

function Settings() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = usePersistedTab("stackbuilders.supervisor.settingsTab", "profile", tabs.map(([id]) => id));
  const session = useSelector((state) => state.auth.session);
  const savedProfile = useSelector((state) => state.supervisor.settings.profile);
  const passwordSaving = useSelector((state) => state.supervisor.settings.passwordSaving);
  const [profile, setProfile] = useState(() => ({ name: session?.profile?.name || "", age: "", gender: "", email: session?.profile?.email || session?.username || "", phone: "", ...savedProfile }));
  const [status, setStatus] = useState("");
  const [security, setSecurity] = useState({ current: "", next: "", confirm: "" });

  function selectTab(tab) {
    setStatus("");
    setActiveTab(tab);
  }

  function updateProfile(event) {
    event.preventDefault();
    if (!profile.name.trim()) return setStatus("Enter your profile name before saving.");
    if (profile.age && (Number(profile.age) < 18 || Number(profile.age) > 99)) return setStatus("Enter an age between 18 and 99.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) return setStatus("Enter a valid profile email address.");
    const normalizedPhone = profile.phone.trim() ? normalizeIndianPhoneNumber(profile.phone) : "";
    if (profile.phone.trim() && !normalizedPhone) return setStatus("Enter a valid Indian mobile number with 10 digits starting from 6–9, optionally prefixed by +91.");
    const normalized = { ...profile, name: profile.name.trim(), email: profile.email.trim().toLowerCase(), phone: normalizedPhone };
    setProfile(normalized);
    void dispatch(saveSupervisorProfile(normalized));
    setStatus("Profile changes saved in Settings.");
  }

  async function updatePassword() {
    if (!security.current || !security.next || !security.confirm) return setStatus("Complete all password fields.");
    if (security.next.length < 6) return setStatus("The new password must be at least 6 characters.");
    if (security.next !== security.confirm) return setStatus("The new password and confirmation do not match.");
    try {
      const result = await dispatch(updateSupervisorPassword({ email: session?.profile?.email || session?.username, currentPassword: security.current, newPassword: security.next })).unwrap();
      setSecurity({ current: "", next: "", confirm: "" });
      setStatus(result.message);
    } catch (error) {
      setStatus(error.message || "Password could not be updated.");
    }
  }

  function handleLogout() {
    void dispatch(signOut());
    navigate("/");
  }

  return <>
    <div className="supervisor-page-heading"><div><p className="supervisor-eyebrow">Account</p><h1>Settings</h1><p className="supervisor-subtitle">Manage your supervisor profile and account security.</p></div></div>
    <div className="settings-layout"><aside className="supervisor-panel settings-tabs"><div className="settings-nav-heading"><strong>Settings</strong><span>Profile and security</span></div>{tabs.map(([id, label]) => <button className={activeTab === id ? "active" : ""} type="button" key={id} onClick={() => selectTab(id)}><SupervisorIcon name={id === "profile" ? "user" : "shield"} size={17} /><span>{label}</span></button>)}</aside><section className="supervisor-panel settings-content">
      {activeTab === "profile" && <form onSubmit={updateProfile}><div className="profile-header"><div className="profile-avatar"><SupervisorIcon name="user" size={22} /></div><div><strong>Supervisor profile</strong><p>Keep your account details up to date.</p></div></div><div className="settings-form-list" style={{ marginTop: 22 }}><label>Name<input type="text" value={profile.name} onChange={(event) => setProfile({ ...profile, name: event.target.value })} placeholder="Supervisor" /></label><label>Age<input type="number" min="18" max="99" value={profile.age} onChange={(event) => setProfile({ ...profile, age: event.target.value })} placeholder="Add age" /></label><label>Gender<select value={profile.gender} onChange={(event) => setProfile({ ...profile, gender: event.target.value })}><option value="">Select gender</option><option>Male</option><option>Female</option><option>Other</option></select></label><label>Gmail ID<input type="email" value={profile.email} onChange={(event) => setProfile({ ...profile, email: event.target.value })} placeholder="supervisor@gmail.com" /></label><label>Phone number<input type="tel" inputMode="tel" autoComplete="tel" maxLength="18" pattern={INDIAN_PHONE_PATTERN} title="Enter a 10-digit Indian mobile number starting with 6–9, optionally prefixed by +91." value={profile.phone} onChange={(event) => setProfile({ ...profile, phone: event.target.value })} placeholder="+91 98765 43210" /></label></div><div className="form-actions" style={{ marginTop: 22 }}><button className="supervisor-outline-button" type="button" onClick={handleLogout}>Log out</button><button className="supervisor-primary-button" type="submit">Save changes</button></div>{status && <p className="save-message" role="status">{status}</p>}</form>}
      {activeTab === "security" && <div><div className="supervisor-panel-heading"><div><p className="supervisor-eyebrow">Protection</p><h2>Security settings</h2></div></div><div className="settings-form-list"><label>Current password<input type="password" autoComplete="current-password" value={security.current} onChange={(event) => setSecurity({ ...security, current: event.target.value })} placeholder="Enter current password" /></label><label>New password<input type="password" autoComplete="new-password" minLength={6} maxLength={128} value={security.next} onChange={(event) => setSecurity({ ...security, next: event.target.value })} placeholder="At least 6 characters" /></label><label>Confirm password<input type="password" autoComplete="new-password" minLength={6} maxLength={128} value={security.confirm} onChange={(event) => setSecurity({ ...security, confirm: event.target.value })} placeholder="Repeat new password" /></label></div><div className="form-actions" style={{ marginTop: 22 }}><button className="supervisor-primary-button" type="button" onClick={updatePassword} disabled={passwordSaving}>{passwordSaving ? "Updating…" : "Update password"}</button></div>{status && <p className="save-message" role="status">{status}</p>}</div>}
    </section></div>
  </>;
}

export default Settings;
