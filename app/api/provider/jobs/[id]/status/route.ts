import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * POST /api/provider/jobs/[id]/status
 * Update job status and record timestamp
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { status, userId, userRole } = body;

    if (!status || !userId || !userRole) {
      return NextResponse.json(
        { error: 'Status, userId, and userRole are required' },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ['scheduled', 'dispatched', 'on-the-way', 'in-progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    // Fetch the current job
    const job = await prisma.job.findUnique({
      where: { id },
      include: {
        customer: {
          select: { name: true },
        },
      },
    });

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // Permission check: Field users can only update jobs they're assigned to
    if (userRole === 'field') {
      if (!job.assignedUserIds || !job.assignedUserIds.includes(userId)) {
        return NextResponse.json(
          { error: 'You are not assigned to this job' },
          { status: 403 }
        );
      }
    }

    // Validate status progression (no backward progression)
    const statusOrder = ['scheduled', 'dispatched', 'on-the-way', 'in-progress', 'completed'];
    const currentIndex = statusOrder.indexOf(job.status);
    const newIndex = statusOrder.indexOf(status);

    if (status !== 'cancelled' && currentIndex > newIndex) {
      return NextResponse.json(
        { error: 'Cannot move backward in job status' },
        { status: 400 }
      );
    }

    // Validate dispatched requires assigned users
    if (status === 'dispatched' && (!job.assignedUserIds || job.assignedUserIds.length === 0)) {
      return NextResponse.json(
        { error: 'Cannot dispatch job without assigned users' },
        { status: 400 }
      );
    }

    // Prepare update data with timestamp based on new status
    const updateData: any = {
      status,
      updatedAt: new Date(),
    };

    const now = new Date();

    switch (status) {
      case 'dispatched':
        if (!job.dispatchedAt) {
          updateData.dispatchedAt = now;
        }
        break;
      case 'on-the-way':
        if (!job.onTheWayAt) {
          updateData.onTheWayAt = now;
        }
        break;
      case 'in-progress':
        if (!job.arrivedAt) {
          updateData.arrivedAt = now;
        }
        break;
      case 'completed':
        if (!job.completedAt) {
          updateData.completedAt = now;
          updateData.completedByUserId = userId;
        }
        break;
    }

    // Update the job
    const updatedJob = await prisma.job.update({
      where: { id },
      data: updateData,
      include: {
        customer: {
          select: { name: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      job: {
        id: updatedJob.id,
        status: updatedJob.status,
        customerName: updatedJob.customer?.name,
        dispatchedAt: updatedJob.dispatchedAt,
        onTheWayAt: updatedJob.onTheWayAt,
        arrivedAt: updatedJob.arrivedAt,
        completedAt: updatedJob.completedAt,
        completedByUserId: updatedJob.completedByUserId,
      },
    });
  } catch (error) {
    console.error('Error updating job status:', error);
    return NextResponse.json(
      { error: 'Failed to update job status' },
      { status: 500 }
    );
  }
}
