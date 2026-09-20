import { Navigate, Route, Routes } from "react-router-dom";
import DashboardLayout from "./layouts/DashboardLayout.jsx";

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
      <Route element={<DashboardLayout roles={roles} />}>
        <Route index element={<Navigate to="/employee" replace />} />
        {roles.map(([role, path]) => (
          <Route
            key={path}
            path={path.slice(1)}
            element={<PlaceholderPage role={role} />}
          />
        ))}
      </Route>
    </Routes>
  );
}

export default App;
