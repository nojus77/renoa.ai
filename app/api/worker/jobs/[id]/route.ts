import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/worker/jobs/[id]
 * Get single job details for a worker (only if assigned to them)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get job only if worker is assigned to it
    const job = await prisma.job.findFirst({
      where: {
        id,
        assignedUserIds: { has: userId },
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            address: true,
          },
        },
        workLogs: {
          where: { userId },
          select: {
            id: true,
            clockIn: true,
            clockOut: true,
            hoursWorked: true,
            earnings: true,
          },
        },
      },
    });

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found or not assigned to you' },
        { status: 404 }
      );
    }

    return NextResponse.json({ job });
  } catch (error) {
    console.error('Error fetching job:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job' },
      { status: 500 }
    );
  }
}
