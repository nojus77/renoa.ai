import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Check all leads for Premier Outdoor Solutions
    const providerId = '25555c94-c1e0-40b9-af19-21a56c9e11bd';

    const leads = await prisma.lead.findMany({
      where: {
        assignedProviderId: providerId
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        status: true,
        assignedProviderId: true,
        customerPreferredDate: true,
        createdAt: true,
        email: true,
        serviceInterest: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Also check total count in database
    const totalCount = await prisma.lead.count({
      where: {
        assignedProviderId: providerId
      }
    });

    // Check count by status
    const statusCounts = await prisma.lead.groupBy({
      by: ['status'],
      where: {
        assignedProviderId: providerId
      },
      _count: true
    });

    return NextResponse.json({
      providerId,
      totalLeads: totalCount,
      statusBreakdown: statusCounts,
      leads,
    });
  } catch (error) {
    console.error('Debug API error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
