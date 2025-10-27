import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get('providerId');
    const days = parseInt(searchParams.get('days') || '30');

    if (!providerId) {
      return NextResponse.json(
        { error: 'Provider ID is required' },
        { status: 400 }
      );
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get all leads for this provider
    const allLeads = await prisma.lead.findMany({
      where: {
        assignedProviderId: providerId,
      },
    });

    // Get leads within time range
    const recentLeads = await prisma.lead.findMany({
      where: {
        assignedProviderId: providerId,
        createdAt: {
          gte: startDate,
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Calculate metrics
    const totalLeads = allLeads.length;
    const acceptedLeads = allLeads.filter(l => 
      l.status === 'accepted' || l.status === 'converted' || l.status === 'unqualified'
    ).length;
    const convertedLeads = allLeads.filter(l => l.status === 'converted').length;
    const unqualifiedLeads = allLeads.filter(l => l.status === 'unqualified').length;

    const acceptanceRate = totalLeads > 0 
      ? Math.round((acceptedLeads / totalLeads) * 100) 
      : 0;
    
    const completedLeads = convertedLeads + unqualifiedLeads;
    const conversionRate = completedLeads > 0 
      ? Math.round((convertedLeads / completedLeads) * 100) 
      : 0;

    // Calculate avg days to convert
    const convertedWithDates = allLeads
      .filter(l => l.status === 'converted')
      .map(l => {
        const created = new Date(l.createdAt);
        const updated = new Date(l.updatedAt);
        return Math.floor((updated.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
      });
    
    const avgDaysToConvert = convertedWithDates.length > 0
      ? Math.round(convertedWithDates.reduce((a, b) => a + b, 0) / convertedWithDates.length)
      : 0;

    // Calculate revenue (sum of contract values for converted leads)
const totalRevenue = allLeads
  .filter(l => l.status === 'converted' && l.contractValue)
  .reduce((sum, l) => sum + Number(l.contractValue || 0), 0);

    // Conversion trend (group by week)
    const conversionTrend = [];
    const weeks = Math.ceil(days / 7);
    for (let i = 0; i < weeks; i++) {
      const weekStart = new Date(startDate);
      weekStart.setDate(startDate.getDate() + (i * 7));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);

      const conversions = recentLeads.filter(l => {
        const leadDate = new Date(l.createdAt);
        return l.status === 'converted' && 
               leadDate >= weekStart && 
               leadDate < weekEnd;
      }).length;

      conversionTrend.push({
        date: weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        conversions,
      });
    }

    // Status breakdown
    const statusBreakdown = [
      { 
        name: 'New', 
        value: allLeads.filter(l => l.status === 'matched').length,
        color: '#3b82f6' 
      },
      { 
        name: 'Active', 
        value: allLeads.filter(l => l.status === 'accepted').length,
        color: '#f59e0b' 
      },
      { 
        name: 'Converted', 
        value: convertedLeads,
        color: '#10b981' 
      },
      { 
        name: 'Unqualified', 
        value: unqualifiedLeads,
        color: '#ef4444' 
      },
    ].filter(item => item.value > 0);

    const analytics = {
      totalLeads,
      acceptedLeads,
      convertedLeads,
      unqualifiedLeads,
      acceptanceRate,
      conversionRate,
      avgDaysToConvert,
      totalRevenue: Math.round(totalRevenue),
      conversionTrend,
      statusBreakdown,
    };

    return NextResponse.json({ analytics });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}