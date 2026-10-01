import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import EmployeeNavbar from './EmployeeNavbar.jsx';
import ProfileDrawer from './ProfileDrawer.jsx';

/**
 * Wraps all Employee routes — renders the tab navbar + profile drawer
 * above every employee page, without duplicating them in each component.
 */
export default function EmployeeLayout() {
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <div className="employee-workspace">
      <EmployeeNavbar
        onProfileClick={() => setProfileOpen(true)}
        onLogout={() => { /* handled inside EmployeeNavbar */ }}
      />
      <ProfileDrawer open={profileOpen} onClose={() => setProfileOpen(false)} />
      <Outlet />
    </div>
  );
}
