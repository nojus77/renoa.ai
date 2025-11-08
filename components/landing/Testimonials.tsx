'use client';

import { useEffect, useRef } from 'react';

export default function Testimonials() {
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
    <section className="section bg-white">
      <div className="section-dots-container" ref={dotsContainerRef}></div>
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">What homeowners are saying</h2>
          <p className="section-subtitle">Real experiences from people who trust Renoa for their home projects.</p>
        </div>

        <div className="testimonial-grid">
          <div className="testimonial">
            <div className="quote-mark">&quot;</div>
            <p className="testimonial-text">After years of dealing with unreliable contractors, finding Renoa was a breath of fresh air. They matched me with a fantastic landscaper who transformed my backyard. Professional, punctual, and reasonably priced.</p>
            <div className="testimonial-author">
              <div className="author-avatar">SJ</div>
              <div className="author-info">
                <h4>Sarah Johnson</h4>
                <p>Homeowner • Chicago, IL</p>
              </div>
            </div>
            <div className="stars">★★★★★</div>
          </div>

          <div className="testimonial">
            <div className="quote-mark">&quot;</div>
            <p className="testimonial-text">As someone who values quality and reliability, Renoa exceeded my expectations. The platform made it easy to find verified professionals, and the service provider they matched me with was exceptional.</p>
            <div className="testimonial-author">
              <div className="author-avatar">RT</div>
              <div className="author-info">
                <h4>Robert Thompson</h4>
                <p>Homeowner • Seattle, WA</p>
              </div>
            </div>
            <div className="stars">★★★★★</div>
          </div>
        </div>
      </div>
    </section>
  );
}
