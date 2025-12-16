import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { startOfDay, endOfDay, parseISO, addMinutes } from 'date-fns';
import {
  calculateHaversineDistance,
  calculateDrivingDistance,
  calculateRouteDistance,
  type Coordinates,
} from '@/lib/services/distance-service';

const WORKER_COLORS = [
  '#10b981', '#3b82f6', '#f59e0b', '#ef4444',
  '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16',
];

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
 * Optimizes routes for workers using a hybrid approach:
 * - Respects fixed appointment times (appointmentType === 'fixed')
 * - Respects time windows (appointmentType === 'window')
 * - Uses nearest-neighbor for flexible jobs (appointmentType === 'anytime')
 * - Starts from worker's home or office location
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
        // Mixed schedule: place fixed/window jobs at their times, optimize flexible jobs around them

        // Create time slots for the day
        interface TimeSlot {
          job: JobWithCoords;
          type: 'fixed' | 'window' | 'flexible';
        }

        const timeSlots: TimeSlot[] = [];

        // Add fixed jobs to their exact slots
        for (const job of fixedJobs) {
          timeSlots.push({ job, type: 'fixed' });
        }

        // Add window jobs (they have some flexibility but should stay near their time)
        for (const job of windowJobs) {
          timeSlots.push({ job, type: 'window' });
        }

        // Sort by start time
        timeSlots.sort((a, b) => new Date(a.job.startTime).getTime() - new Date(b.job.startTime).getTime());

        // Now insert flexible jobs using nearest-neighbor relative to fixed/window anchors
        const remainingFlexible = [...flexibleJobs];

        // If there are fixed/window jobs, insert flexible jobs in gaps
        if (timeSlots.length > 0) {
          // Insert flexible jobs before the first fixed job
          let currentLocation = startPoint;
          const finalSchedule: JobWithCoords[] = [];

          for (let slotIdx = 0; slotIdx < timeSlots.length; slotIdx++) {
            const slot = timeSlots[slotIdx];
            const slotTime = new Date(slot.job.startTime).getTime();

            // Insert as many flexible jobs as fit before this slot
            while (remainingFlexible.length > 0 && currentLocation) {
              // Find nearest flexible job
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

              // Estimate if we have time to fit this job before the fixed appointment
              const travelTimeEstimate = Math.ceil(nearestDist / 30 * 60); // 30 mph average
              const jobDuration = (remainingFlexible[nearestIdx].estimatedDuration || 1) * 60; // hours to minutes
              const currentTime = finalSchedule.length > 0
                ? new Date(finalSchedule[finalSchedule.length - 1].endTime).getTime()
                : startOfDay(dateObj).getTime() + 8 * 60 * 60 * 1000; // 8 AM default

              const neededTime = currentTime + (travelTimeEstimate + jobDuration) * 60 * 1000;

              if (neededTime <= slotTime) {
                // We can fit this job
                const flexJob = remainingFlexible.splice(nearestIdx, 1)[0];
                finalSchedule.push(flexJob);
                currentLocation = { latitude: flexJob.lat, longitude: flexJob.lng };
              } else {
                // No time before this fixed slot, break
                break;
              }
            }

            // Add the fixed/window job
            finalSchedule.push(slot.job);
            currentLocation = { latitude: slot.job.lat, longitude: slot.job.lng };
          }

          // Add remaining flexible jobs after the last fixed appointment
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
          // No fixed/window jobs, use pure nearest-neighbor
          optimizedJobs = timeSlots.map(s => s.job);
        }
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

      // Build reordered jobs list for UI
      const optimizedOrder = optimizedJobs.map(j => j.id);
      const reorderedJobs = [];

      for (let o = 0; o < optimizedOrder.length; o++) {
        const jobId = optimizedOrder[o];
        const oldIdx = originalOrder.indexOf(jobId);
        if (oldIdx !== o) {
          const job = optimizedJobs[o];
          reorderedJobs.push({
            service: job.serviceType,
            customer: job.customer?.name || 'Unknown',
            oldOrder: oldIdx + 1,
            newOrder: o + 1,
          });
        }
      }

      // Update database with new route order
      for (let o = 0; o < optimizedOrder.length; o++) {
        await prisma.job.update({
          where: { id: optimizedOrder[o] },
          data: { routeOrder: o + 1 },
        });
      }

      // Calculate actual savings
      const savedMiles = Math.max(0, beforeMiles - afterMiles);
      // Estimate time savings: assume 30 mph average + 2 min per stop saved
      const savedMinutes = Math.round(savedMiles / 30 * 60 + reorderedJobs.length * 2);

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
