/**
 * employeeAuth.js
 * Adapts the existing employeeAuth localStorage logic for React.
 * Uses the same storage keys as the plain HTML app so sessions are shared.
 */

const EMPLOYEE_SESSION_KEY = 'stackbuilders.employeeSession.v1';
const EMPLOYEE_STORAGE_KEY  = 'stackbuilders.hr.employees';

export function getCurrentEmployee() {
  try {
    const raw = sessionStorage.getItem(EMPLOYEE_SESSION_KEY)
      || localStorage.getItem(EMPLOYEE_SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function getEmployeeFirstName(employee) {
  const name = employee?.name || 'Employee';
  return name.split(/\s+/).filter(Boolean)[0] || name;
}

export function getCompanyContext(employee) {
  return {
    companyId: String(employee?.companyId || '').trim(),
    companyName: String(employee?.companyName || '').trim(),
  };
}

/** Read all registered employees from localStorage (written by HR portal) */
export function getAllEmployees() {
  try {
    const raw = localStorage.getItem(EMPLOYEE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/** Attempt email+password login against the localStorage employee list */
export function loginEmployee(email, password) {
  const employees = getAllEmployees();
  const normalised = email.trim().toLowerCase();
  const match = employees.find(
    (e) =>
      String(e.email || '').trim().toLowerCase() === normalised &&
      String(e.password || '') === password
  );
  if (!match) return { ok: false, error: 'Invalid email or password.' };

  const session = { ...match };
  try {
    sessionStorage.setItem(EMPLOYEE_SESSION_KEY, JSON.stringify(session));
    localStorage.setItem(EMPLOYEE_SESSION_KEY, JSON.stringify(session));
  } catch { /* ignore */ }
  return { ok: true, employee: session };
}

/** Create and persist a demo session so the app can be previewed without HR setup */
export function createDemoSession() {
  const demo = {
    id: 'demo-emp-001',
    name: 'Alex Johnson',
    email: 'alex.johnson@demo.com',
    companyId: 'demo-co',
    companyName: 'Demo Company',
    role: 'employee',
    rewardPointsBalance: 750,
    claimedRewardIds: [],
  };
  try {
    sessionStorage.setItem(EMPLOYEE_SESSION_KEY, JSON.stringify(demo));
    localStorage.setItem(EMPLOYEE_SESSION_KEY, JSON.stringify(demo));
  } catch { /* ignore */ }
  return demo;
}

export function logoutEmployee() {
  try {
    sessionStorage.removeItem(EMPLOYEE_SESSION_KEY);
    localStorage.removeItem(EMPLOYEE_SESSION_KEY);
  } catch { /* ignore */ }
}
