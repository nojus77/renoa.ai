'use client';

import { useEffect, useRef } from 'react';

interface ServiceCardProps {
  service: string;
  icon: JSX.Element;
  label: string;
  onClick?: (service: string) => void;
}

const ServiceCard = ({ service, icon, label, onClick }: ServiceCardProps) => {
  const handleClick = () => {
    if (onClick) {
      onClick(service);
    }
  };

  return (
    <button
      className="service-card"
      data-ui="service-card"
      data-service={service}
      aria-label={`Book ${label} service`}
      onClick={handleClick}
    >
      <div className="service-icon">{icon}</div>
      <span className="service-label">{label}</span>
    </button>
  );
};

const services = [
  {
    service: 'handyperson',
    label: 'Handyperson',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
      </svg>
    ),
  },
  {
    service: 'landscaping',
    label: 'Landscaping',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2v20M2 12h20" />
        <path d="M12 2a7 7 0 0 1 7 7c0 5.5-7 13-7 13s-7-7.5-7-13a7 7 0 0 1 7-7z" />
      </svg>
    ),
  },
  {
    service: 'plumbing',
    label: 'Plumbing',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 20v-8M8 20v-8M16 20v-8M4 4h16v8a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V4z" />
      </svg>
    ),
  },
  {
    service: 'electrical',
    label: 'Electrical',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
  },
  {
    service: 'remodeling',
    label: 'Remodeling',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M9 3v18M15 3v18M3 9h18M3 15h18" />
      </svg>
    ),
  },
  {
    service: 'roofing',
    label: 'Roofing',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      </svg>
    ),
  },
  {
    service: 'painting',
    label: 'Painting',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M18.37 2.63 14 7l-1.59-1.59a2 2 0 0 0-2.82 0L8 7l9 9 1.59-1.59a2 2 0 0 0 0-2.82L17 10l4.37-4.37a2.12 2.12 0 1 0-3-3z" />
        <path d="M9 8c-2 3-4 3.5-7 4l8 10c2-1 6-5 6-7" />
      </svg>
    ),
  },
  {
    service: 'cleaning',
    label: 'Cleaning',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v8M8 12h8" />
      </svg>
    ),
  },
  {
    service: 'hvac',
    label: 'HVAC',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" />
      </svg>
    ),
  },
  {
    service: 'windows',
    label: 'Windows',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 12h18M12 3v18" />
      </svg>
    ),
  },
  {
    service: 'concrete',
    label: 'Concrete',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 9h18M9 21V9" />
      </svg>
    ),
  },
  {
    service: 'tree-service',
    label: 'Tree Service',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2a3 3 0 0 0-3 3v4a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3zM12 9v13M8 15a3 3 0 0 1 0-6M16 15a3 3 0 0 0 0-6" />
      </svg>
    ),
  },
  {
    service: 'fencing',
    label: 'Fencing',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 4v16M8 4v16M12 4v16M16 4v16M20 4v16M2 8h20M2 12h20M2 16h20" />
      </svg>
    ),
  },
];

interface ServicesCarouselProps {
  onServiceClick?: (service: string) => void;
}

export default function ServicesCarousel({ onServiceClick }: ServicesCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    // Set CSS animation via inline style
    track.style.animation = 'scrollServices 40s linear infinite';

    // Pause animation on hover
    const handleMouseEnter = () => {
      track.style.animationPlayState = 'paused';
    };

    const handleMouseLeave = () => {
      track.style.animationPlayState = 'running';
    };

    track.addEventListener('mouseenter', handleMouseEnter);
    track.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      track.removeEventListener('mouseenter', handleMouseEnter);
      track.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  const handleServiceClick = (service: string) => {
    if (onServiceClick) {
      onServiceClick(service);
    }
  };

  return (
    <section className="section services-section" id="services">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title services-title">Available Services</h2>
          <p className="section-subtitle">
            Professional home services, expertly matched to your needs.
          </p>
        </div>
      </div>

      {/* Carousel container for horizontal scrolling */}
      <div className="services-carousel-container">
        <div className="services-carousel-track" ref={trackRef}>
          {/* First set of cards */}
          {services.map((service, index) => (
            <ServiceCard
              key={`${service.service}-${index}`}
              service={service.service}
              icon={service.icon}
              label={service.label}
              onClick={handleServiceClick}
            />
          ))}

          {/* Duplicate cards for seamless loop */}
          {services.map((service, index) => (
            <ServiceCard
              key={`${service.service}-duplicate-${index}`}
              service={service.service}
              icon={service.icon}
              label={service.label}
              onClick={handleServiceClick}
            />
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes scrollServices {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </section>
  );
}
