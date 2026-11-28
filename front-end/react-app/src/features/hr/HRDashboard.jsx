import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import HRChallengeOverview from "./components/HRChallengeOverview.jsx";
import HREmployeeManagement from "./components/HREmployeeManagement.jsx";
import HRExpertManagement from "./components/HRExpertManagement.jsx";
import HRNavbar from "./components/HRNavbar.jsx";
import HRStatCard from "./components/HRStatCard.jsx";
import DashboardProfileOverlay from "../../components/DashboardProfileOverlay.jsx";
import RouteLoadingScreen from "../../components/RouteLoadingScreen.jsx";
import usePageStylesheets from "../../hooks/usePageStylesheets.js";
import { loadHrDashboard } from "./dashboardSlice.js";
import useAutoRefresh from "../../hooks/useAutoRefresh.js";
import { useRoleAccess } from "../shared/roleAccessContext.jsx";
import { getHrCompanyContext } from "./hrUtils.js";

function HRDashboard() {
  const { hasPermission } = useRoleAccess();
  const canReadReports = hasPermission("reports-read");
  const canReadUsers = hasPermission("user-management-read");
  const canReadChallenges = hasPermission("challenge-management-read");
  const stylesReady = usePageStylesheets("/hr-dashboard-legacy.css");
  const dispatch = useDispatch();
  const profile = useSelector((state) => state.auth.session?.profile || null);
  const company = useMemo(() => getHrCompanyContext(profile), [profile]);
  const employees = useSelector((state) => state.hr.employees.items);
  const experts = useSelector((state) => state.hr.experts.items);
  const challenges = useSelector((state) => state.hr.challenges.challenges);
  const liveSessions = useSelector((state) => state.hr.liveSessions.items);
  const rewards = useSelector((state) => state.hr.challenges.rewards);
  const loading = useSelector((state) => state.hr.dashboard.loading);
  const dashboardError = useSelector((state) => state.hr.dashboard.error);
  const [profileOpen, setProfileOpen] = useState(false);

  const loadDashboard = useCallback(
    () => dispatch(loadHrDashboard(company)),
    [dispatch, company],
  );

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);
  useAutoRefresh(
    loadDashboard,
    `hr-dashboard:${company.companyId || company.companyName || "default"}`,
  );

  if (!stylesReady) return <RouteLoadingScreen />;

  return (
    <div className="page-shell" id="home">
      <HRNavbar onProfileClick={() => setProfileOpen(true)} />

      {canReadReports && (
        <section className="hero-card">
          <h1>Welcome back</h1>
          <p>
            Monitor and manage employee wellness programs, track participation,
            and ensure a healthy workplace culture.
          </p>
        </section>
      )}

      {dashboardError && (
        <p className="api-error" role="alert">
          {dashboardError}
        </p>
      )}
      {loading && <p className="api-status">Loading HR workspace…</p>}

      {canReadReports && (
        <section className="stats-grid">
          <HRStatCard
            icon="PG"
            label="Total Employees"
            tone="teal"
            value={employees.length}
          />
          <HRStatCard
            icon="WB"
            label="Wellness Experts"
            tone="blue"
            value={experts.length}
          />
          <HRStatCard
            icon="LS"
            label="Scheduled Live Sessions"
            tone="green"
            value={liveSessions.length}
          />
          <HRStatCard
            icon="RW"
            label="Active Rewards"
            tone="purple"
            value={rewards.length}
          />
          <HRStatCard
            icon="AC"
            label="Active Challenges"
            tone="orange"
            value={challenges.length}
          />
        </section>
      )}

      {canReadChallenges && <HRChallengeOverview />}

      {canReadUsers && <HREmployeeManagement />}

      {canReadUsers && <HRExpertManagement />}

      <DashboardProfileOverlay
        role="hr"
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
      />
    </div>
  );
}

export default HRDashboard;
