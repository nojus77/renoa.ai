'use client';

import { useEffect, useState } from 'react';

const MOCK_REVIEWS = [
  { initials: "GH", name: "Green Haven", tag: "Landscaping", rating: "4.9", quote: "Fast and super tidy", author: "Elena M." },
  { initials: "PR", name: "Premo Remodel", tag: "Remodeling", rating: "5.0", quote: "Beautiful finish, on budget", author: "Marcus K." },
  { initials: "SP", name: "Swift Plumbing", tag: "Plumbing", rating: "4.9", quote: "Came same day, no mess", author: "Daria V." },
  { initials: "CC", name: "ClimaCare", tag: "HVAC", rating: "4.8", quote: "Cold AC in hours", author: "Jamal T." },
  { initials: "LT", name: "Lumen Tech", tag: "Electrical", rating: "4.8", quote: "Clean wiring & clear pricing", author: "Priya S." },
  { initials: "SB", name: "SkyBright", tag: "Roofing", rating: "4.7", quote: "Leak fixed before the storm", author: "Hannah R." },
];

export default function WhyTrust() {
  const [statPros, setStatPros] = useState(1100);
  const [statRating, setStatRating] = useState(4.6);

  useEffect(() => {
    // In-view reveal
    const obs = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add('revealed');
          obs.unobserve(e.target);
        }
      }
    }, { threshold: 0.2 });

    document.querySelectorAll('.reveal').forEach(el => obs.observe(el));

    // Count-up animation
    const elPros = document.getElementById('stat-pros');
    const elRate = document.getElementById('stat-rating');

    const animate = (el: HTMLElement | null, start: number, end: number, dur = 900, decimals = 0) => {
      if (!el) return;
      const t0 = performance.now();
      const step = (t: number) => {
        const p = Math.min(1, (t - t0) / dur);
        const val = start + (end - start) * p;
        el.textContent = val.toFixed(decimals);
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };

    const feature = document.querySelector('.card.feature');
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        animate(elPros, 1100, 1200, 900, 0);
        animate(elRate, 4.6, 4.8, 900, 1);
        io.disconnect();
      }
    }, { threshold: 0.6 });

    if (feature) io.observe(feature);

    // Enhanced carousel controls with reduced motion support
    const strip = document.getElementById('our-pros-strip');
    if (strip) {
      const track = strip.querySelector('.carousel-track') as HTMLElement;
      const cards = strip.querySelectorAll('.provider-card');

      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (prefersReducedMotion) {
        track.style.animation = 'none';
        strip.style.overflowX = 'auto';
        strip.style.scrollSnapType = 'x mandatory';
        cards.forEach(card => {
          (card as HTMLElement).style.scrollSnapAlign = 'start';
        });
      } else {
        let isPaused = false;

        strip.addEventListener('mouseenter', () => {
          track.style.animationPlayState = 'paused';
          isPaused = true;
        });

        strip.addEventListener('mouseleave', () => {
          if (!document.activeElement || !strip.contains(document.activeElement)) {
            track.style.animationPlayState = 'running';
            isPaused = false;
          }
        });

        cards.forEach(card => {
          card.addEventListener('focus', () => {
            track.style.animationPlayState = 'paused';
            isPaused = true;
          });

          card.addEventListener('blur', () => {
            setTimeout(() => {
              if (!strip.contains(document.activeElement)) {
                track.style.animationPlayState = 'running';
                isPaused = false;
              }
            }, 50);
          });
        });

        window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
          if (e.matches) {
            track.style.animation = 'none';
            strip.style.overflowX = 'auto';
          } else {
            track.style.animation = '';
            strip.style.overflowX = '';
            if (!isPaused) {
              track.style.animationPlayState = 'running';
            }
          }
        });
      }
    }

    // Reviews track setup
    const reviewsTrack = document.getElementById('reviewsTrack');
    if (reviewsTrack) {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (prefersReducedMotion) {
        reviewsTrack.style.animation = 'none';
      }

      const strip = document.getElementById('our-pros-strip');
      const mainTrack = strip?.querySelector('.carousel-track:not(.carousel-track--reviews)') as HTMLElement;

      if (strip) {
        strip.addEventListener('mouseenter', () => {
          if (mainTrack) mainTrack.style.animationPlayState = 'paused';
          reviewsTrack.style.animationPlayState = 'paused';
        });

        strip.addEventListener('mouseleave', () => {
          if (!document.activeElement || !strip.contains(document.activeElement)) {
            if (mainTrack) mainTrack.style.animationPlayState = 'running';
            reviewsTrack.style.animationPlayState = 'running';
          }
        });
      }

      window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
        if (e.matches) {
          if (mainTrack) mainTrack.style.animation = 'none';
          reviewsTrack.style.animation = 'none';
        } else {
          if (mainTrack) mainTrack.style.animation = '';
          reviewsTrack.style.animation = '';
        }
      });
    }

    // Browser window tilt on cursor movement
    const browserWindow = document.querySelector('.browser-window') as HTMLElement;
    if (browserWindow) {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!prefersReducedMotion && window.innerWidth >= 768) {
        let isHovering = false;

        const handleMouseEnter = () => {
          isHovering = true;
        };

        const handleMouseLeave = () => {
          isHovering = false;
          browserWindow.style.transform = 'translateY(0) rotateX(0deg) rotateY(0deg)';
        };

        const handleMouseMove = (e: MouseEvent) => {
          if (!isHovering) return;

          const rect = browserWindow.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;

          const centerX = rect.width / 2;
          const centerY = rect.height / 2;

          const rotateX = ((y - centerY) / centerY) * -2;
          const rotateY = ((x - centerX) / centerX) * 2;

          browserWindow.style.transform = `translateY(-4px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        };

        browserWindow.addEventListener('mouseenter', handleMouseEnter);
        browserWindow.addEventListener('mouseleave', handleMouseLeave);
        browserWindow.addEventListener('mousemove', handleMouseMove);

        return () => {
          browserWindow.removeEventListener('mouseenter', handleMouseEnter);
          browserWindow.removeEventListener('mouseleave', handleMouseLeave);
          browserWindow.removeEventListener('mousemove', handleMouseMove);
        };
      }
    }
  }, []);

  // Duplicate reviews for seamless loop
  const allReviews = [...MOCK_REVIEWS, ...MOCK_REVIEWS];

  return (
    <>
      <div className="browser-window-container">
        <div className="browser-window">
          {/* Browser Chrome Bar */}
          <div className="browser-bar" aria-hidden="true">
            {/* Traffic Lights */}
            <div className="traffic-lights">
              <span className="dot dot-red"></span>
              <span className="dot dot-yellow"></span>
              <span className="dot dot-green"></span>
            </div>

            {/* Address Bar */}
            <div className="address-bar">
              <svg className="lock-icon" width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect x="4" y="6" width="6" height="5" rx="1" stroke="currentColor" strokeWidth="1.2"/>
                <path d="M5 6V4.5C5 3.67157 5.67157 3 6.5 3H7.5C8.32843 3 9 3.67157 9 4.5V6" stroke="currentColor" strokeWidth="1.2"/>
              </svg>
              <span className="address-text">renoa.ai/why-trust</span>
            </div>

            {/* Browser Actions */}
            <div className="browser-actions">
              <button className="browser-icon" aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M13.65 2.35A7.958 7.958 0 008 0a7.958 7.958 0 00-5.65 2.35l11.3 11.3A7.958 7.958 0 0016 8a7.958 7.958 0 00-2.35-5.65z" fill="currentColor" opacity="0.3"/>
                </svg>
              </button>
              <button className="browser-icon" aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 2l1.545 4.755h5l-4.045 2.94 1.545 4.755L8 11.51l-4.045 2.94 1.545-4.755L1.455 6.755h5L8 2z" fill="currentColor" opacity="0.3"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Browser Screen (Content Area) */}
          <div className="browser-screen">
            {/* Glass Reflection */}
            <div className="screen-reflection" aria-hidden="true"></div>

            {/* ================= Why homeowners trust (HTML/CSS/JS only) ================= */}
            <section className="trust-wrap">
              <div className="trust-noise" aria-hidden="true"></div>

              <header className="trust-head reveal">
                <h2>Why homeowners trust Renoa</h2>
                <p>Quality, reliability, and peace of mind for every home project.</p>
                <div className="trust-metrics">
                  <span className="chip">Avg match <strong>47s</strong></span>
                  <span className="chip">⭐ <strong>4.8</strong></span>
                  <span className="chip"><strong>12,432</strong> projects</span>
                </div>
              </header>

              <div className="trust-grid">
                {/* FEATURE CARD (left, big) */}
                <article className="card feature reveal">
                  <div className="inner">
                    {/* Shield (pulse on reveal) */}
                    <svg className="ico shield" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M12 3 19 6v6c0 5-3.5 8-7 9-3.5-1-7-4-7-9V6l7-3z" />
                      <path d="M8.5 12.5 10.8 14.9 15.5 10.2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <h3><span className="badge">Featured</span> Verified pros</h3>
                    <p>Every professional is licensed, insured, and background-checked before joining our network.</p>

                    <div className="mini-stats">
                      <span>👤 <b id="stat-pros">1,200</b>+ verified pros</span>
                      <span>⭐ <b id="stat-rating">4.8</b> avg rating</span>
                    </div>

                    <a className="ghost" href="#">Learn about our verification →</a>
                  </div>
                </article>

                {/* FAQ Card (clickable) */}
                <a href="/faq" className="card reveal faq-card" aria-label="Open FAQ page">
                  <div className="inner">
                    {/* Question mark icon */}
                    <svg className="ico" viewBox="0 0 24 24" aria-hidden="true">
                      <circle cx="12" cy="12" r="10"/>
                      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                      <line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                    <h4>Common Questions</h4>

                    <div className="faq-list">
                      <div className="faq-mini-item">
                        <p className="faq-q">How do you verify pros?</p>
                        <p className="faq-a">License & insurance check, identity + background screening, and ongoing performance reviews.</p>
                      </div>
                      <div className="faq-mini-item">
                        <p className="faq-q">What if a job goes wrong?</p>
                        <p className="faq-a">Renoa Protection: support, dispute guidance, and documentation to help resolve issues quickly.</p>
                      </div>
                      <div className="faq-mini-item">
                        <p className="faq-q">Can I get multiple quotes?</p>
                        <p className="faq-a">Yes—get 2–3 curated matches, compare details, chat, and book when you're ready.</p>
                      </div>
                    </div>

                    <span className="ghost">View all FAQs →</span>
                  </div>
                </a>

                <article className="card reveal">
                  <svg className="ico doc" viewBox="0 0 24 24" aria-hidden="true">
                    <rect x="4" y="3" width="16" height="18" rx="2"/>
                    <path d="M8 8h8M8 12h8M8 16h7"/>
                  </svg>
                  <h4>Transparent</h4>
                  <p>Clear pricing, detailed reviews, and no hidden fees.</p>
                  <a className="ghost" href="#">See pricing →</a>
                </article>

                {/* Our Pros Strip */}
                <div id="our-pros-strip">
                  {/* Row 1: Regular providers */}
                  <div className="track-row track-row--providers">
                    <div className="carousel-track">
                      <div className="provider-card" tabIndex={0}>
                        <div className="provider-avatar">GH</div>
                        <div className="provider-info">
                          <h3>Green Horizons Landscaping</h3>
                          <p>Landscaping</p>
                        </div>
                        <div className="provider-stats">
                          <div className="rating">
                            <span className="star">★</span>
                            <strong>4.9</strong>
                          </div>
                          <div className="verified-badge verified">
                            <span>✓ Verified</span>
                          </div>
                        </div>
                      </div>

                      <div className="provider-card" tabIndex={0}>
                        <div className="provider-avatar">CC</div>
                        <div className="provider-info">
                          <h3>Climate Control Experts</h3>
                          <p>HVAC</p>
                        </div>
                        <div className="provider-stats">
                          <div className="rating">
                            <span className="star">★</span>
                            <strong>5.0</strong>
                          </div>
                          <div className="verified-badge verified">
                            <span>✓ Verified</span>
                          </div>
                        </div>
                      </div>

                      <div className="provider-card" tabIndex={0}>
                        <div className="provider-avatar">SP</div>
                        <div className="provider-info">
                          <h3>Swift Plumbing Services</h3>
                          <p>Plumbing</p>
                        </div>
                        <div className="provider-stats">
                          <div className="rating">
                            <span className="star">★</span>
                            <strong>4.9</strong>
                          </div>
                          <div className="verified-badge verified">
                            <span>✓ Verified</span>
                          </div>
                        </div>
                      </div>

                      <div className="provider-card" tabIndex={0}>
                        <div className="provider-avatar">PR</div>
                        <div className="provider-info">
                          <h3>Premier Remodeling</h3>
                          <p>Remodeling</p>
                        </div>
                        <div className="provider-stats">
                          <div className="rating">
                            <span className="star">★</span>
                            <strong>5.0</strong>
                          </div>
                          <div className="verified-badge verified">
                            <span>✓ Verified</span>
                          </div>
                        </div>
                      </div>

                      {/* Duplicates for seamless loop */}
                      <div className="provider-card" tabIndex={0}>
                        <div className="provider-avatar">GH</div>
                        <div className="provider-info">
                          <h3>Green Horizons Landscaping</h3>
                          <p>Landscaping</p>
                        </div>
                        <div className="provider-stats">
                          <div className="rating">
                            <span className="star">★</span>
                            <strong>4.9</strong>
                          </div>
                          <div className="verified-badge verified">
                            <span>✓ Verified</span>
                          </div>
                        </div>
                      </div>

                      <div className="provider-card" tabIndex={0}>
                        <div className="provider-avatar">CC</div>
                        <div className="provider-info">
                          <h3>Climate Control Experts</h3>
                          <p>HVAC</p>
                        </div>
                        <div className="provider-stats">
                          <div className="rating">
                            <span className="star">★</span>
                            <strong>5.0</strong>
                          </div>
                          <div className="verified-badge verified">
                            <span>✓ Verified</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Second track: Reviews (scrolls opposite direction) */}
                  <div className="track-row track-row--reviews">
                    <div className="carousel-track carousel-track--reviews" id="reviewsTrack">
                      {allReviews.map((review, index) => (
                        <div key={index} className="provider-card provider-card--review" tabIndex={0}>
                          <div className="provider-avatar">{review.initials}</div>
                          <div className="provider-info">
                            <h3>{review.name}</h3>
                            <p>{review.tag}</p>
                            <p className="provider-quote">&quot;{review.quote}&quot; <span className="quote-author">— {review.author}</span></p>
                          </div>
                          <div className="provider-stats">
                            <div className="rating">
                              <span className="star">★</span>
                              <strong>{review.rating}</strong>
                            </div>
                            <div className="verified-badge verified">
                              <span>✓ Verified</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Footer link inside the card */}
                  <a className="ghost" href="#our-pros" style={{display: 'block', textAlign: 'center', fontSize: '14px', color: '#059669', margin: '0'}}>View all pros →</a>
                </div>
              </div>
            </section>
          </div>
          {/* End Browser Screen */}
        </div>
        {/* End Browser Window */}
      </div>
      {/* End Browser Window Container */}

      <style jsx>{`
        /* ===== BROWSER WINDOW WRAPPER ===== */

        /* Container with gradient background */
        .browser-window-container {
          background: linear-gradient(180deg, #FFFFFF 0%, #F2F7F4 100%);
          padding: clamp(40px, 6vw, 80px) 20px;
          position: relative;
        }

        /* Browser window frame */
        .browser-window {
          max-width: 1200px;
          margin: 0 auto;
          border-radius: 22px;
          background: #F7F7FB;
          box-shadow: 0 40px 80px rgba(0, 0, 0, 0.12), 0 0 1px rgba(0, 0, 0, 0.05);
          overflow: hidden;
          position: relative;
          transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.4s ease;
          transform-style: preserve-3d;
          will-change: transform;
        }

        .browser-window:hover {
          transform: translateY(-4px);
          box-shadow: 0 50px 100px rgba(0, 0, 0, 0.15), 0 0 1px rgba(0, 0, 0, 0.05);
        }

        /* Subtle glass effect at top */
        .browser-window::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 6px;
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.6) 0%, transparent 100%);
          z-index: 3;
          pointer-events: none;
        }

        /* Very subtle noise overlay */
        .browser-window::after {
          content: '';
          position: absolute;
          inset: 0;
          background-image:
            radial-gradient(circle at 25% 25%, rgba(0, 0, 0, 0.015) 0%, transparent 50%),
            radial-gradient(circle at 75% 75%, rgba(0, 0, 0, 0.015) 0%, transparent 50%);
          opacity: 0.3;
          pointer-events: none;
          z-index: 1;
        }

        /* Browser Chrome Bar */
        .browser-bar {
          height: 60px;
          background: #F7F7FB;
          border-bottom: 1px solid rgba(0, 0, 0, 0.06);
          display: flex;
          align-items: center;
          padding: 0 16px;
          gap: 12px;
          position: relative;
          z-index: 2;
        }

        /* Traffic Lights (macOS style) */
        .traffic-lights {
          display: flex;
          gap: 8px;
          flex-shrink: 0;
        }

        .dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          opacity: 0.6;
          transition: opacity 0.2s ease;
        }

        .browser-window:hover .dot {
          opacity: 0.85;
        }

        .dot-red {
          background: #FF5F57;
        }

        .dot-yellow {
          background: #FFBD2E;
        }

        .dot-green {
          background: #28CA42;
        }

        /* Address Bar */
        .address-bar {
          flex: 1;
          max-width: 500px;
          height: 32px;
          background: #FFFFFF;
          border: 1px solid rgba(0, 0, 0, 0.06);
          border-radius: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 0 12px;
          box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.05);
          margin: 0 auto;
        }

        .lock-icon {
          color: #6B7280;
          flex-shrink: 0;
        }

        .address-text {
          font-size: 14px;
          color: #6B7280;
          font-weight: 500;
          letter-spacing: -0.01em;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* Browser Actions (right side icons) */
        .browser-actions {
          display: flex;
          gap: 6px;
          flex-shrink: 0;
        }

        .browser-icon {
          width: 28px;
          height: 28px;
          background: transparent;
          border: none;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.2s ease;
          color: #6B7280;
          padding: 0;
        }

        .browser-icon:hover {
          background: rgba(0, 0, 0, 0.05);
        }

        /* Browser Screen (Content Area) */
        .browser-screen {
          position: relative;
          background: linear-gradient(180deg, #fff 0%, #F2F7F4 100%);
          min-height: 400px;
          overflow: hidden;
        }

        /* Glass reflection at top of screen */
        .screen-reflection {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 120px;
          background: linear-gradient(
            180deg,
            rgba(255, 255, 255, 0.4) 0%,
            rgba(255, 255, 255, 0.1) 40%,
            transparent 100%
          );
          pointer-events: none;
          z-index: 1;
          opacity: 0.6;
        }

        /* Adjust trust-wrap to fit inside browser screen */
        .browser-screen .trust-wrap {
          position: relative;
          z-index: 2;
          padding: clamp(48px, 7vw, 100px) 24px;
        }

        /* Responsive adjustments */
        @media (max-width: 768px) {
          .browser-window-container {
            padding: 24px 12px;
          }

          .browser-window {
            border-radius: 16px;
          }

          .browser-bar {
            height: 44px;
            padding: 0 12px;
          }

          .dot {
            width: 10px;
            height: 10px;
          }

          .address-bar {
            max-width: none;
            height: 28px;
            padding: 0 10px;
          }

          .address-text {
            font-size: 12px;
          }

          .browser-actions {
            display: none; /* Hide extra icons on mobile */
          }

          .lock-icon {
            width: 12px;
            height: 12px;
          }

          /* Disable tilt on mobile */
          .browser-window:hover {
            transform: translateY(-2px);
          }
        }

        /* Accessibility: Reduced Motion */
        @media (prefers-reduced-motion: reduce) {
          .browser-window {
            transition: none;
          }

          .browser-window:hover {
            transform: translateY(-2px);
          }

          .cursor-dot {
            display: none !important;
          }
        }

        /* Animated cursor dot (for one-time click animation) */
        .cursor-dot {
          position: absolute;
          width: 16px;
          height: 16px;
          background: rgba(22, 163, 74, 0.8);
          border: 2px solid rgba(255, 255, 255, 0.9);
          border-radius: 50%;
          pointer-events: none;
          z-index: 1000;
          opacity: 0;
          box-shadow: 0 2px 8px rgba(22, 163, 74, 0.3);
          transition: transform 0.15s ease, opacity 0.15s ease;
        }

        .cursor-dot.active {
          opacity: 1;
        }

        .cursor-dot.clicking {
          transform: scale(0.85);
        }

        /* ===== Palette (tuned) ===== */
        :root {
          --text: #0F172A;          /* deep slate */
          --body: #475569;          /* slate-600 */
          --emerald: #16A34A;       /* accent */
          --cyan: #22D3EE;          /* accent-2 */
          --band: #F2F7F4;          /* sage */
          --surface: #FFFFFF;       /* cards */
          --divider: #E7EFEA;
          --shadow: 0 20px 40px rgba(11,58,46,.08);
        }

        /* ===== Wrapper & noise ===== */
        .trust-wrap {
          position: relative;
          overflow: hidden;
          padding: clamp(40px,6vw,80px) 20px;
          background: linear-gradient(180deg,#fff 0%, var(--band) 100%);
        }

        .trust-noise {
          position: absolute;
          inset: 0;
          pointer-events: none;
          opacity: 0.055;
          mix-blend-mode: multiply;
          background-image: radial-gradient(#000 0.5px,transparent 0.5px);
          background-size: 6px 6px;
        }

        /* ===== Header ===== */
        .trust-head {
          max-width: 760px;
          margin: 0 auto 20px;
          text-align: center;
        }

        .trust-head h2 {
          margin: 0 0 8px;
          font-size: clamp(28px,4.5vw,40px);
          font-weight: 800;
          color: var(--text);
          letter-spacing: -0.01em;
        }

        .trust-head p {
          margin: 0 0 12px;
          color: var(--body);
          opacity: 0.9;
        }

        .trust-metrics {
          display: flex;
          justify-content: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(22,163,74,.10);
          color: #166534;
          border: 1px solid rgba(22,163,74,.18);
          padding: 6px 10px;
          border-radius: 999px;
          font-size: 12px;
        }

        /* ===== Grid ===== */
        .trust-grid {
          max-width: 1100px;
          margin: 0 auto;
          display: grid;
          gap: 24px;
          grid-template-columns: 1fr;
          align-items: start;
        }

        @media (min-width:900px) {
          .trust-grid {
            grid-template-columns: 2fr 1fr;
            gap: 24px;
          }
          .card.feature {
            grid-row: span 2;
          }
        }

        /* ===== Cards (modern glass style) ===== */
        .card {
          position: relative;
          background: rgba(255,255,255,.7);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(226,232,240,.6);
          border-radius: 16px;
          box-shadow: 0 2px 12px rgba(15,23,42,.06);
          padding: 0;
          transition: all 0.3s ease;
        }

        .card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 20px rgba(15,23,42,.1);
        }

        .card .inner {
          position: relative;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        @media (min-width:768px) {
          .card .inner {
            padding: 24px;
          }
        }

        /* FAQ Card - make it clickable with hover arrow */
        a.faq-card {
          display: block;
          text-decoration: none;
          color: inherit;
          cursor: pointer;
          position: relative;
        }

        a.faq-card .inner::after {
          content: "→";
          position: absolute;
          right: 20px;
          top: 20px;
          font-size: 18px;
          color: #059669;
          opacity: 0;
          transition: all 0.3s ease;
          transform: translateX(-4px);
        }

        a.faq-card:hover .inner::after {
          opacity: 1;
          transform: translateX(0);
        }

        .faq-list {
          display: flex;
          flex-direction: column;
          gap: 0;
          border-top: 1px solid rgba(226,232,240,.6);
        }

        .faq-mini-item {
          text-align: left;
          padding: 12px 0;
          border-bottom: 1px solid rgba(226,232,240,.6);
        }

        .faq-mini-item:last-child {
          border-bottom: none;
        }

        .faq-q {
          font-size: 13px;
          font-weight: 600;
          color: #0f172a;
          margin: 0 0 4px 0;
          line-height: 1.4;
        }

        .faq-a {
          font-size: 12px;
          color: #64748b;
          margin: 0;
          line-height: 1.5;
          font-weight: 400;
        }

        /* Gradient noise overlay on FEATURE card */
        .card.feature::before {
          content: "";
          position: absolute;
          inset: 0;
          z-index: 0;
          border-radius: 16px;
          background:
            radial-gradient(ellipse at top, rgba(16,185,129,.07), transparent 60%),
            radial-gradient(ellipse at bottom, rgba(34,211,238,.06), transparent 60%);
          pointer-events: none;
        }

        /* ===== Typo inside cards ===== */
        .card h3, .card h4 {
          margin: 0 0 4px;
          font-size: 16px;
          font-weight: 600;
          color: #0f172a;
          letter-spacing: -0.01em;
        }

        .card p {
          margin: 0;
          font-size: 14px;
          color: #475569;
          line-height: 1.6;
        }

        .badge {
          display: inline-block;
          font-size: 12px;
          font-weight: 500;
          margin-right: 8px;
          padding: 2px 8px;
          border-radius: 9999px;
          background: rgba(16,185,129,.06);
          color: #047857;
          border: 1px solid rgba(16,185,129,.2);
        }

        .ghost {
          margin: 0;
          font-size: 14px;
          color: #059669;
          text-decoration: none;
          transition: all 0.2s ease;
        }

        .ghost:hover {
          text-decoration: underline;
          color: #047857;
        }

        .mini-stats {
          display: flex;
          gap: 12px;
          margin: 0;
          color: #64748b;
          font-size: 14px;
          font-weight: 400;
        }

        /* ===== Icons ===== */
        .ico {
          width: 24px;
          height: 24px;
          margin: 0 0 4px;
          color: #0f172a;
          fill: none;
          stroke: currentColor;
          stroke-width: 1.5;
        }

        .ico.star path {
          stroke-dasharray: 6 6;
          animation: twinkle 1.2s ease-in-out infinite;
        }

        .ico.shield {
          transform-origin: center;
        }

        .revealed .ico.shield {
          animation: pulse .32s ease-out 1;
        }

        /* ===== Animations ===== */
        @keyframes twinkle {
          0% {
            stroke-dashoffset: 0;
            filter: none;
          }
          50% {
            stroke-dashoffset: 6;
            filter: drop-shadow(0 0 4px rgba(34,211,238,.6));
          }
          100% {
            stroke-dashoffset: 0;
            filter: none;
          }
        }

        @keyframes pulse {
          0% {
            transform: scale(1);
          }
          60% {
            transform: scale(1.05);
          }
          100% {
            transform: scale(1);
          }
        }

        /* ===== Reveal on scroll ===== */
        .reveal {
          opacity: 0;
          transform: translateY(8px);
          transition: opacity .4s ease, transform .4s ease;
        }

        .revealed {
          opacity: 1;
          transform: translateY(0);
        }

        /* ===== Our Pros Strip (Modern) ===== */
        #our-pros-strip {
          grid-column: 1 / -1;
          max-width: 1100px;
          margin: 0 auto;
          background: rgba(255,255,255,.7);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(226,232,240,.6);
          border-radius: 16px;
          box-shadow: 0 2px 12px rgba(15,23,42,.06);
          padding: 16px;
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        /* Track row containers with fixed heights */
        .track-row {
          position: relative;
          overflow: hidden;
        }

        .track-row--providers {
          height: 64px; /* h-16 */
        }

        .track-row--reviews {
          height: 72px; /* h-18 */
        }

        /* Carousel track with smooth animation */
        #our-pros-strip .carousel-track {
          display: flex;
          gap: 8px;
          animation: prosScroll 28s linear infinite;
          width: fit-content;
        }

        #our-pros-strip .carousel-track:hover {
          animation-play-state: paused;
        }

        /* Second track (reviews) - opposite direction and different speed */
        #our-pros-strip .carousel-track--reviews {
          animation: prosScrollReverse 24s linear infinite;
        }

        @keyframes prosScroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        @keyframes prosScrollReverse {
          0% {
            transform: translateX(-50%);
          }
          100% {
            transform: translateX(0);
          }
        }

        /* Provider pill cards - modern style */
        #our-pros-strip .provider-card {
          flex-shrink: 0;
          background: rgba(255,255,255,.8);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border: 1px solid rgba(226,232,240,.6);
          border-radius: 12px;
          padding: 8px 12px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          height: 52px;
          min-width: 220px;
          max-width: 260px;
          box-shadow: 0 1px 3px rgba(15,23,42,.04);
          transition: all 0.3s ease;
          cursor: pointer;
        }

        #our-pros-strip .provider-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(15,23,42,.1);
        }

        #our-pros-strip .provider-card:focus {
          outline: none;
          box-shadow: 0 0 0 2px rgba(16,185,129,.6);
        }

        /* Review cards - same horizontal layout, just wider */
        #our-pros-strip .provider-card--review {
          min-width: 340px;
          max-width: 400px;
          height: 64px;
          padding: 8px 12px;
          gap: 8px;
          flex-direction: row;
        }

        #our-pros-strip .provider-card--review .provider-info {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        #our-pros-strip .provider-card--review .provider-quote {
          font-size: 11px;
          color: #64748b;
          line-height: 1.3;
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          font-style: italic;
        }

        #our-pros-strip .provider-card--review .quote-author {
          color: #94a3b8;
          font-size: 11px;
        }

        /* Avatar - modern minimal style */
        #our-pros-strip .provider-avatar {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: linear-gradient(135deg, #94a3b8, #cbd5e1);
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 600;
          flex-shrink: 0;
          transition: background 0.3s ease;
        }

        #our-pros-strip .provider-card:hover .provider-avatar,
        #our-pros-strip .provider-card:focus .provider-avatar {
          background: linear-gradient(135deg, #10b981, #06b6d4);
        }

        /* Provider info */
        #our-pros-strip .provider-info {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 2px;
        }

        #our-pros-strip .provider-info h3 {
          font-size: 13px;
          font-weight: 600;
          color: #0f172a;
          margin: 0;
          line-height: 1.3;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        #our-pros-strip .provider-info p {
          font-size: 11px;
          color: #64748b;
          margin: 0;
          line-height: 1.3;
          font-weight: 400;
        }

        /* Stats */
        #our-pros-strip .provider-stats {
          display: flex;
          flex-direction: column;
          gap: 3px;
          align-items: flex-end;
          flex-shrink: 0;
        }

        #our-pros-strip .provider-card .rating {
          color: #64748b;
          font-size: 11px;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 2px;
        }

        #our-pros-strip .provider-card .rating .star {
          color: #eab308;
          font-size: 12px;
        }

        #our-pros-strip .provider-card .verified {
          font-size: 9px;
          font-weight: 500;
          padding: 2px 6px;
          border-radius: 9999px;
          background: rgba(16,185,129,.07);
          color: #047857;
          border: 1px solid rgba(16,185,129,.2);
        }

        /* Responsive: Tablet */
        @media (max-width: 900px) {
          #our-pros-strip {
            margin: 0 auto;
          }
          #our-pros-strip .provider-card {
            min-width: 200px;
            max-width: 240px;
          }
        }

        /* Responsive: Mobile */
        @media (max-width: 600px) {
          #our-pros-strip {
            margin: 0 8px;
            padding: 12px;
          }
          #our-pros-strip .provider-card {
            min-width: 180px;
            max-width: 220px;
            height: 52px;
            padding: 6px 8px;
          }
          #our-pros-strip .provider-avatar {
            width: 32px;
            height: 32px;
            font-size: 11px;
          }
          #our-pros-strip .provider-info h3 {
            font-size: 12px;
          }
          #our-pros-strip .provider-info p {
            font-size: 10px;
          }
        }

        /* Accessibility: Reduced motion */
        @media (prefers-reduced-motion: reduce) {
          #our-pros-strip .carousel-track {
            animation: none !important;
          }
          /* Show scroll hint on reduced motion */
          #our-pros-strip::after {
            background: linear-gradient(270deg, #F2F7F4 0%, rgba(242,247,244,0.6) 50%, transparent 100%);
          }
        }
      `}</style>
    </>
  );
}
