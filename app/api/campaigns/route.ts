import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { EventType, ServiceCategory, SequenceType, CampaignStatus } from '@prisma/client'

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Received campaign data:', body)
    
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
        status: (status as CampaignStatus) || 'draft',
        serviceType: serviceType as ServiceCategory,
        targetAudience: targetAudience || {},
        sequenceType: (sequenceType as SequenceType) || 'custom',
      }
    })

    console.log('Campaign created:', campaign)

    return NextResponse.json({ campaign }, { status: 201 })
  } catch (error) {
    console.error('Error creating campaign:', error)
    const errorMsg = typeof error === 'object' && error !== null && 'message' in error ? (error as any).message : String(error)
    return NextResponse.json({ error: errorMsg || 'Failed to create campaign' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const campaigns = await prisma.campaign.findMany({
      select: {
        id: true,
        name: true,
        status: true,
        serviceType: true,
        createdAt: true,
        messagesSent: true,
        openedCount: true,
        repliedCount: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    const withStats = await Promise.all(
      campaigns.map(async (c) => {
        const leadsAssigned = await prisma.campaignLead.count({
          where: { campaignId: c.id }
        })

        const sentCount = c.messagesSent || 0

        const openedMsgs = await prisma.emailEvent.findMany({
          where: { eventType: EventType.OPENED, message: { campaignId: c.id } },
          select: { messageId: true },
          distinct: ['messageId'],
        })
        const openUnique = openedMsgs.length

        const clickedMsgs = await prisma.emailEvent.findMany({
          where: { eventType: EventType.CLICKED, message: { campaignId: c.id } },
          select: { messageId: true },
          distinct: ['messageId'],
        })
        const clickUnique = clickedMsgs.length

        const repliedUnique = await prisma.inboundMessage.findMany({
          where: { originalMsg: { campaignId: c.id } },
          select: { originalMsgId: true },
          distinct: ['originalMsgId'],
        })

        const openRate = sentCount > 0 ? (openUnique / sentCount) * 100 : 0
        const clickRate = sentCount > 0 ? (clickUnique / sentCount) * 100 : 0
        const replyRate = sentCount > 0 ? (repliedUnique.length / sentCount) * 100 : 0

        return {
          id: c.id,
          name: c.name,
          status: c.status,
          serviceType: c.serviceType,
          createdAt: c.createdAt,
          totalLeads: leadsAssigned,
          leadsAssigned: leadsAssigned,
          sequence: 3,
          emailsSent: sentCount,
          opensCount: openUnique,
          clicksCount: clickUnique,
          repliesCount: c.repliedCount || 0,
          openRate,
          clickRate,
          replyRate,
        }
      })
    )

    return NextResponse.json({ campaigns: withStats })
  } catch (error) {
    console.error('GET /api/campaigns error', error)
    return NextResponse.json({ error: 'Failed to load campaign stats' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, name, status, serviceType, targetAudience, sequenceType } = body
    
    if (!id) {
      return NextResponse.json({ error: 'Campaign id is required' }, { status: 400 })
    }

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (status !== undefined) updateData.status = status as CampaignStatus
    if (targetAudience !== undefined) updateData.targetAudience = targetAudience
    if (sequenceType !== undefined) updateData.sequenceType = sequenceType as SequenceType
    if (serviceType !== undefined) updateData.serviceType = serviceType as ServiceCategory

    const updated = await prisma.campaign.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating campaign:', error)
    const errorMsg = typeof error === 'object' && error !== null && 'message' in error ? (error as any).message : String(error)
    return NextResponse.json({ error: errorMsg || 'Failed to update campaign' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { id } = body
    
    if (!id) {
      return NextResponse.json({ error: 'Campaign id is required' }, { status: 400 })
    }

    await prisma.campaign.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting campaign:', error)
    const errorMsg = typeof error === 'object' && error !== null && 'message' in error ? (error as any).message : String(error)
    return NextResponse.json({ error: errorMsg || 'Failed to delete campaign' }, { status: 500 })
  }
}