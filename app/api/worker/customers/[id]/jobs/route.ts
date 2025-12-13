import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/worker/customers/[id]/jobs
 * Get job history for a customer (for workers to see past service history)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get customer's completed jobs
    const jobs = await prisma.job.findMany({
      where: {
        customerId: id,
        status: 'completed',
      },
      orderBy: { startTime: 'desc' },
      take: 20, // Limit to last 20 jobs
      select: {
        id: true,
        serviceType: true,
        startTime: true,
        endTime: true,
        status: true,
        actualValue: true,
        estimatedValue: true,
        internalNotes: true,
        assignedUserIds: true,
      },
    });

    // Get worker names for the jobs
    const workerIds = Array.from(new Set(jobs.flatMap(j => j.assignedUserIds)));
    const workers = await prisma.providerUser.findMany({
      where: { id: { in: workerIds } },
      select: { id: true, firstName: true, lastName: true },
    });

    const workerMap = new Map(
      workers.map(w => [w.id, `${w.firstName || ''} ${w.lastName || ''}`.trim()])
    );

    // Transform jobs for worker view
    const transformedJobs = jobs.map(job => {
      const workerNames = job.assignedUserIds
        .map(id => workerMap.get(id) || 'Unknown')
        .filter(Boolean);

      // Calculate duration if we have times
      let duration = 0;
      if (job.startTime && job.endTime) {
        duration = Math.round(
          (new Date(job.endTime).getTime() - new Date(job.startTime).getTime()) / 1000
        );
      }

      return {
        id: job.id,
        serviceType: job.serviceType,
        date: job.startTime.toISOString(),
        amount: job.actualValue || job.estimatedValue || 0,
        status: job.status,
        workerName: workerNames[0] || 'N/A',
        duration,
        notes: job.internalNotes || null,
      };
    });

    return NextResponse.json({ jobs: transformedJobs });
  } catch (error) {
    console.error('Error fetching customer jobs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customer jobs' },
      { status: 500 }
    );
  }
}
