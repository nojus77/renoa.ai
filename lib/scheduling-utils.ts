import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface Conflict {
  workerId: string;
  workerName: string;
  conflictingJobId: string;
  conflictingJobTitle: string;
  conflictStart: Date;
  conflictEnd: Date;
}

export interface AvailabilityResult {
  available: boolean;
  conflicts: Conflict[];
}

/**
 * Check if specified workers have any scheduling conflicts
 * within the given time window
 */
export async function checkWorkerConflicts(
  workerIds: string[],
  jobStartTime: Date,
  jobEndTime: Date,
  excludeJobId?: string
): Promise<Conflict[]> {
  if (workerIds.length === 0) {
    return [];
  }

  // Find all jobs that overlap with the given time window
  // A job overlaps if: jobStart < windowEnd AND jobEnd > windowStart
  const overlappingJobs = await prisma.job.findMany({
    where: {
      AND: [
        // Job starts before our window ends
        { startTime: { lt: jobEndTime } },
        // Job ends after our window starts
        { endTime: { gt: jobStartTime } },
        // Exclude the job we're editing (if provided)
        excludeJobId ? { id: { not: excludeJobId } } : {},
        // Only consider scheduled or in-progress jobs
        { status: { in: ['scheduled', 'in_progress'] } },
      ],
    },
    select: {
      id: true,
      serviceType: true,
      startTime: true,
      endTime: true,
      assignedUserIds: true,
    },
  });

  const conflicts: Conflict[] = [];

  // Get worker details for names
  const workers = await prisma.providerUser.findMany({
    where: { id: { in: workerIds } },
    select: { id: true, firstName: true, lastName: true },
  });

  const workerMap = new Map(
    workers.map(w => [w.id, `${w.firstName} ${w.lastName}`])
  );

  for (const job of overlappingJobs) {
    // Check if any of our workers are assigned to this job
    for (const workerId of workerIds) {
      if (job.assignedUserIds.includes(workerId)) {
        conflicts.push({
          workerId,
          workerName: workerMap.get(workerId) || 'Unknown Worker',
          conflictingJobId: job.id,
          conflictingJobTitle: job.serviceType || 'Untitled Job',
          conflictStart: job.startTime,
          conflictEnd: job.endTime,
        });
      }
    }
  }

  return conflicts;
}

/**
 * Get availability status for a crew
 * Returns whether the crew is available and any conflicts
 */
export async function getCrewAvailability(
  crewId: string,
  jobStartTime: Date,
  jobEndTime: Date,
  excludeJobId?: string
): Promise<AvailabilityResult> {
  // Get crew with its userIds
  const crew = await prisma.crew.findUnique({
    where: { id: crewId },
    select: {
      userIds: true,
    },
  });

  if (!crew || crew.userIds.length === 0) {
    return { available: true, conflicts: [] };
  }

  // Get active members from userIds
  const activeMembers = await prisma.providerUser.findMany({
    where: {
      id: { in: crew.userIds },
      status: 'active',
    },
    select: { id: true },
  });

  if (activeMembers.length === 0) {
    return { available: true, conflicts: [] };
  }

  const memberIds = activeMembers.map(m => m.id);
  const conflicts = await checkWorkerConflicts(
    memberIds,
    jobStartTime,
    jobEndTime,
    excludeJobId
  );

  return {
    available: conflicts.length === 0,
    conflicts,
  };
}

/**
 * Get availability for multiple individual workers
 */
export async function getWorkersAvailability(
  workerIds: string[],
  jobStartTime: Date,
  jobEndTime: Date,
  excludeJobId?: string
): Promise<AvailabilityResult> {
  const conflicts = await checkWorkerConflicts(
    workerIds,
    jobStartTime,
    jobEndTime,
    excludeJobId
  );

  return {
    available: conflicts.length === 0,
    conflicts,
  };
}

/**
 * Format conflicts into a human-readable message
 */
export function formatConflictMessage(conflicts: Conflict[]): string {
  if (conflicts.length === 0) {
    return '';
  }

  const uniqueWorkers = Array.from(new Set(conflicts.map(c => c.workerName)));

  if (conflicts.length === 1) {
    const c = conflicts[0];
    return `${c.workerName} is already assigned to "${c.conflictingJobTitle}" at this time.`;
  }

  if (uniqueWorkers.length === 1) {
    return `${uniqueWorkers[0]} has ${conflicts.length} conflicting jobs at this time.`;
  }

  return `${uniqueWorkers.length} workers have scheduling conflicts: ${uniqueWorkers.join(', ')}.`;
}

/**
 * Calculate job end time based on start time and duration in minutes
 */
export function calculateJobEndTime(startTime: Date, durationMinutes: number): Date {
  return new Date(startTime.getTime() + durationMinutes * 60 * 1000);
}

/**
 * Check if two time ranges overlap
 */
export function timeRangesOverlap(
  start1: Date,
  end1: Date,
  start2: Date,
  end2: Date
): boolean {
  return start1 < end2 && end1 > start2;
}

/**
 * Get crew members (active only) for a crew
 */
export async function getCrewMembers(crewId: string) {
  const crew = await prisma.crew.findUnique({
    where: { id: crewId },
    select: { userIds: true },
  });

  if (!crew || crew.userIds.length === 0) {
    return [];
  }

  return prisma.providerUser.findMany({
    where: {
      id: { in: crew.userIds },
      status: 'active',
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      color: true,
      skills: true,
    },
  });
}
