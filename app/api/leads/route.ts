import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'
import { Prisma } from '@prisma/client'

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Quick count endpoint
    if (searchParams.get('countOnly') === 'true') {
      const scoreMin = searchParams.get('scoreMin') ? parseInt(searchParams.get('scoreMin')!) : undefined
      const where: any = {}
      if (typeof scoreMin === 'number' && !Number.isNaN(scoreMin)) {
        where.leadScore = { gte: scoreMin }
      }
      const total = await prisma.lead.count({ where })
      return NextResponse.json({ total })
    }

    // Group by service endpoint
    if (searchParams.get('groupByService') === 'true') {
      const breakdown = await prisma.lead.groupBy({
        by: ['serviceInterest'],
        _count: { serviceInterest: true },
      })
      return NextResponse.json({
        breakdown: breakdown.map(b => [b.serviceInterest, b._count.serviceInterest])
      })
    }

    // Main query with filters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status')?.split(',').filter(Boolean)
    const serviceInterest = searchParams.get('serviceInterest')?.split(',').filter(Boolean)
    const tier = searchParams.get('tier')?.split(',').map(t => parseInt(t)).filter(n => !Number.isNaN(n))
    const sortBy = (searchParams.get('sortBy') || 'createdAt') as 'leadScore' | 'propertyValue' | 'tier' | 'createdAt'
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc'

    const where: any = {}

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (status && status.length > 0) {
      where.status = { in: status }
    }

    if (serviceInterest && serviceInterest.length > 0) {
      where.serviceInterest = { in: serviceInterest }
    }

    if (tier && tier.length > 0) {
      where.tier = { in: tier }
    }

    const total = await prisma.lead.count({ where })

    const orderBy: any = (() => {
      switch (sortBy) {
        case 'leadScore':
          return { leadScore: sortOrder }
        case 'propertyValue':
          return { propertyValue: sortOrder }
        case 'tier':
          return { tier: sortOrder }
        default:
          return { createdAt: sortOrder }  // ✅ Use sortOrder, not hardcoded 'desc'
      }
    })()

    // ✅ FIX: Actually USE the where, orderBy, and pagination!
    const leads = await prisma.lead.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy,
      include: {
        assignedProvider: true,  // ✅ Include provider info
      },
    });

    return NextResponse.json({
      leads,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching leads:', error)
    return NextResponse.json(
      { error: 'Failed to fetch leads' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log('📥 Received lead data:', JSON.stringify(body, null, 2));
    
    // Validate required fields
    const required = ['firstName', 'lastName', 'email', 'phone', 'city', 'state', 'zip'];
    const missing = required.filter(field => !body[field]);
    
    if (missing.length > 0) {
      console.log('❌ Missing required fields:', missing);
      return NextResponse.json(
        { error: `Missing required fields: ${missing.join(', ')}` },
        { status: 400 }
      )
    }
    
    // Validate service interest
    const validServices = ['landscaping', 'lawn_care', 'hardscaping', 'remodeling', 'roofing', 'fencing', 'hvac', 'plumbing', 'painting', 'flooring'];
    if (body.serviceInterest && !validServices.includes(body.serviceInterest)) {
      console.log('❌ Invalid service interest:', body.serviceInterest);
      return NextResponse.json(
        { error: `Invalid service interest. Must be one of: ${validServices.join(', ')}` },
        { status: 400 }
      )
    }

    // Calculate tier
    const tier = body.tier || (body.leadScore >= 80 ? 1 : body.leadScore >= 60 ? 2 : 3);

    // Build the data object with proper types
    const leadData: Prisma.LeadCreateInput = {
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      phone: body.phone,
      address: body.address || '',
      city: body.city,
      state: body.state,
      zip: body.zip,
      propertyType: body.propertyType || 'single_family',
      propertyValue: body.propertyValue ? new Prisma.Decimal(body.propertyValue) : null,
      squareFootage: body.squareFootage ? parseInt(body.squareFootage) : null,
      moveInDate: body.moveInDate ? new Date(body.moveInDate) : null,
      serviceInterest: body.serviceInterest || 'landscaping',
      leadSource: body.leadSource || 'website',
      leadScore: body.leadScore || 50,
      tier: tier,
      campaign: body.campaign || null,
      contactCount: body.contactCount || 0,
      urgencyScore: body.urgencyScore || null,
      propertyScore: body.propertyScore || null,
      financialScore: body.financialScore || null,
      demographicScore: body.demographicScore || null,
      marketScore: body.marketScore || null,
      urgencyReasons: body.urgencyReasons || null,
      status: 'new',
      notes: body.notes || null,
    };

    console.log('💾 Creating lead in database...');

    const lead = await prisma.lead.create({
      data: leadData,
      include: {
        assignedProvider: true,  // ✅ Include provider in response
      },
    });
    
    console.log('✅ Lead created successfully:', lead.id);

    // Send Slack notification (non-blocking)
    if (process.env.SLACK_WEBHOOK_URL) {
      try {
        const slackMessage = {
          text: `🎯 New Lead Captured!`,
          blocks: [
            {
              type: 'header',
              text: {
                type: 'plain_text',
                text: '🎯 New Lead Captured!',
                emoji: true
              }
            },
            {
              type: 'section',
              fields: [
                {
                  type: 'mrkdwn',
                  text: `*Name:*\n${lead.firstName} ${lead.lastName}`
                },
                {
                  type: 'mrkdwn',
                  text: `*Service:*\n${lead.serviceInterest}`
                },
                {
                  type: 'mrkdwn',
                  text: `*Phone:*\n${lead.phone}`
                },
                {
                  type: 'mrkdwn',
                  text: `*Email:*\n${lead.email}`
                },
                {
                  type: 'mrkdwn',
                  text: `*Location:*\n${lead.city}, ${lead.state} ${lead.zip}`
                },
                {
                  type: 'mrkdwn',
                  text: `*Lead Source:*\n${lead.leadSource}`
                }
              ]
            },
            {
              type: 'context',
              elements: [
                {
                  type: 'mrkdwn',
                  text: `Lead ID: ${lead.id} | Tier: ${lead.tier} | Score: ${lead.leadScore}`
                }
              ]
            }
          ]
        };

        await fetch(process.env.SLACK_WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(slackMessage),
        });

        console.log('✅ Slack notification sent successfully');
      } catch (slackError) {
        // Don't fail the request if Slack notification fails
        console.error('⚠️ Failed to send Slack notification:', slackError);
      }
    } else {
      console.log('⚠️ SLACK_WEBHOOK_URL not configured, skipping notification');
    }

    return NextResponse.json({ lead }, { status: 201 })
    
  } catch (error: any) {
    console.error('💥 Error creating lead:', error);
    console.error('💥 Error stack:', error.stack);
    console.error('💥 Error message:', error.message);
    
    // Return detailed error for debugging
    return NextResponse.json(
      { 
        error: 'Failed to create lead',
        details: error.message,
        code: error.code,
      },
      { status: 500 }
    )
  }
}