import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// POST update job status (on the way, arrived, etc)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobId, userId, action } = body;

    if (!jobId || !userId || !action) {
      return NextResponse.json(
        { error: 'Job ID, User ID, and action are required' },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};

    switch (action) {
      case 'on_the_way':
        updateData.onTheWayAt = new Date();
        break;
      case 'arrived':
        updateData.arrivedAt = new Date();
        updateData.status = 'in_progress';
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    const job = await prisma.job.update({
      where: { id: jobId },
      data: updateData,
    });

    return NextResponse.json({ success: true, job });
  } catch (error) {
    console.error('Error updating job status:', error);
    return NextResponse.json(
      { error: 'Failed to update job status' },
      { status: 500 }
    );
  }
}
