import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { clearProfileError, updateSignedInProfile } from "../shared/authSlice.js";
import "./profile-edit-page.css";

const INDIAN_PHONE_PATTERN = "(?:\\+?91[\\s()-]*)?[6-9](?:[\\s()-]*[0-9]){9}";

function normalizeIndianPhoneNumber(value) {
  const phone = String(value ?? "").trim();
  if (!phone || !/^\+?[\d\s()-]+$/.test(phone)) return null;
  const digits = phone.replace(/\D/g, "");
  const number = digits.length === 10 ? digits : digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : "";
  return /^[6-9]\d{9}$/.test(number) ? `+91 ${number.slice(0, 5)} ${number.slice(5)}` : null;
}

const ROLE_CONFIG = {
  Employee: { endpoint: "/employees", home: "/employee", returnPrefixes: ["/employee", "/consultation", "/wellness-checkins", "/live-sessions", "/video-library", "/mental-wellness", "/physical-wellness", "/diet-plan"], fields: ["name", "age", "phoneNumber", "gender", "heightCm", "weightKg"] },
  "Wellness Expert": { endpoint: "/experts", home: "/expert", returnPrefixes: ["/expert"], fields: ["name", "phoneNumber", "experience"] },
  HR: { endpoint: "/hr-profiles", home: "/hr", returnPrefixes: ["/hr"], fields: ["name", "phoneNumber", "location"] },
};

const FIELD_LABELS = {
  name: "Full name",
  age: "Age",
  phoneNumber: "Phone number",
  gender: "Gender",
  heightCm: "Height (cm)",
  weightKg: "Weight (kg)",
  experience: "Experience",
  location: "Location",
};

function normalizeGender(value) {
  const gender = String(value || "").trim().toLowerCase();
  if (gender === "m" || gender === "male") return "M";
  if (gender === "f" || gender === "female") return "F";
  return "";
}

function ProfileEditPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();
  const session = useSelector((state) => state.auth.session);
  const saving = useSelector((state) => state.auth.profileSaving);
  const profileError = useSelector((state) => state.auth.profileError);
  const config = ROLE_CONFIG[session?.role];
  const profile = session?.profile || {};
  const returnTo = useMemo(() => {
    const requested = searchParams.get("returnTo") || "";
    const allowed = config?.returnPrefixes?.some((prefix) => requested === prefix || requested.startsWith(`${prefix}/`));
    return allowed ? requested : (config?.home || "/");
  }, [config, searchParams]);
  const [values, setValues] = useState(() => Object.fromEntries((config?.fields || []).map((field) => [field, field === "gender" ? normalizeGender(profile[field]) : profile[field] ?? ""])));
  const [password, setPassword] = useState({ current: "", next: "", confirm: "" });
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  if (!config || !profile.id) {
    return <main className="profile-edit-page"><div className="profile-edit-card"><h1>Profile unavailable</h1><p>Your signed-in account could not be loaded.</p><button type="button" onClick={() => navigate("/")}>Go to homepage</button></div></main>;
  }

  function updateField(field, value) {
    setValues((current) => ({ ...current, [field]: value }));
    setStatus("");
    setError("");
    dispatch(clearProfileError());
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    setStatus("");
    dispatch(clearProfileError());

    const updates = Object.fromEntries(config.fields.map((field) => [field, String(values[field] ?? "").trim()]));
    if (updates.phoneNumber) {
      const normalizedPhone = normalizeIndianPhoneNumber(updates.phoneNumber);
      if (!normalizedPhone) {
        setError("Enter a valid Indian mobile number with 10 digits starting from 6–9, optionally prefixed by +91.");
        return;
      }
      updates.phoneNumber = normalizedPhone;
    }
    if (password.next || password.confirm || password.current) {
      if (password.current !== String(profile.password || "")) {
        setError("Your current password is incorrect.");
        return;
      }
      if (password.next.length < 6) {
        setError("The new password must be at least 6 characters.");
        return;
      }
      if (password.next !== password.confirm) {
        setError("The new password and confirmation do not match.");
        return;
      }
      updates.password = password.next;
    }

    try {
      await dispatch(updateSignedInProfile(updates)).unwrap();

      setPassword({ current: "", next: "", confirm: "" });
      setStatus("Profile updated successfully.");
    } catch { /* The shared auth slice exposes the profile update error. */ }
  }

  return (
    <main className="profile-edit-page">
      <div className="profile-edit-shell">
        <header className="profile-edit-heading">
          <div><p className="profile-edit-eyebrow">Account settings</p><h1>Edit profile</h1><p>Update your details without leaving your workspace.</p></div>
          <button className="profile-edit-secondary" type="button" onClick={() => navigate(returnTo)}>Back to workspace</button>
        </header>

        <form className="profile-edit-card" onSubmit={submit}>
          <div className="profile-edit-identity"><span className="profile-edit-avatar">{String(profile.name || profile.email || "U").trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()}</span><div><h2>{profile.name || "Your profile"}</h2><p>{profile.email || ""} · {session.role}</p></div></div>
          <div className="profile-edit-fields">
            {config.fields.map((field) => <label key={field}>{FIELD_LABELS[field]}{field === "gender" ? <select
              required
              value={values[field]}
              onChange={(event) => updateField(field, event.target.value)}
            >
              <option value="">Select gender</option>
              <option value="M">Male (M)</option>
              <option value="F">Female (F)</option>
            </select> : field === "phoneNumber" ? <input
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              maxLength="18"
              pattern={INDIAN_PHONE_PATTERN}
              title="Enter a 10-digit Indian mobile number starting with 6–9, optionally prefixed by +91."
              value={values[field]}
              onChange={(event) => updateField(field, event.target.value)}
            /> : <input
              type={field === "age" || field === "heightCm" || field === "weightKg" ? "number" : "text"}
              min={field === "age" ? 18 : field === "heightCm" ? 80 : field === "weightKg" ? 20 : undefined}
              max={field === "age" ? 99 : field === "heightCm" ? 250 : field === "weightKg" ? 300 : undefined}
              value={values[field]}
              onChange={(event) => updateField(field, event.target.value)}
              required={field === "name" || field === "experience"}
            />}</label>)}
          </div>
          <details className="profile-edit-security"><summary>Change password</summary><div className="profile-edit-fields"><label>Current password<input type="password" autoComplete="current-password" value={password.current} onChange={(event) => setPassword((current) => ({ ...current, current: event.target.value }))} /></label><label>New password<input type="password" minLength={6} autoComplete="new-password" value={password.next} onChange={(event) => setPassword((current) => ({ ...current, next: event.target.value }))} /></label><label>Confirm new password<input type="password" minLength={6} autoComplete="new-password" value={password.confirm} onChange={(event) => setPassword((current) => ({ ...current, confirm: event.target.value }))} /></label></div></details>
          {(error || profileError) && <p className="profile-edit-message is-error" role="alert">{error || profileError}</p>}
          {status && <p className="profile-edit-message" role="status">{status}</p>}
          <div className="profile-edit-actions"><button className="profile-edit-secondary" type="button" disabled={saving} onClick={() => navigate(returnTo)}>Cancel</button><button className="profile-edit-primary" type="submit" disabled={saving}>{saving ? "Saving…" : "Save changes"}</button></div>
        </form>
      </div>
    </main>
  );
}

export default ProfileEditPage;
