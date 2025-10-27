// This script simulates a background job for batch email generation
import { prisma } from '../lib/prisma'
import { generateMessageId, generateTrackingToken } from '../lib/emails/id'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

async function generateEmailsForCampaign(campaignId: string) {
  const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } })
  if (!campaign) throw new Error('Campaign not found')
  const campaignLeads = await prisma.campaignLead.findMany({ where: { campaignId } })
  const template = await prisma.emailTemplate.findFirst()
  if (!template) throw new Error('No template found')

  let generated = 0
  for (const cl of campaignLeads) {
    const lead = await prisma.lead.findUnique({ where: { id: cl.leadId } })
    if (!lead) continue
    // Personalize template (simple merge)
    let subject = template.subject
    let body = template.body
    Object.entries({
      firstName: lead.firstName,
      lastName: lead.lastName,
      city: lead.city,
      serviceType: lead.serviceInterest,
      propertyValue: lead.propertyValue?.toString() || ''
    }).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g')
      subject = subject.replace(regex, value)
      body = body.replace(regex, value)
    })
    // Optionally: Use OpenAI to rewrite body (uncomment to enable)
    // const aiResult = await openai.chat.completions.create({
    //   model: 'gpt-4',
    //   messages: [{ role: 'system', content: 'Rewrite this email for clarity and engagement.' }, { role: 'user', content: body }]
    // })
    // body = aiResult.choices[0].message.content || body
    await prisma.message.create({
      data: {
        leadId: lead.id,
        campaignId,
        subject,
        body,
        fromEmail: 'hello@renoa.ai',
        toEmail: lead.email,
        status: 'QUEUED',
        messageId: generateMessageId(),
        trackingToken: generateTrackingToken(),
      }
    })
    generated++
    if (generated % 10 === 0) {
      console.log(`[Progress] ${generated}/${campaignLeads.length} emails generated...`)
    }
  }
  console.log(`[Done] Generated ${generated} emails for campaign ${campaignId}`)
}

// Usage: npx ts-node scripts/generate-campaign-emails.ts <campaignId>
if (require.main === module) {
  const campaignId = process.argv[2]
  if (!campaignId) throw new Error('Usage: npx ts-node scripts/generate-campaign-emails.ts <campaignId>')
  generateEmailsForCampaign(campaignId).then(() => process.exit(0))
}
