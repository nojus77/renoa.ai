import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET /api/provider/jobs/[id]
 * Fetch a single job with all details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const job = await prisma.job.findUnique({
      where: { id },
      include: {
        customer: true,
        photos: true,
      },
    });

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // Fetch assigned user details if there are any
    let assignedUsers: Array<{ id: string; firstName: string; lastName: string; role: string; profilePhotoUrl: string | null }> = [];
    if (job.assignedUserIds && job.assignedUserIds.length > 0) {
      assignedUsers = await prisma.providerUser.findMany({
        where: {
          id: { in: job.assignedUserIds },
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          role: true,
          profilePhotoUrl: true,
        },
      });
    }

    // Return job with assigned users
    return NextResponse.json({
      ...job,
      assignedUsers,
    });
  } catch (error) {
    console.error('Error fetching job:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/provider/jobs/[id]
 * Update job details (status, completion, etc.)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      providerId,
      status,
      completedByUserId,
      completedAt,
      actualValue,
      internalNotes,
      customerNotes,
      // Calendar drag-and-drop support
      startTime,
      endTime,
      assignedUserIds,
    } = body;

    if (!providerId) {
      return NextResponse.json(
        { error: 'Provider ID required' },
        { status: 400 }
      );
    }

    // Verify job belongs to this provider
    const existingJob = await prisma.job.findUnique({
      where: { id },
    });

    if (!existingJob) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    if (existingJob.providerId !== providerId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Build update data
    const updateData: any = {};

    if (status !== undefined) {
      updateData.status = status;
    }

    if (completedByUserId !== undefined) {
      updateData.completedByUserId = completedByUserId;
    }

    if (completedAt !== undefined) {
      updateData.completedAt = completedAt ? new Date(completedAt) : null;
    }

    if (actualValue !== undefined) {
      updateData.actualValue = actualValue;
    }

    if (internalNotes !== undefined) {
      updateData.internalNotes = internalNotes;
    }

    if (customerNotes !== undefined) {
      updateData.customerNotes = customerNotes;
    }

    // Calendar drag-and-drop: update time
    if (startTime !== undefined) {
      updateData.startTime = new Date(startTime);
    }

    if (endTime !== undefined) {
      updateData.endTime = new Date(endTime);
    }

    // Calendar drag-and-drop: update assigned users
    if (assignedUserIds !== undefined) {
      updateData.assignedUserIds = assignedUserIds;
    }

    // Update the job
    const updatedJob = await prisma.job.update({
      where: { id },
      data: updateData,
      include: {
        customer: true,
        photos: true,
      },
    });

    return NextResponse.json({
      success: true,
      job: updatedJob,
    });
  } catch (error) {
    console.error('Error updating job:', error);
    return NextResponse.json(
      { error: 'Failed to update job' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/provider/jobs/[id]
 * Delete or cancel a job
 *
 * Accepts providerId from query params OR request body
 * Query params:
 * - providerId: required (can also be in body)
 * - cancellationReason: optional, if provided job is marked cancelled instead of deleted
 * - cancelledBy: optional, userId of who cancelled
 * - softDelete: optional, if true mark as cancelled instead of hard delete
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;

    // Get from query params first
    let providerId = searchParams.get('providerId');
    let cancellationReason = searchParams.get('cancellationReason');
    let cancelledBy = searchParams.get('cancelledBy');
    let softDelete = searchParams.get('softDelete') === 'true';

    // Also try to get from request body (some clients send it that way)
    try {
      const body = await request.json();
      if (!providerId && body.providerId) {
        providerId = body.providerId;
      }
      if (!cancellationReason && body.cancellationReason) {
        cancellationReason = body.cancellationReason;
      }
      if (!cancelledBy && body.cancelledBy) {
        cancelledBy = body.cancelledBy;
      }
      if (body.softDelete !== undefined) {
        softDelete = body.softDelete;
      }
    } catch {
      // No body or invalid JSON - that's fine, use query params
    }

    console.log('Delete job request:', { id, providerId, cancellationReason, softDelete });

    if (!providerId) {
      console.error('Delete job failed: Missing providerId');
      return NextResponse.json(
        { error: 'Provider ID required' },
        { status: 400 }
      );
    }

    // Verify job belongs to this provider
    const existingJob = await prisma.job.findUnique({
      where: { id },
    });

    if (!existingJob) {
      console.error('Delete job failed: Job not found', { id });
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    if (existingJob.providerId !== providerId) {
      console.error('Delete job failed: Unauthorized', { jobProviderId: existingJob.providerId, requestProviderId: providerId });
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Soft delete (cancel) if reason provided or softDelete flag set
    if (softDelete || cancellationReason) {
      const updatedJob = await prisma.job.update({
        where: { id },
        data: {
          status: 'cancelled',
          cancellationReason: cancellationReason || 'Cancelled by provider',
          cancelledAt: new Date(),
          cancelledBy: cancelledBy || null,
        },
      });

      console.log('Job cancelled:', { id, reason: cancellationReason });
      return NextResponse.json({
        success: true,
        message: 'Job cancelled successfully',
        job: updatedJob,
      });
    }

    // Hard delete
    await prisma.job.delete({
      where: { id },
    });

    console.log('Job deleted:', { id });
    return NextResponse.json({
      success: true,
      message: 'Job deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting job:', error);
    return NextResponse.json(
      { error: 'Failed to delete job' },
      { status: 500 }
    );
  }
}
