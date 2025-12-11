import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET /api/provider/crews/[id]/availability
 * Check crew members' availability for a time slot
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const crewId = params.id;
    const searchParams = request.nextUrl.searchParams;
    const providerId = searchParams.get('providerId');
    const startTime = searchParams.get('start');
    const endTime = searchParams.get('end');

    if (!providerId) {
      return NextResponse.json(
        { error: 'Provider ID required' },
        { status: 400 }
      );
    }

    if (!startTime || !endTime) {
      return NextResponse.json(
        { error: 'Start and end time required' },
        { status: 400 }
      );
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    // Get crew with members
    const crew = await prisma.crew.findUnique({
      where: { id: crewId },
      include: {
        members: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!crew) {
      return NextResponse.json(
        { error: 'Crew not found' },
        { status: 404 }
      );
    }

    if (crew.providerId !== providerId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Get member IDs
    const memberIds = crew.members.map((m) => m.userId);

    // Find conflicting jobs for each member
    const conflictingJobs = await prisma.job.findMany({
      where: {
        providerId,
        status: { notIn: ['cancelled'] },
        assignedUserIds: { hasSome: memberIds },
        OR: [
          {
            // Job starts during the time slot
            startTime: { gte: start, lt: end },
          },
          {
            // Job ends during the time slot
            endTime: { gt: start, lte: end },
          },
          {
            // Job spans the entire time slot
            AND: [
              { startTime: { lte: start } },
              { endTime: { gte: end } },
            ],
          },
        ],
      },
      include: {
        customer: true,
      },
    });

    // Build availability response
    const available: string[] = [];
    const busy: string[] = [];
    const conflicts: Array<{
      userId: string;
      userName: string;
      job: {
        id: string;
        serviceType: string;
        startTime: string;
        endTime: string;
        customerName: string;
      };
    }> = [];

    for (const member of crew.members) {
      const memberJobs = conflictingJobs.filter((job) =>
        job.assignedUserIds?.includes(member.userId)
      );

      if (memberJobs.length === 0) {
        available.push(member.userId);
      } else {
        busy.push(member.userId);

        // Add conflict details
        for (const job of memberJobs) {
          conflicts.push({
            userId: member.userId,
            userName: `${member.user.firstName} ${member.user.lastName}`,
            job: {
              id: job.id,
              serviceType: job.serviceType,
              startTime: job.startTime.toISOString(),
              endTime: job.endTime.toISOString(),
              customerName: job.customer?.name || 'Unknown',
            },
          });
        }
      }
    }

    return NextResponse.json({
      crewId,
      crewName: crew.name,
      totalMembers: crew.members.length,
      available,
      busy,
      conflicts,
      allAvailable: available.length === crew.members.length,
      hasConflicts: busy.length > 0,
    });
  } catch (error) {
    console.error('Error checking crew availability:', error);
    return NextResponse.json(
      { error: 'Failed to check availability' },
      { status: 500 }
    );
  }
}
