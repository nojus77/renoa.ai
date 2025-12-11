import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
