import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get('providerId');
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    if (!providerId) {
      return NextResponse.json(
        { error: 'Provider ID is required' },
        { status: 400 }
      );
    }

    // Default to last 30 days if no dates provided
    const endDate = endDateParam ? new Date(endDateParam) : new Date();
    const startDate = startDateParam ? new Date(startDateParam) : new Date();
    if (!startDateParam) {
      startDate.setDate(startDate.getDate() - 30);
    }

    // Calculate previous period for comparison
    const periodDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const previousStart = new Date(startDate);
    previousStart.setDate(previousStart.getDate() - periodDays);
    const previousEnd = new Date(startDate);

    // Get jobs for current period
    const jobs = await prisma.job.findMany({
      where: {
        providerId,
        startTime: { gte: startDate, lte: endDate },
      },
      include: {
        customer: true,
      },
    });

    // Get jobs for previous period
    const previousJobs = await prisma.job.findMany({
      where: {
        providerId,
        startTime: { gte: previousStart, lt: previousEnd },
      },
      include: {
        customer: true,
      },
    });

    // Calculate total revenue from completed jobs
    const completedJobs = jobs.filter(j => j.status === 'completed');
    const totalRevenue = completedJobs.reduce((sum, job) => {
      return sum + (job.actualValue || job.estimatedValue || 0);
    }, 0);

    const previousCompletedJobs = previousJobs.filter(j => j.status === 'completed');
    const previousRevenue = previousCompletedJobs.reduce((sum, job) => {
      return sum + (job.actualValue || job.estimatedValue || 0);
    }, 0);

    const revenueChange = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0;

    // Jobs completed count
    const jobsCompletedCount = completedJobs.length;
    const previousJobsCompletedCount = previousCompletedJobs.length;
    const jobsChange = previousJobsCompletedCount > 0 ? ((jobsCompletedCount - previousJobsCompletedCount) / previousJobsCompletedCount) * 100 : 0;

    // Average job value
    const avgJobValue = jobsCompletedCount > 0 ? totalRevenue / jobsCompletedCount : 0;
    const previousAvgJobValue = previousJobsCompletedCount > 0 ? previousRevenue / previousJobsCompletedCount : 0;
    const avgJobValueChange = previousAvgJobValue > 0 ? ((avgJobValue - previousAvgJobValue) / previousAvgJobValue) * 100 : 0;

    // New customers
    const newCustomers = await prisma.customer.count({
      where: {
        providerId,
        createdAt: { gte: startDate, lte: endDate },
      },
    });

    const previousNewCustomers = await prisma.customer.count({
      where: {
        providerId,
        createdAt: { gte: previousStart, lt: previousEnd },
      },
    });

    const newCustomersChange = previousNewCustomers > 0 ? ((newCustomers - previousNewCustomers) / previousNewCustomers) * 100 : 0;

    // Count Renoa leads in new customers
    const renoaNewCustomers = await prisma.customer.count({
      where: {
        providerId,
        createdAt: { gte: startDate, lte: endDate },
        source: 'renoa',
      },
    });

    // Revenue over time
    const revenueOverTime = groupRevenueByPeriod(completedJobs, startDate, endDate, periodDays);

    // Service type breakdown
    const serviceBreakdown: Record<string, { count: number; revenue: number }> = {};
    completedJobs.forEach(job => {
      const service = job.serviceType || 'Other';
      const revenue = job.actualValue || job.estimatedValue || 0;

      if (!serviceBreakdown[service]) {
        serviceBreakdown[service] = { count: 0, revenue: 0 };
      }
      serviceBreakdown[service].count++;
      serviceBreakdown[service].revenue += revenue;
    });

    // Top customers by revenue
    const customerRevenue: Record<string, { name: string; revenue: number; jobs: number }> = {};
    completedJobs.forEach(job => {
      const customerId = job.customerId;
      const customer = job.customer;
      const revenue = job.actualValue || job.estimatedValue || 0;

      if (!customerRevenue[customerId]) {
        customerRevenue[customerId] = {
          name: customer.name,
          revenue: 0,
          jobs: 0
        };
      }
      customerRevenue[customerId].revenue += revenue;
      customerRevenue[customerId].jobs++;
    });

    const topCustomers = Object.entries(customerRevenue)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Renoa lead performance
    const renoaJobs = jobs.filter(j => j.source === 'renoa');
    const ownJobs = jobs.filter(j => j.source === 'own');

    const renoaCompleted = renoaJobs.filter(j => j.status === 'completed');
    const ownCompleted = ownJobs.filter(j => j.status === 'completed');

    const renoaRevenue = renoaCompleted.reduce((sum, job) => {
      return sum + (job.actualValue || job.estimatedValue || 0);
    }, 0);

    const ownRevenue = ownCompleted.reduce((sum, job) => {
      return sum + (job.actualValue || job.estimatedValue || 0);
    }, 0);

    // Customer retention - new vs returning
    const customerIds = new Set(jobs.map(j => j.customerId));
    const allTimeCustomers = await prisma.customer.findMany({
      where: {
        providerId,
        createdAt: { lt: startDate },
      },
      select: { id: true },
    });

    const existingCustomerIds = new Set(allTimeCustomers.map(c => c.id));
    const returningCustomers = Array.from(customerIds).filter(id => existingCustomerIds.has(id)).length;
    const newCustomersInJobs = Array.from(customerIds).filter(id => !existingCustomerIds.has(id)).length;

    // Day of week analysis
    const dayOfWeekCounts: Record<string, number> = {
      'Sunday': 0, 'Monday': 0, 'Tuesday': 0, 'Wednesday': 0,
      'Thursday': 0, 'Friday': 0, 'Saturday': 0
    };
    const hourCounts: Record<number, number> = {};

    jobs.forEach(job => {
      const date = new Date(job.startTime);
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
      const hour = date.getHours();

      dayOfWeekCounts[dayName] = (dayOfWeekCounts[dayName] || 0) + 1;
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    // Performance metrics
    const totalJobs = jobs.length;
    const conversionRate = totalJobs > 0 ? (jobsCompletedCount / totalJobs) * 100 : 0;
    const repeatCustomerRate = customerIds.size > 0 ? (returningCustomers / customerIds.size) * 100 : 0;

    // Calculate average job duration
    const avgDuration = completedJobs.length > 0
      ? completedJobs.reduce((sum, job) => {
          const duration = (new Date(job.endTime).getTime() - new Date(job.startTime).getTime()) / (1000 * 60 * 60);
          return sum + duration;
        }, 0) / completedJobs.length
      : 0;

    return NextResponse.json({
      kpis: {
        totalRevenue: Math.round(totalRevenue),
        revenueChange: Math.round(revenueChange * 10) / 10,
        jobsCompleted: jobsCompletedCount,
        jobsChange: Math.round(jobsChange * 10) / 10,
        previousJobsCompleted: previousJobsCompletedCount,
        avgJobValue: Math.round(avgJobValue),
        avgJobValueChange: Math.round(avgJobValueChange * 10) / 10,
        newCustomers,
        newCustomersChange: Math.round(newCustomersChange * 10) / 10,
        renoaNewCustomers,
      },
      revenueOverTime,
      serviceBreakdown: Object.entries(serviceBreakdown).map(([name, data]) => ({
        name: name.replace(/_/g, ' '),
        ...data,
        percentage: totalRevenue > 0 ? Math.round((data.revenue / totalRevenue) * 100) : 0,
      })),
      topCustomers,
      newVsReturning: {
        new: newCustomersInJobs,
        returning: returningCustomers,
      },
      renoaPerformance: {
        leadsReceived: renoaJobs.length,
        leadsCompleted: renoaCompleted.length,
        completionRate: renoaJobs.length > 0 ? Math.round((renoaCompleted.length / renoaJobs.length) * 100) : 0,
        revenue: Math.round(renoaRevenue),
        avgRenoaJobValue: renoaCompleted.length > 0 ? Math.round(renoaRevenue / renoaCompleted.length) : 0,
      },
      ownClientPerformance: {
        jobsCreated: ownJobs.length,
        jobsCompleted: ownCompleted.length,
        completionRate: ownJobs.length > 0 ? Math.round((ownCompleted.length / ownJobs.length) * 100) : 0,
        revenue: Math.round(ownRevenue),
        avgOwnJobValue: ownCompleted.length > 0 ? Math.round(ownRevenue / ownCompleted.length) : 0,
      },
      seasonalInsights: {
        busiestDays: Object.entries(dayOfWeekCounts)
          .map(([day, count]) => ({ day, count }))
          .sort((a, b) => b.count - a.count),
        peakHours: Object.entries(hourCounts)
          .map(([hour, count]) => ({ hour: parseInt(hour), count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5),
      },
      performanceMetrics: {
        conversionRate: Math.round(conversionRate),
        repeatCustomerRate: Math.round(repeatCustomerRate),
        avgJobDuration: Math.round(avgDuration * 10) / 10,
        onTimeRate: 94, // Placeholder - would need completion time tracking
        customerSatisfaction: 4.8, // Placeholder - would need ratings system
      },
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}

function groupRevenueByPeriod(
  jobs: any[],
  start: Date,
  end: Date,
  periodDays: number
) {
  const groupBy = periodDays <= 7 ? 'day' : periodDays <= 90 ? 'week' : 'month';
  const groups: Record<string, { revenue: number; jobs: number }> = {};

  jobs.forEach(job => {
    const date = new Date(job.startTime);
    let key: string;

    if (groupBy === 'day') {
      key = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else if (groupBy === 'week') {
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      key = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else {
      key = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    }

    if (!groups[key]) {
      groups[key] = { revenue: 0, jobs: 0 };
    }

    const revenue = job.actualValue || job.estimatedValue || 0;
    groups[key].revenue += revenue;
    groups[key].jobs++;
  });

  return Object.entries(groups).map(([label, data]) => ({
    label,
    revenue: Math.round(data.revenue),
    jobs: data.jobs,
  })).sort((a, b) => {
    // Sort chronologically
    return new Date(a.label).getTime() - new Date(b.label).getTime();
  });
}
