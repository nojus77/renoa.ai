import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { startOfMonth, endOfMonth } from 'date-fns';

export const dynamic = 'force-dynamic';

/**
 * GET /api/provider/team/[id]/time-logs
 * Get worker time logs (clock in/out history)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: workerId } = await params;
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 30;

    // Get the worker
    const worker = await prisma.providerUser.findUnique({
      where: { id: workerId },
      select: { id: true, providerId: true },
    });

    if (!worker) {
      return NextResponse.json({ error: 'Worker not found' }, { status: 404 });
    }

    // Get work logs for this worker
    const workLogs = await prisma.workLog.findMany({
      where: {
        userId: workerId,
      },
      orderBy: { clockIn: 'desc' },
      take: limit,
    });

    // Format logs for the response
    const logs = workLogs.map((log) => ({
      id: log.id,
      date: log.clockIn.toISOString().split('T')[0],
      clockIn: log.clockIn.toISOString(),
      clockOut: log.clockOut?.toISOString() || null,
      hoursWorked: log.hoursWorked || 0,
      status: log.clockOut ? 'completed' : 'active',
    }));

    // Calculate summary stats for current month
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const monthLogs = workLogs.filter(
      (log) => log.clockIn >= monthStart && log.clockIn <= monthEnd
    );

    const totalHoursThisMonth = monthLogs.reduce(
      (sum, log) => sum + (log.hoursWorked || 0),
      0
    );
    const daysWorkedThisMonth = new Set(
      monthLogs.map((log) => log.clockIn.toISOString().split('T')[0])
    ).size;

    return NextResponse.json({
      logs,
      summary: {
        totalHoursThisMonth,
        daysWorkedThisMonth,
        avgHoursPerDay: daysWorkedThisMonth > 0 ? totalHoursThisMonth / daysWorkedThisMonth : 0,
      },
    });
  } catch (error) {
    console.error('[Time Logs API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch time logs' },
      { status: 500 }
    );
  }
}
