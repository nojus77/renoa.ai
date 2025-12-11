import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface UnassignRequest {
  providerId: string;
  userId: string;
  type: 'all' | 'crew' | 'users';
  userIds?: string[]; // Only used when type is 'users'
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const jobId = params.id;
    const body: UnassignRequest = await request.json();
    const { providerId, userId, type, userIds } = body;

    // Validate required fields
    if (!providerId || !userId) {
      return NextResponse.json(
        { error: 'Provider ID and User ID are required' },
        { status: 400 }
      );
    }

    if (!type || !['all', 'crew', 'users'].includes(type)) {
      return NextResponse.json(
        { error: 'Type must be one of: all, crew, users' },
        { status: 400 }
      );
    }

    if (type === 'users' && (!userIds || userIds.length === 0)) {
      return NextResponse.json(
        { error: 'User IDs are required when type is "users"' },
        { status: 400 }
      );
    }

    // Verify the requesting user has permission (owner or office)
    const requestingUser = await prisma.providerUser.findFirst({
      where: {
        id: userId,
        providerId,
        role: { in: ['owner', 'office'] },
        status: 'active',
      },
    });

    if (!requestingUser) {
      return NextResponse.json(
        { error: 'Unauthorized. Only owners and office staff can unassign workers.' },
        { status: 403 }
      );
    }

    // Get the job with crew info
    const job = await prisma.job.findFirst({
      where: {
        id: jobId,
        providerId,
      },
      select: {
        id: true,
        serviceType: true,
        assignedUserIds: true,
        assignedCrewId: true,
        assignedCrew: {
          select: {
            id: true,
            name: true,
            userIds: true,
          },
        },
      },
    });

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    let updateData: { assignedUserIds?: string[]; assignedCrewId?: string | null } = {};
    let message = '';

    switch (type) {
      case 'all':
        // Remove all assignments
        updateData = {
          assignedUserIds: [],
          assignedCrewId: null,
        };
        message = 'All workers and crew unassigned from job';
        break;

      case 'crew':
        // Remove only the crew assignment (keep individual user assignments that aren't crew members)
        if (!job.assignedCrewId) {
          return NextResponse.json(
            { error: 'No crew is assigned to this job' },
            { status: 400 }
          );
        }

        // Get crew member IDs to remove them from assignedUserIds
        const crewMemberIds = job.assignedCrew?.userIds || [];
        const remainingUserIds = job.assignedUserIds.filter(
          (id: string) => !crewMemberIds.includes(id)
        );

        updateData = {
          assignedUserIds: remainingUserIds,
          assignedCrewId: null,
        };
        message = `Crew "${job.assignedCrew?.name}" unassigned from job`;
        break;

      case 'users':
        // Remove specific users
        if (!userIds) {
          return NextResponse.json(
            { error: 'User IDs required for type "users"' },
            { status: 400 }
          );
        }

        const newUserIds = job.assignedUserIds.filter(
          (id: string) => !userIds.includes(id)
        );

        // Check if we're removing crew members - if so, also remove crew assignment
        let shouldRemoveCrew = false;
        if (job.assignedCrewId && job.assignedCrew) {
          const crewMembers = job.assignedCrew.userIds || [];
          const remainingCrewMembers = crewMembers.filter(
            (id: string) => newUserIds.includes(id)
          );
          // If all crew members are being removed, remove the crew assignment too
          if (remainingCrewMembers.length === 0) {
            shouldRemoveCrew = true;
          }
        }

        updateData = {
          assignedUserIds: newUserIds,
          ...(shouldRemoveCrew ? { assignedCrewId: null } : {}),
        };

        const removedCount = job.assignedUserIds.length - newUserIds.length;
        message = `${removedCount} worker(s) unassigned from job`;
        break;
    }

    // Update the job
    const updatedJob = await prisma.job.update({
      where: { id: jobId },
      data: updateData,
      select: {
        id: true,
        serviceType: true,
        assignedUserIds: true,
        assignedCrewId: true,
        assignedCrew: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Get remaining assigned users for response
    const assignedUsers = await prisma.providerUser.findMany({
      where: { id: { in: updatedJob.assignedUserIds } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        color: true,
      },
    });

    return NextResponse.json({
      success: true,
      message,
      job: {
        ...updatedJob,
        assignedUsers,
      },
    });
  } catch (error) {
    console.error('Error unassigning from job:', error);
    return NextResponse.json(
      { error: 'Failed to unassign from job' },
      { status: 500 }
    );
  }
}
