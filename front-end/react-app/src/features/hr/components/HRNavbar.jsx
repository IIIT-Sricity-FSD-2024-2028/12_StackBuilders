function HRNavbar() {
  return (
    <nav className="hr-navbar">
      <div className="hr-logo">Stack Builders</div>

      <div className="hr-nav-links">
        <a className="active" href="#home">
          <span>⌂</span> Home
        </a>
        <a href="#challenges">
          <span>□</span> Challenges
        </a>
        <a href="#videos">
          <span>▶</span> Video Library
        </a>
      </div>

      <div className="hr-nav-right">
        <a className="hr-upgrade" href="#pricing">
          Upgrade Plan
        </a>
        <span className="hr-round-icon">!</span>
        <span>Welcome, HR</span>
        <span className="hr-round-icon">U</span>
      </div>
    </nav>
  );
}

export default HRNavbar;
