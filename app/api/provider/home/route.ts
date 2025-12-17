import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get('providerId');

    if (!providerId) {
      return NextResponse.json(
        { error: 'Provider ID is required' },
        { status: 400 }
      );
    }

    const now = new Date();

    // Today
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    // This week
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    // This month
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // Next 7 days
    const next7Days = new Date(todayEnd);
    next7Days.setDate(next7Days.getDate() + 7);

    // Get today's jobs
    const todaysJobs = await prisma.job.findMany({
      where: {
        providerId,
        startTime: {
          gte: todayStart,
          lte: todayEnd,
        },
        status: {
          in: ['scheduled', 'in_progress'],
        },
      },
      include: {
        customer: true,
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    // DEBUG: Get ALL jobs for this provider to understand what exists
    const allProviderJobs = await prisma.job.findMany({
      where: { providerId },
      select: {
        id: true,
        startTime: true,
        status: true,
        serviceType: true,
      },
      orderBy: { startTime: 'asc' },
    });

    console.log('🔍 DEBUG - All jobs for provider:', {
      providerId,
      totalJobs: allProviderJobs.length,
      allStatuses: Array.from(new Set(allProviderJobs.map(j => j.status))),
      futureJobs: allProviderJobs.filter(j => j.startTime > todayEnd).length,
      jobs: allProviderJobs.map(j => ({
        id: j.id.slice(-6),
        status: j.status,
        startTime: j.startTime.toISOString(),
        isFuture: j.startTime > todayEnd,
      })),
    });

    // Get upcoming jobs (future jobs excluding today)
    // Include all non-completed/cancelled statuses
    const upcomingJobs = await prisma.job.findMany({
      where: {
        providerId,
        startTime: {
          gt: todayEnd, // Jobs starting after today
        },
        status: {
          notIn: ['completed', 'cancelled', 'no_show'],
        },
      },
      select: {
        id: true,
        startTime: true,
        endTime: true,
        serviceType: true,
        address: true,
        status: true,
        estimatedValue: true,
        actualValue: true,
        assignedUserIds: true,
        customer: {
          select: {
            name: true,
            phone: true,
          },
        },
      },
      orderBy: {
        startTime: 'asc',
      },
      take: 10,
    });

    // Get worker names for upcoming jobs
    const upcomingJobUserIds = Array.from(new Set(upcomingJobs.flatMap(job => job.assignedUserIds)));
    const upcomingJobUsers = upcomingJobUserIds.length > 0 ? await prisma.providerUser.findMany({
      where: {
        id: {
          in: upcomingJobUserIds,
        },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
    }) : [];
    const upcomingJobUserMap = new Map(upcomingJobUsers.map(u => [u.id, `${u.firstName} ${u.lastName}`]));

    console.log('📅 Upcoming jobs result:', {
      count: upcomingJobs.length,
      todayEnd: todayEnd.toISOString(),
      jobs: upcomingJobs.map(j => ({
        id: j.id.slice(-6),
        serviceType: j.serviceType,
        startTime: j.startTime.toISOString(),
        status: j.status,
        customerName: j.customer?.name,
      })),
    });

    // Get weekly stats
    const weeklyJobs = await prisma.job.findMany({
      where: {
        providerId,
        startTime: {
          gte: weekStart,
          lte: weekEnd,
        },
        status: 'completed',
      },
      select: {
        actualValue: true,
      },
    });

    const weeklyRevenue = weeklyJobs.reduce((sum, job) => {
      return sum + (job.actualValue || 0);
    }, 0);

    // Get monthly stats
    const monthlyJobs = await prisma.job.findMany({
      where: {
        providerId,
        startTime: {
          gte: monthStart,
          lte: monthEnd,
        },
        status: 'completed',
      },
      select: {
        actualValue: true,
      },
    });

    const monthlyRevenue = monthlyJobs.reduce((sum, job) => {
      return sum + (job.actualValue || 0);
    }, 0);

    // Get pending invoices
    const pendingInvoices = await prisma.invoice.count({
      where: {
        providerId,
        status: {
          in: ['draft', 'sent'],
        },
      },
    });

    const pendingInvoicesAmount = await prisma.invoice.aggregate({
      where: {
        providerId,
        status: {
          in: ['draft', 'sent'],
        },
      },
      _sum: {
        total: true,
      },
    });

    // Get new leads count
    const newLeads = await prisma.lead.count({
      where: {
        assignedProviderId: providerId,
        status: {
          in: ['matched', 'new'],
        },
      },
    });

    // DEBUG: Log leads info for this provider
    const allProviderLeads = await prisma.lead.findMany({
      where: { assignedProviderId: providerId },
      select: { id: true, status: true, firstName: true, lastName: true },
    });
    console.log('🎯 DEBUG - Leads for provider:', {
      providerId,
      totalLeads: allProviderLeads.length,
      newLeadsCount: newLeads,
      leadStatuses: allProviderLeads.map(l => l.status),
      leads: allProviderLeads.slice(0, 5).map(l => ({
        id: l.id.slice(-6),
        status: l.status,
        name: `${l.firstName} ${l.lastName}`,
      })),
    });

    // Get jobs needing crew assignment (scheduled but no workers assigned)
    const unassignedJobs = await prisma.job.count({
      where: {
        providerId,
        status: {
          in: ['scheduled', 'pending'],
        },
        startTime: {
          gte: todayStart,
          lte: next7Days,
        },
        assignedUserIds: {
          isEmpty: true,
        },
      },
    });

    // Get overdue jobs (past end time but not completed)
    const overdueJobs = await prisma.job.count({
      where: {
        providerId,
        status: {
          in: ['scheduled', 'in_progress'],
        },
        endTime: {
          lt: now,
        },
      },
    });

    // Jobs starting in <2 hours without confirmation (status still pending)
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const unconfirmedSoonJobs = await prisma.job.count({
      where: {
        providerId,
        status: 'pending',
        startTime: {
          gte: now,
          lte: twoHoursFromNow,
        },
      },
    });

    // Unpaid invoices >30 days old
    const invoiceThirtyDaysAgo = new Date(now);
    invoiceThirtyDaysAgo.setDate(invoiceThirtyDaysAgo.getDate() - 30);
    const overdueInvoices = await prisma.invoice.count({
      where: {
        providerId,
        status: {
          in: ['sent', 'viewed', 'overdue'],
        },
        dueDate: {
          lt: invoiceThirtyDaysAgo,
        },
      },
    });

    // Get all jobs in next 7 days for worker analysis
    const upcomingJobsForAnalysis = await prisma.job.findMany({
      where: {
        providerId,
        status: {
          notIn: ['completed', 'cancelled', 'no_show'],
        },
        startTime: {
          gte: todayStart,
          lte: next7Days,
        },
      },
      select: {
        id: true,
        startTime: true,
        endTime: true,
        assignedUserIds: true,
        address: true,
      },
    });

    // Get all workers for this provider
    const providerWorkers = await prisma.providerUser.findMany({
      where: {
        providerId,
        status: 'active',
        role: 'field',
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
    });

    // Calculate job counts per worker
    const workerJobCounts = new Map<string, number>();
    providerWorkers.forEach(w => workerJobCounts.set(w.id, 0));

    upcomingJobsForAnalysis.forEach(job => {
      job.assignedUserIds.forEach(userId => {
        if (workerJobCounts.has(userId)) {
          workerJobCounts.set(userId, (workerJobCounts.get(userId) || 0) + 1);
        }
      });
    });

    // Overloaded workers (>8 jobs in next 7 days)
    const overloadedWorkers = Array.from(workerJobCounts.entries())
      .filter(([_, count]) => count > 8)
      .map(([id, count]) => {
        const worker = providerWorkers.find(w => w.id === id);
        return { id, name: worker ? `${worker.firstName} ${worker.lastName}` : 'Unknown', jobCount: count };
      });

    // Underutilized workers (<2 jobs in next 7 days)
    const underutilizedWorkers = Array.from(workerJobCounts.entries())
      .filter(([_, count]) => count < 2)
      .map(([id, count]) => {
        const worker = providerWorkers.find(w => w.id === id);
        return { id, name: worker ? `${worker.firstName} ${worker.lastName}` : 'Unknown', jobCount: count };
      });

    // Schedule conflicts: Find overlapping jobs for same worker
    const conflictingJobs: { jobId1: string; jobId2: string; workerId: string }[] = [];

    // Group jobs by worker
    const jobsByWorker = new Map<string, typeof upcomingJobsForAnalysis>();
    upcomingJobsForAnalysis.forEach(job => {
      job.assignedUserIds.forEach(userId => {
        if (!jobsByWorker.has(userId)) {
          jobsByWorker.set(userId, []);
        }
        jobsByWorker.get(userId)!.push(job);
      });
    });

    // Check for time overlaps within each worker's jobs
    jobsByWorker.forEach((jobs, workerId) => {
      for (let i = 0; i < jobs.length; i++) {
        for (let j = i + 1; j < jobs.length; j++) {
          const job1 = jobs[i];
          const job2 = jobs[j];
          // Check if times overlap
          if (job1.startTime < job2.endTime && job2.startTime < job1.endTime) {
            conflictingJobs.push({ jobId1: job1.id, jobId2: job2.id, workerId });
          }
        }
      }
    });

    console.log('🔔 DEBUG - Alerts for provider:', {
      providerId,
      pendingInvoices,
      newLeads,
      unassignedJobs,
      overdueJobs,
      unconfirmedSoonJobs,
      overdueInvoices,
      overloadedWorkers: overloadedWorkers.length,
      underutilizedWorkers: underutilizedWorkers.length,
      scheduleConflicts: conflictingJobs.length,
    });

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentJobs = await prisma.job.findMany({
      where: {
        providerId,
        updatedAt: {
          gte: sevenDaysAgo,
        },
      },
      include: {
        customer: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: 10,
    });

    const recentInvoices = await prisma.invoice.findMany({
      where: {
        providerId,
        updatedAt: {
          gte: sevenDaysAgo,
        },
      },
      include: {
        customer: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: 10,
    });

    // Combine and sort activity
    const activity = [
      ...recentJobs.map(job => ({
        id: job.id,
        type: 'job' as const,
        status: job.status,
        customerName: job.customer?.name || 'Unknown Customer',
        serviceType: job.serviceType,
        timestamp: job.updatedAt.toISOString(),
        amount: job.actualValue || undefined,
      })),
      ...recentInvoices.map(invoice => ({
        id: invoice.id,
        type: 'invoice' as const,
        status: invoice.status,
        customerName: invoice.customer?.name || 'Unknown Customer',
        timestamp: invoice.updatedAt.toISOString(),
        amount: Number(invoice.total),
      })),
    ]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);

    // Get assigned users for today's jobs
    const userIds = Array.from(new Set(todaysJobs.flatMap(job => job.assignedUserIds)));
    const users = userIds.length > 0 ? await prisma.providerUser.findMany({
      where: {
        id: {
          in: userIds,
        },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
    }) : [];

    const userMap = new Map(users.map(u => [u.id, u]));

    // Get revenue history for the past 30 days (grouped by day)
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const completedJobsLast30Days = await prisma.job.findMany({
      where: {
        providerId,
        status: 'completed',
        endTime: {
          gte: thirtyDaysAgo,
          lte: now,
        },
      },
      select: {
        endTime: true,
        actualValue: true,
        estimatedValue: true,
      },
    });

    // Group revenue and job counts by date
    const revenueByDate = new Map<string, number>();
    const jobCountByDate = new Map<string, number>();

    // Initialize all 30 days with 0 (using local dates)
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateKey = `${year}-${month}-${day}`;
      revenueByDate.set(dateKey, 0);
      jobCountByDate.set(dateKey, 0);
    }

    // Sum up completed job revenues and counts by date
    // Use local date to match frontend date calculations
    completedJobsLast30Days.forEach(job => {
      const endDate = new Date(job.endTime);
      const year = endDate.getFullYear();
      const month = String(endDate.getMonth() + 1).padStart(2, '0');
      const day = String(endDate.getDate()).padStart(2, '0');
      const dateKey = `${year}-${month}-${day}`;
      const amount = job.actualValue || job.estimatedValue || 0;
      revenueByDate.set(dateKey, (revenueByDate.get(dateKey) || 0) + amount);
      jobCountByDate.set(dateKey, (jobCountByDate.get(dateKey) || 0) + 1);
    });

    // Convert to array sorted by date with all metrics
    const revenueHistory = Array.from(revenueByDate.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, amount]) => {
        const jobCount = jobCountByDate.get(date) || 0;
        const avgValue = jobCount > 0 ? Math.round(amount / jobCount) : 0;
        return {
          date,
          amount,
          jobCount,
          avgValue,
        };
      });

    // Calculate utilization rate (jobs scheduled vs capacity)
    // Assume capacity is 8 jobs per worker per day
    const activeWorkerCount = providerWorkers.length || 1;
    const dailyCapacity = activeWorkerCount * 8;

    // Add utilization to each day
    const revenueHistoryWithUtilization = revenueHistory.map(day => ({
      ...day,
      utilization: Math.min(100, Math.round((day.jobCount / dailyCapacity) * 100)),
    }));

    // Get recent completed jobs for the table
    const recentCompletedJobs = await prisma.job.findMany({
      where: {
        providerId,
        status: 'completed',
      },
      include: {
        customer: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        endTime: 'desc',
      },
      take: 10,
    });

    // Get worker names for recent jobs
    const recentJobUserIds = Array.from(new Set(recentCompletedJobs.flatMap(job => job.assignedUserIds)));
    const recentJobUsers = recentJobUserIds.length > 0 ? await prisma.providerUser.findMany({
      where: {
        id: {
          in: recentJobUserIds,
        },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
    }) : [];
    const recentJobUserMap = new Map(recentJobUsers.map(u => [u.id, `${u.firstName} ${u.lastName}`]));

    const recentCompletedJobsForTable = recentCompletedJobs.map(job => ({
      id: job.id,
      completedAt: job.endTime.toISOString(),
      customerName: job.customer?.name || 'Unknown Customer',
      serviceType: job.serviceType,
      workerName: job.assignedUserIds.length > 0 ? recentJobUserMap.get(job.assignedUserIds[0]) || null : null,
      address: job.address,
      amount: job.actualValue || job.estimatedValue || null,
    }));

    return NextResponse.json({
      success: true,
      data: {
        todaysJobs: todaysJobs.map(job => ({
          id: job.id,
          customerName: job.customer?.name || 'Unknown Customer',
          customerPhone: job.customer?.phone || '',
          serviceType: job.serviceType,
          address: job.address,
          startTime: job.startTime.toISOString(),
          endTime: job.endTime.toISOString(),
          status: job.status,
          totalAmount: job.actualValue || job.estimatedValue || null,
          workers: job.assignedUserIds.map(userId => {
            const user = userMap.get(userId);
            return user ? {
              id: user.id,
              firstName: user.firstName,
              lastName: user.lastName,
            } : null;
          }).filter((u): u is NonNullable<typeof u> => u !== null),
        })),
        upcomingJobs: upcomingJobs.map(job => ({
          id: job.id,
          startTime: job.startTime.toISOString(),
          endTime: job.endTime?.toISOString(),
          serviceType: job.serviceType,
          customerName: job.customer?.name || 'Unknown Customer',
          address: job.address || '',
          status: job.status,
          estimatedValue: job.estimatedValue,
          actualValue: job.actualValue,
          workerName: job.assignedUserIds.length > 0 ? upcomingJobUserMap.get(job.assignedUserIds[0]) || null : null,
          phone: job.customer?.phone || '',
        })),
        stats: {
          todaysJobsCount: todaysJobs.length,
          weeklyRevenue,
          monthlyRevenue,
          pendingInvoicesCount: pendingInvoices,
          pendingInvoicesAmount: pendingInvoicesAmount._sum.total
            ? Number(pendingInvoicesAmount._sum.total)
            : 0,
          newLeadsCount: newLeads,
          completedThisWeek: weeklyJobs.length,
          completedThisMonth: monthlyJobs.length,
        },
        alerts: {
          scheduleConflicts: conflictingJobs.length,
          overloadedWorkers,
          underutilizedWorkers,
          unassignedJobs,
          unconfirmedSoonJobs,
          overdueInvoices,
          overdueJobs,
        },
        recentActivity: activity,
        revenueHistory: revenueHistoryWithUtilization,
        recentJobs: recentCompletedJobsForTable,
        workerCount: activeWorkerCount,
      },
    });
  } catch (error) {
    console.error('❌ Error fetching home data:', error);
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      {
        error: 'Failed to fetch home data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}