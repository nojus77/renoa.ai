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

    // AUTH CHECK 1: Verify user exists and is active
    const user = await prisma.providerUser.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        providerId: true,
        status: true,
        role: true,
        payType: true,
        hourlyRate: true,
        commissionRate: true,
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

    // AUTH CHECK 2: Verify the work log belongs to the user's provider
    if (workLog.providerId !== user.providerId) {
      return NextResponse.json(
        { error: 'Forbidden - provider mismatch' },
        { status: 403 }
      );
    }

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

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // AUTH CHECK 3: Verify job belongs to user's provider
    if (job.providerId !== user.providerId) {
      return NextResponse.json(
        { error: 'Forbidden - job belongs to different provider' },
        { status: 403 }
      );
    }

    // AUTH CHECK 4: Only allow workers assigned to this job to clock out (or admin/owner/office roles)
    const isAssigned = job.assignedUserIds.includes(userId);
    const isOfficeRole = ['admin', 'owner', 'office'].includes(user.role);

    if (!isAssigned && !isOfficeRole) {
      return NextResponse.json(
        { error: 'Forbidden - you are not assigned to this job' },
        { status: 403 }
      );
    }

    const clockOut = new Date();
    const clockIn = new Date(workLog.clockIn);
    const hoursWorked = (clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60);

    // Calculate earnings using CENTS to avoid floating point precision errors
    // All intermediate calculations are in cents (integers), only convert to dollars for storage/display
    const numWorkers = job.assignedUserIds.length || 1;

    // Convert to cents (multiply by 100, round to integer)
    const totalJobValueCents = Math.round((job.actualValue || job.estimatedValue || 0) * 100);
    const workerShareOfJobCents = Math.floor(totalJobValueCents / numWorkers); // Integer division
    const tipValueCents = tipAmount ? Math.round(tipAmount * 100) : 0;
    const hourlyRateCents = user.hourlyRate ? Math.round(user.hourlyRate * 100) : 0;

    // Calculate earnings in cents
    let earningsCents = 0;
    if (user.payType === 'hourly' && hourlyRateCents > 0) {
      // hoursWorked * hourlyRate, result in cents
      earningsCents = Math.round(hoursWorked * hourlyRateCents);
    } else if (user.payType === 'commission' && user.commissionRate) {
      // Apply commission to worker's share (already in cents)
      earningsCents = Math.round(workerShareOfJobCents * (user.commissionRate / 100));
    }

    const totalEarningsCents = earningsCents + tipValueCents;

    // Convert back to dollars for storage (Prisma expects Decimal)
    const earnings = earningsCents / 100;
    const tipValue = tipValueCents / 100;
    const totalEarnings = totalEarningsCents / 100;
    const totalJobValue = totalJobValueCents / 100;
    const workerShareOfJob = workerShareOfJobCents / 100;

    console.log('Clock-out earnings calculation (cents-based):', {
      userId,
      jobId,
      payType: user.payType,
      hourlyRateCents,
      commissionRate: user.commissionRate,
      totalJobValueCents,
      workerShareOfJobCents,
      earningsCents,
      tipValueCents,
      totalEarningsCents,
      hoursWorked,
    });

    // Calculate payment direction and amounts based on payment method
    // Cash/Check: Worker collected money, owes business the difference
    // Card/Invoice: Business collects, owes worker their earnings
    const isCashOrCheck = paymentMethod && ['cash', 'check'].includes(paymentMethod);
    const paymentDirection = isCashOrCheck ? 'worker_owes_business' : 'business_owes_worker';

    // For cash/check, worker collected their share of the job value (plus tip)
    // They owe the business: collected amount - their earnings (calculated in cents)
    const collectedAmountCents = isCashOrCheck ? workerShareOfJobCents + tipValueCents : null;
    const businessOwedAmountCents = isCashOrCheck
      ? workerShareOfJobCents - earningsCents // worker keeps earnings, owes rest to business
      : null;

    // Convert to dollars for storage
    const collectedAmount = collectedAmountCents !== null ? collectedAmountCents / 100 : null;
    const businessOwedAmount = businessOwedAmountCents !== null ? businessOwedAmountCents / 100 : null;

    console.log('Calculated earnings (dollars):', {
      baseEarnings: earnings,
      tip: tipValue,
      totalEarnings,
      paymentDirection,
      collectedAmount,
      businessOwedAmount,
    });

    // Update work log (includes tip in earnings + payment direction info)
    // Values are already properly calculated in cents and converted to dollars
    const updatedWorkLog = await prisma.workLog.update({
      where: { id: workLog.id },
      data: {
        clockOut,
        hoursWorked: Math.round(hoursWorked * 100) / 100, // Round to 2 decimals
        earnings: totalEarnings, // Already calculated precisely in cents
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
        tipAmount: tipValue > 0 ? tipValue : null, // Already calculated precisely from cents
        actualDurationMinutes: actualDurationMinutes ? (isNaN(parseInt(actualDurationMinutes)) ? null : parseInt(actualDurationMinutes)) : null,
      },
    });

    // Create work logs for other assigned workers who didn't clock in
    // This ensures all workers appear in payroll for multi-worker jobs
    if (job.assignedUserIds.length > 1) {
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

      // Build work log data for workers without existing logs (batch insert)
      const workLogsToCreate: Array<{
        jobId: string;
        userId: string;
        providerId: string;
        clockIn: Date;
        clockOut: Date;
        hoursWorked: number;
        earnings: number;
        paymentDirection: string;
        collectedAmount: number | null;
        businessOwedAmount: number | null;
      }> = [];

      for (const otherWorker of otherWorkers) {
        if (workersWithLogs.has(otherWorker.id)) {
          continue; // Already has a work log
        }

        // Calculate earnings for this worker using CENTS
        const otherHourlyRateCents = otherWorker.hourlyRate ? Math.round(otherWorker.hourlyRate * 100) : 0;
        let otherWorkerEarningsCents = 0;
        if (otherWorker.payType === 'hourly' && otherHourlyRateCents > 0) {
          // Use same hours as completing worker
          otherWorkerEarningsCents = Math.round(hoursWorked * otherHourlyRateCents);
        } else if (otherWorker.payType === 'commission' && otherWorker.commissionRate) {
          otherWorkerEarningsCents = Math.round(workerShareOfJobCents * (otherWorker.commissionRate / 100));
        }

        // For other workers, tips are split equally (if any) - in cents
        const otherWorkerTipCents = Math.floor(tipValueCents / numWorkers);
        const otherWorkerTotalEarningsCents = otherWorkerEarningsCents + otherWorkerTipCents;

        // Calculate payment direction for other worker (in cents)
        const otherWorkerBusinessOwedCents = isCashOrCheck
          ? workerShareOfJobCents - otherWorkerEarningsCents
          : null;
        const otherWorkerCollectedCents = isCashOrCheck ? workerShareOfJobCents + otherWorkerTipCents : null;

        // Convert to dollars for storage
        const otherWorkerTotalEarnings = otherWorkerTotalEarningsCents / 100;
        const otherWorkerBusinessOwedAmount = otherWorkerBusinessOwedCents !== null ? otherWorkerBusinessOwedCents / 100 : null;
        const otherWorkerCollectedAmount = otherWorkerCollectedCents !== null ? otherWorkerCollectedCents / 100 : null;

        // Add to batch
        workLogsToCreate.push({
          jobId,
          userId: otherWorker.id,
          providerId: job.providerId,
          clockIn: workLog.clockIn,
          clockOut,
          hoursWorked: Math.round(hoursWorked * 100) / 100,
          earnings: otherWorkerTotalEarnings,
          paymentDirection,
          collectedAmount: otherWorkerCollectedAmount,
          businessOwedAmount: otherWorkerBusinessOwedAmount,
        });
      }

      // Batch insert all work logs at once (fixes N+1 query issue)
      if (workLogsToCreate.length > 0) {
        await prisma.workLog.createMany({
          data: workLogsToCreate,
        });

        console.log('Created work logs for other workers (batch):', {
          count: workLogsToCreate.length,
          workerIds: workLogsToCreate.map(log => log.userId),
          paymentDirection,
        });
      }
    }

    // Create notification for job completion
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

    // All values are already calculated precisely from cents - no rounding needed
    return NextResponse.json({
      success: true,
      workLog: updatedWorkLog,
      hoursWorked: Math.round(hoursWorked * 100) / 100,
      earnings: totalEarnings, // Includes tip, calculated from cents
      baseEarnings: earnings,
      tip: tipValue,
      // Earnings breakdown for display
      earningsBreakdown: {
        payType: user.payType || 'hourly',
        hourlyRate: user.hourlyRate || null,
        commissionRate: user.commissionRate || null,
        totalJobValue,
        numWorkers,
        workerShareOfJob,
        baseEarnings: earnings,
        tipAmount: tipValue,
        totalEarnings,
        // Payment direction info
        paymentDirection,
        collectedAmount,
        businessOwedAmount,
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
