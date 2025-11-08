'use client';

import { useEffect, useRef } from 'react';

export default function CTASection() {
  const dotsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const dotsContainer = dotsContainerRef.current;
    if (!dotsContainer) return;

    const maxDots = 30;
    function createDot() {
      const dot = document.createElement('div');
      dot.className = 'dot';
      const size = Math.random() * 60 + 20;
      dot.style.width = `${size}px`;
      dot.style.height = `${size}px`;
      dot.style.left = `${Math.random() * 100}%`;
      dot.style.top = `${Math.random() * 100}%`;
      dot.style.animationDelay = `${Math.random() * 15}s`;
      dot.style.opacity = String(Math.random() * 0.3 + 0.1);
      dotsContainer.appendChild(dot);
    }

    for (let i = 0; i < maxDots; i++) {
      createDot();
    }
  }, []);

  return (
    <section className="cta-section">
      <div className="section-dots-container" ref={dotsContainerRef}></div>
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
