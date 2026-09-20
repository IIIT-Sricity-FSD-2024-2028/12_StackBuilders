const iconPaths = {
  home: <><path d="m3 10 9-7 9 7" /><path d="M5 9.5V21h14V9.5" /><path d="M9 21v-6h6v6" /></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></>,
  checkins: <><path d="M9 4h6l1 2h3v15H5V6h3l1-2Z" /><path d="M9 12h6M9 16h4" /></>,
  broadcast: <><path d="M4 7a11 11 0 0 0 0 10M7 10a6 6 0 0 0 0 4M20 7a11 11 0 0 1 0 10M17 10a6 6 0 0 1 0 4" /><circle cx="12" cy="12" r="2" /></>,
  video: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m10 9 5 3-5 3V9Z" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  chevron: <path d="m9 18 6-6-6-6" />,
  arrowLeft: <path d="m15 18-6-6 6-6M9 12h10" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  search: <><circle cx="11" cy="11" r="6" /><path d="m16 16 4 4" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  users: <><path d="M16 20v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1" /><circle cx="9.5" cy="7" r="4" /><path d="M17 11a4 4 0 0 0 0-8M21 20v-1a4 4 0 0 0-3-3.87" /></>,
  activity: <path d="M3 12h4l2-7 4 14 2-7h6" />,
  heart: <path d="M20.8 4.7a5.5 5.5 0 0 0-7.8 0L12 5.8l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.5a5.5 5.5 0 0 0 0-7.8Z" />,
  brain: <><path d="M9 4a3 3 0 0 0-5.7 1.3A3.8 3.8 0 0 0 4 12.8 3.5 3.5 0 0 0 6 19.3 4 4 0 0 0 12 21V4" /><path d="M15 4a3 3 0 0 1 5.7 1.3 3.8 3.8 0 0 1-.7 7.5 3.5 3.5 0 0 1-2 6.5 4 4 0 0 1-6-1.3" /><path d="M7 9h2M15 9h2M7 15h2M15 15h2" /></>,
  dumbbell: <><path d="m6.5 6.5 11 11M4 8l-2 2 4 4 2-2M20 16l2-2-4-4-2 2M8.5 4.5l-2 2M15.5 19.5l2-2" /></>,
  send: <><path d="m21 3-7.5 18-3.7-7.8L3 9.5 21 3Z" /><path d="m9.8 13.2 4.8-4.8" /></>,
  external: <><path d="M14 4h6v6M20 4l-9 9" /><path d="M18 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h6" /></>,
  alert: <><path d="M10.3 4.2 2.6 18a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4M12 17h.01" /></>,
  play: <path d="m9 7 8 5-8 5V7Z" />,
  bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
};

function ExpertIcon({ name, size = 20, className = "" }) {
  return (
    <svg className={`expert-icon ${className}`} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      {iconPaths[name] || iconPaths.activity}
    </svg>
  );
}

export default ExpertIcon;
