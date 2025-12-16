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
        serviceType: true,
        address: true,
        status: true,
        customer: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        startTime: 'asc',
      },
      take: 5,
    });

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

    // Group revenue by date
    const revenueByDate = new Map<string, number>();

    // Initialize all 30 days with 0
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      revenueByDate.set(dateKey, 0);
    }

    // Sum up completed job revenues by date
    completedJobsLast30Days.forEach(job => {
      const dateKey = job.endTime.toISOString().split('T')[0];
      const amount = job.actualValue || job.estimatedValue || 0;
      revenueByDate.set(dateKey, (revenueByDate.get(dateKey) || 0) + amount);
    });

    // Convert to array sorted by date
    const revenueHistory = Array.from(revenueByDate.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, amount]) => ({
        date,
        amount,
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
          serviceType: job.serviceType,
          customerName: job.customer?.name || 'Unknown Customer',
          address: job.address || '',
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
        recentActivity: activity,
        revenueHistory,
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