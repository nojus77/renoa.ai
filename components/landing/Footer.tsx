export default function Footer() {
  return (
    <footer>
      <div className="footer-grid">
        <div className="footer-section">
          <div className="logo" style={{ marginBottom: '16px' }}>
            <span>Renoa<span className="ai-text">AI</span></span>
          </div>
          <p className="footer-description">Connecting homeowners with trusted, verified home service professionals. Quality work, every time.</p>
        </div>

        <div className="footer-section">
          <h4>Company</h4>
          <ul>
            <li><a href="#">About us</a></li>
            <li><a href="#">How it works</a></li>
            <li><a href="#">Contact</a></li>
            <li><a href="#">Careers</a></li>
          </ul>
        </div>

        <div className="footer-section">
          <h4>For Homeowners</h4>
          <ul>
            <li><a href="#">Find professionals</a></li>
            <li><a href="#">Service categories</a></li>
            <li><a href="#">Safety & trust</a></li>
            <li><a href="#">Help center</a></li>
          </ul>
        </div>

        <div className="footer-section">
          <h4>For Professionals</h4>
          <ul>
            <li><a href="#">Join our network</a></li>
            <li><a href="#">Benefits</a></li>
            <li><a href="#">Resources</a></li>
            <li><a href="#">Support</a></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© 2025 Renoa. All rights reserved.</p>
        <div className="footer-links">
          <a href="/privacy-policy">Privacy Policy</a>
          <a href="/terms">Terms of Service</a>
          <a href="/cookie-policy">Cookie Policy</a>
          <a href="/cookie-preferences">Cookie Preferences</a>
        </div>
      </div>
    </footer>
  );
}
