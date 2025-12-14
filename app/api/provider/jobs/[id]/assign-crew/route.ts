import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getCrewAvailability, formatConflictMessage, getCrewMembers } from '@/lib/scheduling-utils';
import { format } from 'date-fns';

const prisma = new PrismaClient();

interface AssignCrewRequest {
  providerId: string;
  userId: string;
  crewId: string;
  overrideConflicts?: boolean;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const jobId = params.id;
    const body: AssignCrewRequest = await request.json();
    const { providerId, userId, crewId, overrideConflicts = false } = body;

    // Validate required fields
    if (!providerId || !userId || !crewId) {
      return NextResponse.json(
        { error: 'Provider ID, User ID, and Crew ID are required' },
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
        { error: 'Unauthorized. Only owners and office staff can assign crews.' },
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

    // Verify crew exists and belongs to this provider
    const crew = await prisma.crew.findFirst({
      where: {
        id: crewId,
        providerId,
      },
      select: {
        id: true,
        name: true,
        userIds: true,
      },
    });

    if (!crew) {
      return NextResponse.json(
        { error: 'Crew not found' },
        { status: 404 }
      );
    }

    // Get active crew members
    const crewMembers = await getCrewMembers(crewId);

    if (crewMembers.length === 0) {
      return NextResponse.json(
        { error: 'Crew has no active members' },
        { status: 400 }
      );
    }

    // Check for conflicts
    const availability = await getCrewAvailability(
      crewId,
      job.startTime,
      job.endTime,
      jobId // Exclude current job from conflict check
    );

    if (!availability.available && !overrideConflicts) {
      return NextResponse.json(
        {
          error: 'Crew has scheduling conflicts',
          conflicts: availability.conflicts,
          message: formatConflictMessage(availability.conflicts),
          requiresOverride: true,
        },
        { status: 409 }
      );
    }

    // Get all crew member IDs
    const crewMemberIds = crewMembers.map(m => m.id);

    // Update the job with crew assignment
    // Merge crew members with any existing individual assignments
    const existingUserIds = job.assignedUserIds || [];
    const allUserIds = Array.from(new Set([...existingUserIds, ...crewMemberIds]));

    const updatedJob = await prisma.job.update({
      where: { id: jobId },
      data: {
        assignedCrewId: crewId,
        assignedUserIds: allUserIds,
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

    // Get assigned users for response
    const assignedUsers = await prisma.providerUser.findMany({
      where: { id: { in: allUserIds } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        color: true,
      },
    });

    // Create notifications for all crew members
    const jobDate = format(new Date(job.startTime), 'EEEE, MMM d');
    const jobTime = format(new Date(job.startTime), 'h:mm a');

    await prisma.notification.createMany({
      data: crewMemberIds.map((memberId) => ({
        providerId,
        userId: memberId,
        type: 'crew_job_assigned',
        title: 'New Job for Your Crew',
        message: `Your crew "${crew.name}" has been assigned to ${job.serviceType} on ${jobDate} at ${jobTime}`,
        link: `/worker/job/${jobId}`,
        data: { jobId, crewId, crewName: crew.name },
      })),
    });

    console.log(`📬 Created notifications for ${crewMemberIds.length} crew members`);

    return NextResponse.json({
      success: true,
      message: `Crew "${crew.name}" assigned to job`,
      job: {
        ...updatedJob,
        assignedUsers,
      },
      overrodeConflicts: !availability.available && overrideConflicts,
      conflicts: availability.conflicts.length > 0 ? availability.conflicts : undefined,
    });
  } catch (error) {
    console.error('Error assigning crew to job:', error);
    return NextResponse.json(
      { error: 'Failed to assign crew to job' },
      { status: 500 }
    );
  }
}
