import { NavLink, useNavigate } from 'react-router-dom';
import { getCurrentEmployee, getEmployeeFirstName, logoutEmployee } from '../services/employeeAuth';
import '../employee.css';

/**
 * Produces the exact same HTML as the original:
 *   <nav class="navbar dashboard-nav"> ... </nav>
 */
export default function Navbar({ onProfileClick, onLogout }) {
  const employee = getCurrentEmployee();
  const firstName = getEmployeeFirstName(employee);
  const navigate = useNavigate();

  function handleLogout() {
    logoutEmployee();
    if (onLogout) onLogout();
  }

  return (
    <nav className="navbar dashboard-nav">
      <div className="logo">Stack Builders</div>

      <div className="nav-links">
        <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'active' : undefined}>
          <i className="fa-solid fa-house" /> Home
        </NavLink>
        <NavLink to="/consultation" className={({ isActive }) => isActive ? 'active' : undefined}>
          <i className="fa-regular fa-calendar" /> Consultation
        </NavLink>
        <NavLink to="/wellness-checkins" className={({ isActive }) => isActive ? 'active' : undefined}>
          <i className="fa-solid fa-notes-medical" /> Wellness Check-ins
        </NavLink>
        <NavLink to="/live-sessions" className={({ isActive }) => isActive ? 'active' : undefined}>
          <i className="fa-solid fa-tower-broadcast" /> Live Session
        </NavLink>
        <NavLink to="/video-library" className={({ isActive }) => isActive ? 'active' : undefined}>
          <i className="fa-solid fa-video" /> Video Library
        </NavLink>
      </div>

      <div className="nav-right">
        <span id="employeeWelcomeMessage">Welcome back, {firstName}!</span>
        <i className="fa-regular fa-bell" />
        <i className="fa-regular fa-user" id="profileNavIcon" onClick={onProfileClick} />
        {onLogout && (
          <i
            className="fa-solid fa-right-from-bracket"
            title="Logout"
            onClick={handleLogout}
            style={{ cursor: 'pointer' }}
          />
        )}
      </div>
    </nav>
  );
}
