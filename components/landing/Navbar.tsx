export default function Navbar() {
  return (
    <nav>
      <div className="nav-container">
        <div className="logo" id="logoElement">
          <span>Renoa<span className="ai-text" id="aiText">AI</span></span>
        </div>
        <div className="nav-right">
          <ul className="nav-links">
            <li><a href="#how">How it works</a></li>
            <li><a href="#providers">Providers</a></li>
            <li><a href="#about">About</a></li>
            <li><a href="/provider/login">For Professionals</a></li>
          </ul>
          <button className="btn btn-primary">Get Started</button>
        </div>
      </div>
    </nav>
  );
}
