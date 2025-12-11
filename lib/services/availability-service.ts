/**
 * Availability Service
 *
 * Checks worker availability based on:
 * - Regular weekly schedules (WorkerSchedule)
 * - Time off requests (WorkerTimeOff)
 * - Existing job assignments (Job)
 * - Maximum hours constraints (WorkerSettings)
 *
 * Used by the smart scheduler to determine which workers can be assigned to jobs.
 */

import { PrismaClient } from '@prisma/client';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, parseISO, format, isWithinInterval } from 'date-fns';

const prisma = new PrismaClient();

export interface AvailabilityCheck {
  userId: string;
  date: Date;
  startTime: string; // "09:00"
  endTime: string; // "17:00"
  durationHours: number;
}

export interface AvailabilityResult {
  available: boolean;
  conflicts: Conflict[];
  warnings: Warning[];
  hoursScheduled: number;
  hoursRemaining: number;
  score: number; // 0-100, higher is better
}

export interface Conflict {
  type: 'time_off' | 'job_overlap' | 'schedule' | 'max_hours';
  message: string;
  severity: 'blocker' | 'warning';
  details?: any;
}

export interface Warning {
  type: 'approaching_max_hours' | 'outside_preferred_hours' | 'weekend_work';
  message: string;
}

/**
 * Check if a worker is available for a specific time slot
 */
export async function checkAvailability(
  check: AvailabilityCheck
): Promise<AvailabilityResult> {
  const conflicts: Conflict[] = [];
  const warnings: Warning[] = [];

  // 1. Check regular schedule
  const scheduleCheck = await checkRegularSchedule(check);
  if (!scheduleCheck.available) {
    conflicts.push(...scheduleCheck.conflicts);
  }

  // 2. Check time off
  const timeOffCheck = await checkTimeOff(check);
  if (!timeOffCheck.available) {
    conflicts.push(...timeOffCheck.conflicts);
  }

  // 3. Check existing job assignments
  const jobConflictCheck = await checkJobConflicts(check);
  if (!jobConflictCheck.available) {
    conflicts.push(...jobConflictCheck.conflicts);
  }

  // 4. Check max hours constraints
  const maxHoursCheck = await checkMaxHours(check);
  conflicts.push(...maxHoursCheck.conflicts);
  warnings.push(...maxHoursCheck.warnings);

  // 5. Check weekend work
  const dayOfWeek = check.date.getDay();
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    const settings = await prisma.workerSettings.findUnique({
      where: { userId: check.userId },
    });

    if (!settings?.canWorkWeekends) {
      warnings.push({
        type: 'weekend_work',
        message: 'Worker prefers not to work weekends',
      });
    }
  }

  // Calculate availability score (0-100)
  const score = calculateAvailabilityScore({
    hasBlockingConflicts: conflicts.some((c) => c.severity === 'blocker'),
    conflictCount: conflicts.length,
    warningCount: warnings.length,
    hoursRemaining: maxHoursCheck.hoursRemaining,
  });

  return {
    available: conflicts.every((c) => c.severity !== 'blocker'),
    conflicts,
    warnings,
    hoursScheduled: maxHoursCheck.hoursScheduled,
    hoursRemaining: maxHoursCheck.hoursRemaining,
    score,
  };
}

/**
 * Check if time slot falls within worker's regular schedule
 */
async function checkRegularSchedule(
  check: AvailabilityCheck
): Promise<{ available: boolean; conflicts: Conflict[] }> {
  const dayOfWeek = check.date.getDay();

  const schedule = await prisma.workerSchedule.findUnique({
    where: {
      userId_dayOfWeek: {
        userId: check.userId,
        dayOfWeek,
      },
    },
  });

  // No schedule = assume available (flexible worker)
  if (!schedule) {
    return { available: true, conflicts: [] };
  }

  // Worker is off this day
  if (!schedule.isAvailable) {
    return {
      available: false,
      conflicts: [
        {
          type: 'schedule',
          message: `Worker is not scheduled to work on ${format(check.date, 'EEEE')}`,
          severity: 'blocker',
        },
      ],
    };
  }

  // Check if job time falls within scheduled hours
  const jobStart = timeToMinutes(check.startTime);
  const jobEnd = timeToMinutes(check.endTime);
  const scheduleStart = timeToMinutes(schedule.startTime);
  const scheduleEnd = timeToMinutes(schedule.endTime);

  if (jobStart < scheduleStart || jobEnd > scheduleEnd) {
    return {
      available: false,
      conflicts: [
        {
          type: 'schedule',
          message: `Job time (${check.startTime}-${check.endTime}) falls outside worker's scheduled hours (${schedule.startTime}-${schedule.endTime})`,
          severity: 'blocker',
          details: { schedule },
        },
      ],
    };
  }

  return { available: true, conflicts: [] };
}

/**
 * Check if worker has time off during this period
 */
async function checkTimeOff(
  check: AvailabilityCheck
): Promise<{ available: boolean; conflicts: Conflict[] }> {
  const dayStart = startOfDay(check.date);
  const dayEnd = endOfDay(check.date);

  const timeOff = await prisma.workerTimeOff.findMany({
    where: {
      userId: check.userId,
      approved: true,
      AND: [
        { startDate: { lte: dayEnd } },
        { endDate: { gte: dayStart } },
      ],
    },
  });

  if (timeOff.length > 0) {
    return {
      available: false,
      conflicts: timeOff.map((to) => ({
        type: 'time_off' as const,
        message: `Worker has time off: ${to.reason || 'Not specified'} (${format(to.startDate, 'MMM d')} - ${format(to.endDate, 'MMM d')})`,
        severity: 'blocker' as const,
        details: to,
      })),
    };
  }

  return { available: true, conflicts: [] };
}

/**
 * Check for overlapping job assignments
 */
async function checkJobConflicts(
  check: AvailabilityCheck
): Promise<{ available: boolean; conflicts: Conflict[] }> {
  const jobStartTime = new Date(check.date);
  const [startHour, startMin] = check.startTime.split(':').map(Number);
  jobStartTime.setHours(startHour, startMin, 0, 0);

  const jobEndTime = new Date(check.date);
  const [endHour, endMin] = check.endTime.split(':').map(Number);
  jobEndTime.setHours(endHour, endMin, 0, 0);

  const overlappingJobs = await prisma.job.findMany({
    where: {
      assignedUserIds: { has: check.userId },
      OR: [
        {
          AND: [
            { startTime: { lte: jobStartTime } },
            { endTime: { gt: jobStartTime } },
          ],
        },
        {
          AND: [
            { startTime: { lt: jobEndTime } },
            { endTime: { gte: jobEndTime } },
          ],
        },
        {
          AND: [
            { startTime: { gte: jobStartTime } },
            { endTime: { lte: jobEndTime } },
          ],
        },
      ],
    },
    include: {
      customer: {
        select: { name: true, address: true },
      },
    },
  });

  if (overlappingJobs.length > 0) {
    return {
      available: false,
      conflicts: overlappingJobs.map((job) => ({
        type: 'job_overlap' as const,
        message: `Conflicts with existing job: ${job.serviceType} at ${job.customer.name} (${format(job.startTime, 'h:mm a')} - ${format(job.endTime, 'h:mm a')})`,
        severity: 'blocker' as const,
        details: job,
      })),
    };
  }

  return { available: true, conflicts: [] };
}

/**
 * Check if assignment would exceed max hours constraints
 */
async function checkMaxHours(
  check: AvailabilityCheck
): Promise<{
  hoursScheduled: number;
  hoursRemaining: number;
  conflicts: Conflict[];
  warnings: Warning[];
}> {
  const conflicts: Conflict[] = [];
  const warnings: Warning[] = [];

  const settings = await prisma.workerSettings.findUnique({
    where: { userId: check.userId },
  });

  if (!settings) {
    return {
      hoursScheduled: 0,
      hoursRemaining: 40, // Default
      conflicts: [],
      warnings: [],
    };
  }

  // Check daily max hours
  const dayStart = startOfDay(check.date);
  const dayEnd = endOfDay(check.date);

  const dailyJobs = await prisma.job.findMany({
    where: {
      assignedUserIds: { has: check.userId },
      startTime: { gte: dayStart, lte: dayEnd },
    },
    select: {
      startTime: true,
      endTime: true,
    },
  });

  const dailyHours = dailyJobs.reduce((sum, job) => {
    const hours = (job.endTime.getTime() - job.startTime.getTime()) / (1000 * 60 * 60);
    return sum + hours;
  }, 0);

  const dailyHoursWithNewJob = dailyHours + check.durationHours;

  if (dailyHoursWithNewJob > settings.maxHoursPerDay) {
    conflicts.push({
      type: 'max_hours',
      message: `Would exceed daily max hours (${dailyHoursWithNewJob.toFixed(1)}h / ${settings.maxHoursPerDay}h)`,
      severity: 'blocker',
    });
  } else if (dailyHoursWithNewJob > settings.maxHoursPerDay * 0.9) {
    warnings.push({
      type: 'approaching_max_hours',
      message: `Approaching daily max hours (${dailyHoursWithNewJob.toFixed(1)}h / ${settings.maxHoursPerDay}h)`,
    });
  }

  // Check weekly max hours
  const weekStart = startOfWeek(check.date, { weekStartsOn: 1 }); // Monday
  const weekEnd = endOfWeek(check.date, { weekStartsOn: 1 });

  const weeklyJobs = await prisma.job.findMany({
    where: {
      assignedUserIds: { has: check.userId },
      startTime: { gte: weekStart, lte: weekEnd },
    },
    select: {
      startTime: true,
      endTime: true,
    },
  });

  const weeklyHours = weeklyJobs.reduce((sum, job) => {
    const hours = (job.endTime.getTime() - job.startTime.getTime()) / (1000 * 60 * 60);
    return sum + hours;
  }, 0);

  const weeklyHoursWithNewJob = weeklyHours + check.durationHours;

  if (weeklyHoursWithNewJob > settings.maxHoursPerWeek) {
    conflicts.push({
      type: 'max_hours',
      message: `Would exceed weekly max hours (${weeklyHoursWithNewJob.toFixed(1)}h / ${settings.maxHoursPerWeek}h)`,
      severity: 'warning', // Warning, not blocker - can be overridden
    });
  }

  return {
    hoursScheduled: weeklyHours,
    hoursRemaining: Math.max(0, settings.maxHoursPerWeek - weeklyHours),
    conflicts,
    warnings,
  };
}

/**
 * Calculate availability score (0-100)
 *
 * Higher score = better availability
 */
function calculateAvailabilityScore(params: {
  hasBlockingConflicts: boolean;
  conflictCount: number;
  warningCount: number;
  hoursRemaining: number;
}): number {
  if (params.hasBlockingConflicts) {
    return 0;
  }

  let score = 100;

  // Deduct points for warnings
  score -= params.warningCount * 10;

  // Deduct points for low hours remaining
  if (params.hoursRemaining < 5) {
    score -= 20;
  } else if (params.hoursRemaining < 10) {
    score -= 10;
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Convert time string to minutes since midnight
 */
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Batch check availability for multiple workers
 */
export async function checkMultipleWorkerAvailability(
  userIds: string[],
  check: Omit<AvailabilityCheck, 'userId'>
): Promise<Map<string, AvailabilityResult>> {
  const results = new Map<string, AvailabilityResult>();

  await Promise.all(
    userIds.map(async (userId) => {
      const result = await checkAvailability({ ...check, userId });
      results.set(userId, result);
    })
  );

  return results;
}
