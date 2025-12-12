import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET unpaid work logs for provider
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get('providerId');

    if (!providerId) {
      return NextResponse.json({ error: 'Provider ID is required' }, { status: 400 });
    }

    const workLogs = await prisma.workLog.findMany({
      where: {
        providerId,
        isPaid: false,
        clockOut: { not: null },
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
            customer: {
              select: { name: true },
            },
          },
        },
      },
      orderBy: { clockIn: 'desc' },
    });

    // Group by worker
    const byWorker: Record<string, {
      user: typeof workLogs[0]['user'];
      logs: typeof workLogs;
      totalHours: number;
      totalOwed: number;
    }> = {};

    workLogs.forEach((log) => {
      if (!byWorker[log.userId]) {
        byWorker[log.userId] = {
          user: log.user,
          logs: [],
          totalHours: 0,
          totalOwed: 0,
        };
      }
      byWorker[log.userId].logs.push(log);
      byWorker[log.userId].totalHours += log.hoursWorked || 0;
      byWorker[log.userId].totalOwed += log.earnings || 0;
    });

    // Calculate totals
    const totalOwed = workLogs.reduce((sum, log) => sum + (log.earnings || 0), 0);
    const totalHours = workLogs.reduce((sum, log) => sum + (log.hoursWorked || 0), 0);

    return NextResponse.json({
      workLogs,
      byWorker: Object.values(byWorker),
      summary: {
        totalOwed: Math.round(totalOwed * 100) / 100,
        totalHours: Math.round(totalHours * 100) / 100,
        workersCount: Object.keys(byWorker).length,
        logsCount: workLogs.length,
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
