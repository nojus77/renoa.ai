import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET earnings summary for worker
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const period = searchParams.get('period') || 'week'; // 'week' or 'month'

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Calculate date range
    const now = new Date();
    let startDate: Date;

    if (period === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else {
      // Week - start from Monday
      startDate = new Date(now);
      const day = startDate.getDay();
      const diff = startDate.getDate() - day + (day === 0 ? -6 : 1);
      startDate.setDate(diff);
      startDate.setHours(0, 0, 0, 0);
    }

    // Get work logs for period
    const workLogs = await prisma.workLog.findMany({
      where: {
        userId,
        clockIn: { gte: startDate },
        clockOut: { not: null },
      },
      include: {
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

    // Calculate totals
    const totalEarnings = workLogs.reduce((sum, log) => sum + (log.earnings || 0), 0);
    const totalHours = workLogs.reduce((sum, log) => sum + (log.hoursWorked || 0), 0);
    const jobsCompleted = workLogs.length;
    const pendingPay = workLogs
      .filter((log) => !log.isPaid)
      .reduce((sum, log) => sum + (log.earnings || 0), 0);
    const paidPay = workLogs
      .filter((log) => log.isPaid)
      .reduce((sum, log) => sum + (log.earnings || 0), 0);

    // Group by date
    const byDate: Record<string, typeof workLogs> = {};
    workLogs.forEach((log) => {
      const dateKey = log.clockIn.toISOString().split('T')[0];
      if (!byDate[dateKey]) {
        byDate[dateKey] = [];
      }
      byDate[dateKey].push(log);
    });

    // Get user pay info
    const user = await prisma.providerUser.findUnique({
      where: { id: userId },
      select: {
        payType: true,
        hourlyRate: true,
        commissionRate: true,
      },
    });

    return NextResponse.json({
      workLogs,
      byDate,
      summary: {
        totalEarnings: Math.round(totalEarnings * 100) / 100,
        totalHours: Math.round(totalHours * 100) / 100,
        jobsCompleted,
        pendingPay: Math.round(pendingPay * 100) / 100,
        paidPay: Math.round(paidPay * 100) / 100,
      },
      payInfo: user,
      period,
      startDate,
    });
  } catch (error) {
    console.error('Error fetching earnings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch earnings' },
      { status: 500 }
    );
  }
}
