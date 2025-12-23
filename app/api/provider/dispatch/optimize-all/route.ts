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

const DEFAULT_START_HOUR = 8;
const AVG_SPEED_MPH = 30;
const MAX_JOBS_PER_WORKER = 12; // Hard limit
const WORKLOAD_PENALTY_FACTOR = 5; // Miles penalty per extra job above average

interface JobWithCoords {
  id: string;
  serviceType: string;
  startTime: Date;
  endTime: Date;
  appointmentType: string;
  status: string;
  durationMinutes: number | null;
  lat: number;
  lng: number;
  assignedUserIds: string[];
  customer: { name: string | null } | null;
  // Skill requirements from job
  requiredSkillIds: string[];
  preferredSkillIds: string[];
  requiredWorkerCount: number;
  bufferMinutes: number;
  allowUnqualified: boolean;
}

interface WorkerData {
  id: string;
  firstName: string;
  lastName: string;
  homeLatitude: number | null;
  homeLongitude: number | null;
  skills: string[];
  skillIds: string[]; // Worker's skill IDs for direct matching
  assignedJobs: JobWithCoords[];
  startPoint: Coordinates | null;
}

interface ScheduledJob extends JobWithCoords {
  eta: Date;
  etaEnd: Date;
  travelTimeMinutes: number;
}

/**
 * Skill mapping for job types - worker needs ANY of these skills
 */
function getRequiredSkillsForJob(serviceType: string): string[] {
  const skillMap: Record<string, string[]> = {
    'Lawn Mowing': ['Lawn Mowing', 'Lawn Care', 'Mowing', 'Lawn Edging', 'Lawn', 'Zero-Turn Mower', 'Walk-Behind Mower', 'Edging & Trimming'],
    'Lawn Edging': ['Lawn Edging', 'Edging & Trimming', 'Lawn Mowing', 'Lawn Care', 'Lawn', 'Mowing', 'String Trimmer', 'Edger'],
    'Tree Trimming': ['Tree Trimming', 'Pruning', 'Tree Work', 'Trimming & Pruning', 'Chainsaw Operation'],
    'Tree Removal': ['Tree Removal', 'Tree Work', 'Tree Trimming', 'Chainsaw Operation', 'ISA Certified Arborist'],
    'Trimming & Pruning': ['Trimming & Pruning', 'Pruning', 'Tree Trimming', 'Bush/Shrub Pruning', 'Hedge Trimming', 'Landscaping', 'Lawn Care'],
    'Landscaping': ['Landscaping', 'Planting', 'Garden Bed Maintenance', 'Landscape Design', 'Mulching', 'Lawn Care'],
    'Planting': ['Planting (Shrubs)', 'Planting (Flowers)', 'Planting (Trees)', 'Planting', 'Landscaping', 'Garden Bed Maintenance', 'Lawn Care', 'Mulching', 'Edging & Trimming'],
    'Mulching': ['Mulching', 'Landscaping', 'Garden Bed Maintenance', 'Planting', 'Planting (Shrubs)', 'Planting (Flowers)', 'Lawn Care', 'Edging & Trimming'],
    'Hardscaping': ['Hardscaping', 'Paver Installation', 'Retaining Wall', 'Concrete Work', 'Stone Work'],
    'Irrigation': ['Irrigation', 'Sprinkler Repair', 'Sprinkler Installation', 'Irrigation Repair', 'Irrigation Installation'],
    'Fertilization': ['Fertilization', 'Lawn Treatment', 'Pesticide Applicator License', 'Weed Control', 'Lawn Care'],
    'Hedge Trimming': ['Hedge Trimming', 'Bush/Shrub Pruning', 'Pruning', 'Trimming & Pruning'],
    'Spring Cleanup': ['Spring Cleanup', 'Fall Cleanup', 'Cleanup', 'Leaf Removal', 'Lawn Care', 'Debris Removal', 'Lawn Mowing', 'Leaf Blower'],
    'Fall Cleanup': ['Fall Cleanup', 'Spring Cleanup', 'Cleanup', 'Leaf Removal', 'Lawn Care', 'Debris Removal', 'Leaf Blower'],
    'Leaf Removal': ['Leaf Removal', 'Fall Cleanup', 'Spring Cleanup', 'Cleanup', 'Leaf Blower', 'Debris Removal', 'Lawn Care', 'Lawn Mowing'],
    'Aeration': ['Aeration', 'Lawn Care', 'Lawn Mowing', 'Lawn Treatment'],
    'Seeding': ['Seeding', 'Seeding & Overseeding', 'Lawn Care', 'Sod Installation', 'Aeration'],
  };
  return skillMap[serviceType] || [];
}

/**
 * Check if worker has skills for a job (with fuzzy matching)
 * DEPRECATED: Use workerHasRequiredSkillIds for explicit skill matching
 */
function workerCanDoJob(workerSkills: string[], serviceType: string): boolean {
  const requiredSkills = getRequiredSkillsForJob(serviceType);

  // If no specific skills required, any worker can do it
  if (requiredSkills.length === 0) return true;

  // Check if worker has ANY of the required skills (fuzzy match)
  return requiredSkills.some(required =>
    workerSkills.some(workerSkill => {
      const reqLower = required.toLowerCase();
      const skillLower = workerSkill.toLowerCase();
      return skillLower === reqLower ||
        skillLower.includes(reqLower) ||
        reqLower.includes(skillLower);
    })
  );
}

/**
 * Check if worker has ALL required skills (explicit ID matching)
 * This is the preferred method when job has requiredSkillIds set
 */
function workerHasRequiredSkillIds(workerSkillIds: string[], requiredSkillIds: string[]): boolean {
  // If no required skills, any worker can do it
  if (!requiredSkillIds || requiredSkillIds.length === 0) return true;

  // Worker must have ALL required skills
  return requiredSkillIds.every(skillId => workerSkillIds.includes(skillId));
}

/**
 * Get missing skill IDs that worker doesn't have
 */
function getMissingSkillIds(workerSkillIds: string[], requiredSkillIds: string[]): string[] {
  if (!requiredSkillIds || requiredSkillIds.length === 0) return [];
  return requiredSkillIds.filter(skillId => !workerSkillIds.includes(skillId));
}

/**
 * Determine if worker is qualified for a job
 * Uses explicit skill IDs if available, falls back to fuzzy matching
 */
function workerIsQualifiedForJob(worker: WorkerData, job: JobWithCoords): boolean {
  // If job has allowUnqualified flag, anyone can do it
  if (job.allowUnqualified) return true;

  // Prefer explicit skill ID matching if job has requiredSkillIds
  if (job.requiredSkillIds && job.requiredSkillIds.length > 0) {
    return workerHasRequiredSkillIds(worker.skillIds, job.requiredSkillIds);
  }

  // Fall back to fuzzy matching for legacy jobs without skill IDs
  return workerCanDoJob(worker.skills, job.serviceType);
}

/**
 * Calculate travel time in minutes between two points
 */
function calculateTravelTime(from: Coordinates, to: Coordinates): number {
  const dist = calculateHaversineDistance(from, to);
  return Math.ceil(dist.miles / AVG_SPEED_MPH * 60);
}

/**
 * Calculate total route distance for a list of jobs
 */
function calculateTotalRouteDistance(startPoint: Coordinates | null, jobs: JobWithCoords[]): number {
  if (jobs.length === 0) return 0;

  let totalMiles = 0;

  if (startPoint && jobs[0]) {
    const dist = calculateHaversineDistance(startPoint, {
      latitude: jobs[0].lat,
      longitude: jobs[0].lng,
    });
    totalMiles += dist.miles;
  }

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
 * Get worker's current location using priority order:
 * 1. Active job (IN_PROGRESS, ON_THE_WAY) location
 * 2. Last completed job location (for today)
 * 3. Last job in assigned route
 * 4. Worker's start point (home or office)
 */
function getWorkerCurrentLocation(
  worker: WorkerData,
  allJobs: JobWithCoords[],
  officeLocation: Coordinates | null
): Coordinates | null {
  // 1. Check for active job (in_progress or on_the_way)
  const activeJob = allJobs.find(j =>
    j.assignedUserIds.includes(worker.id) &&
    ['in_progress', 'on_the_way'].includes(j.status.toLowerCase())
  );
  if (activeJob && activeJob.lat && activeJob.lng) {
    return { latitude: activeJob.lat, longitude: activeJob.lng };
  }

  // 2. Check for last completed job today
  // (Jobs should already be filtered to today's date in the API)
  const completedJobs = allJobs
    .filter(j => j.assignedUserIds.includes(worker.id))
    .filter(j => j.status.toLowerCase() === 'completed');

  if (completedJobs.length > 0) {
    const lastCompleted = completedJobs[completedJobs.length - 1];
    if (lastCompleted.lat && lastCompleted.lng) {
      return { latitude: lastCompleted.lat, longitude: lastCompleted.lng };
    }
  }

  // 3. Last job in their assigned route
  if (worker.assignedJobs.length > 0) {
    const lastJob = worker.assignedJobs[worker.assignedJobs.length - 1];
    return { latitude: lastJob.lat, longitude: lastJob.lng };
  }

  // 4. Worker's start point (home or office)
  return worker.startPoint;
}

/**
 * Get last location in worker's route (for route building)
 */
function getWorkerLastLocation(worker: WorkerData): Coordinates | null {
  if (worker.assignedJobs.length > 0) {
    const lastJob = worker.assignedJobs[worker.assignedJobs.length - 1];
    return { latitude: lastJob.lat, longitude: lastJob.lng };
  }
  return worker.startPoint;
}

/**
 * Calculate cost to add a job to a worker's route
 * Uses smarter worker location when allJobs is provided
 */
function calculateAssignmentCost(
  worker: WorkerData,
  job: JobWithCoords,
  avgJobsPerWorker: number,
  allJobs?: JobWithCoords[],
  officeLocation?: Coordinates | null
): number {
  // Distance cost: miles from current/last location to job
  // Use smart location if we have all jobs data, otherwise fall back to route-based
  const workerLocation = allJobs
    ? getWorkerCurrentLocation(worker, allJobs, officeLocation || null)
    : getWorkerLastLocation(worker);

  let distanceCost = 0;

  if (workerLocation) {
    const dist = calculateHaversineDistance(workerLocation, {
      latitude: job.lat,
      longitude: job.lng,
    });
    distanceCost = dist.miles;
  }

  // Workload cost: penalize workers with more than average jobs
  const currentJobs = worker.assignedJobs.length;
  const overAverage = Math.max(0, currentJobs - avgJobsPerWorker);
  const workloadCost = overAverage * WORKLOAD_PENALTY_FACTOR;

  // Hard limit penalty
  if (currentJobs >= MAX_JOBS_PER_WORKER) {
    return Infinity;
  }

  return distanceCost + workloadCost;
}

/**
 * Optimize a single worker's route using nearest-neighbor
 */
function optimizeWorkerRoute(worker: WorkerData, dateObj: Date): JobWithCoords[] {
  const jobs = [...worker.assignedJobs];
  if (jobs.length <= 1) return jobs;

  // Separate fixed/window jobs from flexible
  const fixedJobs = jobs.filter(j => j.appointmentType === 'fixed' || j.appointmentType === 'window');
  const flexibleJobs = jobs.filter(j => j.appointmentType === 'anytime' || !j.appointmentType);

  if (fixedJobs.length > 0) {
    // Sort fixed/window by time
    const anchors = [...fixedJobs].sort(
      (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );

    const remaining = [...flexibleJobs];
    let currentLocation = worker.startPoint;
    const optimized: JobWithCoords[] = [];

    for (const anchor of anchors) {
      // Nearest-neighbor insert flexible jobs before anchor
      while (remaining.length > 0 && currentLocation) {
        let nearestIdx = 0;
        let nearestDist = Infinity;

        for (let i = 0; i < remaining.length; i++) {
          const dist = calculateHaversineDistance(currentLocation, {
            latitude: remaining[i].lat,
            longitude: remaining[i].lng,
          });
          if (dist.miles < nearestDist) {
            nearestDist = dist.miles;
            nearestIdx = i;
          }
        }

        // Check if job fits before anchor
        const travelTime = Math.ceil(nearestDist / AVG_SPEED_MPH * 60);
        const jobDuration = (remaining[nearestIdx].durationMinutes || 1) * 60;
        const currentTime = optimized.length > 0
          ? new Date(optimized[optimized.length - 1].endTime).getTime()
          : startOfDay(dateObj).getTime() + DEFAULT_START_HOUR * 60 * 60 * 1000;

        const neededTime = currentTime + (travelTime + jobDuration) * 60 * 1000;
        const anchorTime = new Date(anchor.startTime).getTime();

        if (neededTime <= anchorTime - 15 * 60 * 1000) {
          const job = remaining.splice(nearestIdx, 1)[0];
          optimized.push(job);
          currentLocation = { latitude: job.lat, longitude: job.lng };
        } else {
          break;
        }
      }

      optimized.push(anchor);
      currentLocation = { latitude: anchor.lat, longitude: anchor.lng };
    }

    // Add remaining flexible jobs after all anchors
    while (remaining.length > 0 && currentLocation) {
      let nearestIdx = 0;
      let nearestDist = Infinity;

      for (let i = 0; i < remaining.length; i++) {
        const dist = calculateHaversineDistance(currentLocation, {
          latitude: remaining[i].lat,
          longitude: remaining[i].lng,
        });
        if (dist.miles < nearestDist) {
          nearestDist = dist.miles;
          nearestIdx = i;
        }
      }

      const job = remaining.splice(nearestIdx, 1)[0];
      optimized.push(job);
      currentLocation = { latitude: job.lat, longitude: job.lng };
    }

    return optimized;
  }

  // All flexible - pure nearest-neighbor
  let currentLocation = worker.startPoint || (jobs.length > 0 ? {
    latitude: jobs[0].lat,
    longitude: jobs[0].lng,
  } : null);

  const remaining = [...jobs];
  const optimized: JobWithCoords[] = [];

  while (remaining.length > 0 && currentLocation) {
    let nearestIdx = 0;
    let nearestDist = Infinity;

    for (let i = 0; i < remaining.length; i++) {
      const dist = calculateHaversineDistance(currentLocation, {
        latitude: remaining[i].lat,
        longitude: remaining[i].lng,
      });
      if (dist.miles < nearestDist) {
        nearestDist = dist.miles;
        nearestIdx = i;
      }
    }

    const job = remaining.splice(nearestIdx, 1)[0];
    optimized.push(job);
    currentLocation = { latitude: job.lat, longitude: job.lng };
  }

  return optimized;
}

/**
 * Calculate ETAs for optimized route
 */
function calculateETAs(jobs: JobWithCoords[], startPoint: Coordinates | null, dayStart: Date): ScheduledJob[] {
  const scheduled: ScheduledJob[] = [];

  let currentTime = new Date(dayStart);
  currentTime.setHours(DEFAULT_START_HOUR, 0, 0, 0);

  let currentLocation = startPoint;

  for (const job of jobs) {
    let travelTimeMinutes = 0;

    if (currentLocation) {
      travelTimeMinutes = calculateTravelTime(currentLocation, {
        latitude: job.lat,
        longitude: job.lng,
      });
    }

    const eta = addMinutes(currentTime, travelTimeMinutes);
    const durationMinutes = (job.durationMinutes || 1) * 60;
    const etaEnd = addMinutes(eta, durationMinutes);

    scheduled.push({
      ...job,
      eta,
      etaEnd,
      travelTimeMinutes,
    });

    currentTime = etaEnd;
    currentLocation = { latitude: job.lat, longitude: job.lng };
  }

  return scheduled;
}

/**
 * Multi-worker route optimization
 * 1. Optimize existing assignments
 * 2. Assign unassigned jobs using cost-based algorithm
 * 3. Re-optimize routes after assignments
 */
export async function POST(req: Request) {
  try {
    const { date, workerIds, providerId, autoAssign = true } = await req.json();

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
      },
    });

    const officeLocation: Coordinates | null = provider?.officeLatitude && provider?.officeLongitude
      ? { latitude: provider.officeLatitude, longitude: provider.officeLongitude }
      : null;

    // Get all active field workers with skills
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
        workerSkills: {
          include: {
            skill: {
              select: { name: true },
            },
          },
        },
      },
    });

    if (workers.length === 0) {
      return NextResponse.json({
        success: true,
        workers: [],
        unassignableJobs: [],
        totalSavedMiles: 0,
        totalSavedMinutes: 0,
        message: 'No active workers found',
      });
    }

    // Get all jobs for the date
    const allJobs = await prisma.job.findMany({
      where: {
        providerId,
        startTime: {
          gte: startOfDay(dateObj),
          lt: endOfDay(dateObj),
        },
        status: { notIn: ['cancelled'] },
      },
      include: {
        customer: {
          select: { name: true, latitude: true, longitude: true },
        },
      },
      orderBy: { startTime: 'asc' },
    });

    // Convert to JobWithCoords
    const jobsWithCoords: JobWithCoords[] = allJobs
      .map(j => {
        // Type assertion to access full Job fields that include returns
        const job = j as typeof j & {
          requiredSkillIds?: string[];
          preferredSkillIds?: string[];
          requiredWorkerCount?: number;
          bufferMinutes?: number;
          allowUnqualified?: boolean;
        };
        return {
          id: job.id,
          serviceType: job.serviceType,
          startTime: job.startTime,
          endTime: job.endTime,
          appointmentType: job.appointmentType,
          status: job.status,
          durationMinutes: job.durationMinutes,
          lat: job.latitude || job.customer?.latitude || 0,
          lng: job.longitude || job.customer?.longitude || 0,
          assignedUserIds: job.assignedUserIds,
          customer: job.customer,
          // Include skill fields from job
          requiredSkillIds: job.requiredSkillIds || [],
          preferredSkillIds: job.preferredSkillIds || [],
          requiredWorkerCount: job.requiredWorkerCount || 1,
          bufferMinutes: job.bufferMinutes || 15,
          allowUnqualified: job.allowUnqualified || false,
        };
      })
      .filter(j => j.lat !== 0 && j.lng !== 0);

    // Build worker data structures
    const workerMap = new Map<string, WorkerData>();

    for (let i = 0; i < workers.length; i++) {
      const w = workers[i];
      const startPoint: Coordinates | null = w.homeLatitude && w.homeLongitude
        ? { latitude: w.homeLatitude, longitude: w.homeLongitude }
        : officeLocation;

      workerMap.set(w.id, {
        id: w.id,
        firstName: w.firstName,
        lastName: w.lastName,
        homeLatitude: w.homeLatitude,
        homeLongitude: w.homeLongitude,
        skills: w.workerSkills.map(ws => ws.skill.name),
        skillIds: w.workerSkills.map(ws => ws.skillId), // Include skill IDs for explicit matching
        assignedJobs: [],
        startPoint,
      });
    }

    // Fetch all skills for this provider (for name lookups)
    const allSkills = await prisma.skill.findMany({
      where: { providerId },
      select: { id: true, name: true },
    });
    const skillNameMap = new Map(allSkills.map(s => [s.id, s.name]));

    // Separate assigned vs unassigned jobs
    const assignedJobs: JobWithCoords[] = [];
    const unassignedJobs: JobWithCoords[] = [];

    // Track skill mismatches in existing assignments
    const skillMismatches: Array<{
      jobId: string;
      jobTitle: string;
      serviceType: string;
      assignedWorkerId: string;
      assignedWorkerName: string;
      workerSkills: string[];
      workerSkillIds: string[];
      requiredSkills: string[];
      requiredSkillIds: string[];
      missingSkillIds: string[];
      missingSkillNames: string[];
    }> = [];

    // Track jobs needing manual review
    const needsReview: Array<{
      jobId: string;
      jobTitle: string;
      serviceType: string;
      reason: string;
      message: string;
      requiredWorkerCount?: number;
      requiredSkillIds?: string[];
      requiredSkillNames?: string[];
    }> = [];

    for (const job of jobsWithCoords) {
      // Check for multi-worker jobs - these should never be auto-assigned
      if (job.requiredWorkerCount > 1) {
        needsReview.push({
          jobId: job.id,
          jobTitle: `${job.serviceType} - ${job.customer?.name || 'Unknown'}`,
          serviceType: job.serviceType,
          reason: 'MULTI_WORKER_REQUIRED',
          message: `Requires ${job.requiredWorkerCount} workers`,
          requiredWorkerCount: job.requiredWorkerCount,
        });
        // Still add to assigned jobs if it has assignments
        if (job.assignedUserIds.length > 0) {
          assignedJobs.push(job);
          for (const workerId of job.assignedUserIds) {
            const worker = workerMap.get(workerId);
            if (worker) worker.assignedJobs.push(job);
          }
        } else {
          unassignedJobs.push(job);
        }
        continue;
      }

      if (job.assignedUserIds.length > 0) {
        // Find which worker(s) this job is assigned to
        for (const workerId of job.assignedUserIds) {
          const worker = workerMap.get(workerId);
          if (worker) {
            // Use new explicit skill checking if job has requiredSkillIds
            const hasSkills = workerIsQualifiedForJob(worker, job);

            if (!hasSkills && !job.allowUnqualified) {
              // Get missing skill details
              const missingIds = getMissingSkillIds(worker.skillIds, job.requiredSkillIds);
              const missingNames = missingIds.map(id => skillNameMap.get(id) || id);

              // Get required skill names for display
              const requiredNames = job.requiredSkillIds.length > 0
                ? job.requiredSkillIds.map(id => skillNameMap.get(id) || id)
                : getRequiredSkillsForJob(job.serviceType);

              skillMismatches.push({
                jobId: job.id,
                jobTitle: `${job.serviceType} - ${job.customer?.name || 'Unknown'}`,
                serviceType: job.serviceType,
                assignedWorkerId: workerId,
                assignedWorkerName: `${worker.firstName} ${worker.lastName}`,
                workerSkills: worker.skills,
                workerSkillIds: worker.skillIds,
                requiredSkills: requiredNames,
                requiredSkillIds: job.requiredSkillIds,
                missingSkillIds: missingIds,
                missingSkillNames: missingNames,
              });
            }

            worker.assignedJobs.push(job);
          }
        }
        assignedJobs.push(job);
      } else {
        unassignedJobs.push(job);
      }
    }

    // Track original distances for savings calculation
    const originalDistances = new Map<string, number>();
    Array.from(workerMap.entries()).forEach(([workerId, worker]) => {
      originalDistances.set(workerId, calculateTotalRouteDistance(worker.startPoint, worker.assignedJobs));
    });

    // Track unassignable jobs
    const unassignableJobs: Array<{
      id: string;
      service: string;
      customer: string | null;
      reason: string;
    }> = [];

    // If auto-assign enabled, assign unassigned jobs
    if (autoAssign && unassignedJobs.length > 0) {
      // Sort jobs by priority/time - fixed appointments first, then multi-worker jobs last
      const sortedUnassigned = [...unassignedJobs].sort((a, b) => {
        // Multi-worker jobs last (they need manual review)
        if (a.requiredWorkerCount > 1 && b.requiredWorkerCount === 1) return 1;
        if (b.requiredWorkerCount > 1 && a.requiredWorkerCount === 1) return -1;
        // Fixed appointments first
        if (a.appointmentType === 'fixed' && b.appointmentType !== 'fixed') return -1;
        if (b.appointmentType === 'fixed' && a.appointmentType !== 'fixed') return 1;
        // Then by start time
        return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
      });

      const totalJobs = assignedJobs.length + unassignedJobs.length;
      const avgJobsPerWorker = totalJobs / workers.length;

      for (const job of sortedUnassigned) {
        // Skip multi-worker jobs - they need manual assignment
        if (job.requiredWorkerCount > 1) {
          // Already added to needsReview above
          continue;
        }

        // Find eligible workers using new skill checking
        const eligibleWorkers: WorkerData[] = [];

        for (const worker of Array.from(workerMap.values())) {
          if (workerIsQualifiedForJob(worker, job)) {
            eligibleWorkers.push(worker);
          }
        }

        if (eligibleWorkers.length === 0) {
          // Get required skill names for the error message
          const requiredSkillNames = job.requiredSkillIds.length > 0
            ? job.requiredSkillIds.map(id => skillNameMap.get(id) || id)
            : getRequiredSkillsForJob(job.serviceType);

          needsReview.push({
            jobId: job.id,
            jobTitle: `${job.serviceType} - ${job.customer?.name || 'Unknown'}`,
            serviceType: job.serviceType,
            reason: 'NO_QUALIFIED_WORKERS',
            message: 'No workers have all required skills',
            requiredSkillIds: job.requiredSkillIds,
            requiredSkillNames: requiredSkillNames,
          });

          unassignableJobs.push({
            id: job.id,
            service: job.serviceType,
            customer: job.customer?.name || null,
            reason: `No workers have required skills: ${requiredSkillNames.join(', ')}`,
          });
          continue;
        }

        // Find best worker based on cost (uses smart worker location)
        let bestWorker: WorkerData | null = null;
        let bestCost = Infinity;

        for (const worker of eligibleWorkers) {
          const cost = calculateAssignmentCost(worker, job, avgJobsPerWorker, jobsWithCoords, officeLocation);
          if (cost < bestCost) {
            bestCost = cost;
            bestWorker = worker;
          }
        }

        if (bestWorker && bestCost !== Infinity) {
          // Assign job to this worker
          bestWorker.assignedJobs.push(job);
        } else {
          unassignableJobs.push({
            id: job.id,
            service: job.serviceType,
            customer: job.customer?.name || null,
            reason: 'All eligible workers at maximum capacity',
          });
        }
      }
    } else if (!autoAssign) {
      // Just mark all unassigned jobs
      for (const job of unassignedJobs) {
        unassignableJobs.push({
          id: job.id,
          service: job.serviceType,
          customer: job.customer?.name || null,
          reason: 'Auto-assign disabled',
        });
      }
    }

    // Optimize each worker's route
    const workerResults = [];
    let totalSavedMiles = 0;
    let totalSavedMinutes = 0;

    let colorIdx = 0;
    for (const [workerId, worker] of Array.from(workerMap.entries())) {
      const beforeMiles = calculateTotalRouteDistance(worker.startPoint, worker.assignedJobs);

      // Optimize route
      const optimizedJobs = optimizeWorkerRoute(worker, dateObj);
      const afterMiles = calculateTotalRouteDistance(worker.startPoint, optimizedJobs);

      // Calculate ETAs
      const scheduledJobs = calculateETAs(optimizedJobs, worker.startPoint, dateObj);

      // Calculate total time
      let totalMinutes = 0;
      for (const sj of scheduledJobs) {
        totalMinutes += sj.travelTimeMinutes + (sj.durationMinutes || 1) * 60;
      }

      // Update database
      for (let i = 0; i < scheduledJobs.length; i++) {
        const sj = scheduledJobs[i];
        const durationMinutes = (sj.durationMinutes || 1) * 60;
        const newEndTime = addMinutes(sj.eta, durationMinutes);

        // Check if this is a newly assigned job
        const wasUnassigned = !assignedJobs.find(aj => aj.id === sj.id);

        await prisma.job.update({
          where: { id: sj.id },
          data: {
            routeOrder: i + 1,
            // Update assignment if newly assigned
            ...(wasUnassigned ? {
              assignedUserIds: [workerId],
            } : {}),
            // Update times for flexible jobs
            ...(sj.appointmentType !== 'fixed' && sj.appointmentType !== 'window' ? {
              startTime: sj.eta,
              endTime: newEndTime,
            } : {}),
          },
        });
      }

      const savedMiles = Math.max(0, beforeMiles - afterMiles);
      const savedMinutes = Math.round(savedMiles / AVG_SPEED_MPH * 60);

      totalSavedMiles += savedMiles;
      totalSavedMinutes += savedMinutes;

      workerResults.push({
        id: workerId,
        name: `${worker.firstName} ${worker.lastName}`,
        color: WORKER_COLORS[colorIdx % WORKER_COLORS.length],
        jobCount: optimizedJobs.length,
        jobs: scheduledJobs.map(sj => ({
          id: sj.id,
          service: sj.serviceType,
          customer: sj.customer?.name || 'Unknown',
          eta: format(sj.eta, 'h:mm a'),
          etaEnd: format(sj.etaEnd, 'h:mm a'),
          travelMinutes: sj.travelTimeMinutes,
        })),
        beforeMiles: Math.round(beforeMiles * 10) / 10,
        afterMiles: Math.round(afterMiles * 10) / 10,
        savedMiles: Math.round(savedMiles * 10) / 10,
        savedMinutes,
        totalMiles: Math.round(afterMiles * 10) / 10,
        totalMinutes: Math.round(totalMinutes),
      });

      colorIdx++;
    }

    return NextResponse.json({
      success: true,
      workers: workerResults,
      unassignableJobs,
      skillMismatches,
      needsReview,
      totalSavedMiles: Math.round(totalSavedMiles * 10) / 10,
      totalSavedMinutes,
      summary: {
        totalWorkers: workerResults.length,
        totalJobs: workerResults.reduce((sum, w) => sum + w.jobCount, 0),
        unassignedCount: unassignableJobs.length,
        skillMismatchCount: skillMismatches.length,
        needsReviewCount: needsReview.length,
        avgJobsPerWorker: workerResults.length > 0
          ? Math.round(workerResults.reduce((sum, w) => sum + w.jobCount, 0) / workerResults.length * 10) / 10
          : 0,
      },
    });
  } catch (error) {
    console.error('[Optimize-All API] Error:', error);
    return NextResponse.json({ error: 'Failed to optimize routes' }, { status: 500 });
  }
}
