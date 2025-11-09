'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  getPreferences,
  setConsent,
  getConsentData,
  type CookiePreferences,
} from '@/lib/cookie-manager';

export default function CookiePreferencesPage() {
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true,
    analytics: false,
    marketing: false,
  });
  const [saved, setSaved] = useState(false);
  const [consentDate, setConsentDate] = useState<string | null>(null);

  useEffect(() => {
    const currentPrefs = getPreferences();
    setPreferences(currentPrefs);

    const consentData = getConsentData();
    if (consentData) {
      setConsentDate(consentData.timestamp);
    }
  }, []);

  const handleToggle = (category: keyof CookiePreferences) => {
    if (category === 'essential') return; // Can't toggle essential

    setPreferences((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
    setSaved(false);
  };

  const handleSave = () => {
    setConsent('custom', preferences);
    setSaved(true);
    setConsentDate(new Date().toISOString());

    // Show confirmation and reload after 2 seconds
    setTimeout(() => {
      window.location.reload();
    }, 2000);
  };

  const handleAcceptAll = () => {
    setConsent('all');
    setSaved(true);
    setTimeout(() => {
      window.location.reload();
    }, 2000);
  };

  const handleRejectAll = () => {
    setConsent('essential_only');
    setSaved(true);
    setTimeout(() => {
      window.location.reload();
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href="/"
            className="inline-flex items-center text-green-600 hover:text-green-700 font-semibold transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Home
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <article className="bg-white rounded-2xl shadow-sm p-8 sm:p-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Cookie Preference Center</h1>
          <p className="text-gray-600 mb-8">
            Manage your cookie preferences and control how we use cookies on your device.
          </p>

          {/* Success Message */}
          {saved && (
            <div className="mb-6 bg-green-50 border-2 border-green-200 rounded-lg p-4 animate-fade-in">
              <div className="flex items-center space-x-3">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-green-800 font-semibold">
                  Preferences saved successfully! Reloading page...
                </p>
              </div>
            </div>
          )}

          {/* Current Status */}
          {consentDate && !saved && (
            <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Current preferences:</strong> Last updated on{' '}
                {new Date(consentDate).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          )}

          {/* Cookie Categories */}
          <div className="space-y-6 mb-8">
            {/* Essential Cookies */}
            <div className="border-2 border-gray-200 rounded-xl p-6 bg-gray-50">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <h2 className="text-2xl font-semibold text-gray-900">Essential Cookies</h2>
                  <span className="text-xs bg-green-100 text-green-800 px-3 py-1 rounded-full font-semibold">
                    Always Active
                  </span>
                </div>
                <div className="relative inline-block w-14 h-7 transition duration-200 ease-in-out bg-green-500 rounded-full opacity-50 cursor-not-allowed">
                  <span className="absolute left-auto right-0 inline-block w-7 h-7 transition-transform duration-200 ease-in-out transform bg-white rounded-full shadow-md" />
                </div>
              </div>
              <p className="text-gray-700 leading-relaxed mb-4">
                These cookies are necessary for the website to function and cannot be switched off
                in our systems. They are usually only set in response to actions made by you which
                amount to a request for services, such as setting your privacy preferences, logging
                in or filling in forms.
              </p>
              <div className="bg-white rounded-lg p-4 mt-4">
                <h3 className="font-semibold text-gray-900 mb-3">Cookies Used:</h3>
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 pr-4 font-semibold text-gray-700">Name</th>
                      <th className="text-left py-2 pr-4 font-semibold text-gray-700">Purpose</th>
                      <th className="text-left py-2 font-semibold text-gray-700">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-600">
                    <tr className="border-b border-gray-100">
                      <td className="py-2 pr-4 font-mono text-xs">cookie_consent</td>
                      <td className="py-2 pr-4">Stores your cookie consent preferences</td>
                      <td className="py-2">12 months</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-2 pr-4 font-mono text-xs">session_id</td>
                      <td className="py-2 pr-4">Maintains your session state</td>
                      <td className="py-2">Session</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-4 font-mono text-xs">csrf_token</td>
                      <td className="py-2 pr-4">Security protection against attacks</td>
                      <td className="py-2">Session</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Analytics Cookies */}
            <div className="border-2 border-gray-200 rounded-xl p-6 hover:border-green-300 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-semibold text-gray-900">Analytics Cookies</h2>
                <button
                  onClick={() => handleToggle('analytics')}
                  className={`relative inline-block w-14 h-7 transition duration-200 ease-in-out rounded-full ${
                    preferences.analytics ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                  role="switch"
                  aria-checked={preferences.analytics}
                  aria-label="Toggle analytics cookies"
                >
                  <span
                    className={`absolute inline-block w-7 h-7 transition-transform duration-200 ease-in-out transform bg-white rounded-full shadow-md ${
                      preferences.analytics ? 'translate-x-7' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
              <p className="text-gray-700 leading-relaxed mb-4">
                These cookies allow us to count visits and traffic sources so we can measure and
                improve the performance of our site. They help us to know which pages are the most
                and least popular and see how visitors move around the site. All information these
                cookies collect is aggregated and therefore anonymous.
              </p>
              <div className="bg-white rounded-lg p-4 mt-4">
                <h3 className="font-semibold text-gray-900 mb-3">Cookies Used:</h3>
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 pr-4 font-semibold text-gray-700">Name</th>
                      <th className="text-left py-2 pr-4 font-semibold text-gray-700">Provider</th>
                      <th className="text-left py-2 pr-4 font-semibold text-gray-700">Purpose</th>
                      <th className="text-left py-2 font-semibold text-gray-700">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-600">
                    <tr className="border-b border-gray-100">
                      <td className="py-2 pr-4 font-mono text-xs">_ga</td>
                      <td className="py-2 pr-4">Google Analytics</td>
                      <td className="py-2 pr-4">Distinguishes unique users</td>
                      <td className="py-2">2 years</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-2 pr-4 font-mono text-xs">_ga_*</td>
                      <td className="py-2 pr-4">Google Analytics</td>
                      <td className="py-2 pr-4">Stores session state</td>
                      <td className="py-2">2 years</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-4 font-mono text-xs">_gid</td>
                      <td className="py-2 pr-4">Google Analytics</td>
                      <td className="py-2 pr-4">Distinguishes users</td>
                      <td className="py-2">24 hours</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Marketing Cookies */}
            <div className="border-2 border-gray-200 rounded-xl p-6 hover:border-green-300 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-semibold text-gray-900">Marketing Cookies</h2>
                <button
                  onClick={() => handleToggle('marketing')}
                  className={`relative inline-block w-14 h-7 transition duration-200 ease-in-out rounded-full ${
                    preferences.marketing ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                  role="switch"
                  aria-checked={preferences.marketing}
                  aria-label="Toggle marketing cookies"
                >
                  <span
                    className={`absolute inline-block w-7 h-7 transition-transform duration-200 ease-in-out transform bg-white rounded-full shadow-md ${
                      preferences.marketing ? 'translate-x-7' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
              <p className="text-gray-700 leading-relaxed mb-4">
                These cookies may be set through our site by our advertising partners. They may be
                used by those companies to build a profile of your interests and show you relevant
                adverts on other sites. They are based on uniquely identifying your browser and
                internet device.
              </p>
              <div className="bg-white rounded-lg p-4 mt-4">
                <h3 className="font-semibold text-gray-900 mb-3">Cookies Used:</h3>
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 pr-4 font-semibold text-gray-700">Name</th>
                      <th className="text-left py-2 pr-4 font-semibold text-gray-700">Provider</th>
                      <th className="text-left py-2 pr-4 font-semibold text-gray-700">Purpose</th>
                      <th className="text-left py-2 font-semibold text-gray-700">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-600">
                    <tr className="border-b border-gray-100">
                      <td className="py-2 pr-4 font-mono text-xs">_fbp</td>
                      <td className="py-2 pr-4">Facebook</td>
                      <td className="py-2 pr-4">Tracks ad conversions</td>
                      <td className="py-2">3 months</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-2 pr-4 font-mono text-xs">fr</td>
                      <td className="py-2 pr-4">Facebook</td>
                      <td className="py-2 pr-4">Delivers targeted advertising</td>
                      <td className="py-2">3 months</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-4 font-mono text-xs">_gcl_au</td>
                      <td className="py-2 pr-4">Google Ads</td>
                      <td className="py-2 pr-4">Stores ad click information</td>
                      <td className="py-2">3 months</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
            <button
              onClick={handleSave}
              disabled={saved}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-lg transition-all transform hover:scale-105 shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              {saved ? 'Saved!' : 'Save My Preferences'}
            </button>
            <button
              onClick={handleAcceptAll}
              disabled={saved}
              className="flex-1 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed text-gray-800 font-semibold py-4 px-6 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
            >
              Accept All
            </button>
            <button
              onClick={handleRejectAll}
              disabled={saved}
              className="flex-1 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed text-gray-800 font-semibold py-4 px-6 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
            >
              Reject All
            </button>
          </div>

          {/* Additional Info */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 leading-relaxed">
              For more information about how we use cookies, please read our{' '}
              <Link
                href="/cookie-policy"
                className="text-green-600 hover:text-green-700 font-semibold underline"
              >
                Cookie Policy
              </Link>
              . If you have questions about your privacy, see our{' '}
              <Link
                href="/privacy-policy"
                className="text-green-600 hover:text-green-700 font-semibold underline"
              >
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </article>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <p className="text-gray-600 text-sm">
              &copy; {new Date().getFullYear()} Renoa AI. All rights reserved.
            </p>
            <div className="flex space-x-6 text-sm">
              <Link
                href="/privacy-policy"
                className="text-gray-600 hover:text-green-600 transition-colors"
              >
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-gray-600 hover:text-green-600 transition-colors">
                Terms of Service
              </Link>
              <Link
                href="/cookie-policy"
                className="text-gray-600 hover:text-green-600 transition-colors"
              >
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
