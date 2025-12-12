import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { checkAvailability } from '@/lib/services/availability-service';
import {
  calculateAssignmentScore,
  getServiceWeights,
  type SchedulingContext,
  type WorkerWithDetails,
  type JobWithDetails,
} from '@/lib/services/scheduling/scoring-engine';
import { geocodeAddress } from '@/lib/services/geocoding-service';

const prisma = new PrismaClient();

/**
 * GET /api/provider/jobs/[jobId]/alternatives
 * Get all possible workers for a job with scores
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const currentWorkerId = searchParams.get('currentWorkerId');

    // Get the job
    const job = (await prisma.job.findUnique({
      where: { id: params.id },
      include: {
        customer: true,
      },
    })) as JobWithDetails | null;

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Ensure coordinates
    if (!job.latitude || !job.longitude) {
      const coords = await geocodeAddress(job.address);
      if (coords) {
        await prisma.job.update({
          where: { id: job.id },
          data: {
            latitude: coords.latitude,
            longitude: coords.longitude,
            zone: coords.zipCode || null,
          },
        });
        job.latitude = coords.latitude;
        job.longitude = coords.longitude;
      }
    }

    // Get all workers
    const workersData = await prisma.providerUser.findMany({
      where: {
        providerId: job.providerId,
        role: 'field',
        status: 'active',
      },
      include: {
        workerSkills: {
          include: { skill: true },
        },
      },
    });

    // Fetch metrics and settings separately (they're not Prisma relations)
    const workerIds = workersData.map(w => w.id);
    const [metricsData, settingsData] = await Promise.all([
      prisma.workerMetrics.findMany({ where: { userId: { in: workerIds } } }),
      prisma.workerSettings.findMany({ where: { userId: { in: workerIds } } }),
    ]);

    const metricsMap = new Map(metricsData.map(m => [m.userId, m]));
    const settingsMap = new Map(settingsData.map(s => [s.userId, s]));

    // Combine into WorkerWithDetails
    const workers = workersData.map(w => ({
      ...w,
      metrics: metricsMap.get(w.id) || null,
      settings: settingsMap.get(w.id) || null,
    })) as WorkerWithDetails[];

    // Get service configs
    const serviceConfigs = await prisma.serviceTypeConfig.findMany({
      where: { providerId: job.providerId },
    });

    // Map the actual schema fields to the expected ServiceWeights interface
    const serviceWeights = new Map(
      serviceConfigs.map((c) => [
        c.serviceType,
        {
          weightSLA: c.skillWeight,           // Map skillWeight to weightSLA
          weightRoute: c.availabilityWeight,  // Map availabilityWeight to weightRoute
          weightContinuity: c.workloadWeight, // Map workloadWeight to weightContinuity
          weightBalance: c.historyWeight,     // Map historyWeight to weightBalance
        },
      ])
    );

    // Build context
    const context: SchedulingContext = {
      date: new Date(job.startTime),
      workers,
      jobs: [job],
      existingAssignments: new Map(),
      serviceWeights,
    };

    // Score all workers
    const alternatives = [];
    const jobStart = new Date(job.startTime);
    const jobEnd = new Date(job.endTime);
    const jobDuration =
      (jobEnd.getTime() - jobStart.getTime()) / (1000 * 60 * 60); // hours

    for (const worker of workers) {
      // Check availability
      const availability = await checkAvailability({
        userId: worker.id,
        date: jobStart,
        startTime: jobStart.toTimeString().substring(0, 5),
        endTime: jobEnd.toTimeString().substring(0, 5),
        durationHours: jobDuration,
      });

      // Calculate score
      const weights = getServiceWeights(job, serviceWeights);
      const score = calculateAssignmentScore(job, worker, context, weights);

      alternatives.push({
        workerId: worker.id,
        workerName: `${worker.firstName} ${worker.lastName}`,
        workerColor: worker.color,
        score: score.totalScore,
        breakdown: score.breakdown,
        isAvailable: availability.available,
        availabilityIssues: availability.conflicts || [],
        passed: score.passed && availability.available,
        hardFilterReasons: score.reasons,
        isCurrent: worker.id === currentWorkerId,
      });
    }

    // Sort by score (viable first, then by score)
    alternatives.sort((a, b) => {
      if (a.passed && !b.passed) return -1;
      if (!a.passed && b.passed) return 1;
      return b.score - a.score;
    });

    return NextResponse.json({ alternatives });
  } catch (error) {
    console.error('Get alternatives error:', error);
    return NextResponse.json(
      { error: 'Failed to get alternatives' },
      { status: 500 }
    );
  }
}
