'use client';

import { useEffect, useRef, useState } from 'react';

interface AddressComponents {
  street: string;
  city: string;
  state: string;
  zip: string;
  fullAddress: string;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onAddressSelect: (components: AddressComponents) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

// Declare google maps types
declare global {
  interface Window {
    google: typeof google;
    initGoogleMaps: () => void;
  }
}

export default function AddressAutocomplete({
  value,
  onChange,
  onAddressSelect,
  placeholder = 'Enter your address',
  className = '',
  disabled = false,
}: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Fix z-index and styling for Google Places dropdown
  const fixDropdownZIndex = () => {
    // Retry multiple times to ensure dropdown is rendered
    const applyStyles = () => {
      const pacContainer = document.querySelector('.pac-container') as HTMLElement;
      if (pacContainer && inputRef.current) {
        const inputWidth = inputRef.current.offsetWidth;
        const inputRect = inputRef.current.getBoundingClientRect();

        // Calculate position: directly below the input field
        const topPosition = inputRect.bottom + 8; // 8px gap below input
        const leftPosition = inputRect.left;

        pacContainer.style.setProperty('z-index', '10001', 'important');
        pacContainer.style.setProperty('position', 'fixed', 'important');
        pacContainer.style.setProperty('width', `${inputWidth}px`, 'important');
        pacContainer.style.setProperty('left', `${leftPosition}px`, 'important');
        pacContainer.style.setProperty('top', `${topPosition}px`, 'important');
        pacContainer.style.borderRadius = '12px';
        pacContainer.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.15)';
        pacContainer.style.border = '2px solid #e0e0e0';
        pacContainer.style.fontFamily = 'inherit';
        pacContainer.style.overflow = 'hidden';
      }
    };

    // Try multiple times with different delays to catch the dropdown
    setTimeout(applyStyles, 10);
    setTimeout(applyStyles, 50);
    setTimeout(applyStyles, 100);
  };

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      console.warn('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not defined');
      // Still set loaded to true so the input works without autocomplete
      setIsLoaded(true);
      return;
    }

    // Check if Google Maps is already loaded
    if (window.google && window.google.maps && window.google.maps.places) {
      setIsLoaded(true);
      return;
    }

    // Load Google Maps script
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => setIsLoaded(true);
    script.onerror = () => {
      console.error('Error loading Google Maps');
      setIsLoaded(true); // Still set loaded so input works
    };
    document.head.appendChild(script);

    return () => {
      // Cleanup script if component unmounts
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  useEffect(() => {
    if (!isLoaded || !inputRef.current || autocomplete) return;

    // Check if Google Maps API is available
    if (!window.google || !window.google.maps || !window.google.maps.places) {
      return;
    }

    const options: google.maps.places.AutocompleteOptions = {
      types: ['address'],
      componentRestrictions: { country: 'us' },
      fields: ['address_components', 'formatted_address'],
    };

    const instance = new google.maps.places.Autocomplete(inputRef.current, options);

    instance.addListener('place_changed', () => {
      const place = instance.getPlace();

      if (!place.address_components) {
        return;
      }

      const components: AddressComponents = {
        street: '',
        city: '',
        state: '',
        zip: '',
        fullAddress: place.formatted_address || '',
      };

      // Parse address components
      place.address_components.forEach((component) => {
        const types = component.types;

        if (types.includes('street_number')) {
          components.street = component.long_name + ' ';
        }
        if (types.includes('route')) {
          components.street += component.long_name;
        }
        if (types.includes('locality')) {
          components.city = component.long_name;
        }
        if (types.includes('administrative_area_level_1')) {
          components.state = component.short_name;
        }
        if (types.includes('postal_code')) {
          components.zip = component.long_name;
        }
      });

      onChange(components.fullAddress);
      onAddressSelect(components);
    });

    setAutocomplete(instance);
  }, [isLoaded, autocomplete, onChange, onAddressSelect]);

  // Monitor for dropdown appearance and apply styles continuously
  useEffect(() => {
    if (!autocomplete) return;

    const applyDropdownStyles = () => {
      const pacContainer = document.querySelector('.pac-container') as HTMLElement;
      if (pacContainer && inputRef.current) {
        const inputWidth = inputRef.current.offsetWidth;
        const inputRect = inputRef.current.getBoundingClientRect();

        // Calculate position: directly below the input field
        const topPosition = inputRect.bottom + 8; // 8px gap below input
        const leftPosition = inputRect.left;

        // Force all styles with !important equivalent (direct inline styles)
        pacContainer.style.setProperty('z-index', '10001', 'important');
        pacContainer.style.setProperty('position', 'fixed', 'important');
        pacContainer.style.setProperty('width', `${inputWidth}px`, 'important');
        pacContainer.style.setProperty('left', `${leftPosition}px`, 'important');
        pacContainer.style.setProperty('top', `${topPosition}px`, 'important');
        pacContainer.style.borderRadius = '12px';
        pacContainer.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.15)';
        pacContainer.style.border = '2px solid #e0e0e0';
        pacContainer.style.overflow = 'hidden';
      }
    };

    const observer = new MutationObserver(applyDropdownStyles);

    // Watch for changes in the document body (where pac-container appears)
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Also apply styles immediately if dropdown already exists
    applyDropdownStyles();

    // Reapply on scroll or resize to keep it positioned correctly
    window.addEventListener('scroll', applyDropdownStyles, true);
    window.addEventListener('resize', applyDropdownStyles);

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', applyDropdownStyles, true);
      window.removeEventListener('resize', applyDropdownStyles);
    };
  }, [autocomplete]);

  return (
    <>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={fixDropdownZIndex}
        placeholder={placeholder}
        className={className}
        disabled={disabled}
        autoComplete="off"
      />
      <style jsx global>{`
        /* Override Google Places container styles - CRITICAL z-index! */
        .pac-container {
          font-family: inherit;
          max-width: none !important;
          width: auto !important;
          z-index: 10001 !important;
          position: fixed !important;
          border-radius: 12px !important;
          margin-top: 8px !important;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15) !important;
          border: 2px solid #e0e0e0 !important;
          overflow: hidden !important;
        }

        /* Ensure dropdown appears above everything */
        .pac-container:after {
          content: none !important;
        }

        /* Ensure Google Places input matches other fields */
        input[type="text"].exit-popup-input {
          width: 100% !important;
          max-width: none !important;
        }

        .pac-item {
          padding: 12px 16px;
          cursor: pointer;
          font-size: 15px;
          line-height: 1.4;
          border-top: 1px solid #f0f0f0;
          transition: background-color 0.2s;
        }

        .pac-item:first-child {
          border-top: none;
        }

        .pac-item:hover {
          background-color: #f9fafb;
        }

        .pac-item-selected {
          background-color: #f3f4f6;
        }

        .pac-icon {
          margin-top: 4px;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z'%3E%3C/path%3E%3Ccircle cx='12' cy='10' r='3'%3E%3C/circle%3E%3C/svg%3E");
          background-size: 18px 18px;
          background-repeat: no-repeat;
          background-position: center;
          width: 20px;
          height: 20px;
        }

        .pac-icon-marker {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z'%3E%3C/path%3E%3Ccircle cx='12' cy='10' r='3'%3E%3C/circle%3E%3C/svg%3E");
        }

        .pac-item-query {
          font-size: 15px;
          color: #1f2937;
          font-weight: 500;
        }

        .pac-matched {
          font-weight: 600;
          color: #059669;
        }
      `}</style>
    </>
  );
}
