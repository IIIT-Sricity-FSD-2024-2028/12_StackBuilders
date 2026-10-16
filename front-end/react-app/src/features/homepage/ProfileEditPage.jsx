import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getAuthSession } from "./authService.js";
import "./profile-edit-page.css";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:3000").replace(/\/+$/, "");
const AUTH_SESSION_KEY = "stackbuilders.react.auth.v1";

function readErrorMessage(value) {
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) return value.map(readErrorMessage).filter(Boolean).join(" ");
  if (!value || typeof value !== "object") return "";
  return readErrorMessage(value.message) || readErrorMessage(value.error) || readErrorMessage(value.details);
}

const ROLE_CONFIG = {
  Employee: { endpoint: "/employees", home: "/employee", returnPrefixes: ["/employee", "/consultation", "/wellness-checkins", "/live-sessions", "/video-library", "/mental-wellness", "/physical-wellness", "/diet-plan"], fields: ["name", "age", "phoneNumber", "gender", "heightCm", "weightKg"] },
  "Wellness Expert": { endpoint: "/experts", home: "/expert", returnPrefixes: ["/expert"], fields: ["name", "phoneNumber", "specialization", "experience"] },
  HR: { endpoint: "/hr-profiles", home: "/hr", returnPrefixes: ["/hr"], fields: ["name", "phoneNumber", "location"] },
};

const FIELD_LABELS = {
  name: "Full name",
  age: "Age",
  phoneNumber: "Phone number",
  gender: "Gender",
  heightCm: "Height (cm)",
  weightKg: "Weight (kg)",
  specialization: "Specialization",
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
  const session = getAuthSession();
  const config = ROLE_CONFIG[session?.role];
  const profile = session?.profile || {};
  const returnTo = useMemo(() => {
    const requested = searchParams.get("returnTo") || "";
    const allowed = config?.returnPrefixes?.some((prefix) => requested === prefix || requested.startsWith(`${prefix}/`));
    return allowed ? requested : (config?.home || "/");
  }, [config, searchParams]);
  const [values, setValues] = useState(() => Object.fromEntries((config?.fields || []).map((field) => [field, field === "gender" ? normalizeGender(profile[field]) : profile[field] ?? ""])));
  const [password, setPassword] = useState({ current: "", next: "", confirm: "" });
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  if (!config || !profile.id) {
    return <main className="profile-edit-page"><div className="profile-edit-card"><h1>Profile unavailable</h1><p>Your signed-in account could not be loaded.</p><button type="button" onClick={() => navigate("/")}>Go to homepage</button></div></main>;
  }

  function updateField(field, value) {
    setValues((current) => ({ ...current, [field]: value }));
    setStatus("");
    setError("");
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setStatus("");

    const updates = Object.fromEntries(config.fields.map((field) => [field, String(values[field] ?? "").trim()]));
    if (password.next || password.confirm || password.current) {
      if (password.current !== String(profile.password || "")) {
        setError("Your current password is incorrect.");
        setSaving(false);
        return;
      }
      if (password.next.length < 6) {
        setError("The new password must be at least 6 characters.");
        setSaving(false);
        return;
      }
      if (password.next !== password.confirm) {
        setError("The new password and confirmation do not match.");
        setSaving(false);
        return;
      }
      updates.password = password.next;
    }

    try {
      const response = await fetch(`${API_BASE_URL}${config.endpoint}/${encodeURIComponent(profile.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", role: session.role },
        body: JSON.stringify(updates),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(readErrorMessage(payload) || "Your profile could not be saved.");
      }

      const nextSession = { ...session, profile: payload, username: payload.email || session.username };
      try {
        sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(nextSession));
        localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(nextSession));
        if (session.role === "Employee") {
          const employeeSession = JSON.stringify(payload);
          sessionStorage.setItem("stackbuilders.employeeSession.v1", employeeSession);
          localStorage.setItem("stackbuilders.employeeSession.v1", employeeSession);
        }
        if (session.role === "Wellness Expert") {
          sessionStorage.setItem("stackbuilders.expertSession.v1", JSON.stringify({ expertId: payload.id }));
        }
        if (session.role === "HR") {
          sessionStorage.setItem("stackbuilders.hrSession.v1", JSON.stringify({ hrId: payload.id, source: "homepage" }));
        }
      } catch {
        // The server update is authoritative; keep the success even if browser storage is blocked.
      }

      setPassword({ current: "", next: "", confirm: "" });
      setStatus("Profile updated successfully.");
    } catch (saveError) {
      setError(saveError.message || "Your profile could not be saved.");
    } finally {
      setSaving(false);
    }
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
            </select> : <input
              type={field === "age" || field === "heightCm" || field === "weightKg" ? "number" : "text"}
              min={field === "age" ? 18 : field === "heightCm" ? 80 : field === "weightKg" ? 20 : undefined}
              max={field === "age" ? 99 : field === "heightCm" ? 250 : field === "weightKg" ? 300 : undefined}
              value={values[field]}
              onChange={(event) => updateField(field, event.target.value)}
              required={field === "name" || field === "specialization" || field === "experience"}
            />}</label>)}
          </div>
          <details className="profile-edit-security"><summary>Change password</summary><div className="profile-edit-fields"><label>Current password<input type="password" autoComplete="current-password" value={password.current} onChange={(event) => setPassword((current) => ({ ...current, current: event.target.value }))} /></label><label>New password<input type="password" minLength={6} autoComplete="new-password" value={password.next} onChange={(event) => setPassword((current) => ({ ...current, next: event.target.value }))} /></label><label>Confirm new password<input type="password" minLength={6} autoComplete="new-password" value={password.confirm} onChange={(event) => setPassword((current) => ({ ...current, confirm: event.target.value }))} /></label></div></details>
          {error && <p className="profile-edit-message is-error" role="alert">{error}</p>}
          {status && <p className="profile-edit-message" role="status">{status}</p>}
          <div className="profile-edit-actions"><button className="profile-edit-secondary" type="button" disabled={saving} onClick={() => navigate(returnTo)}>Cancel</button><button className="profile-edit-primary" type="submit" disabled={saving}>{saving ? "Saving…" : "Save changes"}</button></div>
        </form>
      </div>
    </main>
  );
}

export default ProfileEditPage;
