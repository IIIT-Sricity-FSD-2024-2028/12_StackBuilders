import ExpertIcon from "./ExpertIcon.jsx";

const items = [
  ["dashboard", "Home", "fa-solid fa-house", "home"],
  ["consultations", "Consultation", "fa-regular fa-calendar", "calendar"],
  ["checkins", "Employee Check-ins", "fa-solid fa-notes-medical", "checkins"],
  ["sessions", "Live Session", "fa-solid fa-tower-broadcast", "broadcast"],
  ["videos", "Video Library", "fa-solid fa-video", "video"],
];

function ExpertNavigation({ activeView, onNavigate, legacy = false, availableViews }) {
  const visibleItems = availableViews ? items.filter(([id]) => availableViews.includes(id)) : items;
  if (legacy) {
    return <div className="nav-links">{visibleItems.map(([id, label, icon]) => <a className={activeView === id ? "active" : ""} href={`#${id}`} key={id} onClick={(event) => { event.preventDefault(); onNavigate(id); }}><i className={icon} /> {label}</a>)}</div>;
  }

  return <nav className="expert-navigation" aria-label="Expert workspace navigation">{visibleItems.map(([id, label, , icon]) => <button className={activeView === id ? "active" : ""} key={id} type="button" onClick={() => onNavigate(id)}><ExpertIcon name={icon} size={17} /><span>{label}</span></button>)}</nav>;
}

export default ExpertNavigation;
