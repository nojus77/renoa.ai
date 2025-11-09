'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import CookiePreferencesModal from './CookiePreferencesModal';
import {
  hasConsent,
  setConsent,
  getConsent,
  initializeCookieConsent,
  loadAnalytics,
  loadMarketing,
} from '@/lib/cookie-manager';
import { detectGPC } from '@/lib/gpc-detector';

export default function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [gpcDetected, setGpcDetected] = useState(false);

  useEffect(() => {
    // Initialize cookie consent system
    initializeCookieConsent();

    // Check for GPC signal
    const gpcEnabled = detectGPC();
    setGpcDetected(gpcEnabled);

    // If GPC is enabled, auto-reject and don't show banner
    if (gpcEnabled) {
      const existingConsent = getConsent();
      if (!existingConsent) {
        setConsent('essential_only');
      }
      setShowBanner(false);
      return;
    }

    // Show banner if no consent exists
    const consentExists = hasConsent();
    setShowBanner(!consentExists);
  }, []);

  const handleAcceptAll = () => {
    setConsent('all');
    setShowBanner(false);
    loadAnalytics();
    loadMarketing();
  };

  const handleRejectAll = () => {
    setConsent('essential_only');
    setShowBanner(false);
  };

  const handleManagePreferences = () => {
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setShowBanner(false);
  };

  // Don't render anything if banner shouldn't be shown
  if (!showBanner && !gpcDetected) return null;

  // Show GPC notice if detected
  if (gpcDetected && !showBanner) {
    return (
      <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-sm z-40 animate-fade-in">
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg shadow-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-blue-900 mb-1">
                Privacy Settings Applied
              </p>
              <p className="text-xs text-blue-700">
                Your browser&apos;s Global Privacy Control (GPC) signal has been honored. Only
                essential cookies are active.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Cookie Banner */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t-2 border-gray-200 shadow-2xl animate-slide-up"
        role="region"
        aria-label="Cookie consent banner"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            {/* Text Content */}
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <svg
                  className="w-6 h-6 text-green-600 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                  />
                </svg>
                <h3 className="font-semibold text-gray-900 text-lg">We Value Your Privacy</h3>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                We use cookies to improve your experience. Essential cookies are always active.{' '}
                <Link
                  href="/cookie-policy"
                  className="text-green-600 hover:text-green-700 underline font-medium"
                >
                  Learn more
                </Link>
              </p>
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <button
                onClick={handleManagePreferences}
                className="text-gray-700 hover:text-gray-900 font-medium text-sm underline transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 rounded px-2 py-1"
              >
                Manage Preferences
              </button>
              <button
                onClick={handleRejectAll}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-6 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
              >
                Reject All
              </button>
              <button
                onClick={handleAcceptAll}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-all transform hover:scale-105 shadow-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                Accept All
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Cookie Preferences Modal */}
      <CookiePreferencesModal
        isOpen={showModal}
        onClose={handleModalClose}
        onSave={handleModalClose}
      />

      {/* Animations */}
      <style jsx global>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .animate-slide-up {
          animation: slide-up 0.4s ease-out;
        }

        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
      `}</style>
    </>
  );
}
