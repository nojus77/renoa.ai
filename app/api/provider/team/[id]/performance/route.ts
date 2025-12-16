import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths } from 'date-fns';

export const dynamic = 'force-dynamic';

/**
 * GET /api/provider/team/[id]/performance
 * Get worker performance data for the specified period
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: workerId } = await params;
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'week';

    // Get the worker
    const worker = await prisma.providerUser.findUnique({
      where: { id: workerId },
      select: { id: true, providerId: true, firstName: true, lastName: true },
    });

    if (!worker) {
      return NextResponse.json({ error: 'Worker not found' }, { status: 404 });
    }

    // Calculate date range based on period
    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    switch (period) {
      case 'month':
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        break;
      case 'quarter':
        startDate = startOfMonth(subMonths(now, 2));
        endDate = endOfMonth(now);
        break;
      case 'week':
      default:
        startDate = startOfWeek(now, { weekStartsOn: 1 });
        endDate = endOfWeek(now, { weekStartsOn: 1 });
        break;
    }

    // Get completed jobs for this worker in the period
    const jobs = await prisma.job.findMany({
      where: {
        providerId: worker.providerId,
        assignedUserIds: { has: workerId },
        startTime: {
          gte: startDate,
          lte: endDate,
        },
        status: 'completed',
      },
      include: {
        customer: {
          select: { name: true },
        },
      },
      orderBy: { startTime: 'desc' },
    });

    // Calculate stats
    const jobsCompleted = jobs.length;
    const totalRevenue = jobs.reduce((sum, job) => sum + (job.actualValue || job.estimatedValue || 0), 0);

    // Calculate total job time from completed jobs
    let totalJobHours = 0;
    jobs.forEach((job) => {
      if (job.startTime && job.endTime) {
        const duration = (job.endTime.getTime() - job.startTime.getTime()) / (1000 * 60 * 60);
        totalJobHours += duration;
      }
    });

    // Get work logs for the period
    const workLogs = await prisma.workLog.findMany({
      where: {
        userId: workerId,
        clockIn: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Calculate total hours worked from work logs
    const totalHoursWorked = workLogs.reduce((sum, log) => sum + (log.hoursWorked || 0), 0);

    // Use total hours from work logs, or fall back to job hours
    const hoursWorked = totalHoursWorked > 0 ? totalHoursWorked : totalJobHours;

    const avgJobDuration = jobsCompleted > 0 ? totalJobHours / jobsCompleted : 0;
    const revenuePerHour = hoursWorked > 0 ? totalRevenue / hoursWorked : 0;

    // Calculate utilization (job time vs total hours worked)
    // Assume 8 hours available per day for the period
    const daysInPeriod = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const workDays = Math.min(daysInPeriod, period === 'week' ? 5 : period === 'month' ? 22 : 66);
    const availableHours = workDays * 8;
    const utilization = availableHours > 0 ? Math.round((totalJobHours / availableHours) * 100) : 0;

    // Time breakdown (estimate drive and idle time)
    // For now, estimate drive time as 20% of job time and calculate idle
    const driveTime = totalJobHours * 0.2;
    const idleTime = Math.max(0, hoursWorked - totalJobHours - driveTime);

    // Recent jobs formatted for display
    const recentJobs = jobs.slice(0, 10).map((job) => ({
      id: job.id,
      date: job.startTime.toISOString(),
      customer: job.customer?.name || 'Unknown',
      service: job.serviceType,
      status: job.status,
      duration: job.startTime && job.endTime
        ? (job.endTime.getTime() - job.startTime.getTime()) / (1000 * 60 * 60)
        : 0,
      revenue: job.actualValue || job.estimatedValue || 0,
    }));

    return NextResponse.json({
      stats: {
        jobsCompleted,
        totalRevenue,
        hoursWorked,
        avgJobDuration,
        revenuePerHour,
      },
      utilization: Math.min(utilization, 100),
      timeBreakdown: {
        jobTime: totalJobHours,
        driveTime,
        idleTime,
      },
      recentJobs,
      period,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
    });
  } catch (error) {
    console.error('[Performance API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch performance data' },
      { status: 500 }
    );
  }
}
