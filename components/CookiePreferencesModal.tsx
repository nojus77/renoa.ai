'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  getPreferences,
  setConsent,
  type CookiePreferences,
} from '@/lib/cookie-manager';

interface CookiePreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
}

export default function CookiePreferencesModal({
  isOpen,
  onClose,
  onSave,
}: CookiePreferencesModalProps) {
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    if (isOpen) {
      const currentPrefs = getPreferences();
      setPreferences(currentPrefs);
    }
  }, [isOpen]);

  const handleToggle = (category: keyof CookiePreferences) => {
    if (category === 'essential') return; // Can't toggle essential

    setPreferences((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const handleSave = () => {
    setConsent('custom', preferences);
    onSave?.();
    onClose();
    // Reload page to apply new settings
    window.location.reload();
  };

  const handleAcceptAll = () => {
    setConsent('all');
    onSave?.();
    onClose();
    window.location.reload();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cookie-modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Content */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 id="cookie-modal-title" className="text-2xl font-bold text-gray-900">
              Cookie Preferences
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-2"
              aria-label="Close modal"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <p className="text-gray-600 text-sm mt-2">
            Manage your cookie preferences. Changes will take effect after saving.
          </p>
        </div>

        {/* Cookie Categories */}
        <div className="px-6 py-6 space-y-6">
          {/* Essential Cookies */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-3">
                <h3 className="font-semibold text-gray-900">Essential Cookies</h3>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
                  Always Active
                </span>
              </div>
              <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out bg-green-500 rounded-full opacity-50 cursor-not-allowed">
                <span className="absolute left-auto right-0 inline-block w-6 h-6 transition-transform duration-200 ease-in-out transform bg-white rounded-full shadow" />
              </div>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              Required for the website to function properly. These cookies enable core
              functionality such as security, network management, and accessibility. They cannot
              be disabled.
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Examples: Session cookies, CSRF tokens, authentication
            </p>
          </div>

          {/* Analytics Cookies */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-900">Analytics Cookies</h3>
              <button
                onClick={() => handleToggle('analytics')}
                className={`relative inline-block w-12 h-6 transition duration-200 ease-in-out rounded-full ${
                  preferences.analytics ? 'bg-green-500' : 'bg-gray-300'
                }`}
                role="switch"
                aria-checked={preferences.analytics}
                aria-label="Toggle analytics cookies"
              >
                <span
                  className={`absolute inline-block w-6 h-6 transition-transform duration-200 ease-in-out transform bg-white rounded-full shadow ${
                    preferences.analytics ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              Help us understand how visitors interact with our website by collecting and
              reporting information anonymously. This helps us improve user experience.
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Examples: Google Analytics, page views, session duration
            </p>
          </div>

          {/* Marketing Cookies */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-900">Marketing Cookies</h3>
              <button
                onClick={() => handleToggle('marketing')}
                className={`relative inline-block w-12 h-6 transition duration-200 ease-in-out rounded-full ${
                  preferences.marketing ? 'bg-green-500' : 'bg-gray-300'
                }`}
                role="switch"
                aria-checked={preferences.marketing}
                aria-label="Toggle marketing cookies"
              >
                <span
                  className={`absolute inline-block w-6 h-6 transition-transform duration-200 ease-in-out transform bg-white rounded-full shadow ${
                    preferences.marketing ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              Used to track visitors across websites to display relevant and engaging
              advertisements. May also be used to measure ad campaign effectiveness.
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Examples: Facebook Pixel, Google Ads, retargeting pixels
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 rounded-b-2xl">
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleSave}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-all transform hover:scale-105 shadow-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              Save Preferences
            </button>
            <button
              onClick={handleAcceptAll}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-6 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
            >
              Accept All
            </button>
          </div>
          <p className="text-xs text-gray-500 text-center mt-3">
            For more details, read our{' '}
            <Link href="/cookie-policy" className="text-green-600 hover:text-green-700 underline">
              Cookie Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
