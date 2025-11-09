'use client';

import { useEffect, useState, useRef } from 'react';
import InputMask from 'react-input-mask';
import AddressAutocomplete from '@/components/ui/AddressAutocomplete';

export default function Hero() {
  const [rotatingWord, setRotatingWord] = useState('landscaping');
  const [servicePlaceholder, setServicePlaceholder] = useState('');
  const [zipPlaceholder, setZipPlaceholder] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const [step1Complete, setStep1Complete] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip: ''
  });
  const [formErrors, setFormErrors] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });
  const [submitError, setSubmitError] = useState('');
  const dotsContainerRef = useRef<HTMLDivElement>(null);

  // Service images mapping
  const serviceImages: Record<string, string> = {
    landscaping: 'https://images.unsplash.com/photo-1558904541-efa843a96f01?w=800&q=80',
    lawn_care: 'https://images.unsplash.com/photo-1599629954294-8f4e8c8b6e3d?w=800&q=80',
    hardscaping: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800&q=80',
    remodeling: 'https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?w=800&q=80',
    roofing: 'https://images.unsplash.com/photo-1632778149955-e80f8ceca2e8?w=800&q=80',
    fencing: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80',
    hvac: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=800&q=80',
    plumbing: 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=800&q=80',
    painting: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=800&q=80',
    flooring: 'https://images.unsplash.com/photo-1615971677499-5467cbab01c0?w=800&q=80',
  };

  // Floating dots animation
  useEffect(() => {
    const dotsContainer = dotsContainerRef.current;
    if (!dotsContainer) return;

    const maxDots = 40;

    function createDot() {
      if (!dotsContainer) return;
      const dot = document.createElement('div');
      dot.className = 'dot';

      const sizeRandom = Math.random();
      if (sizeRandom < 0.5) {
        dot.classList.add('dot-tiny');
      } else if (sizeRandom < 0.8) {
        dot.classList.add('dot-small');
      } else if (sizeRandom < 0.95) {
        dot.classList.add('dot-medium');
      } else {
        dot.classList.add('dot-large');
      }

      const top = Math.random() * 90 + 5;
      const left = Math.random() * 95 + 2.5;
      dot.style.top = top + '%';
      dot.style.left = left + '%';

      dot.style.animationDelay = Math.random() * 8 + 's';
      dot.style.animationDuration = (Math.random() * 10 + 12) + 's';

      dot.style.opacity = String(Math.random() * 0.5 + 0.4);

      dotsContainer.appendChild(dot);
    }

    for (let i = 0; i < maxDots; i++) {
      createDot();
    }

    return () => {
      if (dotsContainer) {
        dotsContainer.innerHTML = '';
      }
    };
  }, []);

  // Typing animation for placeholders
  useEffect(() => {
    const typeText = (text: string, setter: (val: string) => void, delay: number) => {
      setTimeout(() => {
        let index = 0;
        const typeInterval = setInterval(() => {
          if (index < text.length) {
            setter(text.substring(0, index + 1) + '|');
            index++;
          } else {
            setter(text);
            clearInterval(typeInterval);
          }
        }, 60);
      }, delay);
    };

    typeText('Select service', setServicePlaceholder, 500);
    typeText('Enter your ZIP code', setZipPlaceholder, 1500);
  }, []);

  // Rotating word animation
  useEffect(() => {
    const words = [
      'landscaping',
      'remodeling',
      'roofing',
      'plumbing',
      'electrical',
      'HVAC',
      'painting',
      'cleaning'
    ];
    let currentIndex = 0;

    const interval = setInterval(() => {
      currentIndex = (currentIndex + 1) % words.length;
      setRotatingWord(words[currentIndex]);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Handle Step 1 -> Step 2
  const handleContinue = () => {
    if (!selectedService || !zipCode) {
      alert('Please select a service and enter your ZIP code');
      return;
    }
    setStep1Complete(true);
    setStep(2);
  };

  // Handle edit Step 1
  const handleEdit = () => {
    setStep(1);
    setStep1Complete(false);
  };

  // Handle form input changes
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Validate form fields
  const validateForm = (): boolean => {
    const errors = {
      firstName: '',
      lastName: '',
      email: '',
      phone: ''
    };

    const nameRegex = /^[a-zA-ZÀ-ÿ\s'-]+$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // First Name validation
    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is required';
    } else if (formData.firstName.trim().length < 2) {
      errors.firstName = 'First name must be at least 2 characters';
    } else if (!nameRegex.test(formData.firstName)) {
      errors.firstName = 'First name can only contain letters';
    }

    // Last Name validation
    if (!formData.lastName.trim()) {
      errors.lastName = 'Last name is required';
    } else if (formData.lastName.trim().length < 2) {
      errors.lastName = 'Last name must be at least 2 characters';
    } else if (!nameRegex.test(formData.lastName)) {
      errors.lastName = 'Last name can only contain letters';
    }

    // Email validation
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    // Phone validation
    const phoneDigits = formData.phone.replace(/\D/g, '');
    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (phoneDigits.length !== 10) {
      errors.phone = 'Phone number must be exactly 10 digits';
    }

    setFormErrors(errors);
    return !errors.firstName && !errors.lastName && !errors.email && !errors.phone;
  };

  // Handle final form submission
  const handleGetMatched = async () => {
    // Validate form
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');
    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone.replace(/\D/g, ''),
          address: formData.address || '',
          city: formData.city || 'Unknown',
          state: formData.state || 'Unknown',
          zip: formData.zip || zipCode,
          serviceInterest: selectedService,
          leadSource: 'landing_page_hero'
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Redirect to success page
        window.location.href = `/success?leadId=${data.lead.id}`;
      } else {
        const error = await response.json();
        setSubmitError(error.error || 'Something went wrong. Please try again.');
      }
    } catch (error) {
      console.error('Form submission error:', error);
      setSubmitError('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get current service image
  const currentImage = selectedService
    ? serviceImages[selectedService]
    : serviceImages.landscaping;

  return (
    <section className="hero">
      <div className="hero-top-section">
        <div className="hero-dots-container" ref={dotsContainerRef}></div>

        <div className="hero-split-container">
          {/* LEFT SIDE - Form */}
          <div className="hero-left-content">
            <div className="hero-text-form-wrapper">
              <h1>
                Find trusted local pros for <br />
                <span className="rotating-word">
                  {rotatingWord}
                </span>
              </h1>

              <p className="hero-subtitle">Stop wasting time on quotes - let AI match you instantly!</p>

              <div className="hero-form-progressive">
          {/* Step 1 - Service & Location (always visible) */}
          <div className={`step1-container ${step1Complete ? 'completed' : 'active'}`}>
            <div className="form-row-inline">
              <select
                value={selectedService}
                onChange={(e) => setSelectedService(e.target.value)}
                disabled={step1Complete}
                className="service-select"
              >
                <option value="" style={{ fontWeight: 700, color: 'rgba(6, 64, 43, 0.7)' }}>
                  {servicePlaceholder || 'Select service'}
                </option>
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

              <input
                type="text"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                placeholder={zipPlaceholder || 'ZIP code'}
                disabled={step1Complete}
                className="zip-input"
              />

              {!step1Complete && (
                <button onClick={handleContinue} className="btn btn-primary">
                  Continue →
                </button>
              )}

              {step1Complete && (
                <button onClick={handleEdit} className="btn-edit">
                  ✓ Edit
                </button>
              )}
            </div>
          </div>

          {/* Step 2 - Contact Details (slides in when Step 1 complete) */}
          {step === 2 && (
            <div className="step2-container slide-in">
              <p className="step2-intro">Great! Now just a few more details...</p>

              {submitError && (
                <div className="error-banner">
                  {submitError}
                </div>
              )}

              <div className="step2-grid">
                <div>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => {
                      handleInputChange('firstName', e.target.value);
                      if (formErrors.firstName) {
                        setFormErrors({ ...formErrors, firstName: '' });
                      }
                    }}
                    placeholder="First Name"
                    className={formErrors.firstName ? 'error' : ''}
                    required
                  />
                  {formErrors.firstName && (
                    <p className="field-error">{formErrors.firstName}</p>
                  )}
                </div>
                <div>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => {
                      handleInputChange('lastName', e.target.value);
                      if (formErrors.lastName) {
                        setFormErrors({ ...formErrors, lastName: '' });
                      }
                    }}
                    placeholder="Last Name"
                    className={formErrors.lastName ? 'error' : ''}
                    required
                  />
                  {formErrors.lastName && (
                    <p className="field-error">{formErrors.lastName}</p>
                  )}
                </div>
                <div>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => {
                      handleInputChange('email', e.target.value);
                      if (formErrors.email) {
                        setFormErrors({ ...formErrors, email: '' });
                      }
                    }}
                    placeholder="Email"
                    className={formErrors.email ? 'error' : ''}
                    required
                  />
                  {formErrors.email && (
                    <p className="field-error">{formErrors.email}</p>
                  )}
                </div>
                <div>
                  <InputMask
                    mask="(999) 999-9999"
                    value={formData.phone}
                    onChange={(e) => {
                      handleInputChange('phone', e.target.value);
                      if (formErrors.phone) {
                        setFormErrors({ ...formErrors, phone: '' });
                      }
                    }}
                  >
                    {(inputProps: any) => (
                      <input
                        {...inputProps}
                        type="tel"
                        placeholder="(555) 123-4567"
                        className={formErrors.phone ? 'error' : ''}
                        required
                      />
                    )}
                  </InputMask>
                  {formErrors.phone && (
                    <p className="field-error">{formErrors.phone}</p>
                  )}
                </div>
                <AddressAutocomplete
                  value={formData.address}
                  onChange={(value) => handleInputChange('address', value)}
                  onAddressSelect={(components) => {
                    setFormData(prev => ({
                      ...prev,
                      address: components.street,
                      city: components.city,
                      state: components.state,
                      zip: components.zip,
                    }));
                  }}
                  placeholder="Your address (optional)"
                  className="address-autocomplete-input"
                />
                <select
                  value={formData.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                >
                  <option value="">State (optional)</option>
                  <option value="AL">Alabama</option>
                  <option value="AK">Alaska</option>
                  <option value="AZ">Arizona</option>
                  <option value="AR">Arkansas</option>
                  <option value="CA">California</option>
                  <option value="CO">Colorado</option>
                  <option value="CT">Connecticut</option>
                  <option value="DE">Delaware</option>
                  <option value="FL">Florida</option>
                  <option value="GA">Georgia</option>
                  <option value="HI">Hawaii</option>
                  <option value="ID">Idaho</option>
                  <option value="IL">Illinois</option>
                  <option value="IN">Indiana</option>
                  <option value="IA">Iowa</option>
                  <option value="KS">Kansas</option>
                  <option value="KY">Kentucky</option>
                  <option value="LA">Louisiana</option>
                  <option value="ME">Maine</option>
                  <option value="MD">Maryland</option>
                  <option value="MA">Massachusetts</option>
                  <option value="MI">Michigan</option>
                  <option value="MN">Minnesota</option>
                  <option value="MS">Mississippi</option>
                  <option value="MO">Missouri</option>
                  <option value="MT">Montana</option>
                  <option value="NE">Nebraska</option>
                  <option value="NV">Nevada</option>
                  <option value="NH">New Hampshire</option>
                  <option value="NJ">New Jersey</option>
                  <option value="NM">New Mexico</option>
                  <option value="NY">New York</option>
                  <option value="NC">North Carolina</option>
                  <option value="ND">North Dakota</option>
                  <option value="OH">Ohio</option>
                  <option value="OK">Oklahoma</option>
                  <option value="OR">Oregon</option>
                  <option value="PA">Pennsylvania</option>
                  <option value="RI">Rhode Island</option>
                  <option value="SC">South Carolina</option>
                  <option value="SD">South Dakota</option>
                  <option value="TN">Tennessee</option>
                  <option value="TX">Texas</option>
                  <option value="UT">Utah</option>
                  <option value="VT">Vermont</option>
                  <option value="VA">Virginia</option>
                  <option value="WA">Washington</option>
                  <option value="WV">West Virginia</option>
                  <option value="WI">Wisconsin</option>
                  <option value="WY">Wyoming</option>
                </select>
              </div>

              <button
                onClick={handleGetMatched}
                className="btn btn-primary btn-submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Get Matched →'}
              </button>
            </div>
          )}
              </div>
            </div>
          </div>

          {/* RIGHT SIDE - Browser Mockup */}
          <div className="hero-right-mockup">
            <div className="browser-mockup">
              <div className="browser-chrome">
                <div className="browser-dots">
                  <span className="dot red"></span>
                  <span className="dot yellow"></span>
                  <span className="dot green"></span>
                </div>
                <div className="browser-address">renoa.ai</div>
              </div>
              <div className="browser-content">
                <div className="browser-main-content">
                  <img
                    src={currentImage}
                    alt={selectedService || 'Service'}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      transition: 'opacity 0.3s ease'
                    }}
                  />
                </div>
                <div className="browser-sidebar">
                  {/* Placeholder for future content */}
                </div>
              </div>
            </div>

            {/* Trust badges below mockup */}
            <div className="trust-bar trust-bar-below-mockup">
              <div className="trust-item">
                <div className="trust-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                  </svg>
                </div>
                <span>Verified Professionals</span>
              </div>
              <div className="trust-item">
                <div className="trust-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                  </svg>
                </div>
                <span>Instant AI Matching</span>
              </div>
              <div className="trust-item">
                <div className="trust-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                </div>
                <span>100% Secure</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
