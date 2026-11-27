import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import RouteLoadingScreen from "../../../components/RouteLoadingScreen.jsx";
import { saveAdminProfile, updateAdminPassword } from "../settingsSlice.js";
import { signOut } from "../../shared/authSlice.js";
import usePageStylesheets from "../../../hooks/usePageStylesheets.js";
import usePersistedTab from "../../../hooks/usePersistedTab.js";

const tabs = ["profile", "security"];
const INDIAN_PHONE_PATTERN = "(?:\\+?91[\\s()-]*)?[6-9](?:[\\s()-]*[0-9]){9}";

function normalizeIndianPhoneNumber(value) {
  const phone = String(value ?? "").trim();
  if (!phone || !/^\+?[\d\s()-]+$/.test(phone)) return null;
  const digits = phone.replace(/\D/g, "");
  const number = digits.length === 10 ? digits : digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : "";
  return /^[6-9]\d{9}$/.test(number) ? `+91 ${number.slice(0, 5)} ${number.slice(5)}` : null;
}

function Settings() {
  const stylesReady = usePageStylesheets("/admin-settings-legacy.css");
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const session = useSelector((state) => state.auth.session);
  const savedProfile = useSelector((state) => state.admin.settings.profile);
  const passwordSaving = useSelector((state) => state.admin.settings.passwordSaving);
  const [activeTab, setActiveTab] = usePersistedTab("stackbuilders.admin.settingsTab", "profile", tabs);
  const [profile, setProfile] = useState(() => ({ name: session?.profile?.name || "", age: "", gender: "", email: session?.profile?.email || session?.email || "", phone: "", ...savedProfile }));
  const [status, setStatus] = useState("");
  const [security, setSecurity] = useState({ current: "", next: "", confirm: "" });

  function selectTab(tab) {
    setStatus("");
    setActiveTab(tab);
  }

  useEffect(() => {
    document.body.classList.add("app-body");
    return () => {
      document.body.classList.remove("app-body");
    };
  }, []);

  function updateProfile(event) {
    event.preventDefault();
    if (!profile.name.trim()) return setStatus("Enter your profile name before saving.");
    if (!profile.age || Number(profile.age) < 18 || Number(profile.age) > 99) return setStatus("Enter an age between 18 and 99.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) return setStatus("Enter a valid profile email address.");
    const formattedPhone = profile.phone.trim() ? normalizeIndianPhoneNumber(profile.phone) : "";
    if (profile.phone.trim() && !formattedPhone) return setStatus("Enter a valid Indian mobile number with 10 digits starting from 6–9, optionally prefixed by +91.");
    try {
      const normalized = { ...profile, name: profile.name.trim(), email: profile.email.trim().toLowerCase(), phone: formattedPhone };
      void dispatch(saveAdminProfile(normalized));
      setProfile(normalized);
      setStatus("Profile changes saved in Settings.");
    } catch {
      setStatus("Profile changes could not be saved.");
    }
  }

  async function updatePassword() {
    if (!security.current || !security.next || !security.confirm) return setStatus("Complete all password fields.");
    if (security.next.length < 6) return setStatus("The new password must be at least 6 characters.");
    if (security.next !== security.confirm) return setStatus("The new password and confirmation do not match.");
    try {
      const result = await dispatch(updateAdminPassword({ email: session?.profile?.email || session?.username, currentPassword: security.current, newPassword: security.next })).unwrap();
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

  if (!stylesReady) return <RouteLoadingScreen />;

  return (
    <main className="content">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Account</p>
          <h1>Profile</h1>
          <p className="subtitle">View and manage your profile details</p>
        </div>
      </div>
      <div className="container">
        <aside className="sidebar">
          <ul>
            {tabs.map((tab) => <li className={activeTab === tab ? "active" : ""} data-tab={tab} key={tab} onClick={() => selectTab(tab)}>{tab[0].toUpperCase() + tab.slice(1)}</li>)}
          </ul>
        </aside>
        <main className="content">
          <section className={`card tab${activeTab === "profile" ? " active" : ""}`} id="profile">
            <div className="profile-header">
              <div className="profile"><div className="avatar" aria-hidden="true"><i className="fa-solid fa-user" /></div><div className="profile-copy"><h2>Profile</h2><p>Keep your account details up to date.</p></div></div>
              <div className="actions"><button className="btn-light" type="button" onClick={handleLogout}>Logout</button><button className="btn-primary" type="button" onClick={updateProfile}>Save Changes</button></div>
            </div>
            <form className="profile-grid" onSubmit={updateProfile}>
              <label className="profile-item" htmlFor="profileNameInput"><span>Name</span><input id="profileNameInput" type="text" placeholder="Super User" value={profile.name} onChange={(event) => setProfile({ ...profile, name: event.target.value })} /></label>
              <label className="profile-item" htmlFor="profileAgeInput"><span>Age</span><input id="profileAgeInput" type="number" min="18" max="99" placeholder="Add age" value={profile.age} onChange={(event) => setProfile({ ...profile, age: event.target.value })} /></label>
              <label className="profile-item" htmlFor="profileGenderInput"><span>Gender</span><select id="profileGenderInput" value={profile.gender} onChange={(event) => setProfile({ ...profile, gender: event.target.value })}><option value="">Select gender</option><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option></select></label>
              <label className="profile-item" htmlFor="profileEmailInput"><span>Gmail ID</span><input id="profileEmailInput" type="email" placeholder="ravi@gmail.com" value={profile.email} onChange={(event) => setProfile({ ...profile, email: event.target.value })} /></label>
              <label className="profile-item" htmlFor="profilePhoneInput"><span>Phone Number</span><input id="profilePhoneInput" type="tel" inputMode="tel" autoComplete="tel" maxLength="18" pattern={INDIAN_PHONE_PATTERN} title="Enter a 10-digit Indian mobile number starting with 6–9, optionally prefixed by +91." placeholder="+91 98765 43210" value={profile.phone} onChange={(event) => setProfile({ ...profile, phone: event.target.value })} /></label>
            </form>
          </section>

          <section className={`card tab${activeTab === "security" ? " active" : ""}`} id="security"><h2>Security Settings</h2><input type="password" autoComplete="current-password" placeholder="Current Password" value={security.current} onChange={(event) => setSecurity({ ...security, current: event.target.value })} /><input type="password" autoComplete="new-password" minLength={6} maxLength={128} placeholder="New Password" value={security.next} onChange={(event) => setSecurity({ ...security, next: event.target.value })} /><input type="password" autoComplete="new-password" minLength={6} maxLength={128} placeholder="Confirm Password" value={security.confirm} onChange={(event) => setSecurity({ ...security, confirm: event.target.value })} /><div className="actions"><button className="btn-light" type="button" onClick={() => setSecurity({ current: "", next: "", confirm: "" })}>Cancel</button><button className="btn-primary" type="button" onClick={updatePassword} disabled={passwordSaving}>{passwordSaving ? "Updating…" : "Update Password"}</button></div></section>

          <p className="profile-status" id="profileStatus" aria-live="polite" role="status">{status}</p>
        </main>
      </div>
    </main>
  );
}

export default Settings;
