import { NavLink } from 'react-router-dom';
import { getCurrentEmployee, getEmployeeFirstName } from '../services/employeeAuth';
import QueryNotifications from '../../../components/QueryNotifications.jsx';
import { useRoleAccess } from '../../shared/roleAccessContext.jsx';
/**
 * Produces the exact same HTML as the original:
 *   <nav class="navbar dashboard-nav"> ... </nav>
 */
export default function Navbar({ onProfileClick }) {
  const employee = getCurrentEmployee();
  const firstName = getEmployeeFirstName(employee);
  const { hasPermission } = useRoleAccess();

  return (
    <nav className="navbar dashboard-nav">
      <div className="logo">Stack Builders</div>

      <div className="nav-links">
        <NavLink to="/employee" className={({ isActive }) => isActive ? 'active' : undefined}>
          <i className="fa-solid fa-house" /> Home
        </NavLink>
        {hasPermission('user-management-read') && <NavLink to="/consultation" className={({ isActive }) => isActive ? 'active' : undefined}>
          <i className="fa-regular fa-calendar" /> Consultation
        </NavLink>}
        {hasPermission('client-management-read') && <NavLink to="/wellness-checkins" className={({ isActive }) => isActive ? 'active' : undefined}>
          <i className="fa-solid fa-notes-medical" /> Wellness Check-ins
        </NavLink>}
        {hasPermission('client-management-read') && <NavLink to="/live-sessions" className={({ isActive }) => isActive ? 'active' : undefined}>
          <i className="fa-solid fa-tower-broadcast" /> Live Session
        </NavLink>}
        {hasPermission('client-management-read') && <NavLink to="/video-library" className={({ isActive }) => isActive ? 'active' : undefined}>
          <i className="fa-solid fa-video" /> Video Library
        </NavLink>}
      </div>

      <div className="nav-right">
        <span id="employeeWelcomeMessage">Welcome back, {firstName}!</span>
        <QueryNotifications user={employee} userType="Employee" />
        <i className="fa-regular fa-user" id="profileNavIcon" onClick={onProfileClick} />
      </div>
    </nav>
  );
}
