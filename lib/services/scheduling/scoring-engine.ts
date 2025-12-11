/**
 * Scoring Engine for Smart Scheduler
 *
 * Implements hard filters and dynamic scoring for worker-job assignments
 */

import type { Job, ProviderUser, Skill, WorkerMetrics, WorkerSettings, Customer } from '@prisma/client';
import { calculateHaversineDistance } from '../distance-service';
import { addMinutes, differenceInMinutes } from 'date-fns';

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

export interface WorkerWithDetails extends ProviderUser {
  workerSkills: Array<{
    id: string;
    skillId: string;
    level: string;
    skill: Skill;
  }>;
  metrics?: WorkerMetrics | null;
  settings?: WorkerSettings | null;
}

export interface JobWithDetails extends Job {
  customer: Customer & {
    preferences?: {
      preferredWorkers: string[];
      blockedWorkers: string[];
    } | null;
  };
}

export interface SchedulingContext {
  date: Date;
  workers: WorkerWithDetails[];
  jobs: JobWithDetails[];
  existingAssignments: Map<string, WorkerScheduleForDay>;
  serviceWeights: Map<string, ServiceWeights>;
}

export interface WorkerScheduleForDay {
  workerId: string;
  jobs: Array<{
    job: JobWithDetails;
    startTime: Date;
    endTime: Date;
    orderInRoute: number;
  }>;
  currentLocation: { latitude: number; longitude: number } | null;
  totalHours: number;
  totalDriveTime: number;
}

export interface ServiceWeights {
  weightSLA: number;        // 0-45
  weightRoute: number;      // 0-35
  weightContinuity: number; // 0-15
  weightBalance: number;    // 0-15
}

export interface AssignmentScore {
  workerId: string;
  jobId: string;
  totalScore: number;
  passed: boolean;
  breakdown: {
    sla: number;
    route: number;
    continuity: number;
    balance: number;
  };
  reasons: string[];
  hardFilters: {
    hasRequiredSkills: boolean;
    isAvailable: boolean;
    withinZone: boolean;
    withinMaxHours: boolean;
  };
}

// ═══════════════════════════════════════════════════════════════════
// HARD FILTERS (MUST PASS ALL)
// ═══════════════════════════════════════════════════════════════════

export function applyHardFilters(
  job: JobWithDetails,
  worker: WorkerWithDetails,
  context: SchedulingContext
): { passed: boolean; reasons: string[] } {
  const reasons: string[] = [];

  // 1. FLEXIBLE SKILL CHECK - Worker needs AT LEAST ONE of the acceptable skills
  const acceptableSkills = getRequiredSkillsForJob(job);
  const workerSkillNames = worker.workerSkills?.map(ws => ws.skill.name) || [];

  if (acceptableSkills.length > 0) {
    // Check if worker has ANY of the acceptable skills (with fuzzy matching)
    const hasAnyAcceptableSkill = acceptableSkills.some(acceptableSkill =>
      workerSkillNames.some(workerSkill =>
        // Exact match OR partial match (case-insensitive)
        workerSkill.toLowerCase() === acceptableSkill.toLowerCase() ||
        workerSkill.toLowerCase().includes(acceptableSkill.toLowerCase()) ||
        acceptableSkill.toLowerCase().includes(workerSkill.toLowerCase())
      )
    );

    if (!hasAnyAcceptableSkill) {
      // Show first 3 acceptable skills in error message
      const skillsToShow = acceptableSkills.slice(0, 3).join(' OR ');
      reasons.push(`Needs one of: ${skillsToShow}${acceptableSkills.length > 3 ? '...' : ''}`);
    }
  }

  // 2. REQUIRED EQUIPMENT
  if (job.requiredEquipment && job.requiredEquipment.length > 0) {
    const workerEquipment = workerSkillNames.filter(s =>
      s.includes('Mower') || s.includes('Chainsaw') || s.includes('Truck') ||
      s.includes('Excavator') || s.includes('Grinder') || s.includes('Skid Steer')
    );
    const hasEquipment = job.requiredEquipment.every(eq =>
      workerEquipment.some(we => we.includes(eq))
    );
    if (!hasEquipment) {
      reasons.push(`Missing equipment: ${job.requiredEquipment.join(', ')}`);
    }
  }

  // 3. ZONE RESTRICTIONS
  if (job.zone && worker.settings?.preferredZones) {
    const preferredZones = worker.settings.preferredZones;
    if (preferredZones.length > 0 && !preferredZones.includes(job.zone)) {
      reasons.push(`Worker doesn't service ${job.zone} zone`);
    }
  }

  // 4. CUSTOMER BLOCKS
  const blockedWorkers = job.customer?.preferences?.blockedWorkers || [];
  if (blockedWorkers.includes(worker.id)) {
    reasons.push('Customer has blocked this worker');
  }

  return {
    passed: reasons.length === 0,
    reasons
  };
}

/**
 * Get flexible skill requirements for a job
 * Returns an array of acceptable skills - worker needs ANY ONE of these
 */
function getRequiredSkillsForJob(job: JobWithDetails): string[] {
  // Map service types to FLEXIBLE skill requirements
  // Worker needs AT LEAST ONE skill from this list
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

  return skillMap[job.serviceType] || [];
}

// ═══════════════════════════════════════════════════════════════════
// DYNAMIC SCORING (0-100 points)
// ═══════════════════════════════════════════════════════════════════

export function calculateAssignmentScore(
  job: JobWithDetails,
  worker: WorkerWithDetails,
  context: SchedulingContext,
  weights: ServiceWeights
): AssignmentScore {

  const breakdown = {
    sla: 0,
    route: 0,
    continuity: 0,
    balance: 0
  };

  const workerSchedule = context.existingAssignments.get(worker.id);

  // SLA Score
  breakdown.sla = calculateSLAScore(job, worker, workerSchedule, weights.weightSLA);

  // Route Score
  breakdown.route = calculateRouteScore(job, worker, workerSchedule, weights.weightRoute);

  // Continuity Score
  breakdown.continuity = calculateContinuityScore(job, worker, context, weights.weightContinuity);

  // Load Balance Score
  breakdown.balance = calculateLoadBalanceScore(worker, workerSchedule, context, weights.weightBalance);

  // Total Score
  const totalScore = breakdown.sla + breakdown.route + breakdown.continuity + breakdown.balance;

  // Apply hard filters
  const hardFilters = applyHardFilters(job, worker, context);

  return {
    workerId: worker.id,
    jobId: job.id,
    totalScore: Math.round(totalScore * 10) / 10,
    passed: hardFilters.passed,
    breakdown,
    reasons: hardFilters.reasons,
    hardFilters: {
      hasRequiredSkills: !hardFilters.reasons.some(r => r.includes('skills')),
      isAvailable: true,
      withinZone: !hardFilters.reasons.some(r => r.includes('zone')),
      withinMaxHours: true
    }
  };
}

// ─────────────────────────────────────────────────────────────────────
// SLA SCORE: Can worker arrive on time?
// ─────────────────────────────────────────────────────────────────────

function calculateSLAScore(
  job: JobWithDetails,
  worker: WorkerWithDetails,
  schedule: WorkerScheduleForDay | undefined,
  maxPoints: number
): number {

  const jobStart = new Date(job.startTime);
  const serviceWindowMins = job.serviceWindowMins || 60;

  // If worker has no jobs yet, perfect score
  if (!schedule || schedule.jobs.length === 0) {
    return maxPoints;
  }

  const previousJob = schedule.jobs[schedule.jobs.length - 1];
  if (!previousJob) return maxPoints;

  // Calculate travel time
  if (!job.latitude || !job.longitude ||
      !previousJob.job.latitude || !previousJob.job.longitude) {
    return maxPoints * 0.8;
  }

  const distance = calculateHaversineDistance(
    { latitude: previousJob.job.latitude, longitude: previousJob.job.longitude },
    { latitude: job.latitude, longitude: job.longitude }
  );

  const travelTime = Math.ceil(distance.miles / 30 * 60); // Assume 30 mph avg
  const arrivalTime = addMinutes(previousJob.endTime, travelTime);
  const minutesLate = differenceInMinutes(arrivalTime, jobStart);

  if (minutesLate <= 0) {
    return maxPoints;
  } else if (minutesLate <= serviceWindowMins) {
    return maxPoints * (1 - minutesLate / serviceWindowMins);
  } else {
    return 0;
  }
}

// ─────────────────────────────────────────────────────────────────────
// ROUTE SCORE: How efficient is the drive?
// ─────────────────────────────────────────────────────────────────────

function calculateRouteScore(
  job: JobWithDetails,
  worker: WorkerWithDetails,
  schedule: WorkerScheduleForDay | undefined,
  maxPoints: number
): number {

  if (!job.latitude || !job.longitude) {
    return maxPoints * 0.5;
  }

  let startLocation: { latitude: number; longitude: number };

  if (schedule && schedule.currentLocation) {
    startLocation = schedule.currentLocation;
  } else if (worker.homeLatitude && worker.homeLongitude) {
    startLocation = {
      latitude: worker.homeLatitude,
      longitude: worker.homeLongitude
    };
  } else {
    return maxPoints * 0.7;
  }

  const distance = calculateHaversineDistance(startLocation, {
    latitude: job.latitude,
    longitude: job.longitude
  });

  const driveTime = Math.ceil(distance.miles / 30 * 60); // minutes

  if (driveTime <= 5) return maxPoints;
  if (driveTime <= 15) return maxPoints * 0.9;
  if (driveTime <= 30) return maxPoints * 0.6;
  if (driveTime <= 45) return maxPoints * 0.3;
  return 0;
}

// ─────────────────────────────────────────────────────────────────────
// CONTINUITY SCORE: Has worker done jobs for this customer before?
// ─────────────────────────────────────────────────────────────────────

function calculateContinuityScore(
  job: JobWithDetails,
  worker: WorkerWithDetails,
  context: SchedulingContext,
  maxPoints: number
): number {

  // Check customer preferences
  const preferences = job.customer?.preferences;
  if (preferences?.preferredWorkers?.includes(worker.id)) {
    return maxPoints;
  }

  // For recurring jobs, prefer workers who've worked in this zone
  if (job.jobCategory === 'recurring' || job.jobCategory === 'maintenance') {
    const hasWorkedInZone = context.existingAssignments
      .get(worker.id)?.jobs
      .some(j => j.job.zone === job.zone);

    if (hasWorkedInZone) {
      return maxPoints * 0.7;
    }
  }

  return 0;
}

// ─────────────────────────────────────────────────────────────────────
// LOAD BALANCE SCORE: Distribute work evenly
// ─────────────────────────────────────────────────────────────────────

function calculateLoadBalanceScore(
  worker: WorkerWithDetails,
  schedule: WorkerScheduleForDay | undefined,
  context: SchedulingContext,
  maxPoints: number
): number {

  const workerHours = schedule?.totalHours || 0;

  const allHours = Array.from(context.existingAssignments.values())
    .map(s => s.totalHours);
  const avgHours = allHours.length > 0
    ? allHours.reduce((a, b) => a + b, 0) / allHours.length
    : 0;

  if (workerHours < avgHours - 1) {
    return maxPoints;
  } else if (workerHours < avgHours) {
    return maxPoints * 0.7;
  } else if (workerHours === avgHours) {
    return maxPoints * 0.5;
  } else if (workerHours < avgHours + 2) {
    return maxPoints * 0.3;
  }

  return 0;
}

// ═══════════════════════════════════════════════════════════════════
// GET WEIGHTS FOR SERVICE TYPE
// ═══════════════════════════════════════════════════════════════════

export function getServiceWeights(
  job: JobWithDetails,
  serviceConfigs: Map<string, ServiceWeights>
): ServiceWeights {

  const config = serviceConfigs.get(job.serviceType);
  if (config) return config;

  // Default weights based on job category/priority
  if (job.jobPriority >= 8 || job.jobCategory === 'emergency') {
    return {
      weightSLA: 45,
      weightRoute: 20,
      weightContinuity: 5,
      weightBalance: 10
    };
  }

  if (job.jobCategory === 'recurring' || job.jobCategory === 'maintenance') {
    return {
      weightSLA: 25,
      weightRoute: 35,
      weightContinuity: 15,
      weightBalance: 10
    };
  }

  if (job.jobCategory === 'first_visit') {
    return {
      weightSLA: 40,
      weightRoute: 25,
      weightContinuity: 5,
      weightBalance: 15
    };
  }

  // Default balanced weights
  return {
    weightSLA: 35,
    weightRoute: 30,
    weightContinuity: 15,
    weightBalance: 20
  };
}
