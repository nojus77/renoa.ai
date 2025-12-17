import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

/**
 * POST /api/provider/jobs/[id]/override
 * Override skill requirements for a job assignment
 *
 * Body:
 * - reason: string (required) - Reason for the override
 * - assignedWorkerId: string (optional) - Worker being assigned despite skill mismatch
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params;
    const body = await request.json();
    const { reason, assignedWorkerId } = body;

    if (!reason || reason.trim().length === 0) {
      return NextResponse.json(
        { error: 'Override reason is required' },
        { status: 400 }
      );
    }

    // Get the current user from session
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('provider_session');

    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let session;
    try {
      session = JSON.parse(sessionCookie.value);
    } catch {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const { providerId, userId, role } = session;

    // Only owners and office staff can override skill requirements
    if (!['owner', 'office'].includes(role)) {
      return NextResponse.json(
        { error: 'Only owners and office staff can override skill requirements' },
        { status: 403 }
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
      unqualifiedOverrideBy: userId,
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

    // Get the user who made the override for the response
    const overrideUser = await prisma.providerUser.findUnique({
      where: { id: userId },
      select: {
        firstName: true,
        lastName: true,
      },
    });

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
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params;

    // Get the current user from session
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('provider_session');

    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let session;
    try {
      session = JSON.parse(sessionCookie.value);
    } catch {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const { providerId, role } = session;

    // Only owners and office staff can remove overrides
    if (!['owner', 'office'].includes(role)) {
      return NextResponse.json(
        { error: 'Only owners and office staff can remove skill overrides' },
        { status: 403 }
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
