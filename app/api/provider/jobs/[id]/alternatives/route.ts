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
        customer: {
          include: { preferences: true },
        },
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
    const workers = (await prisma.providerUser.findMany({
      where: {
        providerId: job.providerId,
        role: 'field',
        status: 'active',
      },
      include: {
        workerSkills: {
          include: { skill: true },
        },
        metrics: true,
        settings: true,
      },
    })) as WorkerWithDetails[];

    // Get service configs
    const serviceConfigs = await prisma.serviceTypeConfig.findMany({
      where: { providerId: job.providerId },
    });

    const serviceWeights = new Map(
      serviceConfigs.map((c) => [
        c.serviceType,
        {
          weightSLA: c.weightSLA,
          weightRoute: c.weightRoute,
          weightContinuity: c.weightContinuity,
          weightBalance: c.weightBalance,
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
