import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { startOfWeek, endOfWeek, eachDayOfInterval, format, addDays, isSameDay } from 'date-fns';

const prisma = new PrismaClient();

interface DayJob {
  id: string;
  serviceType: string;
  customerName: string;
  customerAddress: string;
  startTime: string;
  endTime: string;
  duration: number;
  status: string;
  estimatedValue: number | null;
  assignedCrewId: string | null;
  crewName: string | null;
  crewColor: string | null;
}

interface WorkerDay {
  date: string;
  dayOfWeek: string;
  isWorkingDay: boolean;
  hours: number;
  capacity: number;
  utilization: number;
  jobs: DayJob[];
  conflicts: Array<{ jobA: string; jobB: string; overlapMinutes: number }>;
}

interface WorkerWeekData {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  photo: string | null;
  color: string;
  role: string;
  weeklyStats: {
    totalHours: number;
    totalCapacity: number;
    utilization: number;
    jobCount: number;
  };
  days: WorkerDay[];
}

interface WeekStats {
  totalJobs: number;
  assignedJobs: number;
  unassignedJobs: number;
  totalHours: number;
  totalCapacity: number;
  avgUtilization: number;
  conflictCount: number;
  overbookedWorkers: string[];
  lowUtilizationDays: string[];
}

// Worker colors for assignment
const WORKER_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
];

/**
 * GET /api/provider/calendar/weekly
 * Fetches weekly calendar data for all team members
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const providerId = searchParams.get('providerId');
    const startDateStr = searchParams.get('startDate');

    if (!providerId) {
      return NextResponse.json(
        { error: 'Provider ID required' },
        { status: 400 }
      );
    }

    // Calculate week range
    const startDate = startDateStr
      ? startOfWeek(new Date(startDateStr), { weekStartsOn: 1 }) // Monday start
      : startOfWeek(new Date(), { weekStartsOn: 1 });

    const endDate = endOfWeek(startDate, { weekStartsOn: 1 });
    const weekDays = eachDayOfInterval({ start: startDate, end: endDate });

    // Get all active team members
    const teamMembers = await prisma.providerUser.findMany({
      where: {
        providerId,
        status: 'active',
      },
      orderBy: [
        { role: 'asc' },
        { firstName: 'asc' },
      ],
    });

    // Get all jobs for the week
    const weekJobs = await prisma.job.findMany({
      where: {
        providerId,
        startTime: {
          gte: startDate,
          lte: addDays(endDate, 1), // Include end of day
        },
        status: {
          notIn: ['cancelled'],
        },
      },
      include: {
        customer: true,
        assignedCrew: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    // Get unassigned jobs count for the week
    const unassignedJobs = weekJobs.filter(
      job => !job.assignedUserIds || job.assignedUserIds.length === 0
    );

    // Build worker data
    const workers: WorkerWeekData[] = teamMembers.map((member, index) => {
      const memberJobs = weekJobs.filter(
        job => job.assignedUserIds?.includes(member.id)
      );

      // Build day-by-day data
      const days: WorkerDay[] = weekDays.map(day => {
        const dayJobs = memberJobs.filter(job =>
          isSameDay(new Date(job.startTime), day)
        );

        // Calculate hours for this day
        const dayHours = dayJobs.reduce((total, job) => {
          const start = new Date(job.startTime);
          const end = new Date(job.endTime);
          return total + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        }, 0);

        // Default working hours (8 hours per weekday, 0 for weekends)
        const dayOfWeek = day.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const capacity = isWeekend ? 4 : 8; // 4 hours on weekends, 8 on weekdays
        const isWorkingDay = !isWeekend || dayJobs.length > 0;

        // Detect conflicts (overlapping jobs)
        const conflicts: Array<{ jobA: string; jobB: string; overlapMinutes: number }> = [];
        for (let i = 0; i < dayJobs.length; i++) {
          for (let j = i + 1; j < dayJobs.length; j++) {
            const jobA = dayJobs[i];
            const jobB = dayJobs[j];
            const startA = new Date(jobA.startTime).getTime();
            const endA = new Date(jobA.endTime).getTime();
            const startB = new Date(jobB.startTime).getTime();
            const endB = new Date(jobB.endTime).getTime();

            // Check for overlap
            if (startA < endB && startB < endA) {
              const overlapStart = Math.max(startA, startB);
              const overlapEnd = Math.min(endA, endB);
              const overlapMinutes = (overlapEnd - overlapStart) / (1000 * 60);
              conflicts.push({
                jobA: jobA.id,
                jobB: jobB.id,
                overlapMinutes,
              });
            }
          }
        }

        return {
          date: format(day, 'yyyy-MM-dd'),
          dayOfWeek: format(day, 'EEEE'),
          isWorkingDay,
          hours: Math.round(dayHours * 10) / 10,
          capacity,
          utilization: capacity > 0 ? Math.round((dayHours / capacity) * 100) : 0,
          jobs: dayJobs.map(job => ({
            id: job.id,
            serviceType: job.serviceType,
            customerName: job.customer?.name || 'Unknown',
            customerAddress: job.customer?.address || job.address,
            startTime: format(new Date(job.startTime), 'HH:mm'),
            endTime: format(new Date(job.endTime), 'HH:mm'),
            duration: (new Date(job.endTime).getTime() - new Date(job.startTime).getTime()) / (1000 * 60 * 60),
            status: job.status,
            estimatedValue: job.estimatedValue ? Number(job.estimatedValue) : null,
            assignedCrewId: job.assignedCrewId,
            crewName: job.assignedCrew?.name || null,
            crewColor: job.assignedCrew?.color || null,
          })),
          conflicts,
        };
      });

      // Calculate weekly stats
      const totalHours = days.reduce((sum, d) => sum + d.hours, 0);
      const totalCapacity = days.reduce((sum, d) => sum + (d.isWorkingDay ? d.capacity : 0), 0);
      const jobCount = days.reduce((sum, d) => sum + d.jobs.length, 0);

      return {
        id: member.id,
        name: `${member.firstName} ${member.lastName}`,
        firstName: member.firstName,
        lastName: member.lastName,
        photo: member.profilePhotoUrl,
        color: WORKER_COLORS[index % WORKER_COLORS.length],
        role: member.role,
        weeklyStats: {
          totalHours: Math.round(totalHours * 10) / 10,
          totalCapacity,
          utilization: totalCapacity > 0 ? Math.round((totalHours / totalCapacity) * 100) : 0,
          jobCount,
        },
        days,
      };
    });

    // Calculate week stats
    const totalHours = workers.reduce((sum, w) => sum + w.weeklyStats.totalHours, 0);
    const totalCapacity = workers.reduce((sum, w) => sum + w.weeklyStats.totalCapacity, 0);
    const conflictCount = workers.reduce(
      (sum, w) => sum + w.days.reduce((daySum, d) => daySum + d.conflicts.length, 0),
      0
    );
    const overbookedWorkers = workers
      .filter(w => w.days.some(d => d.utilization > 100))
      .map(w => w.id);

    // Find days with low utilization (< 40% average across all workers)
    const lowUtilizationDays: string[] = [];
    weekDays.forEach((day, index) => {
      const dayKey = format(day, 'yyyy-MM-dd');
      const avgUtilization = workers.reduce((sum, w) => sum + w.days[index].utilization, 0) / workers.length;
      if (avgUtilization < 40 && workers.length > 0) {
        lowUtilizationDays.push(dayKey);
      }
    });

    const weekStats: WeekStats = {
      totalJobs: weekJobs.length,
      assignedJobs: weekJobs.length - unassignedJobs.length,
      unassignedJobs: unassignedJobs.length,
      totalHours: Math.round(totalHours * 10) / 10,
      totalCapacity,
      avgUtilization: totalCapacity > 0 ? Math.round((totalHours / totalCapacity) * 100) : 0,
      conflictCount,
      overbookedWorkers,
      lowUtilizationDays,
    };

    // Calculate insights
    const insights = calculateWeeklyInsights(workers, weekStats, weekDays);

    return NextResponse.json({
      weekStart: format(startDate, 'yyyy-MM-dd'),
      weekEnd: format(endDate, 'yyyy-MM-dd'),
      workers,
      weekStats: {
        ...weekStats,
        activeWorkers: workers.length,
        avgCapacity: weekStats.avgUtilization,
        overbookedDays: workers.reduce(
          (sum, w) => sum + w.days.filter(d => d.utilization > 90).length,
          0
        ),
        underutilizedDays: workers.reduce(
          (sum, w) => sum + w.days.filter(d => d.utilization > 0 && d.utilization < 40).length,
          0
        ),
      },
      insights,
      unassignedJobs: unassignedJobs.map(job => ({
        id: job.id,
        serviceType: job.serviceType,
        customerName: job.customer?.name || 'Unknown',
        customerAddress: job.customer?.address || job.address,
        startTime: job.startTime.toISOString(),
        endTime: job.endTime.toISOString(),
        duration: (new Date(job.endTime).getTime() - new Date(job.startTime).getTime()) / (1000 * 60 * 60),
        estimatedValue: job.estimatedValue ? Number(job.estimatedValue) : null,
      })),
    });
  } catch (error) {
    console.error('Error fetching weekly calendar:', error);
    return NextResponse.json(
      { error: 'Failed to fetch weekly calendar' },
      { status: 500 }
    );
  }
}

/**
 * Calculate weekly insights for optimization suggestions
 */
function calculateWeeklyInsights(
  workers: WorkerWeekData[],
  weekStats: WeekStats,
  weekDays: Date[]
) {
  const problems: Array<{
    type: string;
    message: string;
    severity: 'warning' | 'error';
    actionLabel?: string;
    workerId?: string;
    day?: string;
  }> = [];

  const suggestions: Array<{
    type: string;
    message: string;
    impact?: string;
  }> = [];

  const opportunities: Array<{
    type: string;
    message: string;
    impact?: string;
  }> = [];

  // Detect overbooked days (>90% utilization)
  workers.forEach((worker) => {
    worker.days.forEach((day) => {
      if (day.utilization > 100) {
        problems.push({
          type: 'overbooked',
          severity: 'error',
          workerId: worker.id,
          day: day.date,
          message: `${worker.firstName} is overbooked at ${day.utilization}% on ${day.dayOfWeek}`,
          actionLabel: 'Rebalance',
        });
      } else if (day.utilization > 90) {
        problems.push({
          type: 'near_capacity',
          severity: 'warning',
          workerId: worker.id,
          day: day.date,
          message: `${worker.firstName} is near capacity (${day.utilization}%) on ${day.dayOfWeek}`,
          actionLabel: 'Review',
        });
      }
    });
  });

  // Detect scheduling conflicts
  const totalConflicts = workers.reduce(
    (sum, w) => sum + w.days.reduce((daySum, d) => daySum + d.conflicts.length, 0),
    0
  );

  if (totalConflicts > 0) {
    problems.push({
      type: 'conflicts',
      severity: 'error',
      message: `${totalConflicts} scheduling conflict${totalConflicts !== 1 ? 's' : ''} need resolution`,
      actionLabel: 'View Conflicts',
    });
  }

  // Detect underutilized days
  const underutilizedDays: Record<string, string[]> = {};
  workers.forEach((worker) => {
    worker.days.forEach((day) => {
      if (day.utilization > 0 && day.utilization < 40 && day.isWorkingDay) {
        if (!underutilizedDays[day.date]) {
          underutilizedDays[day.date] = [];
        }
        underutilizedDays[day.date].push(worker.firstName);
      }
    });
  });

  Object.entries(underutilizedDays).forEach(([date, workerNames]) => {
    if (workerNames.length >= 2) {
      const dayName = workers[0]?.days.find((d) => d.date === date)?.dayOfWeek || date;
      opportunities.push({
        type: 'capacity',
        message: `${dayName} has ${workerNames.length} workers under 40% capacity - opportunity to schedule more work`,
        impact: `Could add ${workerNames.length * 4}+ hours of work`,
      });
    }
  });

  // Suggest workload balancing
  const overworked = workers.filter((w) => w.weeklyStats.utilization > 85);
  const underworked = workers.filter((w) => w.weeklyStats.utilization < 50 && w.weeklyStats.utilization > 0);

  if (overworked.length > 0 && underworked.length > 0) {
    suggestions.push({
      type: 'balance',
      message: `Move jobs from ${overworked[0].firstName} (${overworked[0].weeklyStats.utilization}%) to ${underworked[0].firstName} (${underworked[0].weeklyStats.utilization}%)`,
      impact: 'Better workload distribution',
    });
  }

  // Suggest filling gaps with unassigned jobs
  if (weekStats.unassignedJobs > 0 && Object.keys(underutilizedDays).length > 0) {
    suggestions.push({
      type: 'fill_gaps',
      message: `${weekStats.unassignedJobs} unassigned job${weekStats.unassignedJobs !== 1 ? 's' : ''} could fill underutilized days`,
      impact: `Increase team utilization and revenue`,
    });
  }

  // Revenue opportunity from low utilization
  const avgUtil = weekStats.avgUtilization;
  if (avgUtil < 60 && workers.length > 0) {
    const potentialHours = Math.round((0.75 - avgUtil / 100) * weekStats.totalCapacity);
    if (potentialHours > 5) {
      opportunities.push({
        type: 'revenue',
        message: `Team is only at ${avgUtil}% average capacity this week`,
        impact: `Potential for ${potentialHours} more hours of billable work`,
      });
    }
  }

  // Detect uneven distribution across days
  if (workers.length > 0) {
    const dayUtilizations = weekDays.map((_, i) => {
      return workers.reduce((sum, w) => sum + w.days[i].utilization, 0) / workers.length;
    });

    const maxDayUtil = Math.max(...dayUtilizations);
    const minDayUtil = Math.min(...dayUtilizations.filter((u) => u > 0));

    if (maxDayUtil - minDayUtil > 40) {
      const maxDayName = workers[0]?.days[dayUtilizations.indexOf(maxDayUtil)]?.dayOfWeek || 'Unknown';
      const minDayName = workers[0]?.days[dayUtilizations.indexOf(minDayUtil)]?.dayOfWeek || 'Unknown';

      suggestions.push({
        type: 'distribute',
        message: `${maxDayName} is much busier than ${minDayName}. Consider redistributing work.`,
        impact: 'Smoother workflow and less stress',
      });
    }
  }

  return { problems, suggestions, opportunities };
}
