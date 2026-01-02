import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET /api/provider/calendar/gantt-daily
 * Fetch daily calendar data optimized for Gantt timeline view
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const providerId = searchParams.get('providerId');
    const dateStr = searchParams.get('date');

    if (!providerId) {
      return NextResponse.json({ error: 'Provider ID is required' }, { status: 400 });
    }

    // Parse date or use today
    const targetDate = dateStr ? new Date(dateStr) : new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    console.log('[Gantt Daily] Query params:', {
      providerId,
      dateStr,
      targetDate: targetDate.toISOString(),
      startOfDay: startOfDay.toISOString(),
      endOfDay: endOfDay.toISOString(),
    });

    // Get active team members
    const teamMembers = await prisma.providerUser.findMany({
      where: {
        providerId,
        status: 'active',
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        profilePhotoUrl: true,
        color: true,
        role: true,
        workingHours: true,
      },
      orderBy: [{ role: 'asc' }, { firstName: 'asc' }],
    });

    // Get all jobs for the day (for timeline display)
    // Include jobs that START during the day (regardless of when they end)
    // This ensures we show all jobs that have any overlap with the selected day
    const dayJobs = await prisma.job.findMany({
      where: {
        providerId,
        startTime: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: { notIn: ['cancelled'] },
      },
      select: {
        id: true,
        serviceType: true,
        startTime: true,
        endTime: true,
        status: true,
        address: true,
        assignedUserIds: true,
        assignedCrewId: true,
        estimatedValue: true,
        customer: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
      },
      orderBy: { startTime: 'asc' },
    });

    console.log('[Gantt Daily] Jobs found for date:', {
      count: dayJobs.length,
      jobs: dayJobs.map(j => ({
        id: j.id.slice(-6),
        service: j.serviceType,
        startTime: j.startTime.toISOString(),
        status: j.status,
      })),
    });

    // Get the next date with jobs (for navigation hint when today has no jobs)
    const nextJobDate = dayJobs.length === 0 ? await prisma.job.findFirst({
      where: {
        providerId,
        startTime: { gte: startOfDay },
        status: { notIn: ['cancelled', 'completed'] },
      },
      select: { startTime: true },
      orderBy: { startTime: 'asc' },
    }) : null;

    // Get the previous date with jobs (for navigation hint)
    const prevJobDate = dayJobs.length === 0 ? await prisma.job.findFirst({
      where: {
        providerId,
        startTime: { lt: startOfDay },
        status: { notIn: ['cancelled', 'completed'] },
      },
      select: { startTime: true },
      orderBy: { startTime: 'desc' },
    }) : null;

    // Get blocked times that overlap with the selected day
    const blockedTimes = await prisma.blockedTime.findMany({
      where: {
        providerId,
        // Block overlaps with the day if:
        // - Block start date is before or on the day AND block end date is on or after the day
        fromDate: { lte: endOfDay },
        toDate: { gte: startOfDay },
        // Active recurring blocks
        OR: [
          { isRecurring: false },
          {
            AND: [
              { isRecurring: true },
              {
                OR: [
                  { recurringEndsType: 'never' },
                  { recurringEndsOnDate: { gte: startOfDay } },
                ],
              },
            ],
          },
        ],
      },
      select: {
        id: true,
        fromDate: true,
        toDate: true,
        startTime: true,
        endTime: true,
        reason: true,
        scope: true,
        blockedWorkerIds: true,
        isRecurring: true,
        recurringType: true,
        recurringDaysOfWeek: true,
      },
    });

    // Filter recurring blocks to only include those that match the current day of week
    const dayOfWeek = targetDate.getDay(); // 0 = Sunday, 6 = Saturday
    const filteredBlockedTimes = blockedTimes.filter((block) => {
      if (!block.isRecurring) return true;
      if (block.recurringType === 'weekly' && block.recurringDaysOfWeek) {
        return (block.recurringDaysOfWeek as number[]).includes(dayOfWeek);
      }
      return true;
    });

    // Get ALL unassigned jobs (not just for the selected day)
    // NOTE: Sidebar shows all unassigned jobs for drag-and-drop convenience,
    // but stats.unassignedJobs only counts jobs for the selected day
    const allUnassignedJobs = await prisma.job.findMany({
      where: {
        providerId,
        status: { notIn: ['cancelled', 'completed'] },
        assignedUserIds: { isEmpty: true },
        assignedCrewId: null,
      },
      select: {
        id: true,
        serviceType: true,
        startTime: true,
        endTime: true,
        status: true,
        address: true,
        assignedUserIds: true,
        assignedCrewId: true,
        estimatedValue: true,
        customer: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
      },
      orderBy: { startTime: 'asc' },
    });

    // Process workers with their jobs
    const workers = teamMembers.map((member) => {
      // Get jobs assigned to this worker (only for the selected day)
      const memberJobs = dayJobs.filter((job) => job.assignedUserIds.includes(member.id));

      // Calculate scheduled hours
      const scheduledMinutes = memberJobs.reduce((total, job) => {
        const duration = (job.endTime.getTime() - job.startTime.getTime()) / (1000 * 60);
        return total + duration;
      }, 0);
      const totalHours = scheduledMinutes / 60;

      // Get working hours (default 8 hours)
      const workingHours = (member.workingHours as { start?: string; end?: string } | null) || {
        start: '08:00',
        end: '17:00',
      };
      const [startHour, startMin] = (workingHours.start || '08:00').split(':').map(Number);
      const [endHour, endMin] = (workingHours.end || '17:00').split(':').map(Number);
      const capacityHours = endHour + endMin / 60 - (startHour + startMin / 60);

      const utilization = capacityHours > 0 ? Math.round((totalHours / capacityHours) * 100) : 0;

      return {
        id: member.id,
        firstName: member.firstName,
        lastName: member.lastName,
        photo: member.profilePhotoUrl,
        color: member.color || '#6b7280',
        role: member.role,
        jobs: memberJobs.map((job) => ({
          id: job.id,
          serviceType: job.serviceType,
          customerName: job.customer?.name || 'Unknown',
          customerAddress: job.customer?.address || job.address || '',
          startTime: job.startTime.toISOString(),
          endTime: job.endTime.toISOString(),
          duration: (job.endTime.getTime() - job.startTime.getTime()) / (1000 * 60 * 60),
          status: job.status,
          estimatedValue: job.estimatedValue ? Number(job.estimatedValue) : null,
        })),
        totalHours: Math.round(totalHours * 10) / 10,
        utilization,
      };
    });

    // Process ALL unassigned jobs (not just for selected day)
    const now = new Date();
    const unassignedJobs = allUnassignedJobs.map((job) => {
      const duration = (job.endTime.getTime() - job.startTime.getTime()) / (1000 * 60 * 60);

      // Determine priority
      let priority: 'urgent' | 'today' | 'normal' = 'normal';
      if (job.startTime < now) {
        priority = 'urgent';
      } else if (job.startTime.getTime() - now.getTime() < 2 * 60 * 60 * 1000) {
        priority = 'urgent';
      } else {
        priority = 'today';
      }

      return {
        id: job.id,
        serviceType: job.serviceType,
        customerName: job.customer?.name || 'Unknown',
        customerAddress: job.customer?.address || job.address || '',
        startTime: job.startTime.toISOString(),
        endTime: job.endTime.toISOString(),
        duration: Math.round(duration * 10) / 10,
        status: job.status,
        estimatedValue: job.estimatedValue ? Number(job.estimatedValue) : null,
        priority,
      };
    });

    // Calculate day stats (based on jobs for the selected day)
    const totalJobs = dayJobs.length;
    const assignedJobCount = dayJobs.filter(
      (j) => j.assignedUserIds.length > 0 || j.assignedCrewId
    ).length;
    const totalScheduledHours = workers.reduce((sum, w) => sum + w.totalHours, 0);
    const avgUtilization =
      workers.length > 0
        ? Math.round(workers.reduce((sum, w) => sum + w.utilization, 0) / workers.length)
        : 0;

    return NextResponse.json({
      date: targetDate.toISOString().split('T')[0],
      workers,
      unassignedJobs,
      blockedTimes: filteredBlockedTimes.map((block) => ({
        id: block.id,
        fromDate: block.fromDate.toISOString(),
        toDate: block.toDate.toISOString(),
        startTime: block.startTime,
        endTime: block.endTime,
        reason: block.reason,
        scope: block.scope,
        blockedWorkerIds: block.blockedWorkerIds,
      })),
      stats: {
        totalJobs,
        assignedJobs: assignedJobCount,
        unassignedJobs: totalJobs - assignedJobCount,
        totalHours: Math.round(totalScheduledHours * 10) / 10,
        avgUtilization,
        activeWorkers: workers.filter((w) => w.jobs.length > 0).length,
        totalWorkers: workers.length,
      },
      // Navigation hints when current date has no jobs
      nextJobDate: nextJobDate?.startTime?.toISOString().split('T')[0] || null,
      prevJobDate: prevJobDate?.startTime?.toISOString().split('T')[0] || null,
    });
  } catch (error) {
    console.error('Error fetching Gantt daily calendar:', error);
    return NextResponse.json({ error: 'Failed to fetch calendar data' }, { status: 500 });
  }
}
