import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Get recent activities from leads, campaigns, and providers
    const recentLeads = await prisma.lead.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        leadScore: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    const recentCampaigns = await prisma.campaign.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 5,
      select: {
        id: true,
        name: true,
        status: true,
        messagesSent: true,  // Changed from emailsSent
        updatedAt: true,
      }
    });

    // Transform into activity feed items
    const activities = [];

    // Lead activities
    for (const lead of recentLeads) {
      const isNew = new Date().getTime() - new Date(lead.createdAt).getTime() < 3600000; // Within 1 hour
      const isUpdated = new Date(lead.updatedAt).getTime() > new Date(lead.createdAt).getTime();

      if (isNew) {
        activities.push({
          id: `lead-new-${lead.id}`,
          type: 'lead_created',
          icon: 'user-plus',
          title: `New lead: ${lead.firstName} ${lead.lastName}`,
          description: `Score: ${lead.leadScore} • Status: ${lead.status}`,
          timestamp: lead.createdAt,
          user: 'System',
          color: 'emerald',
        });
      } else if (isUpdated) {
        activities.push({
          id: `lead-updated-${lead.id}`,
          type: 'lead_updated',
          icon: 'user-check',
          title: `${lead.firstName} ${lead.lastName} was updated`,
          description: `Status changed to ${lead.status}`,
          timestamp: lead.updatedAt,
          user: 'Team',
          color: 'sky',
        });
      }
    }

    // Campaign activities
    for (const campaign of recentCampaigns) {
      const isRecent = new Date().getTime() - new Date(campaign.updatedAt).getTime() < 7200000; // Within 2 hours
      
      if (isRecent && campaign.status === 'active') {
        activities.push({
          id: `campaign-${campaign.id}`,
          type: 'campaign_sent',
          icon: 'mail',
          title: `Campaign "${campaign.name}" is active`,
          description: `Sent to ${campaign.messagesSent || 0} leads`,
          timestamp: campaign.updatedAt,
          user: 'Marketing',
          color: 'purple',
        });
      }
    }

    // Sort by timestamp descending
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json(activities.slice(0, 20));
  } catch (error) {
    console.error('Error fetching activities:', error);
    // Return empty array instead of error object to prevent frontend crashes
    return NextResponse.json([]);
  }
}