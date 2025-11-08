'use client';

import { useEffect, useRef } from 'react';

export default function HowItWorks() {
  const dotsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const dotsContainer = dotsContainerRef.current;
    if (!dotsContainer) return;

    const maxDots = 30;
    function createDot() {
      if (!dotsContainer) return;
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
    <section className="how-it-works-redesign" id="how">
      <div className="section-dots-container" ref={dotsContainerRef}></div>

      {/* Progress Bar */}
      <div className="section-progress-bar">
        <div className="section-progress-fill" id="howProgress"></div>
      </div>

      {/* Top Wave Divider */}
      <div className="wave-divider wave-top">
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M0,0 C300,80 600,80 900,40 C1050,20 1150,0 1200,0 L1200,120 L0,120 Z" fill="currentColor"/>
        </svg>
      </div>

      <div className="how-container">
        <div className="section-header-new">
          <h2 className="section-title-new">How it works</h2>
          <p className="section-subtitle-new">Three simple steps to connect with the right professional</p>
          <div className="metrics-row">
            <span className="metric-item">Avg match 47s</span>
            <span className="metric-divider">•</span>
            <span className="metric-item">4.8★</span>
            <span className="metric-divider">•</span>
            <span className="metric-item">12,432 projects</span>
          </div>
        </div>

        {/* Timeline SVG */}
        <svg className="timeline-curve" viewBox="0 0 1000 200" preserveAspectRatio="none">
          <path
            id="timelinePath"
            d="M 50,100 Q 250,50 500,100 T 950,100"
            stroke="rgba(6, 78, 59, 0.15)"
            strokeWidth="2"
            fill="none"
            strokeDasharray="8,8"
          />
          <circle id="timelineDot" r="6" fill="#16A34A" opacity="0">
            <animateMotion dur="3s" repeatCount="indefinite">
              <mpath href="#timelinePath"/>
            </animateMotion>
          </circle>
        </svg>

        {/* Radial Highlight behind center card */}
        <div className="radial-highlight"></div>

        <div className="steps-grid-new">
          {/* Step 1 */}
          <div className="step-card-wrapper" data-step="1">
            <div className="step-badge">①</div>
            <div className="glass-card">
              <div className="card-icon-new" data-icon="1">
                <svg className="icon-default" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
                <svg className="icon-animated" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path className="icon-line-1" d="M12 5v14M5 12h14" strokeDasharray="50" strokeDashoffset="50"/>
                </svg>
              </div>
              <h3 className="card-title-new">Tell us</h3>
              <p className="card-desc-new">Share your needs and get instant matches</p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="step-card-wrapper" data-step="2">
            <div className="step-badge">②</div>
            <div className="glass-card">
              <div className="card-icon-new" data-icon="2">
                <svg className="icon-default" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="12" y1="18" x2="12" y2="12"></line>
                  <line x1="9" y1="15" x2="15" y2="15"></line>
                </svg>
                <svg className="icon-animated" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline className="icon-line-1" points="20 6 9 17 4 12" strokeDasharray="30" strokeDashoffset="30"/>
                </svg>
              </div>
              <h3 className="card-title-new">Review</h3>
              <p className="card-desc-new">Compare ratings and choose confidently</p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="step-card-wrapper" data-step="3">
            <div className="step-badge">③</div>
            <div className="glass-card">
              <div className="card-icon-new" data-icon="3">
                <svg className="icon-default" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                <svg className="icon-animated" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline className="icon-line-1" points="20 6 9 17 4 12" strokeDasharray="30" strokeDashoffset="30"/>
                </svg>
              </div>
              <h3 className="card-title-new">Hire</h3>
              <p className="card-desc-new">Book and track—we handle the rest</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Wave Divider */}
      <div className="wave-divider wave-bottom">
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M0,0 C300,40 600,40 900,80 C1050,100 1150,120 1200,120 L1200,0 L0,0 Z" fill="currentColor"/>
        </svg>
      </div>
    </section>
  );
}
