import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { startOfDay, endOfDay, parseISO, addMinutes, format } from 'date-fns';
import {
  calculateHaversineDistance,
  getDrivingTimeWithTraffic,
  type Coordinates,
} from '@/lib/services/distance-service';

const AVG_SPEED_MPH = 30;
const DEFAULT_START_HOUR = 8;

interface JobWithCoords {
  id: string;
  serviceType: string;
  startTime: Date;
  endTime: Date;
  appointmentType: string;
  durationMinutes: number | null;
  lat: number;
  lng: number;
  status: string;
  customer: { name: string | null } | null;
}

interface ScheduledJob extends JobWithCoords {
  eta: Date;
  etaEnd: Date;
  travelTimeMinutes: number;
  trafficDelayMinutes: number;
  isLate: boolean;
  lateByMinutes: number;
}

/**
 * Calculate travel time in minutes between two points (fallback without traffic)
 */
function calculateTravelTime(from: Coordinates, to: Coordinates): number {
  const dist = calculateHaversineDistance(from, to);
  return Math.ceil(dist.miles / AVG_SPEED_MPH * 60);
}

/**
 * Calculate ETAs with traffic for each job in order
 */
async function calculateETAsWithTraffic(
  jobs: JobWithCoords[],
  startPoint: Coordinates | null,
  currentTime: Date,
  useTraffic: boolean = true
): Promise<ScheduledJob[]> {
  const scheduled: ScheduledJob[] = [];
  let runningTime = new Date(currentTime);
  let currentLocation = startPoint;

  for (let i = 0; i < jobs.length; i++) {
    const job = jobs[i];
    let travelTimeMinutes = 0;
    let trafficDelayMinutes = 0;

    // Calculate travel time from current location to this job
    if (currentLocation) {
      const destination: Coordinates = { latitude: job.lat, longitude: job.lng };

      if (useTraffic) {
        try {
          const trafficResult = await getDrivingTimeWithTraffic(
            currentLocation,
            destination,
            runningTime
          );
          travelTimeMinutes = trafficResult.durationInTrafficMinutes;
          trafficDelayMinutes = trafficResult.trafficDelayMinutes;
        } catch {
          // Fallback to simple calculation
          travelTimeMinutes = calculateTravelTime(currentLocation, destination);
        }
      } else {
        travelTimeMinutes = calculateTravelTime(currentLocation, destination);
      }
    }

    // Calculate ETA
    const eta = addMinutes(runningTime, travelTimeMinutes);

    // Job duration in minutes
    const durationMinutes = (job.durationMinutes || 1) * 60;
    const etaEnd = addMinutes(eta, durationMinutes);

    // Check if this job has a fixed/window time and we'd be late
    const scheduledTime = new Date(job.startTime);
    let isLate = false;
    let lateByMinutes = 0;

    if (job.appointmentType === 'fixed' || job.appointmentType === 'window') {
      const diff = Math.round((eta.getTime() - scheduledTime.getTime()) / 60000);
      if (diff > 15) {
        isLate = true;
        lateByMinutes = diff;
      }
    }

    scheduled.push({
      ...job,
      eta,
      etaEnd,
      travelTimeMinutes,
      trafficDelayMinutes,
      isLate,
      lateByMinutes,
    });

    // Update for next iteration
    runningTime = etaEnd;
    currentLocation = { latitude: job.lat, longitude: job.lng };
  }

  return scheduled;
}

/**
 * Re-optimize a worker's remaining route
 *
 * Triggered when:
 * - Job is completed (worker finishes early/late)
 * - New urgent job added mid-day
 * - Job cancelled
 * - Traffic significantly changes
 */
export async function POST(req: Request) {
  try {
    const {
      workerId,
      providerId,
      date,
      trigger, // 'job_completed' | 'job_added' | 'job_cancelled' | 'traffic_update' | 'manual'
      currentLocation, // Optional: worker's current GPS location
      useTraffic = true,
    } = await req.json();

    if (!providerId || !workerId) {
      return NextResponse.json(
        { error: 'Provider ID and Worker ID required' },
        { status: 400 }
      );
    }

    const dateObj = date ? parseISO(date) : new Date();

    // Get worker info
    const worker = await prisma.providerUser.findUnique({
      where: { id: workerId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        homeLatitude: true,
        homeLongitude: true,
      },
    });

    if (!worker) {
      return NextResponse.json({ error: 'Worker not found' }, { status: 404 });
    }

    // Get provider for office location
    const provider = await prisma.provider.findUnique({
      where: { id: providerId },
      select: {
        officeLatitude: true,
        officeLongitude: true,
      },
    });

    // Get worker's remaining jobs for today (not completed, not cancelled)
    const remainingJobs = await prisma.job.findMany({
      where: {
        providerId,
        assignedUserIds: { has: workerId },
        startTime: {
          gte: startOfDay(dateObj),
          lt: endOfDay(dateObj),
        },
        status: { notIn: ['completed', 'cancelled'] },
      },
      include: {
        customer: {
          select: { name: true, latitude: true, longitude: true },
        },
      },
      orderBy: { routeOrder: 'asc' },
    });

    if (remainingJobs.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No remaining jobs to optimize',
        jobCount: 0,
        changes: [],
      });
    }

    // Build jobs with coordinates
    const jobsWithCoords: JobWithCoords[] = remainingJobs
      .map(j => ({
        id: j.id,
        serviceType: j.serviceType,
        startTime: j.startTime,
        endTime: j.endTime,
        appointmentType: j.appointmentType,
        durationMinutes: j.durationMinutes,
        lat: j.latitude || j.customer?.latitude || 0,
        lng: j.longitude || j.customer?.longitude || 0,
        status: j.status,
        customer: j.customer,
      }))
      .filter(j => j.lat !== 0 && j.lng !== 0);

    // Determine current position
    let startPoint: Coordinates | null = null;

    if (currentLocation?.latitude && currentLocation?.longitude) {
      // Use provided GPS location
      startPoint = {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
      };
    } else if (worker.homeLatitude && worker.homeLongitude) {
      // Use worker's home
      startPoint = {
        latitude: worker.homeLatitude,
        longitude: worker.homeLongitude,
      };
    } else if (provider?.officeLatitude && provider?.officeLongitude) {
      // Use office
      startPoint = {
        latitude: provider.officeLatitude,
        longitude: provider.officeLongitude,
      };
    }

    // Current time for ETA calculation
    const now = new Date();

    // Store old ETAs for comparison
    const oldETAs = new Map<string, Date>();
    for (const job of jobsWithCoords) {
      oldETAs.set(job.id, job.startTime);
    }

    // Separate fixed/window jobs from flexible jobs
    const fixedJobs = jobsWithCoords.filter(
      j => j.appointmentType === 'fixed' || j.appointmentType === 'window'
    );
    const flexibleJobs = jobsWithCoords.filter(
      j => j.appointmentType === 'anytime' || !j.appointmentType
    );

    // Sort fixed jobs by their scheduled time
    fixedJobs.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    // Re-optimize: place flexible jobs around fixed jobs using nearest-neighbor
    const optimizedJobs: JobWithCoords[] = [];
    let currentPos = startPoint;
    const remainingFlexible = [...flexibleJobs];

    // Process fixed jobs as anchor points
    for (const fixed of fixedJobs) {
      // Insert nearby flexible jobs before this fixed appointment
      const fixedTime = new Date(fixed.startTime).getTime();

      while (remainingFlexible.length > 0 && currentPos) {
        // Find nearest flexible job
        let nearestIdx = 0;
        let nearestDist = Infinity;

        for (let f = 0; f < remainingFlexible.length; f++) {
          const dist = calculateHaversineDistance(currentPos, {
            latitude: remainingFlexible[f].lat,
            longitude: remainingFlexible[f].lng,
          });
          if (dist.miles < nearestDist) {
            nearestDist = dist.miles;
            nearestIdx = f;
          }
        }

        // Estimate if we can fit this job before the fixed appointment
        const travelTime = Math.ceil(nearestDist / AVG_SPEED_MPH * 60);
        const jobDuration = (remainingFlexible[nearestIdx].durationMinutes || 1) * 60;
        const currentTimeMs = optimizedJobs.length === 0
          ? now.getTime()
          : optimizedJobs[optimizedJobs.length - 1].endTime.getTime();
        const neededTime = currentTimeMs + (travelTime + jobDuration) * 60 * 1000;

        if (neededTime <= fixedTime - 15 * 60 * 1000) {
          const flexJob = remainingFlexible.splice(nearestIdx, 1)[0];
          optimizedJobs.push(flexJob);
          currentPos = { latitude: flexJob.lat, longitude: flexJob.lng };
        } else {
          break;
        }
      }

      // Add the fixed job
      optimizedJobs.push(fixed);
      currentPos = { latitude: fixed.lat, longitude: fixed.lng };
    }

    // Add remaining flexible jobs after all fixed jobs
    while (remainingFlexible.length > 0 && currentPos) {
      let nearestIdx = 0;
      let nearestDist = Infinity;

      for (let f = 0; f < remainingFlexible.length; f++) {
        const dist = calculateHaversineDistance(currentPos, {
          latitude: remainingFlexible[f].lat,
          longitude: remainingFlexible[f].lng,
        });
        if (dist.miles < nearestDist) {
          nearestDist = dist.miles;
          nearestIdx = f;
        }
      }

      const flexJob = remainingFlexible.splice(nearestIdx, 1)[0];
      optimizedJobs.push(flexJob);
      currentPos = { latitude: flexJob.lat, longitude: flexJob.lng };
    }

    // Calculate new ETAs with traffic
    const scheduledJobs = await calculateETAsWithTraffic(
      optimizedJobs,
      startPoint,
      now,
      useTraffic
    );

    // Track changes
    const changes: Array<{
      jobId: string;
      service: string;
      customer: string | null;
      oldETA: string;
      newETA: string;
      changeMinutes: number;
      isSignificant: boolean;
      trafficDelay: number;
    }> = [];

    const conflicts: Array<{
      jobId: string;
      service: string;
      customer: string | null;
      scheduledTime: string;
      eta: string;
      lateByMinutes: number;
    }> = [];

    // Update database and collect changes
    for (let i = 0; i < scheduledJobs.length; i++) {
      const sj = scheduledJobs[i];
      const oldETA = oldETAs.get(sj.id) || sj.startTime;
      const changeMinutes = Math.round((sj.eta.getTime() - oldETA.getTime()) / 60000);
      const isSignificant = Math.abs(changeMinutes) >= 10;

      if (isSignificant || sj.trafficDelayMinutes > 5) {
        changes.push({
          jobId: sj.id,
          service: sj.serviceType,
          customer: sj.customer?.name || null,
          oldETA: format(oldETA, 'h:mm a'),
          newETA: format(sj.eta, 'h:mm a'),
          changeMinutes,
          isSignificant,
          trafficDelay: sj.trafficDelayMinutes,
        });
      }

      if (sj.isLate) {
        conflicts.push({
          jobId: sj.id,
          service: sj.serviceType,
          customer: sj.customer?.name || null,
          scheduledTime: format(new Date(sj.startTime), 'h:mm a'),
          eta: format(sj.eta, 'h:mm a'),
          lateByMinutes: sj.lateByMinutes,
        });
      }

      // Update job in database
      const durationMinutes = (sj.durationMinutes || 1) * 60;
      const newEndTime = addMinutes(sj.eta, durationMinutes);

      await prisma.job.update({
        where: { id: sj.id },
        data: {
          routeOrder: i + 1,
          // Only update times for flexible jobs
          ...(sj.appointmentType !== 'fixed' && sj.appointmentType !== 'window' ? {
            startTime: sj.eta,
            endTime: newEndTime,
          } : {}),
        },
      });
    }

    // Calculate total traffic delay
    const totalTrafficDelay = scheduledJobs.reduce(
      (sum, sj) => sum + sj.trafficDelayMinutes,
      0
    );

    return NextResponse.json({
      success: true,
      trigger,
      worker: `${worker.firstName} ${worker.lastName}`,
      jobCount: scheduledJobs.length,
      changes,
      conflicts,
      totalTrafficDelayMinutes: totalTrafficDelay,
      hasSignificantChanges: changes.some(c => c.isSignificant),
      schedule: scheduledJobs.map(sj => ({
        id: sj.id,
        service: sj.serviceType,
        customer: sj.customer?.name || 'Unknown',
        eta: format(sj.eta, 'h:mm a'),
        etaEnd: format(sj.etaEnd, 'h:mm a'),
        travelMinutes: sj.travelTimeMinutes,
        trafficDelay: sj.trafficDelayMinutes,
        appointmentType: sj.appointmentType,
        isLate: sj.isLate,
      })),
    });
  } catch (error) {
    console.error('[Reoptimize API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to re-optimize route' },
      { status: 500 }
    );
  }
}
