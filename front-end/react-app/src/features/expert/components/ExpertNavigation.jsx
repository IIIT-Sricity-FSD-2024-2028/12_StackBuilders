import ExpertIcon from "./ExpertIcon.jsx";

const items = [
  ["dashboard", "Home", "home"],
  ["consultations", "Consultations", "calendar"],
  ["checkins", "Employee Check-ins", "checkins"],
  ["sessions", "Live Sessions", "broadcast"],
  ["videos", "Video Library", "video"],
];

function ExpertNavigation({ activeView, onNavigate }) {
  return (
    <nav className="expert-navigation" aria-label="Expert workspace navigation">
      {items.map(([id, label, icon]) => (
        <button
          className={activeView === id ? "active" : ""}
          key={id}
          type="button"
          onClick={() => onNavigate(id)}
        >
          <ExpertIcon name={icon} size={17} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}

export default ExpertNavigation;
