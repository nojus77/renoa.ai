/**
 * Global Privacy Control (GPC) Detection Utility
 *
 * Detects if the user's browser sends a Global Privacy Control signal,
 * indicating they want to opt-out of data sale/sharing.
 *
 * Supported browsers: Brave, Firefox (with extension), Chrome/Edge (with extension)
 */

// Extend Navigator interface to include GPC property
declare global {
  interface Navigator {
    globalPrivacyControl?: boolean;
  }
}

/**
 * Detects if Global Privacy Control (GPC) is enabled
 * @returns true if GPC signal is detected, false otherwise
 */
export function detectGPC(): boolean {
  if (typeof window === 'undefined') {
    return false; // Server-side rendering
  }

  // Check for GPC signal in navigator
  return navigator.globalPrivacyControl === true;
}

/**
 * Gets the GPC status with additional metadata
 * @returns Object containing GPC status and detection timestamp
 */
export function getGPCStatus(): {
  enabled: boolean;
  detectedAt: string;
  browserSupport: boolean;
} {
  const enabled = detectGPC();
  const browserSupport = typeof navigator.globalPrivacyControl !== 'undefined';

  return {
    enabled,
    detectedAt: new Date().toISOString(),
    browserSupport,
  };
}

/**
 * Checks if GPC preference has been stored and is still valid
 * @returns true if GPC was previously detected and stored
 */
export function hasStoredGPCPreference(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    const stored = localStorage.getItem('gpc_detected');
    return stored === 'true';
  } catch {
    return false;
  }
}

/**
 * Stores GPC detection result in localStorage
 * @param detected - Whether GPC signal was detected
 */
export function storeGPCPreference(detected: boolean): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem('gpc_detected', String(detected));
    localStorage.setItem('gpc_detected_at', new Date().toISOString());
  } catch (error) {
    console.warn('Failed to store GPC preference:', error);
  }
}
