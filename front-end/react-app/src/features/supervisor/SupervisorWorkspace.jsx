import { useEffect, useMemo, useState } from "react";
import SupervisorIcon from "./components/SupervisorIcon.jsx";
import SupervisorSidebar from "./components/SupervisorSidebar.jsx";
import SupervisorDashboard from "./pages/SupervisorDashboard.jsx";
import UserManagement from "./pages/UserManagement.jsx";
import CompanyManagement from "./pages/CompanyManagement.jsx";
import RolesAccess from "./pages/RolesAccess.jsx";
import Reports from "./pages/Reports.jsx";
import Revenue from "./pages/Revenue.jsx";
import Queries from "./pages/Queries.jsx";
import Settings from "./pages/Settings.jsx";
import supervisorApi from "./supervisorApi.js";
import "./supervisor.css";

const pageNames = { dashboard: "Dashboard", users: "User Management", roles: "Roles & Access", companies: "Company Management", reports: "Reports", revenue: "Revenue", queries: "Queries", settings: "Settings" };
const emptyData = { users: [], companies: [], requests: [], queries: [], payments: [], subscriptions: [], consultations: [], liveSessions: [], videos: [], challenges: [], rewards: [] };

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? "—" : new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date);
}

function formatRelativeDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? "—" : new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(date);
}

function normalizeUsers({ employees, experts, hrProfiles }) {
  const mapUser = (record, role) => ({ id: record.id, name: record.name || record.email || "Unnamed user", email: record.email || "—", role, company: record.companyName || "—", companyId: record.companyId || "", status: record.status || "Unknown", lastActive: formatRelativeDate(record.updatedAt || record.createdAt), createdAt: record.createdAt || record.updatedAt });
  return [...employees.map((record) => mapUser(record, "Employee")), ...experts.map((record) => mapUser(record, "Wellness Expert")), ...hrProfiles.map((record) => mapUser(record, "HR"))];
}

function normalizeCompanies(companies, users, subscriptions) {
  return companies.map((company) => {
    const subscription = subscriptions.find((entry) => entry.companyId === company.id || entry.companyName?.toLowerCase() === company.name?.toLowerCase());
    return { ...company, plan: subscription?.planName || subscription?.planId || "No plan", employees: users.filter((user) => user.companyId === company.id || user.company?.toLowerCase() === company.name?.toLowerCase()).length, status: subscription?.status || "Unsubscribed" };
  });
}

function normalizeRequests(requests) { return requests.map((request) => ({ ...request, status: request.status ? request.status[0].toUpperCase() + request.status.slice(1) : "Pending", createdAt: formatDate(request.createdAt) })); }
function normalizeQueries(queries) { return queries.map((query) => ({ ...query, user: query.userName || query.userEmail || "Unknown user", email: query.userEmail || "—", description: query.description || "No description", createdAt: formatDate(query.createdAt), status: query.status || "Open" })); }
function normalizePayments(payments) { return payments.map((payment) => ({ ...payment, company: payment.companyName || payment.company || "—", plan: payment.planName || payment.planId || "—", amount: Number(payment.amount) || 0, date: formatDate(payment.paidAt || payment.createdAt), status: payment.status || "Unknown" })); }

function monthBuckets(records, dateKey) {
  const now = new Date();
  const buckets = Array.from({ length: 6 }, (_, index) => new Date(now.getFullYear(), now.getMonth() - (5 - index), 1));
  return { labels: buckets.map((date) => new Intl.DateTimeFormat(undefined, { month: "short" }).format(date)), values: buckets.map((bucket) => records.filter((record) => { const date = new Date(record[dateKey]); return date.getFullYear() === bucket.getFullYear() && date.getMonth() === bucket.getMonth(); }).length) };
}

function amountBuckets(records) {
  const now = new Date();
  const buckets = Array.from({ length: 6 }, (_, index) => new Date(now.getFullYear(), now.getMonth() - (5 - index), 1));
  return { labels: buckets.map((date) => new Intl.DateTimeFormat(undefined, { month: "short" }).format(date)), values: buckets.map((bucket) => records.filter((record) => { const date = new Date(record.paidAt || record.createdAt); return date.getFullYear() === bucket.getFullYear() && date.getMonth() === bucket.getMonth(); }).reduce((sum, record) => sum + (Number(record.amount) || 0), 0)) };
}

function SupervisorWorkspace() {
  const [activeView, setActiveView] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [data, setData] = useState(emptyData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = async () => {
    setLoading(true);
    setError("");
    try {
      const raw = await supervisorApi.loadWorkspace();
      const users = normalizeUsers(raw);
      setData({ ...raw, users, companies: normalizeCompanies(raw.companies, users, raw.subscriptions), requests: normalizeRequests(raw.requests), queries: normalizeQueries(raw.queries), payments: normalizePayments(raw.payments) });
    } catch (requestError) {
      setData(emptyData);
      setError(requestError.message || "The supervisor data could not be loaded.");
    } finally { setLoading(false); }
  };

  useEffect(() => { refresh(); }, []);

  const stats = useMemo(() => [{ label: "Total Users", value: String(data.users.length), detail: "Synced from employee, expert, and HR accounts" }, { label: "Active Users", value: String(data.users.filter((user) => user.status.toLowerCase() === "active").length), detail: "Live enabled accounts across the workspace" }, { label: "System Activity", value: String(data.consultations.length + data.liveSessions.length + data.videos.length + data.challenges.length + data.rewards.length), detail: "Consultations, sessions, videos, challenges, and rewards" }], [data]);
  const activities = useMemo(() => [{ id: "requests", title: `${data.requests.length} company onboarding requests`, detail: "Company Management", time: "Live" }, { id: "queries", title: `${data.queries.filter((query) => query.status.toLowerCase() === "open").length} open user queries`, detail: "Queries", time: "Live" }, { id: "companies", title: `${data.companies.length} company workspaces`, detail: "Workspace health", time: "Live" }], [data]);
  const reportData = useMemo(() => ({ monthlyUsers: monthBuckets(data.users, "createdAt"), roleDistribution: ["Employee", "HR", "Wellness Expert"].map((role) => data.users.filter((user) => user.role === role).length), weeklyActivity: [data.consultations, data.liveSessions, data.videos, data.challenges, data.rewards].map((records) => records.length), monthlyRevenue: amountBuckets(data.payments), planRevenue: [...new Set(data.payments.map((payment) => payment.planName || payment.planId).filter(Boolean))].map((plan) => ({ label: plan, value: data.payments.filter((payment) => (payment.planName || payment.planId) === plan).reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0) })) }), [data]);

  const navigate = (view) => { setActiveView(view); setSidebarOpen(false); };
  const addUser = async (user) => { const company = data.companies.find((entry) => entry.id === user.companyId); const common = { name: user.name, email: user.email, password: user.password, companyId: user.companyId, companyName: company?.name, phoneNumber: user.phone, status: "Active" }; const created = user.role === "Employee" ? await supervisorApi.createEmployee({ ...common, department: user.department }) : user.role === "HR" ? await supervisorApi.createHrProfile(common) : await supervisorApi.createExpert({ ...common, specialization: user.specialization, experience: user.experience }); const record = created.hrProfile || created; setData((current) => ({ ...current, users: [...current.users, normalizeUsers({ employees: user.role === "Employee" ? [record] : [], experts: user.role === "Wellness Expert" ? [record] : [], hrProfiles: user.role === "HR" ? [record] : [] })[0]] })); };
  const addCompany = async (company) => { const created = await supervisorApi.createCompany(company); setData((current) => ({ ...current, companies: [normalizeCompanies([created], current.users, current.subscriptions)[0], ...current.companies] })); };
  const approveRequest = async (id) => { await supervisorApi.approveRequest(id); await refresh(); };
  const replyToQuery = async (id, reply) => { const updated = await supervisorApi.updateQuery(id, { reply, status: "Replied" }); setData((current) => ({ ...current, queries: current.queries.map((query) => query.id === id ? { ...query, ...updated, status: "Replied", reply } : query) })); };

  const page = { dashboard: <SupervisorDashboard navigate={navigate} stats={stats} activities={activities} />, users: <UserManagement users={data.users} companies={data.companies} onAddUser={addUser} />, companies: <CompanyManagement companies={data.companies} requests={data.requests} onAddCompany={addCompany} onApproveRequest={approveRequest} />, roles: <RolesAccess />, reports: <Reports stats={[{ label: "Total Companies", value: String(data.companies.length), detail: "Managed from the supervisor workspace" }, { label: "Consultations", value: String(data.consultations.length), detail: "Requested and accepted sessions" }, { label: "Scheduled Live Sessions", value: String(data.liveSessions.length), detail: "Upcoming expert-led sessions" }, { label: "Video Library Items", value: String(data.videos.length), detail: "Expert content in the library" }]} chartData={reportData} />, revenue: <Revenue payments={data.payments} subscriptions={data.subscriptions} chartData={reportData} />, queries: <Queries queries={data.queries} onReply={replyToQuery} />, settings: <Settings /> }[activeView];

  return <div className="supervisor-workspace"><SupervisorSidebar activeView={activeView} isOpen={sidebarOpen} onSelect={navigate} /><main className="supervisor-main"><header className="supervisor-topbar"><button className="supervisor-mobile-menu" type="button" onClick={() => setSidebarOpen((open) => !open)} aria-label="Toggle supervisor navigation"><span /><span /><span /></button><div className="supervisor-breadcrumb"><span>Supervisor Console</span><SupervisorIcon name="chevron" size={14} /><strong>{pageNames[activeView]}</strong></div><div className="supervisor-topbar-actions"><span className="supervisor-status-dot" /><span>{loading ? "Loading workspace" : "Wellness workspace"}</span><span className="supervisor-avatar">SB</span></div></header><div className="supervisor-content">{error && <div className="supervisor-error" role="alert"><span>{error}</span><button type="button" onClick={refresh}>Retry</button></div>}{loading ? <div className="supervisor-loading"><span className="supervisor-spinner" />Loading supervisor data…</div> : page}</div></main></div>;
}

export default SupervisorWorkspace;
