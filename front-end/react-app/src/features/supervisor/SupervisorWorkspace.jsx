import { useMemo, useState } from "react";
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
import "./supervisor.css";

const pageNames = { dashboard: "Dashboard", users: "User Management", roles: "Roles & Access", companies: "Company Management", reports: "Reports", revenue: "Revenue", queries: "Queries", settings: "Settings" };

const initialUsers = [
  { id: "USR-001", name: "Ananya Rao", email: "ananya.rao@gmail.com", role: "Employee", company: "Northstar Labs", status: "Active", lastActive: "Today, 10:42 AM" },
  { id: "USR-002", name: "Ravi Kumar", email: "ravi.kumar@gmail.com", role: "HR", company: "Northstar Labs", status: "Active", lastActive: "Today, 09:18 AM" },
  { id: "USR-003", name: "Dr. Meera Shah", email: "meera.shah@gmail.com", role: "Wellness Expert", company: "WellSpring Co.", status: "Active", lastActive: "Yesterday" },
  { id: "USR-004", name: "Vikram Singh", email: "vikram.singh@gmail.com", role: "Employee", company: "WellSpring Co.", status: "Inactive", lastActive: "18 Sep 2026" },
];

const initialCompanies = [
  { id: "CMP-001", name: "Northstar Labs", email: "people@northstarlabs.com", plan: "Business", employees: 86, status: "Active" },
  { id: "CMP-002", name: "WellSpring Co.", email: "hr@wellspring.co", plan: "Starter", employees: 34, status: "Active" },
  { id: "CMP-003", name: "BrightPath Health", email: "hello@brightpath.health", plan: "Enterprise", employees: 214, status: "Active" },
];

const initialRequests = [
  { id: "REQ-001", companyName: "Urban Bloom", hrName: "Priya Menon", createdAt: "Today, 11:05 AM", status: "Pending" },
  { id: "REQ-002", companyName: "Cedar & Co.", hrName: "Arjun Nair", createdAt: "Yesterday", status: "Pending" },
];

const initialQueries = [
  { id: "Q-001", user: "Riya Patel", email: "riya.patel@gmail.com", description: "How can I update my company wellness preferences?", createdAt: "Today, 09:12 AM", status: "Open", reply: "" },
  { id: "Q-002", user: "Karan Shah", email: "karan.shah@gmail.com", description: "The video library is not showing my assigned sessions.", createdAt: "Yesterday", status: "Open", reply: "" },
  { id: "Q-003", user: "Neha Joshi", email: "neha.joshi@gmail.com", description: "Please help me understand the challenge points system.", createdAt: "18 Sep 2026", status: "Replied", reply: "The HR team can help assign the next challenge.", },
];

const initialPayments = [
  { id: "PAY-001", company: "Northstar Labs", plan: "Business", amount: 200, date: "20 Sep 2026", status: "Completed" },
  { id: "PAY-002", company: "WellSpring Co.", plan: "Starter", amount: 100, date: "18 Sep 2026", status: "Completed" },
  { id: "PAY-003", company: "BrightPath Health", plan: "Enterprise", amount: 300, date: "12 Sep 2026", status: "Completed" },
];

function SupervisorWorkspace() {
  const [activeView, setActiveView] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [users, setUsers] = useState(initialUsers);
  const [companies, setCompanies] = useState(initialCompanies);
  const [requests, setRequests] = useState(initialRequests);
  const [queries, setQueries] = useState(initialQueries);

  const stats = useMemo(() => [
    { label: "Total Users", value: String(users.length), detail: "Synced from employee, expert, and HR accounts" },
    { label: "Active Users", value: String(users.filter((user) => user.status === "Active").length), detail: "Live enabled accounts across the workspace" },
    { label: "System Activity", value: String(users.length + companies.length + queries.length), detail: "Consultations, sessions, videos, challenges, and rewards" },
  ], [users, companies, queries]);

  const activities = [
    { id: "activity-1", title: `${requests.length} company onboarding requests need review`, detail: "Company Management", time: "Now" },
    { id: "activity-2", title: `${queries.filter((query) => query.status === "Open").length} user queries are open`, detail: "Queries", time: "Today" },
    { id: "activity-3", title: `${companies.length} company workspaces are active`, detail: "Workspace health", time: "Today" },
  ];

  const navigate = (view) => { setActiveView(view); setSidebarOpen(false); };
  const addUser = (user) => setUsers((current) => [...current, user]);
  const addCompany = (company) => setCompanies((current) => [...current, company]);
  const approveRequest = (id) => setRequests((current) => current.filter((request) => request.id !== id));
  const replyToQuery = (id, reply) => setQueries((current) => current.map((query) => query.id === id ? { ...query, reply, status: "Replied" } : query));

  const page = {
    dashboard: <SupervisorDashboard navigate={navigate} stats={stats} activities={activities} />,
    users: <UserManagement users={users} onAddUser={addUser} />,
    companies: <CompanyManagement companies={companies} requests={requests} onAddCompany={addCompany} onApproveRequest={approveRequest} />,
    roles: <RolesAccess />,
    reports: <Reports stats={[{ label: "Total Companies", value: String(companies.length), detail: "Managed from the supervisor workspace" }, { label: "Consultations", value: "24", detail: "Requested and accepted sessions" }, { label: "Scheduled Live Sessions", value: "8", detail: "Upcoming expert-led sessions" }, { label: "Video Library Items", value: "56", detail: "Expert content in the library" }]} />,
    revenue: <Revenue payments={initialPayments} />,
    queries: <Queries queries={queries} onReply={replyToQuery} />,
    settings: <Settings />,
  }[activeView];

  return <div className="supervisor-workspace"><SupervisorSidebar activeView={activeView} isOpen={sidebarOpen} onSelect={navigate} /><main className="supervisor-main"><header className="supervisor-topbar"><button className="supervisor-mobile-menu" type="button" onClick={() => setSidebarOpen((open) => !open)} aria-label="Toggle supervisor navigation"><span /><span /><span /></button><div className="supervisor-breadcrumb"><span>Supervisor Console</span><SupervisorIcon name="chevron" size={14} /><strong>{pageNames[activeView]}</strong></div><div className="supervisor-topbar-actions"><span className="supervisor-status-dot" /><span>Wellness workspace</span><span className="supervisor-avatar">SB</span></div></header><div className="supervisor-content">{page}</div></main></div>;
}

export default SupervisorWorkspace;
