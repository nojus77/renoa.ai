import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, addDays, format } from 'date-fns';

export const dynamic = 'force-dynamic';

/**
 * GET /api/provider/team/[id]/profile
 * Get full profile data for a team member
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const weekOffset = parseInt(searchParams.get('weekOffset') || '0');

    // Get user with all related data
    const user = await prisma.providerUser.findUnique({
      where: { id },
      include: {
        workerSkills: {
          include: {
            skill: true,
          },
        },
        workLogs: {
          orderBy: { clockIn: 'desc' },
          take: 50,
          include: {
            job: {
              select: {
                id: true,
                serviceType: true,
                address: true,
                startTime: true,
                status: true,
                actualValue: true,
                estimatedValue: true,
                customer: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Team member not found' },
        { status: 404 }
      );
    }

    // Calculate date ranges
    const now = new Date();
    const baseWeekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday
    const weekStart = addDays(baseWeekStart, weekOffset * 7);
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    // Get this week's stats
    const weekWorkLogs = await prisma.workLog.findMany({
      where: {
        userId: id,
        clockIn: { gte: weekStart, lte: weekEnd },
      },
    });

    const weekHours = weekWorkLogs.reduce((sum, log) => sum + (log.hoursWorked || 0), 0);
    const weekJobs = new Set(weekWorkLogs.map(log => log.jobId)).size;
    const weekEarnings = weekWorkLogs.reduce((sum, log) => sum + (log.earnings || 0), 0);

    // Get this month's stats
    const monthWorkLogs = await prisma.workLog.findMany({
      where: {
        userId: id,
        clockIn: { gte: monthStart, lte: monthEnd },
      },
    });

    const monthHours = monthWorkLogs.reduce((sum, log) => sum + (log.hoursWorked || 0), 0);
    const monthJobs = new Set(monthWorkLogs.map(log => log.jobId)).size;
    const monthEarnings = monthWorkLogs.reduce((sum, log) => sum + (log.earnings || 0), 0);

    // Get total unpaid earnings
    const unpaidWorkLogs = await prisma.workLog.aggregate({
      where: {
        userId: id,
        isPaid: false,
      },
      _sum: {
        earnings: true,
      },
    });

    const totalUnpaidEarnings = unpaidWorkLogs._sum.earnings || 0;

    // Get average rating from completed jobs
    const jobsWithReviews = await prisma.job.findMany({
      where: {
        assignedUserIds: { has: id },
        status: 'completed',
      },
      include: {
        reviews: true,
      },
    });

    const reviews = jobsWithReviews
      .filter(j => j.reviews?.rating)
      .map(j => j.reviews!.rating);
    const avgRating = reviews.length > 0
      ? reviews.reduce((a, b) => a + b, 0) / reviews.length
      : null;
    const totalReviews = reviews.length;

    // Get this week's jobs
    const thisWeekJobs = await prisma.job.findMany({
      where: {
        assignedUserIds: { has: id },
        startTime: { gte: weekStart, lte: weekEnd },
      },
      orderBy: { startTime: 'asc' },
      include: {
        customer: {
          select: {
            name: true,
          },
        },
      },
    });

    // Format schedule for the week
    const scheduleByDay: Record<string, {
      date: string;
      dayName: string;
      dayNum: number;
      isOff: boolean;
      workingHours: { start: string; end: string } | null;
      jobs: Array<{
        id: string;
        time: string;
        service: string;
        customer: string;
        status: string;
      }>;
    }> = {};

    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

    for (let i = 0; i < 7; i++) {
      const date = addDays(weekStart, i);
      const dayName = dayNames[date.getDay()];
      const dateStr = format(date, 'yyyy-MM-dd');
      const workingHours = user.workingHours as Record<string, { start: string; end: string }> | null;
      const dayHours = workingHours?.[dayName] || null;

      scheduleByDay[dateStr] = {
        date: dateStr,
        dayName: format(date, 'EEE'),
        dayNum: date.getDate(),
        isOff: !dayHours,
        workingHours: dayHours,
        jobs: [],
      };
    }

    // Add jobs to the schedule
    for (const job of thisWeekJobs) {
      const dateStr = format(job.startTime, 'yyyy-MM-dd');
      if (scheduleByDay[dateStr]) {
        scheduleByDay[dateStr].jobs.push({
          id: job.id,
          time: format(job.startTime, 'h:mma').toLowerCase(),
          service: job.serviceType,
          customer: job.customer.name,
          status: job.status,
        });
      }
    }

    // Check for time off this week
    const timeOffThisWeek = await prisma.workerTimeOff.findMany({
      where: {
        userId: id,
        status: 'approved',
        OR: [
          { startDate: { lte: weekEnd }, endDate: { gte: weekStart } },
        ],
      },
    });

    // Mark days as off if they have approved time off
    for (const timeOff of timeOffThisWeek) {
      const startDate = new Date(timeOff.startDate);
      const endDate = new Date(timeOff.endDate);

      for (let date = new Date(startDate); date <= endDate; date = addDays(date, 1)) {
        const dateStr = format(date, 'yyyy-MM-dd');
        if (scheduleByDay[dateStr]) {
          scheduleByDay[dateStr].isOff = true;
          scheduleByDay[dateStr].workingHours = null;
        }
      }
    }

    // Get recent jobs (last 20)
    const recentJobs = await prisma.job.findMany({
      where: {
        assignedUserIds: { has: id },
      },
      orderBy: { startTime: 'desc' },
      take: 20,
      include: {
        customer: {
          select: {
            name: true,
          },
        },
      },
    });

    // Get earnings history (grouped by week)
    const allWorkLogs = await prisma.workLog.findMany({
      where: { userId: id },
      orderBy: { clockIn: 'desc' },
    });

    // Group work logs by week
    const earningsHistory: Array<{
      period: string;
      startDate: string;
      endDate: string;
      hours: number;
      jobs: number;
      amount: number;
      isPaid: boolean;
      paidAt: string | null;
    }> = [];

    const workLogsByWeek = new Map<string, typeof allWorkLogs>();
    for (const log of allWorkLogs) {
      const weekStart = startOfWeek(log.clockIn, { weekStartsOn: 1 });
      const weekKey = format(weekStart, 'yyyy-MM-dd');
      if (!workLogsByWeek.has(weekKey)) {
        workLogsByWeek.set(weekKey, []);
      }
      workLogsByWeek.get(weekKey)!.push(log);
    }

    for (const [weekKey, logs] of Array.from(workLogsByWeek.entries())) {
      const weekStart = new Date(weekKey);
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });

      const hours = logs.reduce((sum, log) => sum + (log.hoursWorked || 0), 0);
      const jobs = new Set(logs.map(log => log.jobId)).size;
      const amount = logs.reduce((sum, log) => sum + (log.earnings || 0), 0);
      const isPaid = logs.every(log => log.isPaid);
      const paidAt = logs.find(log => log.paidAt)?.paidAt?.toISOString() || null;

      earningsHistory.push({
        period: `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`,
        startDate: format(weekStart, 'yyyy-MM-dd'),
        endDate: format(weekEnd, 'yyyy-MM-dd'),
        hours: Math.round(hours * 10) / 10,
        jobs,
        amount,
        isPaid,
        paidAt,
      });
    }

    // Get all time off requests
    const timeOffRequests = await prisma.workerTimeOff.findMany({
      where: { userId: id },
      orderBy: { startDate: 'desc' },
    });

    // Transform skills
    const skills = user.workerSkills.map(ws => ({
      id: ws.skill.id,
      name: ws.skill.name,
      level: ws.level,
      category: ws.skill.category,
    }));

    return NextResponse.json({
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        profilePhotoUrl: user.profilePhotoUrl,
        payType: user.payType,
        hourlyRate: user.hourlyRate,
        commissionRate: user.commissionRate,
        color: user.color,
        createdAt: user.createdAt.toISOString(),
        canCreateJobs: user.canCreateJobs,
        jobsNeedApproval: user.jobsNeedApproval,
        homeAddress: user.homeAddress,
        homeLatitude: user.homeLatitude,
        homeLongitude: user.homeLongitude,
      },
      skills,
      stats: {
        weekHours: Math.round(weekHours * 10) / 10,
        weekJobs,
        weekEarnings,
        monthHours: Math.round(monthHours * 10) / 10,
        monthJobs,
        monthEarnings,
        totalUnpaidEarnings,
        avgRating: avgRating ? Math.round(avgRating * 10) / 10 : null,
        totalReviews,
      },
      schedule: {
        weekStart: format(weekStart, 'yyyy-MM-dd'),
        weekEnd: format(weekEnd, 'yyyy-MM-dd'),
        days: Object.values(scheduleByDay),
      },
      recentJobs: recentJobs.map(job => ({
        id: job.id,
        date: job.startTime.toISOString(),
        customer: job.customer.name,
        service: job.serviceType,
        status: job.status,
        address: job.address,
        duration: job.estimatedDuration,
        earnings: job.actualValue || job.estimatedValue,
      })),
      earnings: {
        history: earningsHistory.slice(0, 12), // Last 12 weeks
        pending: totalUnpaidEarnings,
      },
      timeOff: timeOffRequests.map(req => ({
        id: req.id,
        startDate: req.startDate.toISOString(),
        endDate: req.endDate.toISOString(),
        reason: req.reason,
        notes: req.notes,
        status: req.status,
        createdAt: req.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Error fetching team member profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}
