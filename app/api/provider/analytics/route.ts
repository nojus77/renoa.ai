import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

    // Get jobs for current period with invoices
    const jobs = await prisma.lead.findMany({
      where: {
        assignedProviderId: providerId,
        createdAt: { gte: startDate, lte: endDate },
      },
      include: {
        invoices: {
          include: {
            payments: true,
          },
        },
      },
    });

    // Get jobs for previous period
    const previousJobs = await prisma.lead.findMany({
      where: {
        assignedProviderId: providerId,
        createdAt: { gte: previousStart, lt: previousEnd },
      },
      include: {
        invoices: true,
      },
    });

    // Calculate total revenue from paid invoices
    const totalRevenue = jobs.reduce((sum, job) => {
      const paidInvoices = job.invoices.filter(inv => inv.status === 'paid');
      return sum + paidInvoices.reduce((s, inv) => s + Number(inv.total), 0);
    }, 0);

    const previousRevenue = previousJobs.reduce((sum, job) => {
      const paidInvoices = job.invoices.filter(inv => inv.status === 'paid');
      return sum + paidInvoices.reduce((s, inv) => s + Number(inv.total), 0);
    }, 0);

    const revenueChange = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0;

    // Jobs completed
    const jobsCompleted = jobs.filter(j => j.status === 'converted' || j.status === 'matched').length;
    const previousJobsCompleted = previousJobs.filter(j => j.status === 'converted' || j.status === 'matched').length;
    const jobsChange = previousJobsCompleted > 0 ? ((jobsCompleted - previousJobsCompleted) / previousJobsCompleted) * 100 : 0;

    // Average job value
    const avgJobValue = jobsCompleted > 0 ? totalRevenue / jobsCompleted : 0;
    const previousAvgJobValue = previousJobsCompleted > 0 ? previousRevenue / previousJobsCompleted : 0;
    const avgJobValueChange = previousAvgJobValue > 0 ? ((avgJobValue - previousAvgJobValue) / previousAvgJobValue) * 100 : 0;

    // New customers
    const customerEmails = new Set(jobs.map(j => j.email));
    const newCustomers = customerEmails.size;
    const previousCustomerEmails = new Set(previousJobs.map(j => j.email));
    const previousNewCustomers = previousCustomerEmails.size;
    const newCustomersChange = previousNewCustomers > 0 ? ((newCustomers - previousNewCustomers) / previousNewCustomers) * 100 : 0;

    // Revenue over time
    const revenueOverTime = groupRevenueByPeriod(jobs, startDate, endDate, periodDays);

    // Service type breakdown
    const serviceBreakdown: Record<string, { count: number; revenue: number }> = {};
    jobs.forEach(job => {
      const service = job.serviceInterest || 'other';
      const revenue = job.invoices
        .filter(inv => inv.status === 'paid')
        .reduce((s, inv) => s + Number(inv.total), 0);

      if (!serviceBreakdown[service]) {
        serviceBreakdown[service] = { count: 0, revenue: 0 };
      }
      serviceBreakdown[service].count++;
      serviceBreakdown[service].revenue += revenue;
    });

    // Top customers
    const customerRevenue: Record<string, { email: string; revenue: number; jobs: number }> = {};
    jobs.forEach(job => {
      const customer = `${job.firstName} ${job.lastName}`;
      const revenue = job.invoices
        .filter(inv => inv.status === 'paid')
        .reduce((s, inv) => s + Number(inv.total), 0);

      if (!customerRevenue[customer]) {
        customerRevenue[customer] = { email: job.email, revenue: 0, jobs: 0 };
      }
      customerRevenue[customer].revenue += revenue;
      customerRevenue[customer].jobs++;
    });

    const topCustomers = Object.entries(customerRevenue)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Renoa lead performance
    const renoaLeads = jobs.filter(j =>
      j.leadSource === 'landing_page_hero' || j.leadSource?.includes('renoa')
    );
    const ownLeads = jobs.filter(j =>
      !(j.leadSource === 'landing_page_hero' || j.leadSource?.includes('renoa'))
    );

    const renoaAccepted = renoaLeads.filter(j =>
      j.status !== 'new' && j.status !== 'contacted'
    ).length;
    const renoaConverted = renoaLeads.filter(j =>
      j.status === 'converted' || j.status === 'matched'
    ).length;
    const renoaRevenue = renoaLeads.reduce((sum, job) => {
      const paidInvoices = job.invoices.filter(inv => inv.status === 'paid');
      return sum + paidInvoices.reduce((s, inv) => s + Number(inv.total), 0);
    }, 0);

    const ownRevenue = ownLeads.reduce((sum, job) => {
      const paidInvoices = job.invoices.filter(inv => inv.status === 'paid');
      return sum + paidInvoices.reduce((s, inv) => s + Number(inv.total), 0);
    }, 0);

    // Customer retention
    const allTimeJobs = await prisma.lead.findMany({
      where: { assignedProviderId: providerId },
      select: { email: true, createdAt: true },
    });

    const customerFirstJob = new Map<string, Date>();
    allTimeJobs.forEach(job => {
      const existing = customerFirstJob.get(job.email);
      if (!existing || job.createdAt < existing) {
        customerFirstJob.set(job.email, job.createdAt);
      }
    });

    const returningCustomers = jobs.filter(job => {
      const firstJob = customerFirstJob.get(job.email);
      return firstJob && firstJob < startDate;
    }).length;

    const newVsReturning = {
      new: Math.max(0, customerEmails.size - returningCustomers),
      returning: returningCustomers,
    };

    // Seasonal insights
    const dayOfWeekCounts: Record<string, number> = {
      'Sunday': 0, 'Monday': 0, 'Tuesday': 0, 'Wednesday': 0,
      'Thursday': 0, 'Friday': 0, 'Saturday': 0
    };
    const hourCounts: Record<number, number> = {};
    const monthCounts: Record<string, number> = {};

    jobs.forEach(job => {
      if (job.providerProposedDate) {
        const date = new Date(job.providerProposedDate);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
        const hour = date.getHours();
        const month = date.toLocaleDateString('en-US', { month: 'long' });

        dayOfWeekCounts[dayName] = (dayOfWeekCounts[dayName] || 0) + 1;
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
        monthCounts[month] = (monthCounts[month] || 0) + 1;
      }
    });

    // Performance metrics
    const totalLeads = jobs.length;
    const convertedLeads = jobs.filter(j => j.status === 'converted' || j.status === 'matched').length;
    const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

    return NextResponse.json({
      kpis: {
        totalRevenue: Math.round(totalRevenue),
        revenueChange: Math.round(revenueChange * 10) / 10,
        jobsCompleted,
        jobsChange: Math.round(jobsChange * 10) / 10,
        avgJobValue: Math.round(avgJobValue),
        avgJobValueChange: Math.round(avgJobValueChange * 10) / 10,
        newCustomers,
        newCustomersChange: Math.round(newCustomersChange * 10) / 10,
      },
      revenueOverTime,
      serviceBreakdown: Object.entries(serviceBreakdown).map(([name, data]) => ({
        name: name.replace(/_/g, ' '),
        ...data,
        percentage: totalRevenue > 0 ? Math.round((data.revenue / totalRevenue) * 100) : 0,
      })),
      topCustomers,
      newVsReturning,
      renoaPerformance: {
        leadsReceived: renoaLeads.length,
        leadsAccepted: renoaAccepted,
        acceptanceRate: renoaLeads.length > 0 ? Math.round((renoaAccepted / renoaLeads.length) * 100) : 0,
        leadsConverted: renoaConverted,
        conversionRate: renoaAccepted > 0 ? Math.round((renoaConverted / renoaAccepted) * 100) : 0,
        revenue: Math.round(renoaRevenue),
        ownLeadsRevenue: Math.round(ownRevenue),
        avgRenoaJobValue: renoaConverted > 0 ? Math.round(renoaRevenue / renoaConverted) : 0,
        avgOwnJobValue: ownLeads.length > 0 ? Math.round(ownRevenue / ownLeads.length) : 0,
      },
      seasonalInsights: {
        busiestDays: Object.entries(dayOfWeekCounts)
          .sort((a, b) => b[1] - a[1])
          .map(([day, count]) => ({ day, count })),
        peakHours: Object.entries(hourCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([hour, count]) => ({ hour: parseInt(hour), count })),
        busiestMonths: Object.entries(monthCounts)
          .sort((a, b) => b[1] - a[1])
          .map(([month, count]) => ({ month, count })),
      },
      performanceMetrics: {
        avgResponseTime: 8, // Placeholder
        conversionRate: Math.round(conversionRate),
        customerSatisfaction: 4.8, // Placeholder
        onTimeRate: 94, // Placeholder
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
  const groups: Record<string, { revenue: number; jobs: number; avgJobValue: number }> = {};

  jobs.forEach(job => {
    if (!job.createdAt) return;

    const date = new Date(job.createdAt);
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
      groups[key] = { revenue: 0, jobs: 0, avgJobValue: 0 };
    }

    const revenue = job.invoices
      .filter((inv: any) => inv.status === 'paid')
      .reduce((s: number, inv: any) => s + Number(inv.total), 0);

    groups[key].revenue += revenue;
    groups[key].jobs++;
  });

  // Calculate avg job value for each period
  Object.keys(groups).forEach(key => {
    groups[key].avgJobValue = groups[key].jobs > 0
      ? Math.round(groups[key].revenue / groups[key].jobs)
      : 0;
  });

  return Object.entries(groups).map(([label, data]) => ({
    label,
    revenue: Math.round(data.revenue),
    jobs: data.jobs,
    avgJobValue: data.avgJobValue,
  }));
}
