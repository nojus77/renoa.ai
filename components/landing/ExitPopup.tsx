'use client';

import { useState, useEffect } from 'react';

export default function ExitPopup() {
  const [isVisible, setIsVisible] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    let exitIntentShown = false;
    let lastY = 0;
    let exitIntentReady = false;

    // Check if popup was already shown in this session
    if (typeof window !== 'undefined' && sessionStorage.getItem('exitPopupShown')) {
      exitIntentShown = true;
    }

    // Wait 3 seconds before enabling exit intent (avoid false triggers)
    const readyTimer = setTimeout(() => {
      exitIntentReady = true;
    }, 3000);

    // Detect exit intent (mouse moving toward top of page)
    const handleMouseMove = (e: MouseEvent) => {
      // Only trigger if:
      // 1. Ready (3 seconds passed)
      // 2. Not already shown
      // 3. Mouse is near top (within 50px)
      // 4. Mouse is moving upward quickly
      if (exitIntentReady && !exitIntentShown && e.clientY < 50 && e.clientY < lastY) {
        setIsVisible(true);
        exitIntentShown = true;
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('exitPopupShown', 'true');
        }
      }
      lastY = e.clientY;
    };

    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      clearTimeout(readyTimer);
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const handleClose = () => {
    setIsVisible(false);
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      service: formData.get('service')
    };

    console.log('Exit popup form submitted:', data);

    // Show success message
    setIsSubmitted(true);

    // In a real app, you'd send this to your backend:
    // fetch('/api/capture-lead', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify(data)
    // });
  };

  if (!isVisible) return null;

  return (
    <div className={`exit-popup-overlay ${isVisible ? 'show' : ''}`} onClick={handleOverlayClick}>
      <div className="exit-popup">
        {!isSubmitted ? (
          <>
            <button className="exit-popup-close" onClick={handleClose}>×</button>

            <div className="exit-popup-icon">
              ⏰
            </div>

            <h2>Wait! Don&apos;t leave yet...</h2>
            <p>Get matched with top-rated professionals in your area. Free quotes, no obligations!</p>

            <form className="exit-popup-form" onSubmit={handleSubmit}>
              <input
                type="text"
                name="name"
                className="exit-popup-input"
                placeholder="Your name"
                required
              />
              <input
                type="email"
                name="email"
                className="exit-popup-input"
                placeholder="Your email"
                required
              />
              <input
                type="tel"
                name="phone"
                className="exit-popup-input"
                placeholder="Phone number (optional)"
              />
              <select name="service" className="exit-popup-input" required>
                <option value="" disabled>What service do you need?</option>
                <option value="handyperson">Handyperson</option>
                <option value="landscaping">Landscaping</option>
                <option value="plumbing">Plumbing</option>
                <option value="electrical">Electrical</option>
                <option value="remodeling">Remodeling</option>
                <option value="roofing">Roofing</option>
                <option value="painting">Painting</option>
                <option value="cleaning">Cleaning</option>
                <option value="hvac">HVAC</option>
                <option value="other">Other</option>
              </select>
              <button type="submit" className="exit-popup-submit">Get My Free Quote 🚀</button>
            </form>

            <p className="exit-popup-guarantee">
              🔒 100% free. No spam. Unsubscribe anytime.
            </p>
          </>
        ) : (
          <>
            <div className="exit-popup-icon" style={{ background: 'linear-gradient(135deg, #A3BE8C 0%, #8FAA76 100%)' }}>
              ✓
            </div>
            <h2 style={{ color: '#06402B' }}>You&apos;re all set!</h2>
            <p style={{ color: '#666' }}>We&apos;re matching you with the perfect professionals. Check your email in the next few minutes!</p>
            <button className="exit-popup-submit" onClick={handleClose}>
              Got it! 🎉
            </button>
          </>
        )}
      </div>

      <style jsx>{`
        /* Exit Intent Popup */
        .exit-popup-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(8px);
          z-index: 10000;
          display: none;
          align-items: center;
          justify-content: center;
          animation: overlayFadeIn 0.3s ease-out;
        }

        .exit-popup-overlay.show {
          display: flex;
        }

        @keyframes overlayFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .exit-popup {
          background: white;
          border-radius: 24px;
          max-width: 600px;
          width: 90%;
          padding: 60px 50px;
          position: relative;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          animation: popupSlideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
          text-align: center;
        }

        @keyframes popupSlideIn {
          from {
            opacity: 0;
            transform: scale(0.8) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        .exit-popup-close {
          position: absolute;
          top: 20px;
          right: 20px;
          background: none;
          border: none;
          font-size: 2rem;
          color: #999;
          cursor: pointer;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: all 0.3s;
        }

        .exit-popup-close:hover {
          background: #f0f0f0;
          color: #333;
          transform: rotate(90deg);
        }

        .exit-popup-icon {
          width: 80px;
          height: 80px;
          margin: 0 auto 24px;
          background: linear-gradient(135deg, #A3BE8C 0%, #8FAA76 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2.5rem;
          animation: iconBounce 0.6s ease-out 0.3s;
        }

        @keyframes iconBounce {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }

        .exit-popup h2 {
          font-size: 2.5rem;
          font-weight: 800;
          color: #06402B;
          margin-bottom: 16px;
          letter-spacing: -0.02em;
        }

        .exit-popup p {
          font-size: 1.125rem;
          color: #666;
          margin-bottom: 32px;
          line-height: 1.6;
        }

        .exit-popup-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .exit-popup-input {
          padding: 16px 20px;
          border: 2px solid #e0e0e0;
          border-radius: 12px;
          font-size: 1rem;
          font-family: inherit;
          transition: all 0.3s;
          -webkit-appearance: none;
          -moz-appearance: none;
          appearance: none;
        }

        .exit-popup-input:focus {
          outline: none;
          border-color: #A3BE8C;
          box-shadow: 0 0 0 4px rgba(163, 190, 140, 0.1);
        }

        /* Style select dropdown arrow */
        .exit-popup-form select {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23666' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 16px center;
          padding-right: 45px;
        }

        .exit-popup-submit {
          padding: 18px 32px;
          background: #06402B;
          color: #F5EDE1;
          border: none;
          border-radius: 12px;
          font-size: 1.125rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s;
        }

        .exit-popup-submit:hover {
          background: #053420;
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(6, 64, 43, 0.3);
        }

        .exit-popup-guarantee {
          margin-top: 20px;
          font-size: 0.875rem;
          color: #999;
        }

        /* Mobile adjustments for popup */
        @media (max-width: 768px) {
          .exit-popup {
            padding: 40px 30px;
            width: 95%;
          }

          .exit-popup h2 {
            font-size: 1.75rem;
          }

          .exit-popup p {
            font-size: 1rem;
          }

          .exit-popup-icon {
            width: 60px;
            height: 60px;
            font-size: 2rem;
          }
        }
      `}</style>
    </div>
  );
}
