export default function CTASection() {
  return (
    <section className="cta-section">
      <div className="cta-content">
        <h2>Ready to start your project?</h2>
        <p>Join thousands of homeowners who trust Renoa for their home service needs.</p>

        <div className="cta-grid">
          <div className="cta-card">
            <h3>For Homeowners</h3>
            <p>Find trusted professionals for your next home project.</p>
            <button className="btn btn-white">Get Matched</button>
            <p className="cta-note">Free to use • No obligations</p>
          </div>

          <div className="cta-card">
            <h3>For Professionals</h3>
            <p>Grow your business with quality leads.</p>
            <button className="btn btn-white">Join our network</button>
            <p className="cta-note">Verified clients • Steady work</p>
          </div>
        </div>
      </div>
    </section>
  );
}
