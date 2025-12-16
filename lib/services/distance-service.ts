/**
 * Distance Service
 *
 * Provides distance calculations between coordinates using:
 * - Haversine formula (straight-line distance)
 * - Google Distance Matrix API (actual driving distance/time)
 */

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface DistanceResult {
  miles: number;
  kilometers: number;
  durationMinutes?: number;
  method: 'haversine' | 'google_maps';
}

export interface DrivingDistanceResult extends DistanceResult {
  durationMinutes: number;
  durationInTrafficMinutes?: number;
}

export interface TrafficAwareResult {
  durationMinutes: number;
  durationInTrafficMinutes: number;
  trafficDelayMinutes: number;
  miles: number;
}

// Simple in-memory cache for distance results
const distanceCache = new Map<string, { result: DrivingDistanceResult; timestamp: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Traffic-aware cache (shorter TTL since traffic changes)
const trafficCache = new Map<string, { result: TrafficAwareResult; timestamp: number }>();
const TRAFFIC_CACHE_TTL = 15 * 60 * 1000; // 15 minutes

function getCacheKey(point1: Coordinates, point2: Coordinates): string {
  return `${point1.latitude},${point1.longitude}->${point2.latitude},${point2.longitude}`;
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
 * Google Distance Matrix API - get actual driving distance and time
 *
 * Uses caching to minimize API costs (billed per element)
 * Falls back to Haversine if API fails
 */
export async function calculateDrivingDistance(
  point1: Coordinates,
  point2: Coordinates,
  useGoogleMaps: boolean = true
): Promise<DrivingDistanceResult> {
  const apiKey = process.env.GOOGLE_MAPS_API || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  // Fall back to Haversine if no API key or not requested
  if (!useGoogleMaps || !apiKey) {
    const haversine = calculateHaversineDistance(point1, point2);
    // Estimate drive time: assume 30 mph average
    const estimatedMinutes = Math.ceil(haversine.miles / 30 * 60);
    return {
      ...haversine,
      durationMinutes: estimatedMinutes,
    };
  }

  // Check cache first
  const cacheKey = getCacheKey(point1, point2);
  const cached = distanceCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.result;
  }

  try {
    const origin = `${point1.latitude},${point1.longitude}`;
    const destination = `${point2.latitude},${point2.longitude}`;

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/distancematrix/json?` +
      `origins=${origin}&destinations=${destination}&units=imperial&key=${apiKey}`
    );

    const data = await response.json();

    if (data.status === 'OK' && data.rows?.[0]?.elements?.[0]?.status === 'OK') {
      const element = data.rows[0].elements[0];

      // Distance is in meters, convert to miles
      const meters = element.distance.value;
      const miles = meters / 1609.34;

      // Duration is in seconds, convert to minutes
      const seconds = element.duration.value;
      const minutes = Math.ceil(seconds / 60);

      const result: DrivingDistanceResult = {
        miles: Math.round(miles * 10) / 10,
        kilometers: Math.round(meters / 1000 * 10) / 10,
        durationMinutes: minutes,
        method: 'google_maps',
      };

      // Cache the result
      distanceCache.set(cacheKey, { result, timestamp: Date.now() });

      return result;
    }

    // API returned error, fall back to Haversine
    console.warn(`Distance Matrix API error: ${data.status}`, data.error_message);
  } catch (error) {
    console.error('Distance Matrix API request failed:', error);
  }

  // Fallback to Haversine
  const haversine = calculateHaversineDistance(point1, point2);
  const estimatedMinutes = Math.ceil(haversine.miles / 30 * 60);
  return {
    ...haversine,
    durationMinutes: estimatedMinutes,
  };
}

/**
 * Calculate driving distances for multiple origin-destination pairs in batch
 * More efficient than individual calls (Google bills per element)
 *
 * Max 25 origins x 25 destinations = 625 elements per request
 */
export async function calculateDrivingDistanceBatch(
  origins: Coordinates[],
  destinations: Coordinates[]
): Promise<Map<string, DrivingDistanceResult>> {
  const results = new Map<string, DrivingDistanceResult>();
  const apiKey = process.env.GOOGLE_MAPS_API || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey || origins.length === 0 || destinations.length === 0) {
    // Return Haversine estimates for all pairs
    for (const origin of origins) {
      for (const dest of destinations) {
        const key = getCacheKey(origin, dest);
        const haversine = calculateHaversineDistance(origin, dest);
        results.set(key, {
          ...haversine,
          durationMinutes: Math.ceil(haversine.miles / 30 * 60),
        });
      }
    }
    return results;
  }

  // Check cache for already-known distances
  const uncachedOrigins: Coordinates[] = [];
  const uncachedDestinations: Coordinates[] = [];

  for (const origin of origins) {
    for (const dest of destinations) {
      const key = getCacheKey(origin, dest);
      const cached = distanceCache.get(key);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        results.set(key, cached.result);
      } else {
        if (!uncachedOrigins.find(o => o.latitude === origin.latitude && o.longitude === origin.longitude)) {
          uncachedOrigins.push(origin);
        }
        if (!uncachedDestinations.find(d => d.latitude === dest.latitude && d.longitude === dest.longitude)) {
          uncachedDestinations.push(dest);
        }
      }
    }
  }

  // If nothing to fetch, return cached results
  if (uncachedOrigins.length === 0 || uncachedDestinations.length === 0) {
    return results;
  }

  try {
    // Batch origins and destinations (max 25 each)
    const batchSize = 25;

    for (let i = 0; i < uncachedOrigins.length; i += batchSize) {
      const originBatch = uncachedOrigins.slice(i, i + batchSize);

      for (let j = 0; j < uncachedDestinations.length; j += batchSize) {
        const destBatch = uncachedDestinations.slice(j, j + batchSize);

        const originsStr = originBatch.map(o => `${o.latitude},${o.longitude}`).join('|');
        const destStr = destBatch.map(d => `${d.latitude},${d.longitude}`).join('|');

        const response = await fetch(
          `https://maps.googleapis.com/maps/api/distancematrix/json?` +
          `origins=${originsStr}&destinations=${destStr}&units=imperial&key=${apiKey}`
        );

        const data = await response.json();

        if (data.status === 'OK') {
          for (let oi = 0; oi < originBatch.length; oi++) {
            for (let di = 0; di < destBatch.length; di++) {
              const element = data.rows[oi]?.elements[di];
              const key = getCacheKey(originBatch[oi], destBatch[di]);

              if (element?.status === 'OK') {
                const meters = element.distance.value;
                const miles = meters / 1609.34;
                const seconds = element.duration.value;
                const minutes = Math.ceil(seconds / 60);

                const result: DrivingDistanceResult = {
                  miles: Math.round(miles * 10) / 10,
                  kilometers: Math.round(meters / 1000 * 10) / 10,
                  durationMinutes: minutes,
                  method: 'google_maps',
                };

                results.set(key, result);
                distanceCache.set(key, { result, timestamp: Date.now() });
              } else {
                // Fallback for this pair
                const haversine = calculateHaversineDistance(originBatch[oi], destBatch[di]);
                results.set(key, {
                  ...haversine,
                  durationMinutes: Math.ceil(haversine.miles / 30 * 60),
                });
              }
            }
          }
        }

        // Small delay between batches to avoid rate limiting
        if (j + batchSize < uncachedDestinations.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      if (i + batchSize < uncachedOrigins.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  } catch (error) {
    console.error('Batch Distance Matrix API request failed:', error);

    // Fill in missing results with Haversine
    for (const origin of origins) {
      for (const dest of destinations) {
        const key = getCacheKey(origin, dest);
        if (!results.has(key)) {
          const haversine = calculateHaversineDistance(origin, dest);
          results.set(key, {
            ...haversine,
            durationMinutes: Math.ceil(haversine.miles / 30 * 60),
          });
        }
      }
    }
  }

  return results;
}

/**
 * Estimate travel time between two points
 * Returns minutes
 */
export async function estimateTravelTime(
  point1: Coordinates,
  point2: Coordinates,
  useGoogleMaps: boolean = true
): Promise<number> {
  const result = await calculateDrivingDistance(point1, point2, useGoogleMaps);
  return result.durationMinutes;
}

/**
 * Clear the distance cache (useful for testing)
 */
export function clearDistanceCache(): void {
  distanceCache.clear();
  trafficCache.clear();
}

/**
 * Get driving time with real-time or predicted traffic
 *
 * Uses Google Distance Matrix API with departure_time parameter:
 * - For current time: uses live traffic data
 * - For future times: uses "best_guess" traffic model based on historical data
 *
 * @param origin Starting point
 * @param destination End point
 * @param departureTime When the trip will start (default: now)
 */
export async function getDrivingTimeWithTraffic(
  origin: Coordinates,
  destination: Coordinates,
  departureTime?: Date
): Promise<TrafficAwareResult> {
  const apiKey = process.env.GOOGLE_MAPS_API || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  // Default to now if no departure time specified
  const departure = departureTime || new Date();
  const departureTimestamp = Math.floor(departure.getTime() / 1000);

  // Check if departure is in the past (more than 1 min ago)
  const now = Math.floor(Date.now() / 1000);
  const isCurrentTime = departureTimestamp <= now + 60;

  // Cache key includes departure time (rounded to 15 min intervals for efficiency)
  const timeSlot = Math.floor(departureTimestamp / (15 * 60)) * (15 * 60);
  const trafficCacheKey = `${getCacheKey(origin, destination)}@${timeSlot}`;

  // Check traffic cache
  const cached = trafficCache.get(trafficCacheKey);
  if (cached && Date.now() - cached.timestamp < TRAFFIC_CACHE_TTL) {
    return cached.result;
  }

  // Fall back to Haversine estimate if no API key
  if (!apiKey) {
    const haversine = calculateHaversineDistance(origin, destination);
    const estimatedMinutes = Math.ceil(haversine.miles / 30 * 60);
    return {
      durationMinutes: estimatedMinutes,
      durationInTrafficMinutes: estimatedMinutes,
      trafficDelayMinutes: 0,
      miles: haversine.miles,
    };
  }

  try {
    const originStr = `${origin.latitude},${origin.longitude}`;
    const destStr = `${destination.latitude},${destination.longitude}`;

    // Build URL with traffic parameters
    let url = `https://maps.googleapis.com/maps/api/distancematrix/json?` +
      `origins=${originStr}&destinations=${destStr}&units=imperial&key=${apiKey}`;

    if (isCurrentTime) {
      // Use "now" for live traffic
      url += `&departure_time=now`;
    } else {
      // Use specific departure time for future traffic prediction
      url += `&departure_time=${departureTimestamp}&traffic_model=best_guess`;
    }

    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK' && data.rows?.[0]?.elements?.[0]?.status === 'OK') {
      const element = data.rows[0].elements[0];

      // Distance in meters -> miles
      const meters = element.distance.value;
      const miles = meters / 1609.34;

      // Duration without traffic (in seconds -> minutes)
      const durationSeconds = element.duration.value;
      const durationMinutes = Math.ceil(durationSeconds / 60);

      // Duration in traffic (if available)
      const durationInTrafficSeconds = element.duration_in_traffic?.value || durationSeconds;
      const durationInTrafficMinutes = Math.ceil(durationInTrafficSeconds / 60);

      const result: TrafficAwareResult = {
        durationMinutes,
        durationInTrafficMinutes,
        trafficDelayMinutes: Math.max(0, durationInTrafficMinutes - durationMinutes),
        miles: Math.round(miles * 10) / 10,
      };

      // Cache the result
      trafficCache.set(trafficCacheKey, { result, timestamp: Date.now() });

      return result;
    }

    console.warn(`Traffic API error: ${data.status}`, data.error_message);
  } catch (error) {
    console.error('Traffic API request failed:', error);
  }

  // Fallback to Haversine
  const haversine = calculateHaversineDistance(origin, destination);
  const estimatedMinutes = Math.ceil(haversine.miles / 30 * 60);
  return {
    durationMinutes: estimatedMinutes,
    durationInTrafficMinutes: estimatedMinutes,
    trafficDelayMinutes: 0,
    miles: haversine.miles,
  };
}

/**
 * Get traffic-aware driving times for multiple segments in batch
 * Useful for calculating a full route with traffic
 */
export async function getDrivingTimesWithTrafficBatch(
  segments: Array<{ origin: Coordinates; destination: Coordinates; departureTime: Date }>,
): Promise<TrafficAwareResult[]> {
  // Process in parallel but with some rate limiting
  const results: TrafficAwareResult[] = [];
  const batchSize = 10;

  for (let i = 0; i < segments.length; i += batchSize) {
    const batch = segments.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(seg => getDrivingTimeWithTraffic(seg.origin, seg.destination, seg.departureTime))
    );
    results.push(...batchResults);

    // Small delay between batches
    if (i + batchSize < segments.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return results;
}

/**
 * Calculate total route time with traffic for a sequence of stops
 * Returns cumulative ETAs for each stop
 */
export async function calculateRouteWithTraffic(
  stops: Coordinates[],
  startTime: Date
): Promise<Array<{ eta: Date; travelMinutes: number; trafficDelayMinutes: number }>> {
  if (stops.length < 2) {
    return [];
  }

  const results: Array<{ eta: Date; travelMinutes: number; trafficDelayMinutes: number }> = [];
  let currentTime = new Date(startTime);

  for (let i = 0; i < stops.length - 1; i++) {
    const traffic = await getDrivingTimeWithTraffic(stops[i], stops[i + 1], currentTime);

    // ETA is current time + travel time with traffic
    const eta = new Date(currentTime.getTime() + traffic.durationInTrafficMinutes * 60 * 1000);

    results.push({
      eta,
      travelMinutes: traffic.durationInTrafficMinutes,
      trafficDelayMinutes: traffic.trafficDelayMinutes,
    });

    // Update current time for next segment (assuming arrival = next departure)
    currentTime = eta;
  }

  return results;
}
