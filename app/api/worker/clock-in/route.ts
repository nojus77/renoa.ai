import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// POST clock in to a job - creates WorkLog
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobId, userId, providerId } = body;

    if (!jobId || !userId || !providerId) {
      return NextResponse.json(
        { error: 'Job ID, User ID, and Provider ID are required' },
        { status: 400 }
      );
    }

    // Check if already clocked in
    const existingWorkLog = await prisma.workLog.findFirst({
      where: {
        jobId,
        userId,
        clockOut: null,
      },
    });

    if (existingWorkLog) {
      return NextResponse.json(
        { error: 'Already clocked in to this job', workLog: existingWorkLog },
        { status: 400 }
      );
    }

    // Create work log with clock in time
    const workLog = await prisma.workLog.create({
      data: {
        jobId,
        userId,
        providerId,
        clockIn: new Date(),
      },
    });

    // Update job status to in_progress
    await prisma.job.update({
      where: { id: jobId },
      data: { status: 'in_progress' },
    });

    return NextResponse.json({ success: true, workLog });
  } catch (error) {
    console.error('Error clocking in:', error);
    return NextResponse.json(
      { error: 'Failed to clock in' },
      { status: 500 }
    );
  }
}
