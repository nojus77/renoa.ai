/**
 * Scheduler Engine for Smart Scheduling
 *
 * Main scheduling logic using greedy algorithm with multi-factor scoring
 */

import { PrismaClient } from '@prisma/client';
import { startOfDay, endOfDay, format } from 'date-fns';
import { formatInProviderTz } from '@/lib/utils/timezone';
import {
  calculateAssignmentScore,
  getServiceWeights,
  type SchedulingContext,
  type WorkerWithDetails,
  type JobWithDetails,
  type WorkerScheduleForDay,
  type AssignmentScore
} from './scoring-engine';
import { checkAvailability } from '../availability-service';
import { geocodeAddress } from '../geocoding-service';
import { calculateHaversineDistance } from '../distance-service';

const prisma = new PrismaClient();

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

export interface ScheduleResult {
  success: boolean;
  proposalId?: string;
  assignments: ProposedAssignment[];
  unassignedJobs: JobWithDetails[];
  stats: {
    totalJobs: number;
    assignedJobs: number;
    unassignedJobs: number;
    totalDriveTime: number;
    averageScore: number;
  };
  errors?: string[];
}

export interface ProposedAssignment {
  jobId: string;
  workerIds: string[];
  suggestedStart: Date;
  suggestedEnd: Date;
  orderInRoute: number;
  driveTimeFromPrev: number;
  totalScore: number;
  scoreBreakdown: {
    sla: number;
    route: number;
    continuity: number;
    balance: number;
  };
}

// ═══════════════════════════════════════════════════════════════════
// MAIN SCHEDULER FUNCTION
// ═══════════════════════════════════════════════════════════════════

export async function scheduleJobsForDate(
  providerId: string,
  date: Date,
  options: {
    jobIds?: string[];
    excludeWorkerIds?: string[];
    createdBy?: string;
  } = {}
): Promise<ScheduleResult> {

  try {
    console.log(`🧠 Starting auto-schedule for ${date.toDateString()}`);

    // ─────────────────────────────────────────────────────────────────
    // 1. LOAD DATA
    // ─────────────────────────────────────────────────────────────────

    // Build query dynamically
    const whereClause: any = {
      providerId,
      status: { notIn: ['cancelled', 'completed'] }
    };

    // If specific job IDs are provided, use those (don't filter by date)
    if (options.jobIds && options.jobIds.length > 0) {
      whereClause.id = { in: options.jobIds };
    } else {
      // Otherwise, get unassigned jobs for the specific date
      whereClause.startTime = { gte: startOfDay(date), lte: endOfDay(date) };
      whereClause.AND = [
        {
          OR: [
            { assignedUserIds: { isEmpty: true } },
            { assignedUserIds: { equals: [] } }
          ]
        }
      ];
    }

    console.log('📋 Query params:', {
      providerId,
      date: date.toISOString(),
      dateRange: `${startOfDay(date).toISOString()} - ${endOfDay(date).toISOString()}`,
      jobIds: options.jobIds
    });

    const jobs = await prisma.job.findMany({
      where: whereClause,
      include: {
        customer: true
      },
      orderBy: [
        { jobPriority: 'desc' },
        { startTime: 'asc' }
      ]
    }) as any as JobWithDetails[];

    console.log(`📋 Found ${jobs.length} jobs to schedule`);

    if (jobs.length === 0) {
      console.log('⚠️  No jobs found matching criteria');
      return {
        success: true,
        assignments: [],
        unassignedJobs: [],
        stats: { totalJobs: 0, assignedJobs: 0, unassignedJobs: 0, totalDriveTime: 0, averageScore: 0 }
      };
    }

    // Get available workers
    const workers = await prisma.providerUser.findMany({
      where: {
        providerId,
        role: 'field',
        status: 'active',
        ...(options.excludeWorkerIds ? { id: { notIn: options.excludeWorkerIds } } : {})
      },
      include: {
        workerSkills: {
          include: { skill: true }
        }
      }
    }) as any as WorkerWithDetails[];

    console.log(`👷 Found ${workers.length} available workers`);

    // Ensure all jobs have coordinates (batch geocode in parallel with limit)
    const jobsNeedingGeocode = jobs.filter(job => !job.latitude || !job.longitude);

    console.log('🗺️  Checking job coordinates...');
    if (jobsNeedingGeocode.length > 0) {
      console.log(`   Geocoding ${jobsNeedingGeocode.length} addresses...`);

      // Geocode in parallel batches of 5 to avoid rate limiting
      const batchSize = 5;
      for (let i = 0; i < jobsNeedingGeocode.length; i += batchSize) {
        const batch = jobsNeedingGeocode.slice(i, i + batchSize);

        await Promise.all(
          batch.map(async (job) => {
            try {
              const result = await geocodeAddress(job.address);
              if (result) {
                await prisma.job.update({
                  where: { id: job.id },
                  data: {
                    latitude: result.latitude,
                    longitude: result.longitude,
                    zone: result.zipCode || null
                  }
                });
                job.latitude = result.latitude;
                job.longitude = result.longitude;
                job.zone = result.zipCode || null;
              }
            } catch (error) {
              console.error(`Failed to geocode job ${job.id}:`, error);
              // Continue without coordinates - job will still be scheduled but with reduced route scoring
            }
          })
        );
      }
      console.log(`   ✅ Geocoding complete`);
    } else {
      console.log(`   ✅ All ${jobs.length} jobs already have coordinates (cached)`);
    }

    // Get service configurations
    const serviceConfigs = await prisma.serviceTypeConfig.findMany({
      where: { providerId }
    });

    const serviceWeights = new Map(
      serviceConfigs.map(c => [c.serviceType, {
        weightSLA: c.skillWeight,
        weightRoute: c.availabilityWeight,
        weightContinuity: c.workloadWeight,
        weightBalance: c.historyWeight
      }])
    );

    // ─────────────────────────────────────────────────────────────────
    // 2. BUILD SCHEDULING CONTEXT
    // ─────────────────────────────────────────────────────────────────

    const existingAssignments = new Map<string, WorkerScheduleForDay>();

    for (const worker of workers) {
      const homeLocation = worker.homeLatitude && worker.homeLongitude
        ? { latitude: worker.homeLatitude, longitude: worker.homeLongitude }
        : null;

      existingAssignments.set(worker.id, {
        workerId: worker.id,
        jobs: [],
        currentLocation: homeLocation,
        totalHours: 0,
        totalDriveTime: 0
      });
    }

    const context: SchedulingContext = {
      date,
      workers,
      jobs,
      existingAssignments,
      serviceWeights
    };

    // ─────────────────────────────────────────────────────────────────
    // 3. SCHEDULE JOBS (GREEDY ALGORITHM WITH CREW PRE-PASS)
    // ─────────────────────────────────────────────────────────────────

    // Load crews for crew-aware assignment
    const crews = await prisma.crew.findMany({
      where: { providerId },
      select: {
        id: true,
        name: true,
        userIds: true,
        color: true,
      },
    });

    console.log(`👥 Found ${crews.length} crews for crew-aware scheduling`);

    const assignments: ProposedAssignment[] = [];
    const unassignedJobs: JobWithDetails[] = [];

    for (const job of jobs) {
      console.log(`\n🎯 Scheduling: ${job.serviceType} at ${new Date(job.startTime).toLocaleTimeString()}`);

      // Try crew assignment first
      let assignment = await tryCrewAssignment(job, crews, context);

      // Fall back to individual worker assignment
      if (!assignment) {
        assignment = await assignJobToWorker(job, context);
      }

      if (assignment) {
        assignments.push(assignment);
        const assignType = assignment.workerIds.length > 1 ? 'crew' : 'worker';
        console.log(`✅ Assigned to ${assignType}: ${assignment.workerIds.join(', ')} (score: ${assignment.totalScore})`);
      } else {
        unassignedJobs.push(job);
        console.log(`❌ Could not assign job ${job.id} (${job.serviceType}) - no viable workers found`);
      }
    }

    // ─────────────────────────────────────────────────────────────────
    // 4. CREATE PROPOSAL
    // ─────────────────────────────────────────────────────────────────

    const totalDriveTime = assignments.reduce((sum, a) => sum + a.driveTimeFromPrev, 0);
    const avgScore = assignments.length > 0
      ? assignments.reduce((sum, a) => sum + a.totalScore, 0) / assignments.length
      : 0;

    const proposal = await prisma.scheduleProposal.create({
      data: {
        providerId,
        scheduleDate: date,
        totalJobs: jobs.length,
        assignedJobs: assignments.length,
        unassignedJobs: unassignedJobs.length,
        totalDriveTime,
        averageScore: Math.round(avgScore * 10) / 10,
        createdBy: options.createdBy || null,
        assignments: {
          create: assignments.map(a => ({
            jobId: a.jobId,
            workerIds: a.workerIds,
            suggestedStart: a.suggestedStart,
            suggestedEnd: a.suggestedEnd,
            orderInRoute: a.orderInRoute,
            driveTimeFromPrev: a.driveTimeFromPrev,
            totalScore: a.totalScore,
            scoreBreakdown: a.scoreBreakdown
          }))
        }
      }
    });

    console.log(`\n✅ Schedule proposal created: ${proposal.id}`);
    console.log(`📊 ${assignments.length}/${jobs.length} jobs assigned`);
    console.log(`🚗 Total drive time: ${totalDriveTime} minutes`);
    console.log(`⭐ Average score: ${avgScore.toFixed(1)}`);

    return {
      success: true,
      proposalId: proposal.id,
      assignments,
      unassignedJobs,
      stats: {
        totalJobs: jobs.length,
        assignedJobs: assignments.length,
        unassignedJobs: unassignedJobs.length,
        totalDriveTime,
        averageScore: Math.round(avgScore * 10) / 10
      }
    };

  } catch (error) {
    console.error('Scheduling error:', error);
    return {
      success: false,
      assignments: [],
      unassignedJobs: [],
      stats: { totalJobs: 0, assignedJobs: 0, unassignedJobs: 0, totalDriveTime: 0, averageScore: 0 },
      errors: [error instanceof Error ? error.message : 'Unknown error']
    };
  }
}

// ═══════════════════════════════════════════════════════════════════
// ASSIGN SINGLE JOB TO BEST WORKER
// ═══════════════════════════════════════════════════════════════════

async function assignJobToWorker(
  job: JobWithDetails,
  context: SchedulingContext
): Promise<ProposedAssignment | null> {

  const jobStart = new Date(job.startTime);
  const jobEnd = new Date(job.endTime);
  const jobDuration = (jobEnd.getTime() - jobStart.getTime()) / (1000 * 60);
  const crewSize = job.crewSizeRequired || 1;

  // Enhanced logging for job details
  console.log(`\n🎯 Scheduling: ${job.serviceType} at ${formatInProviderTz(job.startTime, 'h:mm a', 'America/Chicago')} - ${formatInProviderTz(job.endTime, 'h:mm a', 'America/Chicago')} Chicago time`);
  console.log(`   (UTC: ${format(jobStart, 'HH:mm')} - ${format(jobEnd, 'HH:mm')})`);
  console.log(`   Job ID: ${job.id}`);
  console.log(`   Customer: ${job.customer?.name}`);
  console.log(`   Duration: ${jobDuration} minutes`);
  console.log(`   Crew size: ${crewSize}`);

  // Get service weights for this job type
  const weights = getServiceWeights(job, context.serviceWeights);

  // ─────────────────────────────────────────────────────────────────
  // SCORE ALL WORKERS (with parallel availability checks)
  // ─────────────────────────────────────────────────────────────────

  const scores: AssignmentScore[] = [];

  // Check availability for all workers in parallel
  const availabilityChecks = await Promise.all(
    context.workers.map(async (worker) => {
      const availability = await checkAvailability({
        userId: worker.id,
        date: jobStart,
        startTime: formatInProviderTz(job.startTime, 'HH:mm', 'America/Chicago'),
        endTime: formatInProviderTz(job.endTime, 'HH:mm', 'America/Chicago'),
        durationHours: jobDuration / 60
      });
      return { worker, available: availability.available };
    })
  );

  // Score only available workers with detailed logging
  const availableCount = availabilityChecks.filter(c => c.available).length;
  console.log(`   Checking ${context.workers.length} workers for availability...`);
  console.log(`   ${availableCount}/${context.workers.length} workers available during ${jobStart.toLocaleTimeString()} - ${jobEnd.toLocaleTimeString()}`);

  const failedScores: { worker: string; reasons: string[] }[] = [];

  for (const { worker, available } of availabilityChecks) {
    const workerName = `${worker.firstName} ${worker.lastName}`;

    if (!available) {
      console.log(`   ❌ ${workerName}: Not available (schedule conflict or outside working hours)`);
      continue;
    }

    // Calculate score
    const score = calculateAssignmentScore(job, worker, context, weights);

    if (score.passed) {
      scores.push(score);
      console.log(`   ✅ ${workerName}: Score ${score.totalScore.toFixed(1)}% (SLA: ${score.breakdown.sla?.toFixed(0) || 0}, Route: ${score.breakdown.route?.toFixed(0) || 0}, Balance: ${score.breakdown.balance?.toFixed(0) || 0})`);
    } else {
      failedScores.push({ worker: workerName, reasons: score.reasons });
      console.log(`   ❌ ${workerName}: Failed filters - ${score.reasons.join(', ')}`);
    }
  }

  if (scores.length === 0) {
    console.log(`   ❌ No workers passed scoring:`);
    failedScores.forEach(f => {
      console.log(`      - ${f.worker}: ${f.reasons.join(', ')}`);
    });
    return null;
  }

  // Sort by score
  scores.sort((a, b) => b.totalScore - a.totalScore);

  // ─────────────────────────────────────────────────────────────────
  // HANDLE CREW JOBS (2-4 workers)
  // ─────────────────────────────────────────────────────────────────

  const selectedWorkerIds: string[] = [];

  if (crewSize === 1) {
    selectedWorkerIds.push(scores[0].workerId);
  } else {
    for (let i = 0; i < Math.min(crewSize, scores.length); i++) {
      selectedWorkerIds.push(scores[i].workerId);
    }
  }

  // Get primary worker
  const primaryWorker = scores[0];
  const primarySchedule = context.existingAssignments.get(primaryWorker.workerId)!;

  // Calculate drive time
  let driveTime = 0;
  if (primarySchedule.currentLocation && job.latitude && job.longitude) {
    const distance = calculateHaversineDistance(
      primarySchedule.currentLocation,
      { latitude: job.latitude, longitude: job.longitude }
    );
    driveTime = Math.ceil(distance.miles / 30 * 60); // Assume 30 mph
  }

  // ─────────────────────────────────────────────────────────────────
  // UPDATE CONTEXT
  // ─────────────────────────────────────────────────────────────────

  for (const workerId of selectedWorkerIds) {
    const schedule = context.existingAssignments.get(workerId)!;

    schedule.jobs.push({
      job,
      startTime: jobStart,
      endTime: jobEnd,
      orderInRoute: schedule.jobs.length + 1
    });

    schedule.totalHours += jobDuration / 60;
    schedule.totalDriveTime += driveTime;

    if (job.latitude && job.longitude) {
      schedule.currentLocation = { latitude: job.latitude, longitude: job.longitude };
    }
  }

  return {
    jobId: job.id,
    workerIds: selectedWorkerIds,
    suggestedStart: jobStart,
    suggestedEnd: jobEnd,
    orderInRoute: primarySchedule.jobs.length,
    driveTimeFromPrev: driveTime,
    totalScore: primaryWorker.totalScore,
    scoreBreakdown: primaryWorker.breakdown
  };
}

// ═══════════════════════════════════════════════════════════════════
// TRY CREW ASSIGNMENT
// ═══════════════════════════════════════════════════════════════════

interface CrewInfo {
  id: string;
  name: string;
  userIds: string[];
  color: string;
}

async function tryCrewAssignment(
  job: JobWithDetails,
  crews: CrewInfo[],
  context: SchedulingContext
): Promise<ProposedAssignment | null> {
  const jobStart = new Date(job.startTime);
  const jobEnd = new Date(job.endTime);
  const jobDuration = (jobEnd.getTime() - jobStart.getTime()) / (1000 * 60);

  // Skip crew assignment for single-person jobs
  const crewSizeRequired = job.crewSizeRequired || 1;
  if (crewSizeRequired < 2) {
    return null;
  }

  console.log(`   👥 Trying crew assignment (requires ${crewSizeRequired} workers)...`);

  for (const crew of crews) {
    // Skip crews with fewer members than required
    if (crew.userIds.length < crewSizeRequired) {
      continue;
    }

    // Get active crew members from context
    const activeCrewMembers = context.workers.filter(
      w => crew.userIds.includes(w.id)
    );

    if (activeCrewMembers.length < crewSizeRequired) {
      console.log(`   ❌ Crew "${crew.name}": Not enough active members (${activeCrewMembers.length}/${crewSizeRequired})`);
      continue;
    }

    // Check if ALL crew members are available
    const availabilityChecks = await Promise.all(
      activeCrewMembers.map(async (member) => {
        const available = await checkAvailability({
          userId: member.id,
          date: jobStart,
          startTime: formatInProviderTz(job.startTime, 'HH:mm', 'America/Chicago'),
          endTime: formatInProviderTz(job.endTime, 'HH:mm', 'America/Chicago'),
          durationHours: jobDuration / 60
        });
        return { member, available: available.available };
      })
    );

    const allAvailable = availabilityChecks.every(check => check.available);

    if (!allAvailable) {
      const unavailable = availabilityChecks
        .filter(c => !c.available)
        .map(c => `${c.member.firstName}`);
      console.log(`   ❌ Crew "${crew.name}": Members unavailable: ${unavailable.join(', ')}`);
      continue;
    }

    // All crew members are available! Assign the crew
    console.log(`   ✅ Crew "${crew.name}" is available with all ${activeCrewMembers.length} members`);

    const crewMemberIds = activeCrewMembers.map(m => m.id);

    // Calculate drive time from first member's location
    let driveTime = 0;
    const primaryMember = activeCrewMembers[0];
    const primarySchedule = context.existingAssignments.get(primaryMember.id);
    if (primarySchedule?.currentLocation && job.latitude && job.longitude) {
      const distance = calculateHaversineDistance(
        primarySchedule.currentLocation,
        { latitude: job.latitude, longitude: job.longitude }
      );
      driveTime = Math.ceil(distance.miles / 30 * 60);
    }

    // Update context for all crew members
    for (const memberId of crewMemberIds) {
      const schedule = context.existingAssignments.get(memberId);
      if (schedule) {
        schedule.jobs.push({
          job,
          startTime: jobStart,
          endTime: jobEnd,
          orderInRoute: schedule.jobs.length + 1
        });
        schedule.totalHours += jobDuration / 60;
        schedule.totalDriveTime += driveTime;
        if (job.latitude && job.longitude) {
          schedule.currentLocation = { latitude: job.latitude, longitude: job.longitude };
        }
      }
    }

    return {
      jobId: job.id,
      workerIds: crewMemberIds,
      suggestedStart: jobStart,
      suggestedEnd: jobEnd,
      orderInRoute: primarySchedule?.jobs.length || 1,
      driveTimeFromPrev: driveTime,
      totalScore: 85, // Crew assignments get a good base score
      scoreBreakdown: {
        sla: 90,
        route: 80,
        continuity: 85,
        balance: 85
      }
    };
  }

  console.log(`   ℹ️ No available crews found, falling back to individual assignment`);
  return null;
}
