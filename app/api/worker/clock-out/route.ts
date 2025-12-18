import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createNotification } from '@/lib/notifications';

export const dynamic = 'force-dynamic';

/**
 * Trigger route re-optimization for a worker after job completion
 * This is called asynchronously to not block the clock-out response
 */
async function triggerReoptimize(
  workerId: string,
  providerId: string,
  trigger: string
): Promise<void> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/provider/dispatch/reoptimize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workerId,
        providerId,
        trigger,
        useTraffic: true,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.warn('[Reoptimize Trigger] Failed:', error);
    } else {
      const result = await response.json();
      if (result.hasSignificantChanges) {
        console.log('[Reoptimize Trigger] Significant ETA changes detected:', {
          workerId,
          changes: result.changes?.length || 0,
        });
      }
    }
  } catch (error) {
    console.error('[Reoptimize Trigger] Error:', error);
  }
}

// POST clock out of a job - completes WorkLog, calculates earnings
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobId, userId, paymentMethod, tipAmount, actualDurationMinutes } = body;

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

    // Calculate payment direction and amounts based on payment method
    // Cash/Check: Worker collected money, owes business the difference
    // Card/Invoice: Business collects, owes worker their earnings
    const isCashOrCheck = paymentMethod && ['cash', 'check'].includes(paymentMethod);
    const paymentDirection = isCashOrCheck ? 'worker_owes_business' : 'business_owes_worker';

    // For cash/check, worker collected their share of the job value (plus tip)
    // They owe the business: collected amount - their earnings
    const collectedAmount = isCashOrCheck ? workerShareOfJob + tipValue : null;
    const businessOwedAmount = isCashOrCheck
      ? Math.round((workerShareOfJob - earnings) * 100) / 100 // worker keeps earnings, owes rest to business
      : null;

    console.log('Calculated earnings:', {
      baseEarnings: earnings,
      tip: tipValue,
      totalEarnings,
      paymentDirection,
      collectedAmount,
      businessOwedAmount,
    });

    // Update work log (includes tip in earnings + payment direction info)
    const updatedWorkLog = await prisma.workLog.update({
      where: { id: workLog.id },
      data: {
        clockOut,
        hoursWorked: Math.round(hoursWorked * 100) / 100, // Round to 2 decimals
        earnings: Math.round(totalEarnings * 100) / 100, // Includes tip
        paymentDirection,
        collectedAmount,
        businessOwedAmount,
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
        actualDurationMinutes: actualDurationMinutes ? parseInt(actualDurationMinutes) : null,
      },
    });

    // Create work logs for other assigned workers who didn't clock in
    // This ensures all workers appear in payroll for multi-worker jobs
    if (job && job.assignedUserIds && job.assignedUserIds.length > 1) {
      const otherWorkerIds = job.assignedUserIds.filter(id => id !== userId);

      // Get pay info for all other workers
      const otherWorkers = await prisma.providerUser.findMany({
        where: { id: { in: otherWorkerIds } },
        select: {
          id: true,
          payType: true,
          hourlyRate: true,
          commissionRate: true,
        },
      });

      // Check which workers already have work logs for this job
      const existingLogs = await prisma.workLog.findMany({
        where: {
          jobId,
          userId: { in: otherWorkerIds },
        },
        select: { userId: true },
      });
      const workersWithLogs = new Set(existingLogs.map(log => log.userId));

      // Create work logs for workers without existing logs
      for (const otherWorker of otherWorkers) {
        if (workersWithLogs.has(otherWorker.id)) {
          continue; // Already has a work log
        }

        // Calculate earnings for this worker
        let otherWorkerEarnings = 0;
        if (otherWorker.payType === 'hourly' && otherWorker.hourlyRate) {
          // Use same hours as completing worker
          otherWorkerEarnings = hoursWorked * otherWorker.hourlyRate;
        } else if (otherWorker.payType === 'commission' && otherWorker.commissionRate) {
          otherWorkerEarnings = workerShareOfJob * (otherWorker.commissionRate / 100);
        }

        // For other workers, tips are split equally (if any)
        const otherWorkerTip = tipValue / numWorkers;
        const otherWorkerTotalEarnings = otherWorkerEarnings + otherWorkerTip;

        // Calculate payment direction for other worker
        const otherWorkerBusinessOwedAmount = isCashOrCheck
          ? Math.round((workerShareOfJob - otherWorkerEarnings) * 100) / 100
          : null;
        const otherWorkerCollectedAmount = isCashOrCheck ? workerShareOfJob + otherWorkerTip : null;

        // Create work log for other worker
        await prisma.workLog.create({
          data: {
            jobId,
            userId: otherWorker.id,
            providerId: job.providerId,
            clockIn: workLog.clockIn, // Same clock in time
            clockOut,
            hoursWorked: Math.round(hoursWorked * 100) / 100,
            earnings: Math.round(otherWorkerTotalEarnings * 100) / 100,
            paymentDirection,
            collectedAmount: otherWorkerCollectedAmount,
            businessOwedAmount: otherWorkerBusinessOwedAmount,
          },
        });

        console.log('Created work log for other worker:', {
          workerId: otherWorker.id,
          earnings: otherWorkerTotalEarnings,
          paymentDirection,
        });
      }
    }

    // Create notification for job completion
    if (user && job) {
      await createNotification({
        providerId: job.providerId,
        type: 'job_completed',
        title: 'Job Completed',
        message: `${user.firstName} ${user.lastName} completed ${job.serviceType || 'job'} for ${job.customer?.name || 'customer'}`,
        link: `/provider/jobs/${jobId}`,
      });

      // Trigger route re-optimization for remaining jobs (async, don't await)
      // This updates ETAs for remaining jobs after this one is completed
      triggerReoptimize(userId, job.providerId, 'job_completed').catch(err => {
        console.error('[Clock-out] Reoptimize trigger failed:', err);
      });
    }

    return NextResponse.json({
      success: true,
      workLog: updatedWorkLog,
      hoursWorked: Math.round(hoursWorked * 100) / 100,
      earnings: Math.round(totalEarnings * 100) / 100, // Includes tip
      baseEarnings: Math.round(earnings * 100) / 100,
      tip: tipValue,
      // Earnings breakdown for display
      earningsBreakdown: {
        payType: user?.payType || 'hourly',
        hourlyRate: user?.hourlyRate || null,
        commissionRate: user?.commissionRate || null,
        totalJobValue: Math.round(totalJobValue * 100) / 100,
        numWorkers,
        workerShareOfJob: Math.round(workerShareOfJob * 100) / 100,
        baseEarnings: Math.round(earnings * 100) / 100,
        tipAmount: tipValue,
        totalEarnings: Math.round(totalEarnings * 100) / 100,
        // Payment direction info
        paymentDirection,
        collectedAmount: collectedAmount ? Math.round(collectedAmount * 100) / 100 : null,
        businessOwedAmount: businessOwedAmount || null,
        isCashOrCheck,
      },
    });
  } catch (error) {
    console.error('Error clocking out:', error);
    return NextResponse.json(
      { error: 'Failed to clock out' },
      { status: 500 }
    );
  }
}
