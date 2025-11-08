'use client';

import { useState, useEffect } from 'react';

export default function StickyBar() {
  const [isVisible, setIsVisible] = useState(false);
  const [selectedService, setSelectedService] = useState('');
  const [zipCode, setZipCode] = useState('');

  useEffect(() => {
    const handleScroll = () => {
      // Show sticky bar after scrolling past hero (approx 800px)
      setIsVisible(window.scrollY > 800);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSubmit = () => {
    if (!selectedService || !zipCode) {
      alert('Please select a service and enter your ZIP code');
      return;
    }
    // Scroll to hero form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!isVisible) return null;

  return (
    <div className="sticky-bar">
      <div className="sticky-bar-content">
        <select
          value={selectedService}
          onChange={(e) => setSelectedService(e.target.value)}
          className="sticky-select"
        >
          <option value="">Select service</option>
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
          onChange={(e) => setZipCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
          placeholder="ZIP code"
          className="sticky-input"
        />

        <button onClick={handleSubmit} className="sticky-button">
          See My Match
        </button>
      </div>
    </div>
  );
}
