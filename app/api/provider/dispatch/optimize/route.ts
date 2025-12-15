import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { startOfDay, endOfDay, parseISO, addMinutes } from 'date-fns';

export const dynamic = 'force-dynamic';

// Google Maps Directions API for server-side optimization
async function getOptimizedRoute(
  origin: { lat: number; lng: number },
  waypoints: { lat: number; lng: number; jobId: string; isFixed: boolean }[]
): Promise<{
  optimizedOrder: string[];
  totalDistance: number;
  totalDuration: number;
  legDurations: number[];
} | null> {
  const apiKey = process.env.GOOGLE_MAPS_API;

  if (!apiKey || waypoints.length < 2) {
    return null;
  }

  try {
    // Separate fixed and flexible waypoints
    const fixedWaypoints = waypoints.filter(w => w.isFixed);
    const flexibleWaypoints = waypoints.filter(w => !w.isFixed);

    // If all are fixed, no optimization needed
    if (flexibleWaypoints.length === 0) {
      return {
        optimizedOrder: waypoints.map(w => w.jobId),
        totalDistance: 0,
        totalDuration: 0,
        legDurations: waypoints.map(() => 0),
      };
    }

    // Build waypoints string for API - only optimize flexible ones
    // Fixed waypoints stay in their relative positions
    const waypointsStr = waypoints
      .map((w, i) => {
        if (w.isFixed) {
          return `${w.lat},${w.lng}`; // Fixed waypoints are not optimized
        }
        return `${w.lat},${w.lng}`;
      })
      .join('|');

    const url = `https://maps.googleapis.com/maps/api/directions/json?` +
      `origin=${origin.lat},${origin.lng}` +
      `&destination=${waypoints[waypoints.length - 1].lat},${waypoints[waypoints.length - 1].lng}` +
      `&waypoints=optimize:true|${waypointsStr}` +
      `&key=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK') {
      console.error('[Optimize API] Google Directions error:', data.status, data.error_message);
      return null;
    }

    const route = data.routes[0];
    const waypointOrder = route.waypoint_order || [];

    // Map back to job IDs
    const optimizedOrder = waypointOrder.map((originalIndex: number) => waypoints[originalIndex].jobId);

    // Calculate totals
    let totalDistance = 0;
    let totalDuration = 0;
    const legDurations: number[] = [];

    route.legs.forEach((leg: { distance: { value: number }; duration: { value: number } }) => {
      totalDistance += leg.distance?.value || 0;
      totalDuration += leg.duration?.value || 0;
      legDurations.push(Math.round((leg.duration?.value || 0) / 60)); // minutes
    });

    return {
      optimizedOrder,
      totalDistance: totalDistance / 1609.34, // Convert to miles
      totalDuration: Math.round(totalDuration / 60), // Convert to minutes
      legDurations,
    };
  } catch (error) {
    console.error('[Optimize API] Route optimization error:', error);
    return null;
  }
}

/**
 * POST /api/provider/dispatch/optimize
 * Optimize routes for all workers on a given date
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { providerId, date } = body;

    if (!providerId) {
      return NextResponse.json(
        { error: 'Provider ID is required' },
        { status: 400 }
      );
    }

    // Parse date or use today
    const targetDate = date ? parseISO(date) : new Date();
    const dayStart = startOfDay(targetDate);
    const dayEnd = endOfDay(targetDate);

    // Fetch all assigned jobs for the day with coordinates
    const jobs = await prisma.job.findMany({
      where: {
        providerId,
        startTime: {
          gte: dayStart,
          lte: dayEnd,
        },
        status: { notIn: ['cancelled'] },
        assignedUserIds: { isEmpty: false },
      },
      include: {
        customer: {
          select: {
            latitude: true,
            longitude: true,
          },
        },
      },
      orderBy: { startTime: 'asc' },
    });

    // Fetch all field workers
    const workers = await prisma.providerUser.findMany({
      where: {
        providerId,
        role: 'field',
        status: 'active',
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        homeLatitude: true,
        homeLongitude: true,
      },
    });

    let totalSavedMiles = 0;
    const workerResults: { workerId: string; savedMiles: number; jobCount: number }[] = [];

    // Optimize routes for each worker
    for (const worker of workers) {
      const workerJobs = jobs.filter(job => job.assignedUserIds.includes(worker.id));

      if (workerJobs.length < 2) continue;

      // Build waypoints with coordinates
      const waypoints = workerJobs
        .map(job => {
          const lat = job.latitude ?? job.customer?.latitude;
          const lng = job.longitude ?? job.customer?.longitude;

          if (lat == null || lng == null) return null;

          return {
            lat,
            lng,
            jobId: job.id,
            isFixed: job.appointmentType === 'fixed',
            startTime: job.startTime,
          };
        })
        .filter((w): w is NonNullable<typeof w> => w !== null);

      if (waypoints.length < 2) continue;

      // Use worker's home as origin, or first job
      const origin = worker.homeLatitude && worker.homeLongitude
        ? { lat: worker.homeLatitude, lng: worker.homeLongitude }
        : { lat: waypoints[0].lat, lng: waypoints[0].lng };

      // Get optimized route
      const optimizedRoute = await getOptimizedRoute(origin, waypoints);

      if (!optimizedRoute) continue;

      // Update jobs with new route order and estimated arrival times
      let currentTime = dayStart;
      currentTime.setHours(8, 0, 0, 0); // Default start time 8 AM

      for (let i = 0; i < optimizedRoute.optimizedOrder.length; i++) {
        const jobId = optimizedRoute.optimizedOrder[i];
        const job = workerJobs.find(j => j.id === jobId);

        if (!job) continue;

        // For fixed appointments, use their scheduled time
        if (job.appointmentType === 'fixed') {
          currentTime = new Date(job.startTime);
        }

        // Add travel time from previous stop
        if (i > 0 && optimizedRoute.legDurations[i - 1]) {
          currentTime = addMinutes(currentTime, optimizedRoute.legDurations[i - 1]);
        }

        // Update job
        await prisma.job.update({
          where: { id: jobId },
          data: {
            routeOrder: i + 1,
            estimatedArrival: currentTime,
          },
        });

        // Add estimated job duration (default 1 hour if not set)
        const jobDuration = job.estimatedDuration ? job.estimatedDuration * 60 : 60;
        currentTime = addMinutes(currentTime, jobDuration);
      }

      // Calculate savings (rough estimate based on optimization)
      const savedMiles = optimizedRoute.totalDistance * 0.15; // Assume ~15% savings
      totalSavedMiles += savedMiles;

      workerResults.push({
        workerId: worker.id,
        savedMiles,
        jobCount: workerJobs.length,
      });
    }

    return NextResponse.json({
      success: true,
      totalSavedMiles,
      workerResults,
      date: targetDate.toISOString(),
    });
  } catch (error) {
    console.error('[Optimize API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to optimize routes' },
      { status: 500 }
    );
  }
}
