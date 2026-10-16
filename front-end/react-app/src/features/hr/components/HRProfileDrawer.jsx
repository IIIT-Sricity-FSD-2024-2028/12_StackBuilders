import { useEffect } from "react";

const PROFILE_STORAGE_KEY = "stackbuilders.hr.profiles.v2";
const SESSION_STORAGE_KEY = "stackbuilders.hrSession.v1";

const fallbackProfile = {
  id: "hr-preview",
  name: "HR",
  email: "hr@example.com",
  phoneNumber: "",
  location: "",
  department: "HR",
  designation: "HR Admin",
};

const infoItems = [
  ["Full Name", "name", "user", "teal"],
  ["Email Address", "email", "mail", "blue"],
  ["Phone Number", "phoneNumber", "phone", "violet"],
  ["Department", "department", "building", "sky"],
  ["Designation", "designation", "briefcase", "amber"],
  ["Location", "location", "pin", "pink"],
];

function HRProfileDrawer({ isOpen, onClose }) {
  const profile = readCurrentHrProfile();
  const metrics = readWorkspaceMetrics();

  useEffect(() => {
    document.body.classList.toggle("hr-profile-drawer-open", isOpen);
    return () => document.body.classList.remove("hr-profile-drawer-open");
  }, [isOpen]);

  function logout() {
    try {
      window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
      window.localStorage.removeItem(SESSION_STORAGE_KEY);
    } catch {
      // Local browser storage can be unavailable in restricted contexts.
    }

    onClose();
  }

  return (
    <div
      className={`hr-profile-drawer-overlay${isOpen ? " open" : ""}`}
      hidden={!isOpen}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <aside className="hr-profile-drawer" aria-label="My Profile" aria-modal="true" role="dialog">
        <button className="hr-profile-drawer-back" type="button" onClick={onClose}>
          Back
        </button>

        <header className="hr-profile-drawer-header">
          <h2>My Profile</h2>
          <p>Manage your HR profile and wellness program oversight</p>
        </header>

        <section className="hr-profile-drawer-card hr-profile-summary-card">
          <div className="hr-profile-summary-orb" />
          <div className="hr-profile-summary">
            <div className="hr-profile-summary-avatar">
              <span>{getInitials(profile.name)}</span>
              <i aria-hidden="true" />
            </div>
            <div>
              <h3>{profile.name}</h3>
              <span>{profile.designation || "HR Admin"}</span>
            </div>
          </div>

          <div className="hr-profile-drawer-actions">
            <a className="hr-profile-edit-link" href="/hr/profile">
              <span aria-hidden="true">✎</span>
              Edit Profile
            </a>
            <button className="hr-profile-logout" type="button" onClick={logout}>
              <span aria-hidden="true">↪</span>
              Logout
            </button>
          </div>
        </section>

        <section className="hr-profile-drawer-card">
          <h3 className="hr-profile-drawer-title">
            <span className="hr-profile-title-icon">●</span>
            HR Information
          </h3>
          <div className="hr-profile-info-list">
            {infoItems.map(([label, key, icon, tone]) => (
              <div className="hr-profile-info-item" key={key}>
                <span className={`hr-profile-info-icon ${tone}`} aria-hidden="true">
                  {iconSymbol(icon)}
                </span>
                <div>
                  <small>{label}</small>
                  <strong>{formatProfileValue(profile[key])}</strong>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="hr-profile-drawer-card">
          <h3 className="hr-profile-drawer-title">
            <span className="hr-profile-title-icon rose">◆</span>
            Workspace Snapshot
          </h3>
          <div className="hr-profile-metrics">
            <MetricCard label="Employees" value={metrics.employees} helper="managed" tone="blue" />
            <MetricCard label="Experts" value={metrics.experts} helper="active" tone="orange" />
          </div>
          <div className="hr-profile-account-card">
            <div className="hr-profile-account-head">
              <span className="hr-profile-account-icon">♥</span>
              <small>Account Status</small>
              <strong>Active</strong>
            </div>
            <div className="hr-profile-account-value">
              <span>{metrics.employees + metrics.experts}</span>
              <small>users</small>
            </div>
            <div className="hr-profile-progress" aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
            </div>
            <div className="hr-profile-scale" aria-hidden="true">
              <span>18.5<small>Under</small></span>
              <span>24.9<small>Normal</small></span>
              <span>29.9<small>Over</small></span>
              <span>40+<small>Obese</small></span>
            </div>
            <p>{profile.name} can manage {metrics.employees + metrics.experts} linked workspace users.</p>
          </div>
        </section>
      </aside>
    </div>
  );
}

function MetricCard({ helper, label, tone, value }) {
  return (
    <div className={`hr-profile-metric ${tone}`}>
      <small>{label}</small>
      <strong>{value}</strong>
      <span>{helper}</span>
    </div>
  );
}

function readCurrentHrProfile() {
  const profiles = readJsonArray(PROFILE_STORAGE_KEY);
  const session = readSession();
  const sessionProfile = session?.hrId
    ? profiles.find((candidate) => candidate.id === session.hrId)
    : null;

  return normalizeProfile(sessionProfile || profiles[0] || fallbackProfile);
}

function readSession() {
  try {
    const raw = window.sessionStorage.getItem(SESSION_STORAGE_KEY)
      || window.localStorage.getItem(SESSION_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function readWorkspaceMetrics() {
  return {
    employees: readJsonArray("stackbuilders.react.hr.employees").length,
    experts: readJsonArray("stackbuilders.react.hr.experts").length,
    challenges: readJsonArray("stackbuilders.react.hr.challenges.v2").length,
    rewards: readJsonArray("stackbuilders.react.hr.rewards.v2").length,
  };
}

function readJsonArray(key) {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function normalizeText(value) {
  return String(value || "").trim();
}

function normalizeProfile(profile) {
  return {
    ...fallbackProfile,
    ...profile,
    name: normalizeText(profile.name) || fallbackProfile.name,
    email: normalizeText(profile.email) || fallbackProfile.email,
    phoneNumber: normalizeText(profile.phoneNumber),
    location: normalizeText(profile.location),
    department: "HR",
    designation: "HR Admin",
  };
}

function formatProfileValue(value) {
  return normalizeText(value) || "Not added";
}

function getInitials(name) {
  return (
    String(name || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || "")
      .join("") || "HR"
  );
}

function iconSymbol(icon) {
  const icons = {
    user: "●",
    mail: "✉",
    phone: "☎",
    building: "▦",
    briefcase: "■",
    pin: "●",
  };

  return icons[icon] || "●";
}

export default HRProfileDrawer;
