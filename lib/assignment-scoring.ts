import { PrismaClient } from '@prisma/client';
import { startOfDay, endOfDay, differenceInMinutes } from 'date-fns';

const prisma = new PrismaClient();

// Scoring weights
const WEIGHTS = {
  skillMatch: 0.30,
  availability: 0.25,
  capacity: 0.20,
  proximity: 0.15,
  performance: 0.10,
};

// Types
export interface ScoringFactors {
  skillMatch: number;
  availability: number;
  capacity: number;
  proximity: number;
  performance: number;
}

export interface WorkerScore {
  workerId: string;
  workerName: string;
  workerPhoto: string | null;
  workerColor: string;
  totalScore: number;
  matchQuality: 'excellent' | 'good' | 'fair' | 'poor';
  factors: ScoringFactors;
  reasoning: string[];
  warnings: string[];
  estimatedTravelTime?: string;
  currentCapacity: number;
  jobsToday: number;
}

interface JobDetails {
  id: string;
  serviceType: string;
  startTime: Date;
  endTime: Date;
  address: string;
  estimatedValue: number | null;
  providerId: string;
}

interface WorkerSkillData {
  level: string;
  skill: {
    id: string;
    name: string;
    category: string | null;
  };
}

interface WorkerDetails {
  id: string;
  firstName: string;
  lastName: string;
  profilePhotoUrl: string | null;
  role: string;
  skills: string[]; // Keep for backward compatibility
  workerSkills: WorkerSkillData[];
  status: string;
}

// Worker colors for display
const WORKER_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
];

// Related skills mapping
const RELATED_SKILLS: Record<string, string[]> = {
  'lawn mowing': ['lawn care', 'landscaping', 'yard maintenance'],
  'lawn care': ['lawn mowing', 'landscaping', 'fertilization'],
  'landscaping': ['lawn care', 'planting', 'hardscaping', 'design'],
  'tree trimming': ['tree service', 'pruning', 'tree removal'],
  'tree service': ['tree trimming', 'tree removal', 'stump grinding'],
  'irrigation': ['sprinkler repair', 'water management', 'landscaping'],
  'mulching': ['landscaping', 'garden beds', 'lawn care'],
  'leaf removal': ['cleanup', 'lawn care', 'seasonal'],
  'snow removal': ['plowing', 'salting', 'winter services'],
  'fertilization': ['lawn care', 'weed control', 'turf management'],
  'hedge trimming': ['pruning', 'shrub care', 'landscaping'],
  'garden beds': ['mulching', 'planting', 'landscaping'],
  'hardscaping': ['patio installation', 'landscaping', 'stonework'],
  'planting': ['landscaping', 'garden beds', 'design'],
};

/**
 * Main scoring function - scores all workers for a specific job
 */
export async function scoreWorkersForJob(
  jobId: string,
  providerId: string,
  limit: number = 5
): Promise<WorkerScore[]> {
  // Get job details
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: { customer: true },
  });

  if (!job) {
    throw new Error('Job not found');
  }

  const jobDetails: JobDetails = {
    id: job.id,
    serviceType: job.serviceType,
    startTime: job.startTime,
    endTime: job.endTime,
    address: job.customer?.address || job.address,
    estimatedValue: job.estimatedValue ? Number(job.estimatedValue) : null,
    providerId: job.providerId,
  };

  // Get all active workers with their skills
  const workers = await prisma.providerUser.findMany({
    where: {
      providerId,
      status: 'active',
    },
    include: {
      workerSkills: {
        include: {
          skill: true,
        },
      },
    },
  });

  // Get all jobs for the day to check conflicts
  const dayStart = startOfDay(job.startTime);
  const dayEnd = endOfDay(job.startTime);

  const dayJobs = await prisma.job.findMany({
    where: {
      providerId,
      startTime: { gte: dayStart, lte: dayEnd },
      status: { notIn: ['cancelled'] },
      id: { not: jobId }, // Exclude the job being assigned
    },
    include: { customer: true },
  });

  // Score each worker
  const scores: WorkerScore[] = await Promise.all(
    workers.map(async (worker, index) => {
      const workerDetails: WorkerDetails = {
        id: worker.id,
        firstName: worker.firstName,
        lastName: worker.lastName,
        profilePhotoUrl: worker.profilePhotoUrl,
        role: worker.role,
        skills: worker.skills || [], // Keep for backward compatibility
        workerSkills: worker.workerSkills || [],
        status: worker.status,
      };

      // Get worker's jobs for the day
      const workerDayJobs = dayJobs.filter(j =>
        j.assignedUserIds?.includes(worker.id)
      );

      // Calculate each factor
      const skillScore = calculateSkillMatch(jobDetails, workerDetails);
      const availabilityScore = calculateAvailability(jobDetails, workerDayJobs);
      const capacityScore = calculateCapacity(workerDayJobs, job.startTime);
      const proximityScore = await calculateProximity(jobDetails, workerDayJobs);
      const performanceScore = await calculatePerformance(worker.id, providerId);

      // Calculate weighted total
      const totalScore = Math.round(
        (skillScore * WEIGHTS.skillMatch) +
        (availabilityScore * WEIGHTS.availability) +
        (capacityScore * WEIGHTS.capacity) +
        (proximityScore * WEIGHTS.proximity) +
        (performanceScore * WEIGHTS.performance)
      );

      // Calculate current capacity percentage
      const workerHours = workerDayJobs.reduce((total, j) => {
        return total + (j.endTime.getTime() - j.startTime.getTime()) / (1000 * 60 * 60);
      }, 0);
      const currentCapacity = Math.round((workerHours / 8) * 100);

      // Generate reasoning and warnings
      const reasoning = generateReasoning(
        { skillMatch: skillScore, availability: availabilityScore, capacity: capacityScore, proximity: proximityScore, performance: performanceScore },
        workerDetails,
        jobDetails,
        currentCapacity
      );

      const warnings = generateWarnings(
        { skillMatch: skillScore, availability: availabilityScore, capacity: capacityScore, proximity: proximityScore, performance: performanceScore },
        workerDetails,
        currentCapacity
      );

      return {
        workerId: worker.id,
        workerName: `${worker.firstName} ${worker.lastName}`,
        workerPhoto: worker.profilePhotoUrl,
        workerColor: WORKER_COLORS[index % WORKER_COLORS.length],
        totalScore,
        matchQuality: getMatchQuality(totalScore),
        factors: {
          skillMatch: skillScore,
          availability: availabilityScore,
          capacity: capacityScore,
          proximity: proximityScore,
          performance: performanceScore,
        },
        reasoning,
        warnings,
        currentCapacity,
        jobsToday: workerDayJobs.length,
      };
    })
  );

  // Sort by total score and return top N
  return scores
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, limit);
}

/**
 * Calculate skill match score (0-100)
 * Now uses the new skills system with proficiency levels
 */
function calculateSkillMatch(job: JobDetails, worker: WorkerDetails): number {
  const jobSkill = job.serviceType.toLowerCase();

  // First, try to match using the new skills system
  if (worker.workerSkills && worker.workerSkills.length > 0) {
    let bestScore = 0;
    let hasDirectMatch = false;

    for (const workerSkill of worker.workerSkills) {
      const skillName = workerSkill.skill.name.toLowerCase();
      const level = workerSkill.level;

      // Check for direct match
      if (skillName.includes(jobSkill) || jobSkill.includes(skillName)) {
        hasDirectMatch = true;
        // Score based on proficiency level
        if (level === 'expert') {
          return 100; // Perfect match with expert level
        } else if (level === 'intermediate') {
          return 90; // Good match with intermediate level
        } else { // basic
          return 75; // Decent match with basic level
        }
      }

      // Check for related skills
      const relatedSkills = RELATED_SKILLS[jobSkill] || [];
      for (const relatedSkill of relatedSkills) {
        if (skillName.includes(relatedSkill) || relatedSkill.includes(skillName)) {
          // Score related skills based on proficiency
          const relatedScore = level === 'expert' ? 70 : level === 'intermediate' ? 55 : 45;
          bestScore = Math.max(bestScore, relatedScore);
        }
      }

      // Check keyword matches
      const jobKeywords = jobSkill.split(/[\s,]+/);
      for (const keyword of jobKeywords) {
        if (keyword.length > 3 && skillName.includes(keyword)) {
          const keywordScore = level === 'expert' ? 50 : level === 'intermediate' ? 40 : 30;
          bestScore = Math.max(bestScore, keywordScore);
        }
      }
    }

    if (hasDirectMatch || bestScore > 0) {
      return bestScore;
    }
  }

  // Fallback to old skills array if no workerSkills
  const workerSkills = worker.skills.map(s => s.toLowerCase());

  // Perfect match (old system)
  if (workerSkills.some(skill => skill.includes(jobSkill) || jobSkill.includes(skill))) {
    return 100;
  }

  // Check for related skills (old system)
  const relatedSkills = RELATED_SKILLS[jobSkill] || [];
  for (const skill of workerSkills) {
    if (relatedSkills.some(related => skill.includes(related) || related.includes(skill))) {
      return 60; // Partial match
    }
  }

  // Check if any job skill keywords match worker skills (old system)
  const jobKeywords = jobSkill.split(/[\s,]+/);
  for (const keyword of jobKeywords) {
    if (keyword.length > 3 && workerSkills.some(skill => skill.includes(keyword))) {
      return 40; // Weak match
    }
  }

  // Field workers get base score (they can do most jobs)
  if (worker.role === 'field_worker') {
    return 30;
  }

  return 10; // No match but still assignable
}

/**
 * Calculate availability score based on conflicts (0-100)
 */
function calculateAvailability(job: JobDetails, workerJobs: any[]): number {
  if (workerJobs.length === 0) {
    return 100; // Completely free
  }

  const jobStart = job.startTime.getTime();
  const jobEnd = job.endTime.getTime();

  let maxOverlapMinutes = 0;

  for (const existingJob of workerJobs) {
    const existingStart = existingJob.startTime.getTime();
    const existingEnd = existingJob.endTime.getTime();

    // Check for overlap
    if (jobStart < existingEnd && existingStart < jobEnd) {
      const overlapStart = Math.max(jobStart, existingStart);
      const overlapEnd = Math.min(jobEnd, existingEnd);
      const overlapMinutes = (overlapEnd - overlapStart) / (1000 * 60);
      maxOverlapMinutes = Math.max(maxOverlapMinutes, overlapMinutes);
    }
  }

  if (maxOverlapMinutes === 0) {
    return 100; // No conflicts
  } else if (maxOverlapMinutes <= 15) {
    return 70; // Minor overlap (buffer time)
  } else if (maxOverlapMinutes <= 30) {
    return 50; // Some overlap
  } else if (maxOverlapMinutes <= 60) {
    return 25; // Significant overlap
  } else {
    return 0; // Major conflict
  }
}

/**
 * Calculate capacity score based on daily workload (0-100)
 */
function calculateCapacity(workerJobs: any[], jobDate: Date): number {
  const totalHours = workerJobs.reduce((total, job) => {
    return total + (job.endTime.getTime() - job.startTime.getTime()) / (1000 * 60 * 60);
  }, 0);

  const capacityPercent = (totalHours / 8) * 100; // Assume 8-hour workday

  if (capacityPercent <= 40) {
    return 100; // Underutilized - prioritize
  } else if (capacityPercent <= 60) {
    return 85; // Light load
  } else if (capacityPercent <= 75) {
    return 70; // Balanced
  } else if (capacityPercent <= 90) {
    return 40; // Busy
  } else {
    return 10; // Overloaded
  }
}

/**
 * Calculate proximity score based on previous job location (0-100)
 * Simplified version using address string matching
 */
async function calculateProximity(job: JobDetails, workerJobs: any[]): Promise<number> {
  if (workerJobs.length === 0) {
    return 70; // No prior jobs, neutral score
  }

  // Find the job that ends closest to the new job's start time
  const jobStart = job.startTime.getTime();
  let closestPriorJob = null;
  let minGap = Infinity;

  for (const existingJob of workerJobs) {
    const existingEnd = existingJob.endTime.getTime();
    if (existingEnd <= jobStart) {
      const gap = jobStart - existingEnd;
      if (gap < minGap) {
        minGap = gap;
        closestPriorJob = existingJob;
      }
    }
  }

  if (!closestPriorJob) {
    return 70; // No prior job on same day
  }

  // Simple proximity check using address similarity
  const jobAddress = job.address.toLowerCase();
  const priorAddress = (closestPriorJob.customer?.address || closestPriorJob.address || '').toLowerCase();

  // Check for same city/area
  const jobCity = extractCity(jobAddress);
  const priorCity = extractCity(priorAddress);

  if (jobCity && priorCity) {
    if (jobCity === priorCity) {
      return 90; // Same city
    }
  }

  // Check for same zip code
  const jobZip = extractZip(jobAddress);
  const priorZip = extractZip(priorAddress);

  if (jobZip && priorZip) {
    if (jobZip === priorZip) {
      return 100; // Same zip code - very close
    }
    // Check if first 3 digits match (same general area)
    if (jobZip.substring(0, 3) === priorZip.substring(0, 3)) {
      return 80;
    }
  }

  // Check gap time - if there's plenty of travel time, it's probably fine
  const gapMinutes = minGap / (1000 * 60);
  if (gapMinutes >= 60) {
    return 70; // Plenty of time to travel
  } else if (gapMinutes >= 30) {
    return 50; // Some travel time
  } else {
    return 30; // Tight schedule
  }
}

/**
 * Calculate performance score based on historical data (0-100)
 */
async function calculatePerformance(workerId: string, providerId: string): Promise<number> {
  // Get completed jobs for this worker in the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const completedJobs = await prisma.job.count({
    where: {
      assignedUserIds: { has: workerId },
      status: 'completed',
      completedAt: { gte: thirtyDaysAgo },
    },
  });

  const totalAssignedJobs = await prisma.job.count({
    where: {
      assignedUserIds: { has: workerId },
      startTime: { gte: thirtyDaysAgo },
      status: { notIn: ['cancelled'] },
    },
  });

  if (totalAssignedJobs === 0) {
    return 70; // New worker, neutral score
  }

  const completionRate = (completedJobs / totalAssignedJobs) * 100;

  if (completionRate >= 95) {
    return 100; // Top performer
  } else if (completionRate >= 85) {
    return 85;
  } else if (completionRate >= 75) {
    return 70;
  } else if (completionRate >= 60) {
    return 50;
  } else {
    return 30; // Below average
  }
}

/**
 * Generate human-readable reasoning for the score
 */
function generateReasoning(
  factors: ScoringFactors,
  worker: WorkerDetails,
  job: JobDetails,
  currentCapacity: number
): string[] {
  const reasons: string[] = [];

  // Skill match with proficiency level
  if (factors.skillMatch >= 90) {
    // Find the matching skill and its level
    const jobSkill = job.serviceType.toLowerCase();
    const matchingSkill = worker.workerSkills.find(ws =>
      ws.skill.name.toLowerCase().includes(jobSkill) || jobSkill.includes(ws.skill.name.toLowerCase())
    );
    if (matchingSkill) {
      const levelText = matchingSkill.level === 'expert' ? 'Expert' : matchingSkill.level === 'intermediate' ? 'Intermediate' : 'Basic';
      reasons.push(`${levelText} in ${matchingSkill.skill.name}`);
    } else {
      reasons.push(`Skilled in ${job.serviceType}`);
    }
  } else if (factors.skillMatch >= 80) {
    reasons.push(`Skilled in ${job.serviceType}`);
  } else if (factors.skillMatch >= 50) {
    reasons.push('Has related skills');
  }

  // Availability
  if (factors.availability === 100) {
    reasons.push('Completely available');
  } else if (factors.availability >= 70) {
    reasons.push('Mostly available');
  }

  // Capacity
  if (factors.capacity >= 85) {
    reasons.push(`Light workload (${currentCapacity}%)`);
  } else if (factors.capacity >= 60) {
    reasons.push(`Balanced schedule (${currentCapacity}%)`);
  }

  // Proximity
  if (factors.proximity >= 80) {
    reasons.push('Close to job location');
  }

  // Performance
  if (factors.performance >= 90) {
    reasons.push('Top performer');
  } else if (factors.performance >= 75) {
    reasons.push('Reliable worker');
  }

  return reasons;
}

/**
 * Generate warnings about potential issues
 */
function generateWarnings(
  factors: ScoringFactors,
  worker: WorkerDetails,
  currentCapacity: number
): string[] {
  const warnings: string[] = [];

  if (factors.skillMatch < 40) {
    warnings.push('Missing required skill');
  } else if (factors.skillMatch >= 75 && factors.skillMatch < 90) {
    // Worker has the skill but only at basic level
    warnings.push('Basic skill level only');
  }

  if (factors.availability < 50) {
    warnings.push('Has scheduling conflict');
  } else if (factors.availability < 70) {
    warnings.push('Minor time overlap');
  }

  if (factors.capacity < 30) {
    warnings.push(`Heavy workload (${currentCapacity}%)`);
  }

  if (factors.proximity < 40) {
    warnings.push('Far from previous job');
  }

  if (factors.performance < 50) {
    warnings.push('Below average completion rate');
  }

  return warnings;
}

/**
 * Get match quality label from score
 */
function getMatchQuality(score: number): 'excellent' | 'good' | 'fair' | 'poor' {
  if (score >= 80) return 'excellent';
  if (score >= 60) return 'good';
  if (score >= 40) return 'fair';
  return 'poor';
}

/**
 * Extract city from address string
 */
function extractCity(address: string): string | null {
  // Simple extraction - look for common patterns
  const parts = address.split(',');
  if (parts.length >= 2) {
    return parts[parts.length - 2].trim().toLowerCase();
  }
  return null;
}

/**
 * Extract zip code from address string
 */
function extractZip(address: string): string | null {
  const zipMatch = address.match(/\b\d{5}(-\d{4})?\b/);
  return zipMatch ? zipMatch[0] : null;
}
