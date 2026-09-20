import { useEffect } from 'react';

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
  useEffect(() => {
    if (open) {
      document.body.classList.add('profile-open');
    } else {
      document.body.classList.remove('profile-open');
    }
    return () => document.body.classList.remove('profile-open');
  }, [open]);

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
          className="profile-frame"
          src="/profile.html?role=employee"
          title="Employee Profile"
        ></iframe>
      </div>
    </div>
  );
}
