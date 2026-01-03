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

    // Helper function to check if two time ranges overlap
    const jobsOverlap = (job1: { startTime: Date; endTime: Date }, job2: { startTime: Date; endTime: Date }) => {
      return job1.startTime < job2.endTime && job1.endTime > job2.startTime;
    };

    // Track conflicts and overbooked workers globally
    const allConflicts: Array<{
      workerId: string;
      workerName: string;
      job1Id: string;
      job1Service: string;
      job2Id: string;
      job2Service: string;
    }> = [];
    const overbookedWorkerIds: string[] = [];

    // Process workers with their jobs
    const workers = teamMembers.map((member) => {
      // Get jobs assigned to this worker (only for the selected day)
      const memberJobs = dayJobs.filter((job) => job.assignedUserIds.includes(member.id));

      // Detect conflicts: jobs that overlap in time
      const workerConflicts: Array<{ job1Id: string; job2Id: string }> = [];
      const conflictingJobIds = new Set<string>();
      for (let i = 0; i < memberJobs.length; i++) {
        for (let j = i + 1; j < memberJobs.length; j++) {
          if (jobsOverlap(memberJobs[i], memberJobs[j])) {
            workerConflicts.push({
              job1Id: memberJobs[i].id,
              job2Id: memberJobs[j].id,
            });
            conflictingJobIds.add(memberJobs[i].id);
            conflictingJobIds.add(memberJobs[j].id);
            // Add to global conflicts
            allConflicts.push({
              workerId: member.id,
              workerName: `${member.firstName} ${member.lastName}`,
              job1Id: memberJobs[i].id,
              job1Service: memberJobs[i].serviceType,
              job2Id: memberJobs[j].id,
              job2Service: memberJobs[j].serviceType,
            });
          }
        }
      }

      // Calculate scheduled hours - merge overlapping time ranges for accurate count
      let mergedMinutes = 0;
      if (memberJobs.length > 0) {
        // Sort jobs by start time
        const sortedJobs = [...memberJobs].sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

        // Merge overlapping time ranges
        const mergedRanges: Array<{ start: number; end: number }> = [];
        for (const job of sortedJobs) {
          const start = job.startTime.getTime();
          const end = job.endTime.getTime();

          if (mergedRanges.length === 0) {
            mergedRanges.push({ start, end });
          } else {
            const lastRange = mergedRanges[mergedRanges.length - 1];
            if (start <= lastRange.end) {
              // Overlapping - extend the range
              lastRange.end = Math.max(lastRange.end, end);
            } else {
              // No overlap - add new range
              mergedRanges.push({ start, end });
            }
          }
        }

        // Sum up merged minutes
        mergedMinutes = mergedRanges.reduce((total, range) => {
          return total + (range.end - range.start) / (1000 * 60);
        }, 0);
      }

      const totalHours = mergedMinutes / 60;

      // Get working hours (default 8 hours)
      const workingHours = (member.workingHours as { start?: string; end?: string } | null) || {
        start: '08:00',
        end: '17:00',
      };
      const [startHour, startMin] = (workingHours.start || '08:00').split(':').map(Number);
      const [endHour, endMin] = (workingHours.end || '17:00').split(':').map(Number);
      let capacityHours = endHour + endMin / 60 - (startHour + startMin / 60);

      // Ensure minimum capacity of 1 hour to avoid unrealistic percentages
      // If working hours are invalid or too short, default to 8 hours
      if (capacityHours <= 0 || isNaN(capacityHours)) {
        capacityHours = 8;
      }

      // Calculate utilization based on merged hours (not double-counting overlaps)
      // Cap at 200% to avoid absurd numbers while still showing overbooking
      const rawUtilization = Math.round((totalHours / capacityHours) * 100);
      const utilization = Math.min(rawUtilization, 200);

      // Worker is overbooked if utilization > 100% OR has any conflicts
      const isOverbooked = utilization > 100 || workerConflicts.length > 0;

      if (isOverbooked) {
        overbookedWorkerIds.push(member.id);
      }

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
          // Mark if this job is part of a conflict
          hasConflict: conflictingJobIds.has(job.id),
        })),
        totalHours: Math.round(totalHours * 10) / 10,
        utilization,
        isOverbooked,
        conflictCount: workerConflicts.length,
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

    // Count unique conflicts (each pair of overlapping jobs counts as 1 conflict)
    const conflictCount = allConflicts.length;

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
      // Include conflicts data for UI
      conflicts: allConflicts,
      stats: {
        totalJobs,
        assignedJobs: assignedJobCount,
        unassignedJobs: totalJobs - assignedJobCount,
        totalHours: Math.round(totalScheduledHours * 10) / 10,
        avgUtilization,
        activeWorkers: workers.filter((w) => w.jobs.length > 0).length,
        totalWorkers: workers.length,
        // NEW: Conflict and overbooking stats
        conflictCount,
        overbookedWorkers: overbookedWorkerIds,
        overbookedCount: overbookedWorkerIds.length,
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
