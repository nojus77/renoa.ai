import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
// import { sendEmailViaSES } from '@/lib/email/ses' // Implement this for real SES sending

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const campaignId = params.id
  try {
    // 1. Find all QUEUED messages for this campaign
    const messages = await prisma.message.findMany({
      where: { campaignId, status: 'QUEUED' }
    })
    if (!messages.length) {
      return NextResponse.json({ error: 'No emails to send for this campaign' }, { status: 400 })
    }
    // 2. Send each email (stub: just log, replace with SES integration)
    for (const msg of messages) {
      // await sendEmailViaSES(msg)
      console.log(`[SEND] Would send email to ${msg.toEmail} for campaign ${campaignId}`)
      await prisma.message.update({ where: { id: msg.id }, data: { status: 'SENT', sentAt: new Date() } })
    }
    // 3. Optionally update campaign status
    await prisma.campaign.update({ where: { id: campaignId }, data: { status: 'active' } })
    return NextResponse.json({ success: true, sent: messages.length })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
