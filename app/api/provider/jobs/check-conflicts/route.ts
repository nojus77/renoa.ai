import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/provider/jobs/check-conflicts
 * Check for scheduling conflicts for specific workers
 */
export async function POST(request: NextRequest) {
  try {
    const { providerId, startTime, duration, workerIds, excludeJobId } = await request.json();

    if (!providerId || !startTime || !duration || !workerIds || workerIds.length === 0) {
      return NextResponse.json({ hasConflict: false });
    }

    const startDate = new Date(startTime);
    const endDate = new Date(startDate.getTime() + duration * 60 * 1000); // duration in minutes

    // Find any jobs that overlap with the time slot for the specified workers
    const conflicts = await prisma.job.findMany({
      where: {
        providerId,
        status: { notIn: ['cancelled', 'completed'] },
        // Check if any of the specified workers are assigned
        assignedUserIds: {
          hasSome: workerIds,
        },
        // Exclude the current job if editing
        ...(excludeJobId ? { id: { not: excludeJobId } } : {}),
        // Time overlap check: job overlaps if it starts before our end AND ends after our start
        OR: [
          {
            // Job starts during our time slot
            startTime: {
              gte: startDate,
              lt: endDate,
            },
          },
          {
            // Job ends during our time slot
            endTime: {
              gt: startDate,
              lte: endDate,
            },
          },
          {
            // Job spans our entire time slot
            AND: [
              { startTime: { lte: startDate } },
              { endTime: { gte: endDate } },
            ],
          },
        ],
      },
      include: {
        customer: {
          select: { name: true },
        },
      },
    });

    if (conflicts.length === 0) {
      return NextResponse.json({ hasConflict: false });
    }

    // Get worker names for the conflict message
    const conflictingWorkerIds = new Set<string>();
    conflicts.forEach(job => {
      job.assignedUserIds.forEach(id => {
        if (workerIds.includes(id)) {
          conflictingWorkerIds.add(id);
        }
      });
    });

    const workers = await prisma.providerUser.findMany({
      where: { id: { in: Array.from(conflictingWorkerIds) } },
      select: { id: true, firstName: true, lastName: true },
    });

    const workerNames = workers.map(w => `${w.firstName} ${w.lastName}`);
    const conflictJob = conflicts[0];

    const formatTime = (date: Date) => {
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    };

    const message = `${workerNames.join(', ')} ${workerNames.length === 1 ? 'has' : 'have'} a conflicting job at ${formatTime(conflictJob.startTime)} (${conflictJob.customer?.name || 'Unknown Customer'} - ${conflictJob.serviceType})`;

    return NextResponse.json({
      hasConflict: true,
      message,
      conflicts: conflicts.map(c => ({
        id: c.id,
        serviceType: c.serviceType,
        customerName: c.customer?.name || 'Unknown',
        startTime: c.startTime,
        endTime: c.endTime,
        assignedUserIds: c.assignedUserIds,
      })),
    });
  } catch (error) {
    console.error('[Check Conflicts] Error:', error);
    return NextResponse.json({ hasConflict: false, error: 'Failed to check conflicts' });
  }
}
