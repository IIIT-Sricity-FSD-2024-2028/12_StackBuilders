import { Navigate, Route, Routes } from "react-router-dom";
import DashboardLayout from "./layouts/DashboardLayout.jsx";
import AdminDashboard from "./features/admin/AdminDashboard.jsx";
import AdminConsoleLayout from "./features/admin/AdminConsoleLayout.jsx";
import UserManagement from "./features/admin/pages/UserManagement.jsx";
import HRDashboard from "./features/hr/HRDashboard.jsx";
import HRChallenges from "./features/hr/HRChallenges.jsx";
import ExpertWorkspace from "./features/expert/ExpertWorkspace.jsx";
import EmployeeDashboard from "./features/employee/EmployeeDashboard.jsx";
import EmployeeConsultation from "./features/employee/components/EmployeeConsultation.jsx";
import SupervisorWorkspace from "./features/supervisor/SupervisorWorkspace.jsx";

const roles = [
  ["Employee", "/employee"],
  ["HR", "/hr"],
  ["Expert", "/expert"],
  ["Admin", "/admin"],
  ["Superadmin", "/superadmin"],
  ["Supervisor", "/supervisor"],
];

function PlaceholderPage({ role }) {
  return (
    <section className="placeholder-page">
      <p className="eyebrow">React foundation</p>
      <h1>{role} workspace</h1>
      <p>
        This route is ready for the {role.toLowerCase()} team to build without
        changing the shared layout.
      </p>
    </section>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/supervisor" element={<SupervisorWorkspace />} />
      <Route path="/expert" element={<ExpertWorkspace />} />
      <Route path="/hr/challenges" element={<HRChallenges />} />
      <Route element={<AdminConsoleLayout />}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<UserManagement />} />
      </Route>
      <Route element={<DashboardLayout roles={roles} />}>
        <Route index element={<Navigate to="/employee" replace />} />
        <Route path="employee" element={<EmployeeDashboard />} />
        <Route path="consultation" element={<EmployeeConsultation />} />
        {roles.filter(([role]) => !["Employee", "Expert"].includes(role)).map(([role, path]) => (
          <Route
            key={path}
            path={path.slice(1)}
            element={
              role === "Admin" ? (
                <AdminDashboard />
              ) : role === "HR" ? (
                <HRDashboard />
              ) : (
                <PlaceholderPage role={role} />
              )
            }
          />
        ))}
      </Route>
    </Routes>
  );
}

export default App;
