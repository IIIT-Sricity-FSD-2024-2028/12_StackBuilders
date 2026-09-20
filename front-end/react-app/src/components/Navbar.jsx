import { Link } from "react-router-dom";

function Navbar({ onMenuToggle }) {
  return (
    <header className="topbar">
      <button className="menu-button" type="button" onClick={onMenuToggle} aria-label="Toggle navigation">
        <span />
        <span />
        <span />
      </button>
      <Link className="brand" to="/employee">Stack Builders</Link>
      <div className="topbar-actions">
        <span className="status-dot" aria-hidden="true" />
        <span>Wellness workspace</span>
        <span className="user-avatar" aria-label="Current user">SB</span>
      </div>
    </header>
  );
}

export default Navbar;
