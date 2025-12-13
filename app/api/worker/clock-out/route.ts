import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createNotification } from '@/lib/notifications';

export const dynamic = 'force-dynamic';

// POST clock out of a job - completes WorkLog, calculates earnings
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobId, userId, paymentMethod, tipAmount } = body;

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

    // Get job for actual value (for commission) and customer info, including assigned workers
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: {
        actualValue: true,
        estimatedValue: true,
        serviceType: true,
        providerId: true,
        assignedUserIds: true,
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
    // IMPORTANT: For commission, split job value by number of workers first to prevent overpayment
    let earnings = 0;
    const totalJobValue = job?.actualValue || job?.estimatedValue || 0;
    const numWorkers = job?.assignedUserIds?.length || 1;
    const workerShareOfJob = totalJobValue / numWorkers; // Each worker's share before commission

    console.log('Clock-out earnings calculation:', {
      userId,
      jobId,
      payType: user?.payType,
      hourlyRate: user?.hourlyRate,
      commissionRate: user?.commissionRate,
      actualValue: job?.actualValue,
      estimatedValue: job?.estimatedValue,
      totalJobValue,
      numWorkers,
      workerShareOfJob,
      hoursWorked,
    });

    if (user?.payType === 'hourly' && user.hourlyRate) {
      earnings = hoursWorked * user.hourlyRate;
    } else if (user?.payType === 'commission' && user.commissionRate) {
      // Apply commission to worker's share of the job, not total job value
      earnings = workerShareOfJob * (user.commissionRate / 100);
    }

    // Tips go 100% to worker - add to earnings
    const tipValue = tipAmount ? Math.round(tipAmount * 100) / 100 : 0;
    const totalEarnings = earnings + tipValue;

    console.log('Calculated earnings:', { baseEarnings: earnings, tip: tipValue, totalEarnings });

    // Update work log (includes tip in earnings)
    const updatedWorkLog = await prisma.workLog.update({
      where: { id: workLog.id },
      data: {
        clockOut,
        hoursWorked: Math.round(hoursWorked * 100) / 100, // Round to 2 decimals
        earnings: Math.round(totalEarnings * 100) / 100, // Includes tip
      },
    });

    // Update job status to completed with payment info
    // Payment status is "paid" for cash/check/card, "pending" for invoice
    const paymentStatus = paymentMethod && ['cash', 'check', 'card'].includes(paymentMethod) ? 'paid' : 'pending';

    await prisma.job.update({
      where: { id: jobId },
      data: {
        status: 'completed',
        completedAt: clockOut,
        completedByUserId: userId,
        paymentMethod: paymentMethod || null,
        paymentStatus,
        tipAmount: tipAmount ? Math.round(tipAmount * 100) / 100 : null,
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
      earnings: Math.round(totalEarnings * 100) / 100, // Includes tip
      baseEarnings: Math.round(earnings * 100) / 100,
      tip: tipValue,
    });
  } catch (error) {
    console.error('Error clocking out:', error);
    return NextResponse.json(
      { error: 'Failed to clock out' },
      { status: 500 }
    );
  }
}
