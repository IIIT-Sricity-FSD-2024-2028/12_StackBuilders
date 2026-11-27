import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import SupervisorDashboard from "./pages/SupervisorDashboard.jsx";
import UserManagement from "./pages/UserManagement.jsx";
import CompanyManagement from "./pages/CompanyManagement.jsx";
import RolesAccess from "./pages/RolesAccess.jsx";
import Reports from "./pages/Reports.jsx";
import Revenue from "./pages/Revenue.jsx";
import Queries from "./pages/Queries.jsx";
import Settings from "./pages/Settings.jsx";
import SupervisorSidebar from "./components/SupervisorSidebar.jsx";
import SupervisorIcon from "./components/SupervisorIcon.jsx";
import { loadSupervisorDashboard } from "./dashboardSlice.js";
import { loadSupervisorReports } from "./reportsSlice.js";
import { createSupervisorUser, addSupervisorUser } from "./usersSlice.js";
import { approveSupervisorRequest, createSupervisorCompany, rejectSupervisorRequest } from "./companyManagementSlice.js";
import { replyToSupervisorQuery } from "./queriesSlice.js";
import { signOut } from "../shared/authSlice.js";
import usePersistedTab from "../../hooks/usePersistedTab.js";
import { buildRecentActivityEntries } from "../../utils/recentActivity.js";
import { buildPlanRevenue } from "../../utils/planRevenue.js";
import useAutoRefresh from "../../hooks/useAutoRefresh.js";
import "./supervisor.css";

const navigationItems = [["chart-pie", "Dashboard", "dashboard"], ["users", "User Management", "users"], ["user-shield", "Roles & Access", "roles"], ["database", "Company Management", "companies"], ["chart-column", "Reports", "reports"], ["dollar-sign", "Revenue", "revenue"], ["envelope", "Queries", "queries"], ["gear", "Settings", "settings"]];
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
  const mapUser = (record, role) => ({ id: record.id, name: record.name || record.email || "Unnamed user", email: record.email || "—", role, company: record.companyName || "—", companyName: record.companyName || "--", companyId: record.companyId || "", isSeededDefault: Boolean(record.isSeededDefault), status: record.status || "Unknown", lastActive: formatRelativeDate(record.updatedAt || record.createdAt), createdAt: record.createdAt || record.updatedAt });
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
  const dispatch = useDispatch();
  const navigateHome = useNavigate();
  const [activeView, setActiveView] = usePersistedTab("stackbuilders.supervisor.activeView", "dashboard", navigationItems.map(([, , view]) => view));
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const loading = useSelector((state) => state.supervisor.dashboard.loading);
  const error = useSelector((state) => state.supervisor.dashboard.error);
  const users = useSelector((state) => state.supervisor.users.items);
  const rawCompanies = useSelector((state) => state.supervisor.companyManagement.companies);
  const requests = useSelector((state) => state.supervisor.companyManagement.requests);
  const queries = useSelector((state) => state.supervisor.queries.items);
  const payments = useSelector((state) => state.supervisor.revenue.payments);
  const subscriptions = useSelector((state) => state.supervisor.revenue.subscriptions);
  const activityData = useSelector((state) => state.supervisor.activity);
  const data = useMemo(() => ({
    users,
    companies: normalizeCompanies(rawCompanies, users, subscriptions),
    requests,
    queries,
    payments,
    subscriptions,
    consultations: activityData.consultations,
    liveSessions: activityData.liveSessions,
    videos: activityData.videos,
    challenges: activityData.challenges,
    rewards: activityData.rewards,
  }), [users, rawCompanies, requests, queries, payments, subscriptions, activityData]);
  const refresh = useCallback(() => dispatch(loadSupervisorDashboard()), [dispatch]);

  useEffect(() => { void refresh(); }, [refresh]);
  useAutoRefresh(refresh, "supervisor-workspace");
  useEffect(() => {
    document.body.classList.add("app-body");
    return () => document.body.classList.remove("app-body");
  }, []);
  useEffect(() => {
    if (activeView === "reports") void dispatch(loadSupervisorReports());
  }, [activeView, dispatch]);

  const stats = useMemo(() => [
    { label: "Total Users", value: String(data.users.length), detail: "Synced from employee, expert, and HR accounts" },
    { label: "Active Users", value: String(data.users.filter((user) => user.status.toLowerCase() === "active").length), detail: "Live enabled accounts across the workspace" },
    { label: "System Activity", value: String(data.consultations.length + data.liveSessions.length + data.videos.length + data.challenges.length + data.rewards.length), detail: "Consultations, sessions, videos, challenges, and rewards" },
  ], [data]);
  const activities = useMemo(() => buildRecentActivityEntries(data), [data]);
  const reportData = useMemo(() => ({
    monthlyUsers: monthBuckets(data.users, "createdAt"),
    roleDistribution: ["Employee", "HR", "Wellness Expert"].map((role) => data.users.filter((user) => user.role === role).length),
    weeklyActivity: [data.consultations, data.liveSessions, data.videos, data.challenges, data.rewards].map((records) => records.length),
    monthlyRevenue: amountBuckets(data.payments),
    planRevenue: buildPlanRevenue(data.payments),
  }), [data]);

  const navigate = (view) => { setActiveView(view); setSidebarOpen(false); };
  const addUser = async (user) => {
    const company = data.companies.find((entry) => entry.id === user.companyId);
    await dispatch(createSupervisorUser({ user, company })).unwrap();
  };
  const addCompany = async (form) => {
    const result = await dispatch(createSupervisorCompany(form)).unwrap();
    const hrUser = normalizeUsers({ employees: [], experts: [], hrProfiles: [result.hrProfile] })[0];
    if (hrUser) dispatch(addSupervisorUser(hrUser));
  };
  const approveRequest = (id) => dispatch(approveSupervisorRequest(id)).unwrap();
  const rejectRequest = (id) => dispatch(rejectSupervisorRequest(id)).unwrap();
  const replyToQuery = (id, reply) => dispatch(replyToSupervisorQuery({ id, reply })).unwrap();

  const page = {
    dashboard: <SupervisorDashboard navigate={navigate} stats={stats} activities={activities} />,
    users: <UserManagement users={data.users} companies={data.companies} onAddUser={addUser} />,
    companies: <CompanyManagement companies={data.companies} users={data.users} requests={data.requests} onAddCompany={addCompany} onApproveRequest={approveRequest} onRejectRequest={rejectRequest} />,
    roles: <RolesAccess />,
    reports: <Reports stats={[
      { label: "Total Companies", value: String(data.companies.length), detail: "Managed from the supervisor workspace" },
      { label: "Consultations", value: String(data.consultations.length), detail: "Requested and accepted sessions" },
      { label: "Scheduled Live Sessions", value: String(data.liveSessions.length), detail: "Upcoming expert-led sessions" },
      { label: "Video Library Items", value: String(data.videos.length), detail: "Expert content in the library" },
    ]} chartData={reportData} />,
    revenue: <Revenue payments={data.payments} subscriptions={data.subscriptions} chartData={reportData} />,
    queries: <Queries queries={data.queries} onReply={replyToQuery} />,
    settings: <Settings />,
  }[activeView];

  const session = useSelector((state) => state.auth.session);
  const profileName = session?.profile?.name || session?.username || "Supervisor";
  const initials = profileName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "SB";
  const activeLabel = navigationItems.find(([, label, view]) => view === activeView)?.[1] || "Dashboard";
  return <div className="supervisor-workspace">
    <SupervisorSidebar activeView={activeView} onSelect={navigate} isOpen={sidebarOpen} />
    <main className="supervisor-main">
      <header className="supervisor-topbar">
        <button className="supervisor-mobile-menu" type="button" onClick={() => setSidebarOpen((open) => !open)} aria-label="Toggle supervisor navigation">
          <span /><span /><span />
        </button>
        <div className="supervisor-breadcrumb"><SupervisorIcon name="layer" size={16} /><span>Workspace</span><span>/</span><strong>{activeLabel}</strong></div>
        <div className="supervisor-topbar-actions"><span className="supervisor-avatar" title={profileName}>{initials}</span><button className="supervisor-logout-button" type="button" onClick={() => { void dispatch(signOut()); navigateHome("/"); }}>Log out</button></div>
      </header>
      <div className="supervisor-content">
        {error && <p className="supervisor-empty-state" role="alert">{error} <button className="supervisor-outline-button" type="button" onClick={refresh}>Retry</button></p>}
        {loading ? <p className="supervisor-empty-state">Loading supervisor data…</p> : page}
      </div>
    </main>
  </div>;
}

export default SupervisorWorkspace;
