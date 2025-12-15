/**
 * Geocode an address to get latitude/longitude coordinates
 * Uses Google Maps Geocoding API
 */
export async function geocodeAddress(
  address: string
): Promise<{ lat: number; lng: number } | null> {
  // Support both env variable names
  const apiKey = process.env.GOOGLE_MAPS_API || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!address || !apiKey) {
    return null;
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        address
      )}&key=${apiKey}`
    );
    const data = await response.json();

    if (data.status === 'OK' && data.results?.[0]?.geometry?.location) {
      return {
        lat: data.results[0].geometry.location.lat,
        lng: data.results[0].geometry.location.lng,
      };
    }

    if (data.status === 'ZERO_RESULTS') {
      console.warn(`No geocoding results for address: ${address}`);
    } else if (data.status !== 'OK') {
      console.error(`Geocoding API error: ${data.status}`, data.error_message);
    }
  } catch (error) {
    console.error('Geocoding error:', error);
  }

  return null;
}

/**
 * Reverse geocode coordinates to get an address
 */
export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<string | null> {
  const apiKey = process.env.GOOGLE_MAPS_API || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return null;
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`
    );
    const data = await response.json();

    if (data.status === 'OK' && data.results?.[0]?.formatted_address) {
      return data.results[0].formatted_address;
    }
  } catch (error) {
    console.error('Reverse geocoding error:', error);
  }

  return null;
}

/**
 * Batch geocode multiple addresses
 * Returns a map of address -> coordinates
 */
export async function batchGeocode(
  addresses: string[]
): Promise<Map<string, { lat: number; lng: number } | null>> {
  const results = new Map<string, { lat: number; lng: number } | null>();

  // Process in batches to avoid rate limiting
  const batchSize = 10;
  for (let i = 0; i < addresses.length; i += batchSize) {
    const batch = addresses.slice(i, i + batchSize);
    const promises = batch.map(async (address) => {
      const coords = await geocodeAddress(address);
      return { address, coords };
    });

    const batchResults = await Promise.all(promises);
    batchResults.forEach(({ address, coords }) => {
      results.set(address, coords);
    });

    // Small delay between batches to avoid rate limiting
    if (i + batchSize < addresses.length) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  return results;
}

/**
 * Calculate distance between two coordinates in miles
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 3959; // Earth's radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}
