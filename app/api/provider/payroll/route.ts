import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const roundCurrency = (value: number) => Math.round(value * 100) / 100;

function getDateRange(range: string) {
  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  if (range === 'this-month') {
    const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    return { startDate, endDate };
  }

  const getMonday = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  if (range === 'last-week') {
    const startDate = getMonday(today);
    startDate.setDate(startDate.getDate() - 7);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 7);
    return { startDate, endDate };
  }

  // default to this week
  const startDate = getMonday(today);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 7);
  return { startDate, endDate };
}

// GET work logs for provider/payroll summary
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get('providerId');
    const range = searchParams.get('range') || 'this-week';

    if (!providerId) {
      return NextResponse.json({ error: 'Provider ID is required' }, { status: 400 });
    }

    const { startDate, endDate } = getDateRange(range);
    const clockOutFilter: Record<string, any> = { not: null };
    if (startDate && endDate) {
      clockOutFilter.gte = startDate;
      clockOutFilter.lt = endDate;
    }

    const workLogs = await prisma.workLog.findMany({
      where: {
        providerId,
        clockOut: clockOutFilter,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            payType: true,
            hourlyRate: true,
            commissionRate: true,
          },
        },
        job: {
          select: {
            id: true,
            serviceType: true,
            paymentMethod: true,
            tipAmount: true,
            assignedUserIds: true,
            customer: {
              select: { name: true },
            },
          },
        },
      },
      orderBy: { clockIn: 'desc' },
    });

    const formattedLogs = workLogs.map((log) => {
      const recordedTip = log.job?.tipAmount || 0;
      const paymentMethod = log.job?.paymentMethod?.toLowerCase();
      const tipEligible = paymentMethod === 'cash' ? 0 : recordedTip;
      const payoutAmount = roundCurrency(((log.earnings || 0) - recordedTip + tipEligible));
      const baseEarnings = roundCurrency((log.earnings || 0) - recordedTip);

      return {
        ...log,
        recordedTip,
        tipEligible,
        baseEarnings,
        payoutAmount,
        tipExcludedReason: paymentMethod === 'cash' && recordedTip > 0 ? 'cash' : null,
      };
    });

    const byWorkerMap: Record<string, {
      user: (typeof formattedLogs)[number]['user'];
      logs: typeof formattedLogs;
      totalHours: number;
      totalOwed: number;
      totalTips: number;
      cashTipsKept: number;
      unpaidTotal: number;
      totalBase: number;
      unpaidBase: number;
      unpaidTips: number;
      unpaidJobs: number;
      totalJobs: number;
      unpaidHours: number;
    }> = {};

    formattedLogs.forEach((log) => {
      if (!byWorkerMap[log.userId]) {
        byWorkerMap[log.userId] = {
          user: log.user,
          logs: [],
          totalHours: 0,
          totalOwed: 0,
          totalTips: 0,
          cashTipsKept: 0,
          unpaidTotal: 0,
          totalBase: 0,
          unpaidBase: 0,
          unpaidTips: 0,
          unpaidJobs: 0,
          totalJobs: 0,
          unpaidHours: 0,
        };
      }

      const workerGroup = byWorkerMap[log.userId];
      workerGroup.logs.push(log);
      workerGroup.totalHours += log.hoursWorked || 0;
      workerGroup.totalJobs += 1;

      const payoutAmount = log.payoutAmount || 0;
      const tipEligible = log.tipEligible || 0;
      const basePay = typeof log.baseEarnings === 'number'
        ? Math.max(log.baseEarnings, 0)
        : Math.max(payoutAmount - tipEligible, 0);

      workerGroup.totalOwed += payoutAmount;
      workerGroup.totalTips += tipEligible;
      workerGroup.totalBase += basePay;

      const recordedTip = log.recordedTip || 0;
      if (recordedTip > tipEligible) {
        workerGroup.cashTipsKept += recordedTip - tipEligible;
      }

      if (!log.isPaid) {
        workerGroup.unpaidTotal += payoutAmount;
        workerGroup.unpaidTips += tipEligible;
        workerGroup.unpaidBase += basePay;
        workerGroup.unpaidJobs += 1;
        workerGroup.unpaidHours += log.hoursWorked || 0;
      }
    });

    const totalHours = formattedLogs.reduce((sum, log) => sum + (log.hoursWorked || 0), 0);
    const totalEarnings = formattedLogs.reduce((sum, log) => sum + (log.payoutAmount || 0), 0);
    const totalTipsEligible = formattedLogs.reduce((sum, log) => sum + (log.tipEligible || 0), 0);
    const totalTipsRecorded = formattedLogs.reduce((sum, log) => sum + (log.recordedTip || 0), 0);
    const totalUnpaid = formattedLogs.filter((log) => !log.isPaid).reduce((sum, log) => sum + (log.payoutAmount || 0), 0);
    const totalPaid = totalEarnings - totalUnpaid;

    return NextResponse.json({
      workLogs: formattedLogs,
      byWorker: Object.values(byWorkerMap),
      summary: {
        totalHours: roundCurrency(totalHours),
        totalEarnings: roundCurrency(totalEarnings),
        totalUnpaid: roundCurrency(totalUnpaid),
        totalPaid: roundCurrency(totalPaid),
        totalTipsEligible: roundCurrency(totalTipsEligible),
        totalTipsRecorded: roundCurrency(totalTipsRecorded),
        workersCount: Object.keys(byWorkerMap).length,
        logsCount: formattedLogs.length,
        range,
        startDate,
        endDate,
      },
    });
  } catch (error) {
    console.error('Error fetching payroll:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payroll' },
      { status: 500 }
    );
  }
}

// POST mark work logs as paid
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { workLogIds, userId } = body;

    if (!workLogIds && !userId) {
      return NextResponse.json(
        { error: 'Either workLogIds or userId is required' },
        { status: 400 }
      );
    }

    const paidAt = new Date();

    if (workLogIds && Array.isArray(workLogIds)) {
      // Mark specific work logs as paid
      await prisma.workLog.updateMany({
        where: { id: { in: workLogIds } },
        data: { isPaid: true, paidAt },
      });
    } else if (userId) {
      // Mark all unpaid work logs for a user as paid
      await prisma.workLog.updateMany({
        where: { userId, isPaid: false, clockOut: { not: null } },
        data: { isPaid: true, paidAt },
      });
    }

    return NextResponse.json({ success: true, paidAt });
  } catch (error) {
    console.error('Error marking as paid:', error);
    return NextResponse.json(
      { error: 'Failed to mark as paid' },
      { status: 500 }
    );
  }
}
