import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { checkWorkerConflicts, formatConflictMessage } from '@/lib/scheduling-utils';

const prisma = new PrismaClient();

interface AssignUsersRequest {
  providerId: string;
  userId: string;
  userIds: string[];
  mode?: 'add' | 'replace'; // add = append to existing, replace = overwrite
  overrideConflicts?: boolean;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const jobId = params.id;
    const body: AssignUsersRequest = await request.json();
    const {
      providerId,
      userId,
      userIds,
      mode = 'add',
      overrideConflicts = false
    } = body;

    // Validate required fields
    if (!providerId || !userId) {
      return NextResponse.json(
        { error: 'Provider ID and User ID are required' },
        { status: 400 }
      );
    }

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: 'At least one user ID is required' },
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
        { error: 'Unauthorized. Only owners and office staff can assign workers.' },
        { status: 403 }
      );
    }

    // Get the job
    const job = await prisma.job.findFirst({
      where: {
        id: jobId,
        providerId,
      },
      select: {
        id: true,
        serviceType: true,
        startTime: true,
        endTime: true,
        status: true,
        assignedUserIds: true,
        assignedCrewId: true,
      },
    });

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // Verify all users exist and belong to this provider
    const users = await prisma.providerUser.findMany({
      where: {
        id: { in: userIds },
        providerId,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        status: true,
        color: true,
      },
    });

    if (users.length !== userIds.length) {
      const foundIds = users.map(u => u.id);
      const missingIds = userIds.filter(id => !foundIds.includes(id));
      return NextResponse.json(
        { error: `Some users not found: ${missingIds.join(', ')}` },
        { status: 404 }
      );
    }

    // Check for inactive users
    const inactiveUsers = users.filter(u => u.status !== 'active');
    if (inactiveUsers.length > 0) {
      const names = inactiveUsers.map(u => `${u.firstName} ${u.lastName}`);
      return NextResponse.json(
        { error: `Cannot assign inactive users: ${names.join(', ')}` },
        { status: 400 }
      );
    }

    // Determine which users are new (for conflict checking)
    const existingUserIds = job.assignedUserIds || [];
    const newUserIds = userIds.filter(id => !existingUserIds.includes(id));

    // Check for conflicts (only for new users)
    if (newUserIds.length > 0 && !overrideConflicts) {
      const conflicts = await checkWorkerConflicts(
        newUserIds,
        job.startTime,
        job.endTime,
        jobId
      );

      if (conflicts.length > 0) {
        return NextResponse.json(
          {
            error: 'Workers have scheduling conflicts',
            conflicts,
            message: formatConflictMessage(conflicts),
            requiresOverride: true,
          },
          { status: 409 }
        );
      }
    }

    // Calculate final user list based on mode
    let finalUserIds: string[];
    if (mode === 'replace') {
      finalUserIds = userIds;
    } else {
      // add mode - merge with existing
      finalUserIds = Array.from(new Set([...existingUserIds, ...userIds]));
    }

    // Update the job
    const updatedJob = await prisma.job.update({
      where: { id: jobId },
      data: {
        assignedUserIds: finalUserIds,
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
          },
        },
      },
    });

    // Get updated user details for response
    const assignedUsers = await prisma.providerUser.findMany({
      where: { id: { in: finalUserIds } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        color: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: `${userIds.length} worker(s) assigned to job`,
      job: {
        ...updatedJob,
        assignedUsers,
      },
      addedCount: mode === 'replace' ? userIds.length : newUserIds.length,
    });
  } catch (error) {
    console.error('Error assigning users to job:', error);
    return NextResponse.json(
      { error: 'Failed to assign users to job' },
      { status: 500 }
    );
  }
}
