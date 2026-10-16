import { Navigate, Route, Routes } from "react-router-dom";
import AdminDashboard from "./features/admin/pages/AdminDashboard.jsx";
import AdminConsoleLayout from "./features/admin/AdminConsoleLayout.jsx";
import UserManagement from "./features/admin/pages/UserManagement.jsx";
import CompanyManagement from "./features/admin/pages/CompanyManagement.jsx";
import RolesAccess from "./features/admin/pages/RolesAccess.jsx";
import Reports from "./features/admin/pages/Reports.jsx";
import Revenue from "./features/admin/pages/Revenue.jsx";
import Settings from "./features/admin/pages/Settings.jsx";
import HRDashboard from "./features/hr/HRDashboard.jsx";
import HRLayout from "./features/hr/HRLayout.jsx";
import HRChallenges from "./features/hr/HRChallenges.jsx";
import HRVideoLibrary from "./features/hr/HRVideoLibrary.jsx";
import HRPricing from "./features/hr/HRPricing.jsx";
import HRPayment from "./features/hr/HRPayment.jsx";
import ExpertWorkspace from "./features/expert/ExpertWorkspace.jsx";
import SupervisorWorkspace from "./features/supervisor/SupervisorWorkspace.jsx";
import HomePage from "./features/homepage/HomePage.jsx";
import CompanyRequestPage from "./features/homepage/CompanyRequestPage.jsx";
import ProtectedRoute from "./features/homepage/ProtectedRoute.jsx";
import ProfileEditPage from "./features/homepage/ProfileEditPage.jsx";
import { RolePermissionGate } from "./features/shared/roleAccessContext.jsx";

// Employee feature pages
import EmployeeLayout      from "./features/employee/components/EmployeeLayout.jsx";
import EmployeeDashboard   from "./features/employee/EmployeeDashboard.jsx";
import EmployeeConsultation from "./features/employee/components/EmployeeConsultation.jsx";
import WellnessCheckins    from "./features/employee/components/WellnessCheckins.jsx";
import LiveSessions        from "./features/employee/components/LiveSessions.jsx";
import VideoLibrary        from "./features/employee/components/VideoLibrary.jsx";
import WellnessFormPage    from "./features/employee/components/WellnessFormPage.jsx";

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/company-request" element={<CompanyRequestPage />} />
      <Route path="/profile/edit" element={<ProtectedRoute roles={["Employee", "Wellness Expert", "HR"]}><ProfileEditPage /></ProtectedRoute>} />
      {/* ── Standalone workspaces (no role-switcher sidebar) ── */}
      <Route path="/supervisor" element={<ProtectedRoute roles={["Supervisor", "Admin"]}><SupervisorWorkspace /></ProtectedRoute>} />
      <Route path="/expert" element={<ProtectedRoute roles={["Wellness Expert"]}><ExpertWorkspace /></ProtectedRoute>} />

      {/* ── Employee workspace (all pages share EmployeeNavbar) ── */}
      <Route element={<ProtectedRoute roles={["Employee"]}><EmployeeLayout /></ProtectedRoute>}>
        <Route path="/employee"          element={<RolePermissionGate anyOf={["reports-read", "user-management-read", "client-management-read", "challenge-management-read"]}><EmployeeDashboard /></RolePermissionGate>} />
        <Route path="/consultation"      element={<RolePermissionGate permission="user-management-read"><EmployeeConsultation /></RolePermissionGate>} />
        <Route path="/wellness-checkins" element={<RolePermissionGate permission="client-management-read"><WellnessCheckins /></RolePermissionGate>} />
        <Route path="/live-sessions"     element={<RolePermissionGate permission="client-management-read"><LiveSessions /></RolePermissionGate>} />
        <Route path="/video-library"     element={<RolePermissionGate permission="client-management-read"><VideoLibrary /></RolePermissionGate>} />
        <Route path="/mental-wellness"   element={<RolePermissionGate permission="client-management-read"><WellnessFormPage trackKey="mental" /></RolePermissionGate>} />
        <Route path="/physical-wellness" element={<RolePermissionGate permission="client-management-read"><WellnessFormPage trackKey="physical" /></RolePermissionGate>} />
        <Route path="/diet-plan"         element={<RolePermissionGate permission="client-management-read"><WellnessFormPage trackKey="nutrition" /></RolePermissionGate>} />
      </Route>

      {/* ── Admin console ── */}
      <Route element={<ProtectedRoute roles={["Admin"]}><AdminConsoleLayout /></ProtectedRoute>}>
        <Route path="/admin"       element={<AdminDashboard />} />
        <Route path="/admin/users" element={<UserManagement />} />
        <Route path="/admin/companies" element={<CompanyManagement />} />
        <Route path="/admin/roles-access" element={<RolesAccess />} />
        <Route path="/admin/reports" element={<Reports />} />
        <Route path="/admin/revenue" element={<Revenue />} />
        <Route path="/admin/settings" element={<Settings />} />
      </Route>

      <Route element={<ProtectedRoute roles={["HR"]}><HRLayout /></ProtectedRoute>}>
        <Route path="/hr" element={<HRDashboard />} />
        <Route path="/hr/challenges" element={<RolePermissionGate permission="challenge-management-read"><HRChallenges /></RolePermissionGate>} />
        <Route path="/hr/videos" element={<RolePermissionGate permission="client-management-read"><HRVideoLibrary /></RolePermissionGate>} />
        <Route path="/hr/pricing" element={<HRPricing />} />
        <Route path="/hr/payment" element={<HRPayment />} />
      </Route>
      <Route path="/superadmin" element={<ProtectedRoute roles={["Admin"]}><Navigate to="/admin" replace /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
