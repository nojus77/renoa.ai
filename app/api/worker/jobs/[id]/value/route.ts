import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * PUT /api/worker/jobs/[id]/value
 * Update job actualValue from worker-entered services and parts
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { actualValue, userId } = body;

    if (actualValue === undefined) {
      return NextResponse.json(
        { error: 'actualValue is required' },
        { status: 400 }
      );
    }

    // Verify job exists and worker is assigned
    const job = await prisma.job.findUnique({
      where: { id },
      select: {
        id: true,
        assignedUserIds: true,
        providerId: true,
      },
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Check if worker is assigned or is owner/office
    let hasAccess = job.assignedUserIds.includes(userId);
    if (!hasAccess && userId) {
      const user = await prisma.providerUser.findFirst({
        where: {
          id: userId,
          providerId: job.providerId,
          role: { in: ['owner', 'office'] },
        },
      });
      hasAccess = !!user;
    }

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Not authorized to update this job' },
        { status: 403 }
      );
    }

    // Update job value
    const updatedJob = await prisma.job.update({
      where: { id },
      data: {
        actualValue: Math.round(actualValue * 100) / 100,
      },
      select: {
        id: true,
        actualValue: true,
      },
    });

    console.log('Job value updated:', {
      jobId: id,
      actualValue: updatedJob.actualValue,
      updatedBy: userId,
    });

    return NextResponse.json({
      success: true,
      actualValue: updatedJob.actualValue,
    });
  } catch (error) {
    console.error('Error updating job value:', error);
    return NextResponse.json(
      { error: 'Failed to update job value' },
      { status: 500 }
    );
  }
}
