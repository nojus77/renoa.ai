import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET all templates with stats
export async function GET() {
  try {
    const templates = await prisma.emailTemplate.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        subject: true,
        body: true,
        variables: true,
        createdAt: true,
        updatedAt: true,
      }
    })

    // For now, return templates without stats (we'll add stats later when messages are sent)
    const templatesWithStats = templates.map(t => ({
      ...t,
      timesUsed: 0,
      avgReplyRate: 0,
      isActive: true
    }))

    return NextResponse.json(templatesWithStats)
  } catch (error) {
    console.error('GET /api/templates error:', error)
    const errorMsg = typeof error === 'object' && error !== null && 'message' in error ? (error as any).message : String(error)
    return NextResponse.json({ error: errorMsg || 'Failed to fetch templates' }, { status: 500 })
  }
}

// POST create new template
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, subject, bodyText, serviceType, status } = body
    console.log('Received fields:', { name, subject, bodyText, serviceType, status })
    if (!name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }
    if (!subject?.trim()) {
      return NextResponse.json({ error: 'Subject is required' }, { status: 400 })
    }
    if (!bodyText?.trim()) {
      return NextResponse.json({ error: 'Body is required' }, { status: 400 })
    }
    const template = await prisma.emailTemplate.create({
      data: {
        name,
        subject,
        body: bodyText,
        variables: {}, // We'll add merge tag detection later
      }
    })
    console.log('Template created:', template)
    return NextResponse.json(template, { status: 201 })
  } catch (error) {
    console.error('POST /api/templates error:', error)
    const errorMsg = typeof error === 'object' && error !== null && 'message' in error ? (error as any).message : String(error)
    return NextResponse.json({ 
      error: errorMsg || 'Failed to create template' 
    }, { status: 500 })
  }
}
