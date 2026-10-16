import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/**
 * Exact match for the original profile overlay HTML:
 *   <div class="profile-overlay" id="profileOverlay" hidden>
 *     <div class="profile-frame-shell" ...>
 *       <button class="profile-overlay-close" ...>Back</button>
 *       <iframe class="profile-frame" src="profile.html?role=employee" ...></iframe>
 *     </div>
 *   </div>
 */
export default function ProfileDrawer({ open, onClose }) {
  const frameRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (open) {
      document.body.classList.add('profile-open');
    } else {
      document.body.classList.remove('profile-open');
    }
    return () => document.body.classList.remove('profile-open');
  }, [open]);

  useEffect(() => {
    function handleProfileNavigation(event) {
      if (
        event.origin !== window.location.origin ||
        event.source !== frameRef.current?.contentWindow ||
        event.data?.type !== 'stackbuilders:edit-profile'
      ) return;

      onClose();
      navigate(`/profile/edit?returnTo=${encodeURIComponent(location.pathname)}`);
    }

    window.addEventListener('message', handleProfileNavigation);
    return () => window.removeEventListener('message', handleProfileNavigation);
  }, [location.pathname, navigate, onClose]);

  if (!open) return null;

  return (
    <div
      className="profile-overlay"
      id="profileOverlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="profile-frame-shell"
        role="dialog"
        aria-modal="true"
        aria-label="My Profile"
      >
        <button
          className="profile-overlay-close"
          id="profileDrawerBackBtn"
          type="button"
          aria-label="Close profile panel"
          onClick={onClose}
        >
          Back
        </button>
        <iframe
          ref={frameRef}
          className="profile-frame"
          src="/profile.html?role=employee"
          title="Employee Profile"
        ></iframe>
      </div>
    </div>
  );
}
