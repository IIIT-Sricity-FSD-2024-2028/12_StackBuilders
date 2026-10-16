const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:3000").replace(/\/+$/, "");
const AUTH_SESSION_KEY = "stackbuilders.react.auth.v1";
const EMPLOYEE_SESSION_KEY = "stackbuilders.employeeSession.v1";
const EXPERT_SESSION_KEY = "stackbuilders.expertSession.v1";
const HR_SESSION_KEY = "stackbuilders.hrSession.v1";

const ADMIN_ACCOUNTS = [
  { email: "ravi@gmail.com", password: "1234", name: "Super User", role: "Admin", path: "/admin" },
  { email: "raju@gmail.com", password: "1234", name: "Supervisor", role: "Supervisor", path: "/supervisor" },
];

const LOCAL_KEYS = {
  employees: ["stackbuilders.hr.employees", "stack-builders-users"],
  experts: ["stackbuilders.hr.experts"],
  hrProfiles: ["stackbuilders.hr.profiles.v2", "stackbuilders.hr.profile.v1"],
};

export async function submitCompanyRequest(payload) {
  try {
    const response = await fetch(`${API_BASE_URL}/company-onboarding-requests`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const data = await response.json().catch(() => null);
    if (!response.ok) return { ok: false, error: getApiErrorMessage(data) || "The request could not be submitted." };
    return { ok: true, request: data };
  } catch {
    return { ok: false, error: "The backend is unavailable. Please try again when the server is running." };
  }
}

function getApiErrorMessage(value) {
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) return value.map(getApiErrorMessage).filter(Boolean).join(" ");
  if (value && typeof value === "object") {
    return getApiErrorMessage(value.message) || getApiErrorMessage(value.error) || getApiErrorMessage(value.detail);
  }
  return "";
}

function normalizeEmail(value) { return String(value || "").trim().toLowerCase(); }
function normalizeText(value) { return String(value || "").trim(); }

function readLocalRecords(keys) {
  for (const key of keys) {
    try {
      const parsed = JSON.parse(localStorage.getItem(key) || "null");
      if (Array.isArray(parsed)) return parsed;
      if (parsed && typeof parsed === "object") return [parsed];
    } catch {
      // Try the next legacy storage key.
    }
  }
  return [];
}

async function getBackendRecords(path, email) {
  try {
    const response = await fetch(`${API_BASE_URL}${path}?email=${encodeURIComponent(email)}`, {
      headers: { role: "Admin" },
    });
    if (!response.ok) return [];
    const records = await response.json();
    return Array.isArray(records) ? records : [];
  } catch {
    return [];
  }
}

function writeSession(profile, role, path) {
  const session = { role, path, profile, username: profile.email || profile.username };
  try {
    sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));

    if (role === "Employee") {
      const employeeSession = JSON.stringify(profile);
      sessionStorage.setItem(EMPLOYEE_SESSION_KEY, employeeSession);
      localStorage.setItem(EMPLOYEE_SESSION_KEY, employeeSession);
    }
    if (role === "Wellness Expert") sessionStorage.setItem(EXPERT_SESSION_KEY, JSON.stringify({ expertId: profile.id }));
    if (role === "HR") sessionStorage.setItem(HR_SESSION_KEY, JSON.stringify({ hrId: profile.id, source: "homepage" }));
  } catch {
    // A session-less preview is still usable when browser storage is blocked.
  }
  return session;
}

function clearOtherSessions() {
  try {
    sessionStorage.removeItem(EMPLOYEE_SESSION_KEY);
    sessionStorage.removeItem(EXPERT_SESSION_KEY);
    sessionStorage.removeItem(HR_SESSION_KEY);
    localStorage.removeItem(EMPLOYEE_SESSION_KEY);
    localStorage.removeItem(EXPERT_SESSION_KEY);
    localStorage.removeItem(HR_SESSION_KEY);
  } catch {
    // Ignore storage restrictions.
  }
}

export async function authenticate(username, password) {
  const email = normalizeEmail(username);
  const secret = normalizeText(password);
  const admin = ADMIN_ACCOUNTS.find((account) => account.email === email && account.password === secret);

  if (admin) {
    clearOtherSessions();
    return { ok: true, session: writeSession({ id: email, name: admin.name, email, role: admin.role }, admin.role, admin.path) };
  }

  const [employees, experts, hrProfiles] = await Promise.all([
    getBackendRecords("/employees", email),
    getBackendRecords("/experts", email),
    getBackendRecords("/hr-profiles", email),
  ]);
  const candidates = [
    ...(employees.length ? employees : readLocalRecords(LOCAL_KEYS.employees)).map((profile) => ({ profile, role: "Employee", path: "/employee" })),
    ...(experts.length ? experts : readLocalRecords(LOCAL_KEYS.experts)).map((profile) => ({ profile, role: "Wellness Expert", path: "/expert" })),
    ...(hrProfiles.length ? hrProfiles : readLocalRecords(LOCAL_KEYS.hrProfiles)).map((profile) => ({ profile, role: "HR", path: "/hr" })),
  ];
  const match = candidates.find(({ profile }) => normalizeEmail(profile.email || profile.username) === email && normalizeText(profile.password) === secret);

  if (!match) return { ok: false, error: "Invalid credentials. Please check your username and password." };
  if (normalizeText(match.profile.status || "Active").toLowerCase() !== "active") return { ok: false, error: `This ${match.role.toLowerCase()} account is inactive.` };

  clearOtherSessions();
  return { ok: true, session: writeSession(match.profile, match.role, match.path) };
}

export function getAuthSession() {
  try {
    const raw = sessionStorage.getItem(AUTH_SESSION_KEY) || localStorage.getItem(AUTH_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function verifyServerAccount(session) {
  const endpointByRole = {
    Employee: "/employees",
    "Wellness Expert": "/experts",
    HR: "/hr-profiles",
  };
  const endpoint = endpointByRole[session?.role];
  if (!endpoint) return true;

  const profile = session.profile || {};
  const id = String(profile.id || "").trim();
  const email = normalizeEmail(profile.email || profile.username || session.username);
  if (!id && !email) return false;

  try {
    const url = id
      ? `${API_BASE_URL}${endpoint}/${encodeURIComponent(id)}`
      : `${API_BASE_URL}${endpoint}?email=${encodeURIComponent(email)}`;
    const response = await fetch(url, { headers: { role: "Admin" } });
    if (response.status === 404) return false;
    if (!response.ok) return null;

    const payload = await response.json();
    const records = Array.isArray(payload) ? payload : [payload];
    const account = records.find((record) =>
      (id && String(record?.id || "") === id) ||
      (email && normalizeEmail(record?.email || record?.username) === email),
    );
    if (!account || String(account.status || "Active").toLowerCase() !== "active") return false;
    return true;
  } catch {
    // Keep the current session if the server cannot be reached; only a confirmed missing record logs out.
    return null;
  }
}

export function logout() {
  try {
    sessionStorage.removeItem(AUTH_SESSION_KEY);
    localStorage.removeItem(AUTH_SESSION_KEY);
    sessionStorage.removeItem("stackbuilders.adminSession.v1");
    localStorage.removeItem("stackbuilders.adminSession.v1");
  } catch {
    // Ignore storage restrictions.
  }
  clearOtherSessions();
}
