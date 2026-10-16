import { useMemo, useState } from "react";
import "./hr-profile.css";

const PROFILE_STORAGE_KEY = "stackbuilders.hr.profiles.v2";
const SESSION_STORAGE_KEY = "stackbuilders.hrSession.v1";
const HR_DEFAULTS = {
  department: "HR",
  designation: "HR Admin",
};

const fallbackProfile = {
  id: "hr-preview",
  name: "HR",
  email: "hr@example.com",
  password: "password",
  phoneNumber: "",
  location: "",
  department: HR_DEFAULTS.department,
  designation: HR_DEFAULTS.designation,
  status: "Active",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

function HRProfile() {
  const [profile, setProfile] = useState(readCurrentHrProfile);
  const [form, setForm] = useState(() => createProfileForm(profile));
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [status, setStatus] = useState({ message: "", isError: false });

  const initials = useMemo(() => getInitials(profile.name), [profile.name]);

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function updatePasswordForm(field, value) {
    setPasswordForm((current) => ({ ...current, [field]: value }));
  }

  function saveProfile() {
    const name = normalizeText(form.name);
    const phoneNumber = normalizeText(form.phoneNumber);

    if (!name) {
      setStatus({ message: "Name cannot be blank.", isError: true });
      return;
    }

    if (phoneNumber && !formatIndianPhoneNumber(phoneNumber)) {
      setStatus({ message: "Enter a valid Indian phone number.", isError: true });
      return;
    }

    const nextProfile = {
      ...profile,
      name,
      phoneNumber,
      location: normalizeText(form.location),
      department: HR_DEFAULTS.department,
      designation: HR_DEFAULTS.designation,
      updatedAt: new Date().toISOString(),
    };

    persistProfile(nextProfile);
    setProfile(nextProfile);
    setForm(createProfileForm(nextProfile));
    setStatus({ message: "Profile updated successfully.", isError: false });
  }

  function changePassword() {
    if (passwordForm.currentPassword !== profile.password) {
      setStatus({ message: "Current password is incorrect.", isError: true });
      return;
    }

    if (!passwordForm.newPassword) {
      setStatus({ message: "Please enter a new password.", isError: true });
      return;
    }

    if (normalizeText(passwordForm.newPassword).length < 6) {
      setStatus({
        message: "New password must be at least 6 characters long.",
        isError: true,
      });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setStatus({
        message: "New password and confirm password do not match.",
        isError: true,
      });
      return;
    }

    const nextProfile = {
      ...profile,
      password: normalizeText(passwordForm.newPassword),
      updatedAt: new Date().toISOString(),
    };

    persistProfile(nextProfile);
    setProfile(nextProfile);
    setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    setStatus({ message: "Password changed successfully.", isError: false });
  }

  return (
    <main className="hr-profile-page">
      <div className="hr-profile-wrapper">
        <header className="hr-profile-header">
          <div>
            <h1>Manage Profile</h1>
            <p>View and manage your HR profile information</p>
          </div>
          <a className="hr-profile-back" href="/hr">
            Back
          </a>
        </header>

        <section className="hr-profile-card">
          <div className="hr-profile-hero">
            <div className="hr-profile-avatar-wrap">
              <div className="hr-profile-avatar">{initials}</div>
              <button className="hr-profile-photo" type="button">
                Photo
              </button>
            </div>
            <div>
              <h2>{profile.name}</h2>
              <span>@{profile.email}</span>
            </div>
          </div>

          <div className="hr-profile-grid">
            <ProfileField
              disabled
              hint="Username cannot be changed"
              label="Username"
              value={profile.email}
            />
            <ProfileField
              label="Full Name"
              onChange={(value) => updateForm("name", value)}
              value={form.name}
            />
            <ProfileField
              label="Phone Number"
              onChange={(value) => updateForm("phoneNumber", value)}
              value={form.phoneNumber}
            />
            <ProfileField
              label="Location"
              onChange={(value) => updateForm("location", value)}
              value={form.location}
            />
          </div>

          <button className="hr-profile-primary" onClick={saveProfile} type="button">
            Save Profile
          </button>
          {status.message && (
            <span className={`hr-profile-status${status.isError ? " error" : ""}`}>
              {status.message}
            </span>
          )}
        </section>

        <section className="hr-profile-card">
          <div className="hr-profile-section-title">
            <h3>HR Details</h3>
            <div className="hr-profile-badge">{HR_DEFAULTS.department}</div>
          </div>
          <div className="hr-profile-grid">
            <ProfileField
              disabled
              hint="Department is fixed for HR accounts"
              label="Department"
              value={HR_DEFAULTS.department}
            />
            <ProfileField
              disabled
              hint="Designation is fixed for HR accounts"
              label="Designation"
              value={HR_DEFAULTS.designation}
            />
          </div>
        </section>

        <section className="hr-profile-card">
          <h3>Security</h3>
          <div className="hr-profile-grid">
            <ProfileField
              full
              label="Current Password"
              onChange={(value) => updatePasswordForm("currentPassword", value)}
              type="password"
              value={passwordForm.currentPassword}
            />
            <ProfileField
              label="New Password"
              onChange={(value) => updatePasswordForm("newPassword", value)}
              type="password"
              value={passwordForm.newPassword}
            />
            <ProfileField
              label="Confirm Password"
              onChange={(value) => updatePasswordForm("confirmPassword", value)}
              type="password"
              value={passwordForm.confirmPassword}
            />
          </div>
          <button className="hr-profile-primary" onClick={changePassword} type="button">
            Change Password
          </button>
        </section>
      </div>
    </main>
  );
}

function ProfileField({ disabled, full, hint, label, onChange, type = "text", value }) {
  return (
    <label className={`hr-profile-field${full ? " full" : ""}`}>
      <span>{label}</span>
      <input
        disabled={disabled}
        onChange={(event) => onChange?.(event.target.value)}
        type={type}
        value={value}
      />
      {hint && <small>{hint}</small>}
    </label>
  );
}

function normalizeText(value) {
  return String(value || "").trim();
}

function normalizeEmail(value) {
  return normalizeText(value).toLowerCase();
}

function createProfileForm(profile) {
  return {
    name: profile.name || "",
    phoneNumber: profile.phoneNumber || "",
    location: profile.location || "",
  };
}

function readProfiles() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(PROFILE_STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function readCurrentHrProfile() {
  const profiles = readProfiles();
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

function normalizeProfile(profile) {
  const email = normalizeEmail(profile.email || fallbackProfile.email);
  const now = new Date().toISOString();

  return {
    ...fallbackProfile,
    ...profile,
    id: normalizeText(profile.id) || fallbackProfile.id,
    name: normalizeText(profile.name) || fallbackProfile.name,
    email,
    username: normalizeEmail(profile.username || email),
    password: normalizeText(profile.password) || fallbackProfile.password,
    phoneNumber: normalizeText(profile.phoneNumber),
    location: normalizeText(profile.location),
    department: HR_DEFAULTS.department,
    designation: HR_DEFAULTS.designation,
    updatedAt: now,
  };
}

function persistProfile(profile) {
  const normalizedProfile = normalizeProfile(profile);
  const profiles = readProfiles();
  let replaced = false;
  const nextProfiles = profiles.map((candidate) => {
    if (candidate.id === normalizedProfile.id || candidate.email === normalizedProfile.email) {
      replaced = true;
      return normalizedProfile;
    }

    return candidate;
  });

  if (!replaced) nextProfiles.unshift(normalizedProfile);
  window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(nextProfiles));
}

function formatIndianPhoneNumber(value) {
  const digitsOnly = String(value || "").replace(/\D/g, "");

  if (digitsOnly.length === 10) return `+91 ${digitsOnly.slice(0, 5)} ${digitsOnly.slice(5)}`;
  if (digitsOnly.length === 12 && digitsOnly.startsWith("91")) {
    return `+91 ${digitsOnly.slice(2, 7)} ${digitsOnly.slice(7)}`;
  }

  return null;
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

export default HRProfile;
