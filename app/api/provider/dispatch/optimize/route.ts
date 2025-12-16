import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { startOfDay, endOfDay, parseISO, addMinutes, format } from 'date-fns';
import {
  calculateHaversineDistance,
  type Coordinates,
} from '@/lib/services/distance-service';

const WORKER_COLORS = [
  '#10b981', '#3b82f6', '#f59e0b', '#ef4444',
  '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16',
];

// Default work day start time (8 AM)
const DEFAULT_START_HOUR = 8;
const AVG_SPEED_MPH = 30; // Average driving speed

interface JobWithCoords {
  id: string;
  serviceType: string;
  startTime: Date;
  endTime: Date;
  appointmentType: string;
  estimatedDuration: number | null;
  lat: number;
  lng: number;
  customer: { name: string | null } | null;
}

interface ScheduledJob extends JobWithCoords {
  eta: Date;
  etaEnd: Date;
  travelTimeMinutes: number;
  isLate: boolean;
  lateByMinutes: number;
}

/**
 * Calculate total route distance for a list of jobs
 */
function calculateTotalRouteDistance(
  startPoint: Coordinates | null,
  jobs: JobWithCoords[]
): number {
  if (jobs.length === 0) return 0;

  let totalMiles = 0;

  // From start point to first job
  if (startPoint && jobs[0]) {
    const dist = calculateHaversineDistance(startPoint, {
      latitude: jobs[0].lat,
      longitude: jobs[0].lng,
    });
    totalMiles += dist.miles;
  }

  // Between consecutive jobs
  for (let i = 0; i < jobs.length - 1; i++) {
    const dist = calculateHaversineDistance(
      { latitude: jobs[i].lat, longitude: jobs[i].lng },
      { latitude: jobs[i + 1].lat, longitude: jobs[i + 1].lng }
    );
    totalMiles += dist.miles;
  }

  return totalMiles;
}

/**
 * Calculate travel time in minutes between two points
 */
function calculateTravelTime(from: Coordinates, to: Coordinates): number {
  const dist = calculateHaversineDistance(from, to);
  return Math.ceil(dist.miles / AVG_SPEED_MPH * 60);
}

/**
 * Calculate ETAs for each job in order, updating times to be chronological
 */
function calculateETAs(
  jobs: JobWithCoords[],
  startPoint: Coordinates | null,
  dayStart: Date
): ScheduledJob[] {
  const scheduled: ScheduledJob[] = [];

  // Start time: 8 AM on the given day
  let currentTime = new Date(dayStart);
  currentTime.setHours(DEFAULT_START_HOUR, 0, 0, 0);

  let currentLocation = startPoint;

  for (let i = 0; i < jobs.length; i++) {
    const job = jobs[i];
    let travelTimeMinutes = 0;

    // Calculate travel time from current location to this job
    if (currentLocation) {
      travelTimeMinutes = calculateTravelTime(currentLocation, {
        latitude: job.lat,
        longitude: job.lng,
      });
    }

    // Calculate ETA
    const eta = addMinutes(currentTime, travelTimeMinutes);

    // Job duration in minutes (estimatedDuration is in hours)
    const durationMinutes = (job.estimatedDuration || 1) * 60;
    const etaEnd = addMinutes(eta, durationMinutes);

    // Check if this job has a fixed/window time and we'd be late
    const scheduledTime = new Date(job.startTime);
    let isLate = false;
    let lateByMinutes = 0;

    if (job.appointmentType === 'fixed' || job.appointmentType === 'window') {
      // For fixed/window appointments, check if ETA is after scheduled time
      const diff = Math.round((eta.getTime() - scheduledTime.getTime()) / 60000);
      if (diff > 15) { // Allow 15 min grace period
        isLate = true;
        lateByMinutes = diff;
      }
    }

    scheduled.push({
      ...job,
      eta,
      etaEnd,
      travelTimeMinutes,
      isLate,
      lateByMinutes,
    });

    // Update current time and location for next iteration
    currentTime = etaEnd;
    currentLocation = { latitude: job.lat, longitude: job.lng };
  }

  return scheduled;
}

/**
 * Optimizes routes for workers using a hybrid approach:
 * - Respects fixed appointment times (appointmentType === 'fixed')
 * - Respects time windows (appointmentType === 'window')
 * - Uses nearest-neighbor for flexible jobs (appointmentType === 'anytime')
 * - Starts from worker's home or office location
 * - Calculates and updates ETAs to ensure chronological order
 */
export async function POST(req: Request) {
  try {
    const { date, workerIds, providerId } = await req.json();

    if (!providerId) {
      return NextResponse.json({ error: 'Provider ID required' }, { status: 400 });
    }

    const dateObj = parseISO(date);

    // Get provider for office location
    const provider = await prisma.provider.findUnique({
      where: { id: providerId },
      select: {
        officeLatitude: true,
        officeLongitude: true,
        businessAddress: true,
      },
    });

    const workerResults = [];
    let totalSavedMiles = 0;
    let totalSavedMinutes = 0;

    // Get workers with their home locations
    const workers = await prisma.providerUser.findMany({
      where: workerIds?.length > 0
        ? { id: { in: workerIds }, providerId }
        : { providerId, role: 'field', status: 'active' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        homeLatitude: true,
        homeLongitude: true,
      },
    });

    console.log('[Optimize API] Workers found:', workers.length, workers.map(w => w.firstName));

    for (let i = 0; i < workers.length; i++) {
      const worker = workers[i];
      const workerName = `${worker.firstName} ${worker.lastName}`;

      // Determine start location: worker home > office > null
      const startPoint: Coordinates | null =
        worker.homeLatitude && worker.homeLongitude
          ? { latitude: worker.homeLatitude, longitude: worker.homeLongitude }
          : provider?.officeLatitude && provider?.officeLongitude
            ? { latitude: provider.officeLatitude, longitude: provider.officeLongitude }
            : null;

      const jobs = await prisma.job.findMany({
        where: {
          providerId,
          assignedUserIds: { has: worker.id },
          startTime: {
            gte: startOfDay(dateObj),
            lt: endOfDay(dateObj),
          },
          status: { notIn: ['cancelled'] },
        },
        include: {
          customer: {
            select: { name: true, latitude: true, longitude: true, address: true },
          },
        },
        orderBy: { startTime: 'asc' },
      });

      // Skip if less than 2 jobs
      if (jobs.length < 2) {
        workerResults.push({
          name: workerName,
          color: WORKER_COLORS[i % WORKER_COLORS.length],
          jobCount: jobs.length,
          beforeMiles: 0,
          afterMiles: 0,
          savedMiles: 0,
          savedMinutes: 0,
          reorderedJobs: [],
          conflicts: [],
        });
        continue;
      }

      // Get jobs with coordinates
      const jobsWithCoords: JobWithCoords[] = jobs
        .map(j => ({
          id: j.id,
          serviceType: j.serviceType,
          startTime: j.startTime,
          endTime: j.endTime,
          appointmentType: j.appointmentType,
          estimatedDuration: j.estimatedDuration,
          lat: j.latitude || j.customer?.latitude || 0,
          lng: j.longitude || j.customer?.longitude || 0,
          customer: j.customer,
        }))
        .filter(j => j.lat !== 0 && j.lng !== 0);

      if (jobsWithCoords.length < 2) {
        workerResults.push({
          name: workerName,
          color: WORKER_COLORS[i % WORKER_COLORS.length],
          jobCount: jobs.length,
          beforeMiles: 0,
          afterMiles: 0,
          savedMiles: 0,
          savedMinutes: 0,
          reorderedJobs: [],
          conflicts: [],
        });
        continue;
      }

      // Calculate BEFORE distance (current order)
      const beforeMiles = calculateTotalRouteDistance(startPoint, jobsWithCoords);

      // Store original order for comparison
      const originalOrder = jobsWithCoords.map(j => j.id);

      // Separate jobs by type
      const fixedJobs = jobsWithCoords.filter(j => j.appointmentType === 'fixed');
      const windowJobs = jobsWithCoords.filter(j => j.appointmentType === 'window');
      const flexibleJobs = jobsWithCoords.filter(j => j.appointmentType === 'anytime' || !j.appointmentType);

      // Build optimized schedule
      let optimizedJobs: JobWithCoords[] = [];

      if (fixedJobs.length > 0 || windowJobs.length > 0) {
        // Mixed schedule: fixed/window jobs are anchor points, flexible jobs fill gaps

        // Sort fixed/window jobs by their scheduled time
        const anchorJobs = [...fixedJobs, ...windowJobs].sort(
          (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
        );

        // Use nearest-neighbor to insert flexible jobs optimally around anchor points
        const remainingFlexible = [...flexibleJobs];
        let currentLocation = startPoint;
        const finalSchedule: JobWithCoords[] = [];

        // Process each anchor job
        for (let anchorIdx = 0; anchorIdx < anchorJobs.length; anchorIdx++) {
          const anchorJob = anchorJobs[anchorIdx];
          const anchorTime = new Date(anchorJob.startTime).getTime();

          // Try to fit flexible jobs before this anchor
          // Estimate current time based on where we are in the schedule
          let currentTimeEstimate = finalSchedule.length > 0
            ? new Date(finalSchedule[finalSchedule.length - 1].endTime).getTime()
            : startOfDay(dateObj).getTime() + DEFAULT_START_HOUR * 60 * 60 * 1000;

          while (remainingFlexible.length > 0 && currentLocation) {
            // Find nearest flexible job to current location
            let nearestIdx = 0;
            let nearestDist = Infinity;

            for (let f = 0; f < remainingFlexible.length; f++) {
              const dist = calculateHaversineDistance(currentLocation, {
                latitude: remainingFlexible[f].lat,
                longitude: remainingFlexible[f].lng,
              });
              if (dist.miles < nearestDist) {
                nearestDist = dist.miles;
                nearestIdx = f;
              }
            }

            // Estimate time needed for this flexible job
            const travelTime = Math.ceil(nearestDist / AVG_SPEED_MPH * 60);
            const jobDuration = (remainingFlexible[nearestIdx].estimatedDuration || 1) * 60;
            const neededTime = currentTimeEstimate + (travelTime + jobDuration) * 60 * 1000;

            // Check if we can fit this job before the anchor
            if (neededTime <= anchorTime - 15 * 60 * 1000) { // 15 min buffer
              const flexJob = remainingFlexible.splice(nearestIdx, 1)[0];
              finalSchedule.push(flexJob);
              currentLocation = { latitude: flexJob.lat, longitude: flexJob.lng };
              currentTimeEstimate = neededTime;
            } else {
              break; // No more flexible jobs fit before this anchor
            }
          }

          // Add the anchor job
          finalSchedule.push(anchorJob);
          currentLocation = { latitude: anchorJob.lat, longitude: anchorJob.lng };
        }

        // Add remaining flexible jobs after all anchors (in optimal order)
        while (remainingFlexible.length > 0 && currentLocation) {
          let nearestIdx = 0;
          let nearestDist = Infinity;

          for (let f = 0; f < remainingFlexible.length; f++) {
            const dist = calculateHaversineDistance(currentLocation, {
              latitude: remainingFlexible[f].lat,
              longitude: remainingFlexible[f].lng,
            });
            if (dist.miles < nearestDist) {
              nearestDist = dist.miles;
              nearestIdx = f;
            }
          }

          const flexJob = remainingFlexible.splice(nearestIdx, 1)[0];
          finalSchedule.push(flexJob);
          currentLocation = { latitude: flexJob.lat, longitude: flexJob.lng };
        }

        optimizedJobs = finalSchedule;
      } else {
        // All flexible - pure nearest-neighbor optimization from start location
        let currentLocation = startPoint || (jobsWithCoords.length > 0 ? {
          latitude: jobsWithCoords[0].lat,
          longitude: jobsWithCoords[0].lng,
        } : null);

        const remaining = [...flexibleJobs];

        while (remaining.length > 0 && currentLocation) {
          let nearestIdx = 0;
          let nearestDist = Infinity;

          for (let r = 0; r < remaining.length; r++) {
            const dist = calculateHaversineDistance(currentLocation, {
              latitude: remaining[r].lat,
              longitude: remaining[r].lng,
            });
            if (dist.miles < nearestDist) {
              nearestDist = dist.miles;
              nearestIdx = r;
            }
          }

          const nearestJob = remaining.splice(nearestIdx, 1)[0];
          optimizedJobs.push(nearestJob);
          currentLocation = { latitude: nearestJob.lat, longitude: nearestJob.lng };
        }
      }

      // Calculate AFTER distance
      const afterMiles = calculateTotalRouteDistance(startPoint, optimizedJobs);

      // Calculate ETAs for the optimized route
      const scheduledJobs = calculateETAs(optimizedJobs, startPoint, dateObj);

      // Build reordered jobs list for UI with new ETAs
      const optimizedOrder = optimizedJobs.map(j => j.id);
      const reorderedJobs = [];
      const conflicts = [];

      for (let o = 0; o < scheduledJobs.length; o++) {
        const scheduledJob = scheduledJobs[o];
        const oldIdx = originalOrder.indexOf(scheduledJob.id);

        // Check for conflicts (late to fixed/window appointments)
        if (scheduledJob.isLate) {
          conflicts.push({
            service: scheduledJob.serviceType,
            customer: scheduledJob.customer?.name || 'Unknown',
            scheduledTime: format(new Date(scheduledJob.startTime), 'h:mm a'),
            eta: format(scheduledJob.eta, 'h:mm a'),
            lateByMinutes: scheduledJob.lateByMinutes,
          });
        }

        if (oldIdx !== o) {
          reorderedJobs.push({
            service: scheduledJob.serviceType,
            customer: scheduledJob.customer?.name || 'Unknown',
            oldOrder: oldIdx + 1,
            newOrder: o + 1,
            oldTime: format(new Date(scheduledJob.startTime), 'h:mm a'),
            newTime: format(scheduledJob.eta, 'h:mm a'),
          });
        }
      }

      // Update database with new route order AND new start times
      for (let o = 0; o < scheduledJobs.length; o++) {
        const scheduledJob = scheduledJobs[o];

        // Calculate new end time based on ETA and duration
        const durationMinutes = (scheduledJob.estimatedDuration || 1) * 60;
        const newEndTime = addMinutes(scheduledJob.eta, durationMinutes);

        await prisma.job.update({
          where: { id: scheduledJob.id },
          data: {
            routeOrder: o + 1,
            // Only update times for flexible/anytime jobs
            // Keep fixed/window appointment times intact
            ...(scheduledJob.appointmentType !== 'fixed' && scheduledJob.appointmentType !== 'window' ? {
              startTime: scheduledJob.eta,
              endTime: newEndTime,
            } : {}),
          },
        });
      }

      // Calculate actual savings
      const savedMiles = Math.max(0, beforeMiles - afterMiles);
      const savedMinutes = Math.round(savedMiles / AVG_SPEED_MPH * 60 + reorderedJobs.length * 2);

      totalSavedMiles += savedMiles;
      totalSavedMinutes += savedMinutes;

      workerResults.push({
        name: workerName,
        color: WORKER_COLORS[i % WORKER_COLORS.length],
        jobCount: jobs.length,
        beforeMiles: Math.round(beforeMiles * 10) / 10,
        afterMiles: Math.round(afterMiles * 10) / 10,
        savedMiles: Math.round(savedMiles * 10) / 10,
        savedMinutes,
        reorderedJobs,
        conflicts,
      });
    }

    return NextResponse.json({
      success: true,
      workerResults,
      totalSavedMiles: Math.round(totalSavedMiles * 10) / 10,
      totalSavedMinutes,
    });
  } catch (error) {
    console.error('[Optimize API] Error:', error);
    return NextResponse.json({ error: 'Failed to optimize routes' }, { status: 500 });
  }
}
