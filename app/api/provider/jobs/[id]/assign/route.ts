import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createNotification } from '@/lib/notifications';

/**
 * POST /api/provider/jobs/[id]/assign
 * Assign or reassign users to a job
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { providerId, userIds = [] } = body;

    if (!providerId) {
      return NextResponse.json(
        { error: 'Provider ID required' },
        { status: 400 }
      );
    }

    // Verify job belongs to provider
    const job = await prisma.job.findUnique({
      where: { id },
    });

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    if (job.providerId !== providerId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Verify all user IDs belong to this provider
    if (userIds.length > 0) {
      const users = await prisma.providerUser.findMany({
        where: {
          id: { in: userIds },
          providerId,
        },
      });

      if (users.length !== userIds.length) {
        return NextResponse.json(
          { error: 'Some user IDs do not belong to this provider' },
          { status: 400 }
        );
      }
    }

    // Update job assignments
    const updatedJob = await prisma.job.update({
      where: { id },
      data: {
        assignedUserIds: userIds,
      },
      include: {
        customer: true,
      },
    });

    // Fetch assigned user details
    const assignedUsers = await prisma.providerUser.findMany({
      where: {
        id: { in: updatedJob.assignedUserIds },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        profilePhotoUrl: true,
      },
    });

    // Find newly assigned workers (not previously assigned)
    const previouslyAssigned = job.assignedUserIds || [];
    const newlyAssigned = userIds.filter((id: string) => !previouslyAssigned.includes(id));

    // Send notifications to newly assigned workers
    if (newlyAssigned.length > 0) {
      const jobDate = updatedJob.startTime.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
      const jobTime = updatedJob.startTime.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });

      console.log('📨 Sending job assignment notifications to newly assigned workers:', newlyAssigned);

      for (const workerId of newlyAssigned) {
        await createNotification({
          providerId,
          userId: workerId,
          type: 'job_assigned',
          title: 'New Job Assigned',
          message: `You've been assigned to ${updatedJob.serviceType} on ${jobDate} at ${jobTime}`,
          link: `/worker/job/${updatedJob.id}`,
          data: {
            jobId: updatedJob.id,
            serviceType: updatedJob.serviceType,
            startTime: updatedJob.startTime.toISOString(),
            address: updatedJob.address,
          },
        });
      }

      console.log('✅ Job assignment notifications sent to', newlyAssigned.length, 'workers');
    }

    return NextResponse.json({
      success: true,
      job: {
        ...updatedJob,
        assignedUsers,
      },
    });
  } catch (error) {
    console.error('Error assigning job:', error);
    return NextResponse.json(
      { error: 'Failed to assign job' },
      { status: 500 }
    );
  }
}
