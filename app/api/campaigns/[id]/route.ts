import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params
  try {
    const body = await request.json()
    const { status } = body
    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 })
    }
    const campaign = await prisma.campaign.update({
      where: { id },
      data: { status }
    })
    return NextResponse.json(campaign, { status: 200 })
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }
    console.error('Error updating campaign:', error)
    return NextResponse.json({ error: 'Failed to update campaign' }, { status: 500 })
  }
}
