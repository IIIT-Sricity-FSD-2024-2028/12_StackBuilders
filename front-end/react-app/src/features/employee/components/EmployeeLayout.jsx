import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import EmployeeNavbar from './EmployeeNavbar.jsx';
import ProfileDrawer from './ProfileDrawer.jsx';
import RouteLoadingScreen from '../../../components/RouteLoadingScreen.jsx';
import QueryModal from '../../../components/QueryModal.jsx';
import usePageStylesheets from '../../../hooks/usePageStylesheets.js';
import { getCurrentEmployee } from '../services/employeeAuth.js';
import { RolePermissionsProvider } from '../../shared/roleAccessContext.jsx';

/**
 * Wraps all Employee routes — renders the tab navbar + profile drawer
 * above every employee page, without duplicating them in each component.
 */
export default function EmployeeLayout() {
  const stylesReady = usePageStylesheets('/employee-legacy.css');
  const [profileOpen, setProfileOpen] = useState(false);
  const [queryOpen, setQueryOpen] = useState(false);
  const employee = getCurrentEmployee();

  useEffect(() => {
    document.body.classList.add('employee-route');

    return () => {
      document.body.classList.remove('employee-route', 'profile-open', 'request-modal-open', 'video-modal-open');
    };
  }, []);

  if (!stylesReady) return <RouteLoadingScreen />;

  return (
    <RolePermissionsProvider group="employee" role="Employee">
    <div className="employee-workspace">
      <EmployeeNavbar
        onProfileClick={() => setProfileOpen(true)}
      />
      <ProfileDrawer open={profileOpen} onClose={() => setProfileOpen(false)} />
      <div className="employee-route-content"><Outlet /></div>
      <footer className="footer employee-shared-footer">
        <div className="footer-links">
          <a href="/#about" target="_blank" rel="noopener noreferrer">About us</a>
          <a href="#contact" className="contact-us-trigger" onClick={(event) => { event.preventDefault(); setQueryOpen(true); }}>Contact us</a>
        </div>
        <p>© 2026 Stack Builders. Built with wellness in mind.</p>
      </footer>
      <QueryModal open={queryOpen} onClose={() => setQueryOpen(false)} user={employee} userType="Employee" />
    </div>
    </RolePermissionsProvider>
  );
}
