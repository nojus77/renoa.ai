import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { scoreWorkersForJob } from '@/lib/assignment-scoring';

const prisma = new PrismaClient();

interface BatchAutoAssignRequest {
  providerId: string;
  jobIds?: string[];
  minMatchScore?: number;
  strategy?: 'balanced' | 'fastest' | 'best_match';
  date?: string;
}

interface Assignment {
  jobId: string;
  jobName: string;
  customerName: string;
  workerId: string;
  workerName: string;
  matchScore: number;
  reasoning: string;
}

interface Failure {
  jobId: string;
  jobName: string;
  customerName: string;
  reason: string;
}

/**
 * POST /api/provider/jobs/batch-auto-assign
 * Automatically assign multiple jobs using AI suggestions
 */
export async function POST(request: NextRequest) {
  try {
    const startTime = Date.now();
    const body: BatchAutoAssignRequest = await request.json();
    const {
      providerId,
      jobIds,
      minMatchScore = 60,
      strategy = 'balanced',
      date,
    } = body;

    if (!providerId) {
      return NextResponse.json(
        { error: 'Provider ID required' },
        { status: 400 }
      );
    }

    // Build job query
    const jobQuery: any = {
      providerId,
      status: { notIn: ['cancelled', 'completed'] },
      OR: [
        { assignedUserIds: { isEmpty: true } },
        { assignedUserIds: { equals: [] } },
      ],
    };

    // If specific job IDs provided, use those
    if (jobIds && jobIds.length > 0) {
      jobQuery.id = { in: jobIds };
    }

    // If date provided, filter to that day
    if (date) {
      const targetDate = new Date(date);
      const dayStart = new Date(targetDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(targetDate);
      dayEnd.setHours(23, 59, 59, 999);

      jobQuery.startTime = { gte: dayStart, lte: dayEnd };
    }

    // Get all unassigned jobs
    const jobs = await prisma.job.findMany({
      where: jobQuery,
      include: { customer: true },
      orderBy: [
        { startTime: 'asc' },
      ],
    });

    if (jobs.length === 0) {
      return NextResponse.json({
        success: true,
        total: 0,
        assigned: 0,
        failed: 0,
        assignments: [],
        failures: [],
        message: 'No unassigned jobs found',
        timeElapsed: '0.0s',
      });
    }

    // Get all active workers
    const workers = await prisma.providerUser.findMany({
      where: {
        providerId,
        status: 'active',
        role: { in: ['field_worker', 'owner'] },
      },
    });

    if (workers.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No active workers available',
        total: jobs.length,
        assigned: 0,
        failed: jobs.length,
        assignments: [],
        failures: jobs.map((job) => ({
          jobId: job.id,
          jobName: job.serviceType,
          customerName: job.customer?.name || 'Unknown',
          reason: 'No active workers available',
        })),
        timeElapsed: `${((Date.now() - startTime) / 1000).toFixed(1)}s`,
      });
    }

    // Track worker workload for balanced strategy
    const workerLoads = new Map<string, number>();
    for (const worker of workers) {
      workerLoads.set(worker.id, 0);
    }

    // Get existing job assignments for today to track initial workload
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const existingJobs = await prisma.job.findMany({
      where: {
        providerId,
        startTime: { gte: today, lte: todayEnd },
        status: { notIn: ['cancelled'] },
        assignedUserIds: { isEmpty: false },
      },
    });

    // Initialize worker loads from existing assignments
    for (const existingJob of existingJobs) {
      const duration = (existingJob.endTime.getTime() - existingJob.startTime.getTime()) / (1000 * 60 * 60);
      for (const userId of existingJob.assignedUserIds || []) {
        const currentLoad = workerLoads.get(userId) || 0;
        workerLoads.set(userId, currentLoad + duration);
      }
    }

    const assignments: Assignment[] = [];
    const failures: Failure[] = [];

    // Process each job
    for (const job of jobs) {
      try {
        // Get suggestions for this job
        const suggestions = await scoreWorkersForJob(job.id, providerId, workers.length);

        // Filter by min score
        const validSuggestions = suggestions.filter(
          (s) => s.totalScore >= minMatchScore
        );

        if (validSuggestions.length === 0) {
          failures.push({
            jobId: job.id,
            jobName: job.serviceType,
            customerName: job.customer?.name || 'Unknown',
            reason: `No workers meet minimum match score (${minMatchScore}%)`,
          });
          continue;
        }

        // Pick worker based on strategy
        let selectedWorker;

        if (strategy === 'balanced') {
          // Sort by current workload (ascending), then by score (descending)
          selectedWorker = validSuggestions.sort((a, b) => {
            const loadA = workerLoads.get(a.workerId) || 0;
            const loadB = workerLoads.get(b.workerId) || 0;

            // Prioritize workers with less workload
            if (Math.abs(loadA - loadB) > 1) {
              return loadA - loadB;
            }

            // If workload is similar, prioritize higher score
            return b.totalScore - a.totalScore;
          })[0];
        } else if (strategy === 'fastest') {
          // Pick worker with highest availability score
          selectedWorker = validSuggestions.sort(
            (a, b) => b.factors.availability - a.factors.availability
          )[0];
        } else {
          // best_match: Pick highest total score
          selectedWorker = validSuggestions[0];
        }

        if (!selectedWorker) {
          failures.push({
            jobId: job.id,
            jobName: job.serviceType,
            customerName: job.customer?.name || 'Unknown',
            reason: 'Could not select a suitable worker',
          });
          continue;
        }

        // Assign job
        await prisma.job.update({
          where: { id: job.id },
          data: {
            assignedUserIds: [selectedWorker.workerId],
          },
        });

        // Update workload tracking
        const jobDuration = (job.endTime.getTime() - job.startTime.getTime()) / (1000 * 60 * 60);
        workerLoads.set(
          selectedWorker.workerId,
          (workerLoads.get(selectedWorker.workerId) || 0) + jobDuration
        );

        // Record assignment
        assignments.push({
          jobId: job.id,
          jobName: job.serviceType,
          customerName: job.customer?.name || 'Unknown',
          workerId: selectedWorker.workerId,
          workerName: selectedWorker.workerName,
          matchScore: selectedWorker.totalScore,
          reasoning: selectedWorker.reasoning.join(', '),
        });
      } catch (error) {
        console.error(`Error processing job ${job.id}:`, error);
        failures.push({
          jobId: job.id,
          jobName: job.serviceType,
          customerName: job.customer?.name || 'Unknown',
          reason: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    const timeElapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    return NextResponse.json({
      success: true,
      total: jobs.length,
      assigned: assignments.length,
      failed: failures.length,
      assignments,
      failures,
      strategy,
      minMatchScore,
      timeElapsed: `${timeElapsed}s`,
      message:
        assignments.length === jobs.length
          ? 'All jobs assigned successfully'
          : failures.length > 0
            ? `Assigned ${assignments.length} of ${jobs.length} jobs`
            : 'No jobs could be assigned',
    });
  } catch (error) {
    console.error('Error in batch auto-assign:', error);
    return NextResponse.json(
      { error: 'Failed to process batch assignment' },
      { status: 500 }
    );
  }
}
