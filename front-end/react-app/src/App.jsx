import { Navigate, Route, Routes } from "react-router-dom";
import DashboardLayout from "./layouts/DashboardLayout.jsx";
import AdminDashboard from "./features/admin/AdminDashboard.jsx";
import AdminConsoleLayout from "./features/admin/AdminConsoleLayout.jsx";
import HRDashboard from "./features/hr/HRDashboard.jsx";
import EmployeeDashboard from "./features/employee/EmployeeDashboard.jsx";
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
      <Route element={<AdminConsoleLayout />}>
        <Route path="/admin" element={<AdminDashboard />} />
      </Route>
      <Route element={<DashboardLayout roles={roles} />}>
        <Route index element={<Navigate to="/employee" replace />} />
        {roles.map(([role, path]) => (
          <Route
            key={path}
            path={path.slice(1)}
            element={
              role === "Admin" ? (
                <AdminDashboard />
              ) : role === "HR" ? (
                <HRDashboard />
              ) : role === "Employee" ? (
                <EmployeeDashboard />
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
