/**
 * Distance Service
 *
 * Provides distance calculations between coordinates using the Haversine formula.
 * Pluggable architecture allows for future integration with Google Maps Distance Matrix API.
 */

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface DistanceResult {
  miles: number;
  kilometers: number;
  method: 'haversine' | 'google_maps';
}

/**
 * Calculate straight-line distance between two points using Haversine formula
 *
 * This is more accurate than simple Euclidean distance on a sphere.
 * Good enough for most routing decisions within 100 miles.
 *
 * Formula:
 * a = sin²(Δφ/2) + cos φ1 ⋅ cos φ2 ⋅ sin²(Δλ/2)
 * c = 2 ⋅ atan2( √a, √(1−a) )
 * d = R ⋅ c
 *
 * where φ is latitude, λ is longitude, R is earth's radius
 */
export function calculateHaversineDistance(
  point1: Coordinates,
  point2: Coordinates
): DistanceResult {
  const R = 3959; // Earth's radius in miles (use 6371 for km)

  // Convert degrees to radians
  const lat1Rad = (point1.latitude * Math.PI) / 180;
  const lat2Rad = (point2.latitude * Math.PI) / 180;
  const deltaLat = ((point2.latitude - point1.latitude) * Math.PI) / 180;
  const deltaLon = ((point2.longitude - point1.longitude) * Math.PI) / 180;

  // Haversine formula
  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1Rad) *
      Math.cos(lat2Rad) *
      Math.sin(deltaLon / 2) *
      Math.sin(deltaLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const miles = R * c;

  return {
    miles: Math.round(miles * 10) / 10, // Round to 1 decimal
    kilometers: Math.round(miles * 1.60934 * 10) / 10,
    method: 'haversine',
  };
}

/**
 * Calculate distance between multiple points and return the closest
 *
 * Useful for finding the nearest worker to a job location.
 */
export function findClosestPoint(
  target: Coordinates,
  points: Array<Coordinates & { id: string; name?: string }>
): Array<{ id: string; name?: string; distance: DistanceResult }> {
  return points
    .map((point) => ({
      id: point.id,
      name: point.name,
      distance: calculateHaversineDistance(target, point),
    }))
    .sort((a, b) => a.distance.miles - b.distance.miles);
}

/**
 * Check if a point is within a certain radius of a target
 */
export function isWithinRadius(
  point1: Coordinates,
  point2: Coordinates,
  radiusMiles: number
): boolean {
  const distance = calculateHaversineDistance(point1, point2);
  return distance.miles <= radiusMiles;
}

/**
 * Calculate total distance for a route (sum of distances between consecutive points)
 */
export function calculateRouteDistance(points: Coordinates[]): DistanceResult {
  if (points.length < 2) {
    return { miles: 0, kilometers: 0, method: 'haversine' };
  }

  let totalMiles = 0;

  for (let i = 0; i < points.length - 1; i++) {
    const segment = calculateHaversineDistance(points[i], points[i + 1]);
    totalMiles += segment.miles;
  }

  return {
    miles: Math.round(totalMiles * 10) / 10,
    kilometers: Math.round(totalMiles * 1.60934 * 10) / 10,
    method: 'haversine',
  };
}

/**
 * Future: Google Maps Distance Matrix API integration
 *
 * This would provide actual driving distance and time, accounting for:
 * - Road networks
 * - Traffic conditions
 * - One-way streets
 * - Turn restrictions
 *
 * Implementation notes:
 * - Requires Google Maps API key
 * - Has rate limits and costs
 * - Should be used sparingly, cached aggressively
 * - Fallback to Haversine if API fails
 */
export async function calculateDrivingDistance(
  point1: Coordinates,
  point2: Coordinates,
  useGoogleMaps: boolean = false
): Promise<DistanceResult> {
  // For now, always use Haversine
  // TODO: Implement Google Maps Distance Matrix API when needed
  if (useGoogleMaps) {
    console.warn(
      'Google Maps API not yet implemented, falling back to Haversine'
    );
  }

  return calculateHaversineDistance(point1, point2);
}
