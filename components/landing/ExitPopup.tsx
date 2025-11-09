'use client';

import { useState, useEffect } from 'react';
import InputMask from 'react-input-mask';
import AddressAutocomplete from '@/components/ui/AddressAutocomplete';

interface FieldError {
  name?: string;
  email?: string;
  phone?: string;
  service?: string;
  address?: string;
}

export default function ExitPopup() {
  const [isVisible, setIsVisible] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    service: '',
    address: '',
    city: '',
    state: '',
    zip: ''
  });
  const [fieldErrors, setFieldErrors] = useState<FieldError>({});

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

  const validateForm = (): boolean => {
    const errors: FieldError = {};
    const nameRegex = /^[a-zA-ZÀ-ÿ\s'-]+$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Name validation
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters';
    } else if (!nameRegex.test(formData.name)) {
      errors.name = 'Name can only contain letters';
    }

    // Email validation
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    // Phone validation - must be exactly 10 digits
    const phoneDigits = formData.phone.replace(/\D/g, '');
    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (phoneDigits.length !== 10) {
      errors.phone = 'Phone number must be exactly 10 digits';
    }

    // Service validation
    if (!formData.service) {
      errors.service = 'Please select a service';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const isFormValid = (): boolean => {
    const nameRegex = /^[a-zA-ZÀ-ÿ\s'-]+$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneDigits = formData.phone.replace(/\D/g, '');

    return (
      formData.name.trim().length >= 2 &&
      nameRegex.test(formData.name) &&
      emailRegex.test(formData.email) &&
      phoneDigits.length === 10 &&
      formData.service !== ''
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Split name into first and last name
      const nameParts = formData.name.trim().split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : nameParts[0];

      // Prepare lead data
      const leadData = {
        firstName,
        lastName,
        email: formData.email,
        phone: formData.phone.replace(/\D/g, ''), // Strip formatting
        address: formData.address || '',
        city: formData.city || 'Unknown',
        state: formData.state || 'Unknown',
        zip: formData.zip || '00000',
        serviceInterest: formData.service,
        leadSource: 'exit_intent_popup',
        projectDetails: {
          capturedViaExitIntent: true
        }
      };

      // Submit to API
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leadData)
      });

      if (response.ok) {
        setIsSubmitted(true);
        // Auto-close after 5 seconds
        setTimeout(() => {
          handleClose();
        }, 5000);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        setSubmitError(`Failed to submit: ${errorData.error || 'Server error'}. Please try again.`);
      }
    } catch (error) {
      console.error('Exit popup submission failed:', error);
      setSubmitError('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
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

            {submitError && (
              <div className="exit-popup-error-banner">
                {submitError}
              </div>
            )}

            <form className="exit-popup-form" onSubmit={handleSubmit}>
              <div>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    if (fieldErrors.name) {
                      setFieldErrors({ ...fieldErrors, name: undefined });
                    }
                  }}
                  className={`exit-popup-input ${fieldErrors.name ? 'error' : ''}`}
                  placeholder="Your name"
                  disabled={isSubmitting}
                />
                {fieldErrors.name && (
                  <p className="exit-popup-error">{fieldErrors.name}</p>
                )}
              </div>

              <div>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    if (fieldErrors.email) {
                      setFieldErrors({ ...fieldErrors, email: undefined });
                    }
                  }}
                  className={`exit-popup-input ${fieldErrors.email ? 'error' : ''}`}
                  placeholder="Your email"
                  disabled={isSubmitting}
                />
                {fieldErrors.email && (
                  <p className="exit-popup-error">{fieldErrors.email}</p>
                )}
              </div>

              <div>
                <InputMask
                  mask="(999) 999-9999"
                  value={formData.phone}
                  onChange={(e) => {
                    setFormData({ ...formData, phone: e.target.value });
                    if (fieldErrors.phone) {
                      setFieldErrors({ ...fieldErrors, phone: undefined });
                    }
                  }}
                  disabled={isSubmitting}
                >
                  {(inputProps: any) => (
                    <input
                      {...inputProps}
                      type="tel"
                      placeholder="(555) 123-4567"
                      className={`exit-popup-input ${fieldErrors.phone ? 'error' : ''}`}
                    />
                  )}
                </InputMask>
                {fieldErrors.phone && (
                  <p className="exit-popup-error">{fieldErrors.phone}</p>
                )}
              </div>

              <div>
                <AddressAutocomplete
                  value={formData.address}
                  onChange={(value) => {
                    setFormData({ ...formData, address: value });
                    if (fieldErrors.address) {
                      setFieldErrors({ ...fieldErrors, address: undefined });
                    }
                  }}
                  onAddressSelect={(components) => {
                    setFormData({
                      ...formData,
                      address: components.street,
                      city: components.city,
                      state: components.state,
                      zip: components.zip,
                    });
                  }}
                  placeholder="Your address (optional)"
                  className={`exit-popup-input ${fieldErrors.address ? 'error' : ''}`}
                  disabled={isSubmitting}
                />
                {fieldErrors.address && (
                  <p className="exit-popup-error">{fieldErrors.address}</p>
                )}
              </div>

              <div>
                <select
                  value={formData.service}
                  onChange={(e) => {
                    setFormData({ ...formData, service: e.target.value });
                    if (fieldErrors.service) {
                      setFieldErrors({ ...fieldErrors, service: undefined });
                    }
                  }}
                  className={`exit-popup-input ${fieldErrors.service ? 'error' : ''}`}
                  disabled={isSubmitting}
                >
                  <option value="">What service do you need?</option>
                  <option value="landscaping">Landscaping</option>
                  <option value="lawn_care">Lawn Care</option>
                  <option value="hardscaping">Hardscaping</option>
                  <option value="remodeling">Remodeling</option>
                  <option value="roofing">Roofing</option>
                  <option value="fencing">Fencing</option>
                  <option value="hvac">HVAC</option>
                  <option value="plumbing">Plumbing</option>
                  <option value="painting">Painting</option>
                  <option value="flooring">Flooring</option>
                </select>
                {fieldErrors.service && (
                  <p className="exit-popup-error">{fieldErrors.service}</p>
                )}
              </div>

              <button
                type="submit"
                className="exit-popup-submit"
                disabled={isSubmitting || !isFormValid()}
              >
                {isSubmitting ? 'Submitting...' : 'Get My Free Quote 🚀'}
              </button>
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
          padding: 60px 80px;
          position: relative;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          animation: popupSlideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
          text-align: center;
        }

        @media (max-width: 640px) {
          .exit-popup {
            padding: 60px 40px;
          }
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
          width: 100%;
          padding: 14px 16px;
          border: 2px solid #e0e0e0;
          border-radius: 12px;
          font-size: 16px;
          font-family: inherit;
          transition: all 0.3s;
          -webkit-appearance: none;
          -moz-appearance: none;
          appearance: none;
          color: #1f2937;
          background-color: white;
          min-height: 48px;
          box-sizing: border-box;
        }

        .exit-popup-input::placeholder {
          color: #9ca3af;
        }

        .exit-popup-input:focus {
          outline: none;
          border-color: #A3BE8C;
          box-shadow: 0 0 0 4px rgba(163, 190, 140, 0.1);
        }

        .exit-popup-input.error {
          border-color: #ef4444;
        }

        .exit-popup-input.error:focus {
          border-color: #ef4444;
          box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.1);
        }

        .exit-popup-error {
          color: #ef4444;
          font-size: 0.75rem;
          margin-top: 4px;
          margin-left: 4px;
          text-align: left;
        }

        .exit-popup-error-banner {
          background: #fee2e2;
          border: 2px solid #fca5a5;
          border-radius: 12px;
          padding: 16px;
          color: #991b1b;
          font-size: 0.875rem;
          margin: 16px 0;
          text-align: center;
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
