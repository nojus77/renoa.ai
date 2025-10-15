import { NextRequest } from 'next/server'
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Received campaign data:', body)
    // Only use fields that exist in Campaign model
    const { name, status, serviceType, targetAudience, sequenceType } = body
    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }
    if (!serviceType) {
      return NextResponse.json({ error: 'serviceType is required' }, { status: 400 })
    }
    const campaign = await prisma.campaign.create({
      data: {
        name,
        status: status || 'draft',
        serviceType,
        targetAudience: targetAudience ?? 'all',
        sequenceType: sequenceType ?? 'single'
      }
    })
    console.log('Campaign created:', campaign)
    return NextResponse.json(campaign, { status: 201 })
  } catch (error) {
    console.error('Error creating campaign:', error)
    return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 })
  }
}
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { EventType } from '@prisma/client'

export async function GET() {
  try {
    // Basic campaign info
    const campaigns = await prisma.campaign.findMany({
      select: {
        id: true,
        name: true,
        status: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    // Aggregate stats per campaign
    const withStats = await Promise.all(
      campaigns.map(async (c) => {
        // Sent count = messages with a sentAt timestamp for this campaign
        const sentCount = await prisma.message.count({
          where: { campaignId: c.id, sentAt: { not: null } },
        })

        // Distinct leads touched by this campaign (via messages)
        const distinctLeads = await prisma.message.findMany({
          where: { campaignId: c.id },
          select: { leadId: true },
          distinct: ['leadId'],
        })
        const leadCount = distinctLeads.length

        // Unique messages that recorded an OPENED event (EmailEvents)
        const openedMsgs = await prisma.emailEvent.findMany({
          where: { eventType: EventType.OPENED, message: { campaignId: c.id } },
          select: { messageId: true },
          distinct: ['messageId'],
        })
        const openUnique = openedMsgs.length

        // Unique messages that recorded a CLICKED event (EmailEvents)
        const clickedMsgs = await prisma.emailEvent.findMany({
          where: { eventType: EventType.CLICKED, message: { campaignId: c.id } },
          select: { messageId: true },
          distinct: ['messageId'],
        })
        const clickUnique = clickedMsgs.length

        // Replies (InboundMessages linked to a message in this campaign)
        const replyCount = await prisma.inboundMessage.count({
          where: { originalMsg: { campaignId: c.id } },
        })
        const repliedUnique = await prisma.inboundMessage.findMany({
          where: { originalMsg: { campaignId: c.id } },
          select: { originalMsgId: true },
          distinct: ['originalMsgId'],
        })

        const openRate = sentCount > 0 ? Math.round((openUnique / sentCount) * 100) : 0
        const clickRate = sentCount > 0 ? Math.round((clickUnique / sentCount) * 100) : 0
        const replyRate = sentCount > 0 ? Math.round((repliedUnique.length / sentCount) * 100) : 0

        return {
          id: c.id,
          name: c.name,
          status: c.status,
          leadCount,
          sentCount,
          openRate,
          clickRate,
          replyCount,
          replyRate,
        }
      })
    )

    return NextResponse.json(withStats)
  } catch (error) {
    console.error('GET /api/campaigns error', error)
    return NextResponse.json({ error: 'Failed to load campaign stats' }, { status: 500 })
  }
}
