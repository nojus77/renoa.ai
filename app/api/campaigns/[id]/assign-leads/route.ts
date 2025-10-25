import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { filters } = await req.json()
    const campaignId = params.id

    let whereClause: any = {}

    if (filters.tier === '1') {
      whereClause.leadScore = { gte: 70 }
    } else if (filters.tier === '2') {
      whereClause.leadScore = { gte: 50, lt: 70 }
    } else if (filters.tier === '3') {
      whereClause.leadScore = { lt: 50 }
    }

    if (filters.serviceType) {
      whereClause.serviceInterest = filters.serviceType
    }

    if (filters.location) {
      whereClause.city = filters.location
    }

    const leads = await prisma.lead.findMany({
      where: whereClause,
      select: { id: true }
    })

    await prisma.campaignLead.createMany({
      data: leads.map(lead => ({
        campaignId,
        leadId: lead.id,
        status: 'pending'
      })),
      skipDuplicates: true
    })

    const totalLeads = await prisma.campaignLead.count({
  where: { campaignId }
})

return NextResponse.json({
  success: true,
  assigned: leads.length,
  totalLeads
})

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
