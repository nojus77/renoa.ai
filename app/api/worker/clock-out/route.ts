import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createNotification } from '@/lib/notifications';

export const dynamic = 'force-dynamic';

// POST clock out of a job - completes WorkLog, calculates earnings
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobId, userId } = body;

    if (!jobId || !userId) {
      return NextResponse.json(
        { error: 'Job ID and User ID are required' },
        { status: 400 }
      );
    }

    // Find the active work log
    const workLog = await prisma.workLog.findFirst({
      where: {
        jobId,
        userId,
        clockOut: null,
      },
    });

    if (!workLog) {
      return NextResponse.json(
        { error: 'No active clock-in found for this job' },
        { status: 400 }
      );
    }

    // Get user pay info
    const user = await prisma.providerUser.findUnique({
      where: { id: userId },
      select: {
        firstName: true,
        lastName: true,
        providerId: true,
        payType: true,
        hourlyRate: true,
        commissionRate: true,
      },
    });

    // Get job for actual value (for commission) and customer info
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: {
        actualValue: true,
        estimatedValue: true,
        serviceType: true,
        providerId: true,
        customer: {
          select: {
            name: true,
          },
        },
      },
    });

    const clockOut = new Date();
    const clockIn = new Date(workLog.clockIn);
    const hoursWorked = (clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60);

    // Calculate earnings based on pay type
    let earnings = 0;
    const jobValue = job?.actualValue || job?.estimatedValue || 0;

    console.log('Clock-out earnings calculation:', {
      userId,
      jobId,
      payType: user?.payType,
      hourlyRate: user?.hourlyRate,
      commissionRate: user?.commissionRate,
      actualValue: job?.actualValue,
      estimatedValue: job?.estimatedValue,
      jobValue,
      hoursWorked,
    });

    if (user?.payType === 'hourly' && user.hourlyRate) {
      earnings = hoursWorked * user.hourlyRate;
    } else if (user?.payType === 'commission' && user.commissionRate) {
      earnings = jobValue * (user.commissionRate / 100);
    }

    console.log('Calculated earnings:', earnings);

    // Update work log
    const updatedWorkLog = await prisma.workLog.update({
      where: { id: workLog.id },
      data: {
        clockOut,
        hoursWorked: Math.round(hoursWorked * 100) / 100, // Round to 2 decimals
        earnings: Math.round(earnings * 100) / 100,
      },
    });

    // Update job status to completed
    await prisma.job.update({
      where: { id: jobId },
      data: {
        status: 'completed',
        completedAt: clockOut,
        completedByUserId: userId,
      },
    });

    // Create notification for job completion
    if (user && job) {
      await createNotification({
        providerId: job.providerId,
        type: 'job_completed',
        title: 'Job Completed',
        message: `${user.firstName} ${user.lastName} completed ${job.serviceType || 'job'} for ${job.customer?.name || 'customer'}`,
        link: `/provider/jobs/${jobId}`,
      });
    }

    return NextResponse.json({
      success: true,
      workLog: updatedWorkLog,
      hoursWorked: Math.round(hoursWorked * 100) / 100,
      earnings: Math.round(earnings * 100) / 100,
    });
  } catch (error) {
    console.error('Error clocking out:', error);
    return NextResponse.json(
      { error: 'Failed to clock out' },
      { status: 500 }
    );
  }
}
