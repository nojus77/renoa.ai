/**
 * Cookie Consent Manager
 *
 * Manages user cookie preferences, consent levels, and script loading
 * for GDPR/CPRA compliance.
 */

import { detectGPC, storeGPCPreference } from './gpc-detector';

export type ConsentLevel = 'all' | 'essential_only' | 'custom';

export interface CookiePreferences {
  essential: boolean; // Always true
  analytics: boolean;
  marketing: boolean;
}

export interface ConsentData {
  level: ConsentLevel;
  preferences: CookiePreferences;
  timestamp: string;
  gpcDetected: boolean;
}

const CONSENT_KEY = 'cookie_consent';
const PREFERENCES_KEY = 'cookie_preferences';
const CONSENT_DATE_KEY = 'cookie_consent_date';
const GPC_KEY = 'gpc_detected';

// Consent expires after 12 months
const CONSENT_EXPIRY_MONTHS = 12;

/**
 * Checks if consent has expired (older than 12 months)
 */
export function isConsentExpired(): boolean {
  if (typeof window === 'undefined') return true;

  try {
    const consentDate = localStorage.getItem(CONSENT_DATE_KEY);
    if (!consentDate) return true;

    const consentTime = new Date(consentDate).getTime();
    const now = new Date().getTime();
    const monthsElapsed = (now - consentTime) / (1000 * 60 * 60 * 24 * 30);

    return monthsElapsed >= CONSENT_EXPIRY_MONTHS;
  } catch {
    return true;
  }
}

/**
 * Gets the current consent level
 */
export function getConsent(): ConsentLevel | null {
  if (typeof window === 'undefined') return null;

  try {
    // Check if consent has expired
    if (isConsentExpired()) {
      clearConsent();
      return null;
    }

    const consent = localStorage.getItem(CONSENT_KEY);
    return consent as ConsentLevel | null;
  } catch {
    return null;
  }
}

/**
 * Gets the current cookie preferences
 */
export function getPreferences(): CookiePreferences {
  if (typeof window === 'undefined') {
    return { essential: true, analytics: false, marketing: false };
  }

  try {
    const prefs = localStorage.getItem(PREFERENCES_KEY);
    if (!prefs) {
      return { essential: true, analytics: false, marketing: false };
    }

    return JSON.parse(prefs);
  } catch {
    return { essential: true, analytics: false, marketing: false };
  }
}

/**
 * Gets full consent data including GPC status
 */
export function getConsentData(): ConsentData | null {
  const level = getConsent();
  if (!level) return null;

  const preferences = getPreferences();
  const timestamp = localStorage.getItem(CONSENT_DATE_KEY) || new Date().toISOString();
  const gpcDetected = localStorage.getItem(GPC_KEY) === 'true';

  return {
    level,
    preferences,
    timestamp,
    gpcDetected,
  };
}

/**
 * Sets the consent level and preferences
 */
export function setConsent(
  level: ConsentLevel,
  preferences?: Partial<CookiePreferences>
): void {
  if (typeof window === 'undefined') return;

  try {
    const fullPreferences: CookiePreferences = {
      essential: true, // Always true
      analytics: level === 'all' || (preferences?.analytics ?? false),
      marketing: level === 'all' || (preferences?.marketing ?? false),
    };

    // If essential_only, force analytics and marketing to false
    if (level === 'essential_only') {
      fullPreferences.analytics = false;
      fullPreferences.marketing = false;
    }

    localStorage.setItem(CONSENT_KEY, level);
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(fullPreferences));
    localStorage.setItem(CONSENT_DATE_KEY, new Date().toISOString());

    // Detect and store GPC
    const gpcEnabled = detectGPC();
    storeGPCPreference(gpcEnabled);

    console.log('✅ Cookie consent saved:', level, fullPreferences);
  } catch (error) {
    console.error('Failed to save cookie consent:', error);
  }
}

/**
 * Clears all consent data (used when consent expires)
 */
export function clearConsent(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(CONSENT_KEY);
    localStorage.removeItem(PREFERENCES_KEY);
    localStorage.removeItem(CONSENT_DATE_KEY);
    console.log('✅ Cookie consent cleared');
  } catch (error) {
    console.error('Failed to clear cookie consent:', error);
  }
}

/**
 * Checks if analytics cookies are allowed
 */
export function hasAnalyticsConsent(): boolean {
  const preferences = getPreferences();
  return preferences.analytics;
}

/**
 * Checks if marketing cookies are allowed
 */
export function hasMarketingConsent(): boolean {
  const preferences = getPreferences();
  return preferences.marketing;
}

/**
 * Checks if user has made any consent choice
 */
export function hasConsent(): boolean {
  return getConsent() !== null && !isConsentExpired();
}

/**
 * Loads Google Analytics if consent is given
 */
export function loadAnalytics(): void {
  if (typeof window === 'undefined') return;

  if (!hasAnalyticsConsent()) {
    console.log('⚠️ Analytics blocked: No consent');
    return;
  }

  const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  if (!GA_MEASUREMENT_ID) {
    console.warn('⚠️ GA_MEASUREMENT_ID not configured');
    return;
  }

  // Check if already loaded
  if (document.querySelector(`script[src*="googletagmanager.com/gtag/js"]`)) {
    console.log('✅ Google Analytics already loaded');
    return;
  }

  // Load Google Analytics
  const script = document.createElement('script');
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  script.async = true;
  document.head.appendChild(script);

  script.onload = () => {
    (window as any).dataLayer = (window as any).dataLayer || [];
    function gtag(...args: any[]) {
      (window as any).dataLayer.push(args);
    }
    gtag('js', new Date());
    gtag('config', GA_MEASUREMENT_ID);
    console.log('✅ Google Analytics loaded');
  };
}

/**
 * Loads marketing pixels (Facebook Pixel, Google Ads) if consent is given
 */
export function loadMarketing(): void {
  if (typeof window === 'undefined') return;

  if (!hasMarketingConsent()) {
    console.log('⚠️ Marketing cookies blocked: No consent');
    return;
  }

  // Load Facebook Pixel
  const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FB_PIXEL_ID;
  if (FB_PIXEL_ID) {
    if (!(window as any).fbq) {
      (function (f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
        if (f.fbq) return;
        n = f.fbq = function () {
          n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
        };
        if (!f._fbq) f._fbq = n;
        n.push = n;
        n.loaded = !0;
        n.version = '2.0';
        n.queue = [];
        t = b.createElement(e);
        t.async = !0;
        t.src = v;
        s = b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t, s);
      })(
        window,
        document,
        'script',
        'https://connect.facebook.net/en_US/fbevents.js'
      );
      (window as any).fbq('init', FB_PIXEL_ID);
      (window as any).fbq('track', 'PageView');
      console.log('✅ Facebook Pixel loaded');
    }
  }

  // Load Google Ads
  const GOOGLE_ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;
  if (GOOGLE_ADS_ID) {
    if (!document.querySelector(`script[src*="googletagmanager.com/gtag/js"]`)) {
      const script = document.createElement('script');
      script.src = `https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ADS_ID}`;
      script.async = true;
      document.head.appendChild(script);

      script.onload = () => {
        (window as any).dataLayer = (window as any).dataLayer || [];
        function gtag(...args: any[]) {
          (window as any).dataLayer.push(args);
        }
        gtag('js', new Date());
        gtag('config', GOOGLE_ADS_ID);
        console.log('✅ Google Ads loaded');
      };
    }
  }
}

/**
 * Blocks non-essential scripts from loading
 */
export function blockScripts(): void {
  if (typeof window === 'undefined') return;

  // Remove any existing analytics/marketing scripts if consent is revoked
  const scripts = document.querySelectorAll(
    'script[src*="googletagmanager.com"], script[src*="facebook.net"]'
  );

  scripts.forEach((script) => {
    script.remove();
  });

  console.log('✅ Non-essential scripts blocked');
}

/**
 * Initializes cookie consent system
 * - Checks for GPC signal
 * - Loads scripts based on consent
 */
export function initializeCookieConsent(): void {
  if (typeof window === 'undefined') return;

  // Check for GPC signal
  const gpcEnabled = detectGPC();
  if (gpcEnabled) {
    console.log('🛡️ GPC detected: Auto-rejecting non-essential cookies');
    setConsent('essential_only');
    return;
  }

  // Load scripts based on existing consent
  const consent = getConsent();
  if (consent) {
    if (hasAnalyticsConsent()) {
      loadAnalytics();
    }
    if (hasMarketingConsent()) {
      loadMarketing();
    }
  }
}
