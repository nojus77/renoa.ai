import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/provider/jobs/[id]/override
 * Override skill requirements for a job assignment
 *
 * Body:
 * - providerId: string (required) - Provider ID
 * - reason: string (required) - Reason for the override
 * - assignedWorkerId: string (optional) - Worker being assigned despite skill mismatch
 * - overrideByUserId: string (optional) - User ID who is overriding (for audit)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params;
    const body = await request.json();
    const { reason, assignedWorkerId, providerId, overrideByUserId } = body;

    if (!providerId) {
      return NextResponse.json(
        { error: 'Provider ID is required' },
        { status: 400 }
      );
    }

    if (!reason || reason.trim().length === 0) {
      return NextResponse.json(
        { error: 'Override reason is required' },
        { status: 400 }
      );
    }

    // Verify job exists and belongs to this provider
    const job = await prisma.job.findFirst({
      where: {
        id: jobId,
        providerId,
      },
      select: {
        id: true,
        serviceType: true,
        assignedUserIds: true,
        allowUnqualified: true,
      },
    });

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // Build the update data
    const updateData: any = {
      allowUnqualified: true,
      unqualifiedOverrideBy: overrideByUserId || null,
      unqualifiedOverrideAt: new Date(),
      unqualifiedOverrideReason: reason.trim(),
    };

    // If a specific worker is being assigned, update the assignment too
    if (assignedWorkerId) {
      // Verify worker belongs to this provider
      const worker = await prisma.providerUser.findFirst({
        where: {
          id: assignedWorkerId,
          providerId,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      });

      if (!worker) {
        return NextResponse.json(
          { error: 'Worker not found' },
          { status: 404 }
        );
      }

      // Add worker to assignments if not already assigned
      if (!job.assignedUserIds.includes(assignedWorkerId)) {
        updateData.assignedUserIds = [...job.assignedUserIds, assignedWorkerId];
      }
    }

    // Update the job
    const updatedJob = await prisma.job.update({
      where: { id: jobId },
      data: updateData,
      select: {
        id: true,
        serviceType: true,
        allowUnqualified: true,
        unqualifiedOverrideBy: true,
        unqualifiedOverrideAt: true,
        unqualifiedOverrideReason: true,
        assignedUserIds: true,
      },
    });

    // Get the user who made the override for the response (if provided)
    let overrideUser = null;
    if (overrideByUserId) {
      overrideUser = await prisma.providerUser.findUnique({
        where: { id: overrideByUserId },
        select: {
          firstName: true,
          lastName: true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      job: {
        ...updatedJob,
        overrideByName: overrideUser
          ? `${overrideUser.firstName} ${overrideUser.lastName}`
          : 'Unknown',
      },
      message: 'Skill requirement override applied successfully',
    });
  } catch (error) {
    console.error('[Override API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to override skill requirements' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/provider/jobs/[id]/override
 * Remove skill override from a job
 *
 * Query params:
 * - providerId: string (required)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const providerId = searchParams.get('providerId');

    if (!providerId) {
      return NextResponse.json(
        { error: 'Provider ID is required' },
        { status: 400 }
      );
    }

    // Verify job exists and belongs to this provider
    const job = await prisma.job.findFirst({
      where: {
        id: jobId,
        providerId,
      },
    });

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // Remove the override
    const updatedJob = await prisma.job.update({
      where: { id: jobId },
      data: {
        allowUnqualified: false,
        unqualifiedOverrideBy: null,
        unqualifiedOverrideAt: null,
        unqualifiedOverrideReason: null,
      },
      select: {
        id: true,
        serviceType: true,
        allowUnqualified: true,
      },
    });

    return NextResponse.json({
      success: true,
      job: updatedJob,
      message: 'Skill override removed',
    });
  } catch (error) {
    console.error('[Override API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to remove skill override' },
      { status: 500 }
    );
  }
}
