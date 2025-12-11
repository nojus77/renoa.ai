/**
 * Geocoding Service
 *
 * Converts addresses to coordinates (latitude/longitude) using OpenStreetMap Nominatim API.
 * Free, open-source, and no API key required.
 *
 * Rate limits: 1 request per second
 * Usage policy: https://operations.osmfoundation.org/policies/nominatim/
 */

import type { Coordinates } from './distance-service';

export interface GeocodingResult {
  latitude: number;
  longitude: number;
  displayName: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  confidence: number; // 0-1, how confident we are in the result
}

interface NominatimResponse {
  lat: string;
  lon: string;
  display_name: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
  importance?: number; // 0-1 importance score from Nominatim
}

/**
 * Geocode an address to coordinates
 *
 * Uses OpenStreetMap Nominatim API (free, no API key required)
 * Respects rate limit of 1 request per second
 */
export async function geocodeAddress(
  address: string
): Promise<GeocodingResult | null> {
  try {
    // Clean up address for better results
    const cleanAddress = address.trim().replace(/\s+/g, ' ');

    // Build query URL
    const params = new URLSearchParams({
      q: cleanAddress,
      format: 'json',
      limit: '1',
      addressdetails: '1',
    });

    const url = `https://nominatim.openstreetmap.org/search?${params}`;

    // Make request with proper user agent (required by Nominatim)
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'RenoaAI-Scheduler/1.0 (Smart Worker Scheduling System)',
      },
    });

    if (!response.ok) {
      console.error('Nominatim API error:', response.status, response.statusText);
      return null;
    }

    const data: NominatimResponse[] = await response.json();

    if (!data || data.length === 0) {
      console.warn('No geocoding results for address:', address);
      return null;
    }

    const result = data[0];

    return {
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      displayName: result.display_name,
      city: result.address?.city || result.address?.town || result.address?.village,
      state: result.address?.state,
      zipCode: result.address?.postcode,
      country: result.address?.country,
      confidence: result.importance || 0.5,
    };
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

/**
 * Batch geocode multiple addresses with rate limiting
 *
 * Respects Nominatim's 1 request per second limit
 */
export async function geocodeAddresses(
  addresses: string[]
): Promise<Map<string, GeocodingResult | null>> {
  const results = new Map<string, GeocodingResult | null>();

  for (const address of addresses) {
    const result = await geocodeAddress(address);
    results.set(address, result);

    // Wait 1 second between requests to respect rate limit
    if (addresses.indexOf(address) < addresses.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return results;
}

/**
 * Extract ZIP code from an address string
 *
 * Useful for zone-based routing when full geocoding isn't needed
 */
export function extractZipCode(address: string): string | null {
  // US ZIP code pattern: 5 digits or 5+4 format
  const zipPattern = /\b(\d{5})(?:-\d{4})?\b/;
  const match = address.match(zipPattern);
  return match ? match[1] : null;
}

/**
 * Reverse geocode: Convert coordinates to address
 *
 * Useful for displaying worker locations or job sites
 */
export async function reverseGeocode(
  coords: Coordinates
): Promise<GeocodingResult | null> {
  try {
    const params = new URLSearchParams({
      lat: coords.latitude.toString(),
      lon: coords.longitude.toString(),
      format: 'json',
      addressdetails: '1',
    });

    const url = `https://nominatim.openstreetmap.org/reverse?${params}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'RenoaAI-Scheduler/1.0 (Smart Worker Scheduling System)',
      },
    });

    if (!response.ok) {
      console.error('Reverse geocoding error:', response.status, response.statusText);
      return null;
    }

    const result: NominatimResponse = await response.json();

    return {
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      displayName: result.display_name,
      city: result.address?.city || result.address?.town || result.address?.village,
      state: result.address?.state,
      zipCode: result.address?.postcode,
      country: result.address?.country,
      confidence: result.importance || 0.5,
    };
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return null;
  }
}

/**
 * Validate if coordinates are reasonable for US addresses
 *
 * US bounding box approximately:
 * Latitude: 24.5° to 49.4° (excluding Alaska/Hawaii for simplicity)
 * Longitude: -125° to -66°
 */
export function validateUSCoordinates(coords: Coordinates): boolean {
  return (
    coords.latitude >= 24.5 &&
    coords.latitude <= 49.4 &&
    coords.longitude >= -125 &&
    coords.longitude <= -66
  );
}

/**
 * Future: Cache geocoding results in database
 *
 * Implementation notes:
 * - Cache results by address string
 * - Include timestamp for cache invalidation
 * - Consider fuzzy matching for similar addresses
 * - Dramatically reduces API calls
 */
export interface GeocodeCache {
  address: string;
  result: GeocodingResult;
  cachedAt: Date;
}

// TODO: Implement database caching layer
export async function getCachedGeocode(
  address: string
): Promise<GeocodingResult | null> {
  // For now, always geocode fresh
  // In production, check database cache first
  return geocodeAddress(address);
}
