import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createNotification } from '@/lib/notifications';

/**
 * POST /api/provider/jobs/[id]/assign
 * Assign or reassign users to a job
 *
 * Validations:
 * - Provider must own the job
 * - Workers must belong to provider and have role 'field'
 * - Workers must have ALL required skills (unless job.allowUnqualified)
 * - Cannot unassign workers from in_progress or on_the_way jobs
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { providerId, userIds = [], skipSkillCheck = false } = body;

    if (!providerId) {
      return NextResponse.json(
        { error: 'Provider ID required' },
        { status: 400 }
      );
    }

    // Verify job belongs to provider and get skill requirements
    const job = await prisma.job.findUnique({
      where: { id },
      select: {
        id: true,
        providerId: true,
        status: true,
        serviceType: true,
        startTime: true,
        address: true,
        assignedUserIds: true,
        requiredSkillIds: true,
        allowUnqualified: true,
        requiredWorkerCount: true,
      },
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

    // Prevent unassigning workers from active jobs (in_progress or on_the_way)
    const activeStatuses = ['in_progress', 'on_the_way'];
    if (activeStatuses.includes(job.status)) {
      // Check if we're removing any workers
      const previousWorkers = job.assignedUserIds || [];
      const removedWorkers = previousWorkers.filter((wId: string) => !userIds.includes(wId));

      if (removedWorkers.length > 0) {
        return NextResponse.json(
          {
            error: `Cannot unassign workers from a job that is ${job.status.replace('_', ' ')}`,
            status: job.status,
          },
          { status: 400 }
        );
      }
    }

    // Validate worker count matches job requirements
    const requiredCount = job.requiredWorkerCount || 1;
    if (userIds.length > 0 && userIds.length !== requiredCount) {
      // Allow partial assignment (for manual incremental assignment)
      // but warn if over-assigning
      if (userIds.length > requiredCount) {
        return NextResponse.json(
          {
            error: `This job requires ${requiredCount} worker${requiredCount > 1 ? 's' : ''}. You tried to assign ${userIds.length}.`,
            requiredCount,
            providedCount: userIds.length,
          },
          { status: 400 }
        );
      }
      // Note: under-assigning is allowed for incremental manual assignment
    }

    // Verify all user IDs belong to this provider and have 'field' role
    if (userIds.length > 0) {
      const users = await prisma.providerUser.findMany({
        where: {
          id: { in: userIds },
          providerId,
        },
        include: {
          workerSkills: {
            select: {
              skillId: true,
              skill: {
                select: { name: true },
              },
            },
          },
        },
      });

      if (users.length !== userIds.length) {
        return NextResponse.json(
          { error: 'Some user IDs do not belong to this provider' },
          { status: 400 }
        );
      }

      // Validate role: only field workers can be assigned to jobs
      const nonFieldUsers = users.filter(u => u.role !== 'field');
      if (nonFieldUsers.length > 0) {
        return NextResponse.json(
          {
            error: `Only field workers can be assigned to jobs. Invalid: ${nonFieldUsers.map(u => `${u.firstName} ${u.lastName}`).join(', ')}`,
            invalidUsers: nonFieldUsers.map(u => ({ id: u.id, name: `${u.firstName} ${u.lastName}`, role: u.role })),
          },
          { status: 400 }
        );
      }

      // Skill validation (unless skipSkillCheck or job allows unqualified)
      if (!skipSkillCheck && !job.allowUnqualified && job.requiredSkillIds && job.requiredSkillIds.length > 0) {
        // Get all provider skills for name lookup
        const allSkills = await prisma.skill.findMany({
          where: { providerId },
          select: { id: true, name: true },
        });
        const skillNameMap = new Map(allSkills.map(s => [s.id, s.name]));

        for (const user of users) {
          const workerSkillIds = user.workerSkills.map(ws => ws.skillId);

          // Check if worker has ALL required skills
          const missingSkillIds = job.requiredSkillIds.filter(
            (skillId: string) => !workerSkillIds.includes(skillId)
          );

          if (missingSkillIds.length > 0) {
            const missingSkillNames = missingSkillIds.map((id: string) => skillNameMap.get(id) || id);

            return NextResponse.json(
              {
                error: `Worker ${user.firstName} ${user.lastName} is missing required skills`,
                skillMismatch: true,
                workerId: user.id,
                workerName: `${user.firstName} ${user.lastName}`,
                missingSkillIds,
                missingSkillNames,
                requiredSkillIds: job.requiredSkillIds,
              },
              { status: 400 }
            );
          }
        }
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
