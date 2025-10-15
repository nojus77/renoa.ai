import { prisma } from '@/lib/prisma';
import { SESService } from './ses-service';
import { EmailStatus } from '@prisma/client';

interface CampaignStats {
  totalLeads: number;
  messagesSent: number;
  delivered: number;
  opened: number;
  clicked: number;
  replied: number;
  bounced: number;
}

export class CampaignEngine {
  /**
   * Process all active campaigns and send scheduled messages
   */
  static async processCampaigns() {
    console.log('🔄 Processing campaigns...');

    const activeCampaigns = await prisma.campaign.findMany({
      where: {
        status: 'active',
      },
      include: {
        sequences: {
          include: {
            template: true,
          },
          orderBy: {
            stepNumber: 'asc',
          },
        },
      },
    });

    console.log(`📊 Found ${activeCampaigns.length} active campaigns`);

    for (const campaign of activeCampaigns) {
      await this.processCampaign(campaign);
    }

    console.log('✅ Campaign processing complete');
  }

  private static async processCampaign(campaign: any) {
    console.log(`📧 Processing campaign: ${campaign.name}`);

    // Get all leads that should be in this campaign
    const leads = await prisma.lead.findMany({
      where: {
        campaign: campaign.name,
        status: {
          not: 'unqualified',
        },
      },
    });

    console.log(`   ${leads.length} leads in campaign`);

    for (const lead of leads) {
      await this.processLeadInCampaign(lead, campaign);
    }
  }

  private static async processLeadInCampaign(lead: any, campaign: any) {
    // Find what step this lead is on
    const sentMessages = await prisma.message.findMany({
      where: {
        leadId: lead.id,
        campaignId: campaign.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const currentStep = sentMessages.length;
    const sequences = campaign.sequences;

    // Check if campaign is complete for this lead
    if (currentStep >= sequences.length) {
      return; // All steps sent
    }

    const nextSequence = sequences[currentStep];
    const template = nextSequence.template;

    // Calculate when this message should be sent
    let sendAfter = new Date();

    if (currentStep > 0) {
      // Not the first message - calculate delay
      const lastMessage = sentMessages[0];
      const delayMs = 
        (nextSequence.delayDays * 24 * 60 * 60 * 1000) +
        (nextSequence.delayHours * 60 * 60 * 1000);

      sendAfter = new Date(lastMessage.createdAt.getTime() + delayMs);
    }

    // Check if it's time to send
    if (sendAfter > new Date()) {
      return; // Not time yet
    }

    // Check if lead has replied (don't send more if they replied)
    const hasReplied = await prisma.inboundMessage.findFirst({
      where: {
        leadId: lead.id,
      },
    });

    if (hasReplied) {
      console.log(`   ⏸️ Lead ${lead.email} replied - pausing sequence`);
      return;
    }

    // Personalize the template
    const personalizedSubject = this.personalizeText(template.subject, lead);
    const personalizedBody = this.personalizeText(template.body, lead);

    try {
      await SESService.sendEmail({
        to: lead.email,
        subject: personalizedSubject,
        body: personalizedBody,
        leadId: lead.id,
        campaignId: campaign.id,
      });

      console.log(`   ✅ Sent step ${currentStep + 1} to ${lead.email}`);

      // Update lead contact count
      await prisma.lead.update({
        where: { id: lead.id },
        data: {
          contactCount: {
            increment: 1,
          },
        },
      });
    } catch (error) {
      console.error(`   ❌ Failed to send to ${lead.email}:`, error);
    }
  }

  /**
   * Replace merge tags in text with lead data
   */
  private static personalizeText(text: string, lead: any): string {
    return text
      .replace(/{{firstName}}/g, lead.firstName || '')
      .replace(/{{lastName}}/g, lead.lastName || '')
      .replace(/{{email}}/g, lead.email || '')
      .replace(/{{city}}/g, lead.city || '')
      .replace(/{{state}}/g, lead.state || '')
      .replace(/{{propertyValue}}/g, lead.propertyValue ? `$${Math.round(lead.propertyValue / 1000)}K` : '')
      .replace(/{{serviceInterest}}/g, lead.serviceInterest || '');
  }

  /**
   * Get campaign statistics
   */
  static async getCampaignStats(campaignId: string): Promise<CampaignStats> {
    const messages = await prisma.message.findMany({
      where: { campaignId },
      include: {
        events: true,
        replies: true,
      },
    });

    const stats: CampaignStats = {
      totalLeads: new Set(messages.map(m => m.leadId)).size,
      messagesSent: messages.length,
      delivered: 0,
      opened: 0,
      clicked: 0,
      replied: 0,
      bounced: 0,
    };

    for (const message of messages) {
      if (message.status === 'DELIVERED') stats.delivered++;
      if (message.status === 'BOUNCED') stats.bounced++;
      
      const hasOpened = message.events.some(e => e.eventType === 'OPENED');
      const hasClicked = message.events.some(e => e.eventType === 'CLICKED');
      
      if (hasOpened) stats.opened++;
      if (hasClicked) stats.clicked++;
      if (message.replies.length > 0) stats.replied++;
    }

    return stats;
  }

  /**
   * Create a new campaign with sequences
   */
  static async createCampaign(data: {
    name: string;
    serviceType: string;
    sequences: Array<{
      stepNumber: number;
      delayDays: number;
      delayHours: number;
      template: {
        name: string;
        subject: string;
        body: string;
      };
    }>;
  }) {
    const campaign = await prisma.campaign.create({
      data: {
        name: data.name,
        serviceType: data.serviceType as any,
        targetAudience: {},
        sequenceType: 'custom',
        status: 'draft',
        // Don't set createdBy - let it be null for now
      },
    });

    for (const seq of data.sequences) {
      const template = await prisma.emailTemplate.create({
        data: {
          name: seq.template.name,
          subject: seq.template.subject,
          body: seq.template.body,
        },
      });

      await prisma.campaignSequence.create({
        data: {
          campaignId: campaign.id,
          stepNumber: seq.stepNumber,
          delayDays: seq.delayDays,
          delayHours: seq.delayHours,
          templateId: template.id,
        },
      });
    }

    return campaign;
  }

  /**
   * Start a campaign (set status to ACTIVE)
   */
  static async startCampaign(campaignId: string) {
    await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        status: 'active',
        startedAt: new Date(),
      },
    });

    console.log(`✅ Campaign ${campaignId} started`);
  }

  /**
   * Pause a campaign
   */
  static async pauseCampaign(campaignId: string) {
    await prisma.campaign.update({
      where: { id: campaignId },
      data: { status: 'paused' },
    });

    console.log(`⏸️ Campaign ${campaignId} paused`);
  }
}
