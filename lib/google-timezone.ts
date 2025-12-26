/**
 * Google Timezone API Helper
 *
 * Fetches timezone information from job address location using Google APIs.
 * Used to store per-job timezone for accurate time display across regions.
 */

interface GeocodeResult {
  results: Array<{
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
    };
  }>;
  status: string;
}

interface TimezoneResult {
  timeZoneId: string;
  timeZoneName: string;
  rawOffset: number;
  dstOffset: number;
  status: string;
}

/**
 * Get IANA timezone ID from an address using Google Geocoding + Timezone APIs
 *
 * @param address - Full street address to geocode
 * @returns IANA timezone string (e.g., "America/Chicago") or null if lookup fails
 *
 * @example
 * const tz = await getTimezoneFromAddress("123 Main St, Dallas, TX 75201")
 * // Returns: "America/Chicago"
 */
export async function getTimezoneFromAddress(address: string): Promise<string | null> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    console.warn('[Timezone] Google Maps API key not configured');
    return null;
  }

  if (!address || address.trim().length < 5) {
    console.warn('[Timezone] Address too short for geocoding:', address);
    return null;
  }

  try {
    // Step 1: Geocode address to get lat/lng
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
    const geocodeRes = await fetch(geocodeUrl);

    if (!geocodeRes.ok) {
      console.error('[Timezone] Geocoding API error:', geocodeRes.status);
      return null;
    }

    const geocodeData: GeocodeResult = await geocodeRes.json();

    if (geocodeData.status !== 'OK' || !geocodeData.results?.[0]) {
      console.warn('[Timezone] Geocoding failed for address:', address, 'Status:', geocodeData.status);
      return null;
    }

    const { lat, lng } = geocodeData.results[0].geometry.location;

    // Step 2: Get timezone from lat/lng
    const timestamp = Math.floor(Date.now() / 1000);
    const timezoneUrl = `https://maps.googleapis.com/maps/api/timezone/json?location=${lat},${lng}&timestamp=${timestamp}&key=${apiKey}`;
    const timezoneRes = await fetch(timezoneUrl);

    if (!timezoneRes.ok) {
      console.error('[Timezone] Timezone API error:', timezoneRes.status);
      return null;
    }

    const timezoneData: TimezoneResult = await timezoneRes.json();

    if (timezoneData.status !== 'OK' || !timezoneData.timeZoneId) {
      console.warn('[Timezone] Timezone lookup failed:', timezoneData.status);
      return null;
    }

    console.log(`[Timezone] Resolved "${address.substring(0, 30)}..." → ${timezoneData.timeZoneId}`);
    return timezoneData.timeZoneId;

  } catch (error) {
    console.error('[Timezone] Lookup failed:', error);
    return null;
  }
}

/**
 * Get timezone from coordinates directly (useful when lat/lng already known)
 */
export async function getTimezoneFromCoordinates(lat: number, lng: number): Promise<string | null> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    console.warn('[Timezone] Google Maps API key not configured');
    return null;
  }

  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const timezoneUrl = `https://maps.googleapis.com/maps/api/timezone/json?location=${lat},${lng}&timestamp=${timestamp}&key=${apiKey}`;
    const timezoneRes = await fetch(timezoneUrl);

    if (!timezoneRes.ok) {
      return null;
    }

    const timezoneData: TimezoneResult = await timezoneRes.json();

    if (timezoneData.status !== 'OK' || !timezoneData.timeZoneId) {
      return null;
    }

    return timezoneData.timeZoneId;

  } catch (error) {
    console.error('[Timezone] Coordinate lookup failed:', error);
    return null;
  }
}
