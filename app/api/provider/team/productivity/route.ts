import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { startOfWeek, startOfMonth, startOfQuarter, startOfYear, subWeeks, subMonths, subYears } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get('providerId');
    const period = searchParams.get('period') || 'month';

    if (!providerId) {
      return NextResponse.json({ error: 'Provider ID is required' }, { status: 400 });
    }

    // Calculate date range
    const now = new Date();
    let startDate: Date;
    let previousStartDate: Date;
    let previousEndDate: Date;

    switch (period) {
      case 'week':
        startDate = startOfWeek(now, { weekStartsOn: 1 });
        previousStartDate = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
        previousEndDate = startDate;
        break;
      case 'month':
        startDate = startOfMonth(now);
        previousStartDate = startOfMonth(subMonths(now, 1));
        previousEndDate = startDate;
        break;
      case 'quarter':
        startDate = startOfQuarter(now);
        previousStartDate = startOfQuarter(subMonths(now, 3));
        previousEndDate = startDate;
        break;
      case 'year':
        startDate = startOfYear(now);
        previousStartDate = startOfYear(subYears(now, 1));
        previousEndDate = startDate;
        break;
      default: // all time
        startDate = new Date(0);
        previousStartDate = new Date(0);
        previousEndDate = new Date(0);
    }

    // Get all active field workers
    const workers = await prisma.providerUser.findMany({
      where: {
        providerId,
        status: 'active',
        role: { in: ['field', 'office'] },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        role: true,
        profilePhotoUrl: true,
        profilePhotoBlobPath: true,
      },
    });

    // Get productivity data for each worker
    const productivityData = await Promise.all(
      workers.map(async (worker) => {
        const name = `${worker.firstName} ${worker.lastName}`;

        // Get completed jobs where this worker was assigned in the current period
        const currentJobs = await prisma.job.findMany({
          where: {
            providerId,
            assignedUserIds: { has: worker.id },
            status: 'completed',
            completedAt: { gte: startDate },
          },
          select: {
            id: true,
            actualValue: true,
            estimatedValue: true,
            assignedUserIds: true,
          },
        });

        // Get work logs for the current period
        const currentWorkLogs = await prisma.workLog.findMany({
          where: {
            userId: worker.id,
            clockIn: { gte: startDate },
            clockOut: { not: null },
          },
          select: {
            clockIn: true,
            clockOut: true,
            hoursWorked: true,
          },
        });

        // Calculate current period stats
        const jobsCompleted = currentJobs.length;

        // Revenue - split among assigned workers
        const revenue = currentJobs.reduce((sum, job) => {
          const value = job.actualValue || job.estimatedValue || 0;
          const workerCount = job.assignedUserIds?.length || 1;
          return sum + value / workerCount;
        }, 0);

        // Calculate minutes worked from work logs
        const minutesWorked = currentWorkLogs.reduce((sum, log) => {
          if (log.hoursWorked) {
            return sum + log.hoursWorked * 60;
          }
          if (log.clockIn && log.clockOut) {
            const start = new Date(log.clockIn);
            const end = new Date(log.clockOut);
            return sum + (end.getTime() - start.getTime()) / 60000;
          }
          return sum;
        }, 0);

        const hoursWorked = minutesWorked / 60;
        const productivity = hoursWorked > 0 ? revenue / hoursWorked : 0;

        // Get previous period stats for trend calculation
        let prevRevenue = 0;
        let prevMinutesWorked = 0;

        if (period !== 'all') {
          const previousJobs = await prisma.job.findMany({
            where: {
              providerId,
              assignedUserIds: { has: worker.id },
              status: 'completed',
              completedAt: {
                gte: previousStartDate,
                lt: previousEndDate,
              },
            },
            select: {
              actualValue: true,
              estimatedValue: true,
              assignedUserIds: true,
            },
          });

          prevRevenue = previousJobs.reduce((sum, job) => {
            const value = job.actualValue || job.estimatedValue || 0;
            const workerCount = job.assignedUserIds?.length || 1;
            return sum + value / workerCount;
          }, 0);

          const previousWorkLogs = await prisma.workLog.findMany({
            where: {
              userId: worker.id,
              clockIn: {
                gte: previousStartDate,
                lt: previousEndDate,
              },
              clockOut: { not: null },
            },
            select: {
              clockIn: true,
              clockOut: true,
              hoursWorked: true,
            },
          });

          prevMinutesWorked = previousWorkLogs.reduce((sum, log) => {
            if (log.hoursWorked) {
              return sum + log.hoursWorked * 60;
            }
            if (log.clockIn && log.clockOut) {
              const start = new Date(log.clockIn);
              const end = new Date(log.clockOut);
              return sum + (end.getTime() - start.getTime()) / 60000;
            }
            return sum;
          }, 0);
        }

        const prevHoursWorked = prevMinutesWorked / 60;
        const prevProductivity = prevHoursWorked > 0 ? prevRevenue / prevHoursWorked : 0;

        // Calculate trend percentage
        const trend =
          prevProductivity > 0
            ? ((productivity - prevProductivity) / prevProductivity) * 100
            : productivity > 0
            ? 100
            : 0;

        return {
          id: worker.id,
          name,
          role: worker.role,
          profilePhotoUrl: worker.profilePhotoBlobPath || worker.profilePhotoUrl,
          jobsCompleted,
          revenue,
          minutesWorked,
          hoursWorked,
          productivity,
          trend,
        };
      })
    );

    // Sort by productivity (highest first), filter out workers with no time tracked
    const sorted = productivityData
      .filter((w) => w.hoursWorked > 0 || w.jobsCompleted > 0)
      .sort((a, b) => b.productivity - a.productivity);

    // Calculate totals
    const totalRevenue = sorted.reduce((sum, w) => sum + w.revenue, 0);
    const totalMinutes = sorted.reduce((sum, w) => sum + w.minutesWorked, 0);
    const totalHours = totalMinutes / 60;
    const totalJobs = sorted.reduce((sum, w) => sum + w.jobsCompleted, 0);
    const avgProductivity = totalHours > 0 ? totalRevenue / totalHours : 0;

    // Find most improved (highest positive trend)
    const mostImproved =
      [...sorted].filter((w) => w.trend > 0).sort((a, b) => b.trend - a.trend)[0] || null;

    return NextResponse.json({
      workers: sorted,
      summary: {
        totalRevenue,
        totalHours,
        totalJobs,
        avgProductivity,
      },
      mostImproved,
      period,
    });
  } catch (error) {
    console.error('Productivity API error:', error);
    return NextResponse.json({ error: 'Failed to fetch productivity' }, { status: 500 });
  }
}
