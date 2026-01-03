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

    // AUTH CHECK 1: Verify user exists, is active, and belongs to the provider
    const user = await prisma.providerUser.findUnique({
      where: { id: userId },
      select: {
        id: true,
        providerId: true,
        status: true,
        role: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (user.status !== 'active') {
      return NextResponse.json(
        { error: 'Your account has been deactivated' },
        { status: 403 }
      );
    }

    if (user.providerId !== providerId) {
      return NextResponse.json(
        { error: 'Forbidden - provider mismatch' },
        { status: 403 }
      );
    }

    // AUTH CHECK 2: Verify the job exists, belongs to the provider, and worker is assigned
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        providerId: true,
        assignedUserIds: true,
        status: true,
      },
    });

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    if (job.providerId !== providerId) {
      return NextResponse.json(
        { error: 'Forbidden - job belongs to different provider' },
        { status: 403 }
      );
    }

    // Only allow workers assigned to this job to clock in (or admin/owner/office roles)
    const isAssigned = job.assignedUserIds.includes(userId);
    const isOfficeRole = ['admin', 'owner', 'office'].includes(user.role);

    if (!isAssigned && !isOfficeRole) {
      return NextResponse.json(
        { error: 'Forbidden - you are not assigned to this job' },
        { status: 403 }
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

    const now = new Date();

    // Auto clock-in to shift if not already clocked in
    const activeShift = await prisma.workerShift.findFirst({
      where: {
        userId,
        providerId,
        clockOut: null,
      },
    });

    let shiftStarted = false;
    if (!activeShift) {
      // Automatically start a shift when starting a job
      await prisma.workerShift.create({
        data: {
          userId,
          providerId,
          clockIn: now,
        },
      });
      shiftStarted = true;
      console.log(`[Auto Clock-In] Started shift for user ${userId} when starting job ${jobId}`);
    }

    // Create work log with clock in time
    const workLog = await prisma.workLog.create({
      data: {
        jobId,
        userId,
        providerId,
        clockIn: now,
      },
    });

    // Update job status to in_progress
    await prisma.job.update({
      where: { id: jobId },
      data: { status: 'in_progress' },
    });

    return NextResponse.json({
      success: true,
      workLog,
      shiftStarted, // Let frontend know a shift was auto-started
    });
  } catch (error) {
    console.error('Error clocking in:', error);
    return NextResponse.json(
      { error: 'Failed to clock in' },
      { status: 500 }
    );
  }
}
