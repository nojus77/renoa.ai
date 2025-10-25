import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function POST(req: Request) {
  try {
    const { leadId, templateId, campaignGoal } = await req.json()

    // Get lead data
    const leadRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002'}/api/leads/${leadId}`)
    const lead = await leadRes.json()

    // Get template
    const templateRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002'}/api/templates/${templateId}`)
    const template = await templateRes.json()

    const prompt = `You are writing a personalized sales email for a home improvement lead.

Lead Details:
- Name: ${lead.firstName} ${lead.lastName}
- Location: ${lead.city}, ${lead.state}
- Service Interest: ${lead.serviceInterest}
- Property Value: ${lead.propertyValue || 'Not specified'}
- Lead Score: ${lead.leadScore}/100

Template Subject: ${template.subject}
Template Body: ${template.body}

Campaign Goal: ${campaignGoal || 'Generate interest and schedule consultation'}

Write a personalized email that:
1. Uses the template as inspiration but makes it unique
2. References their location and service interest naturally
3. Feels personal, not templated
4. Keeps subject under 60 characters
5. Body under 200 words
6. Has clear call-to-action

Return ONLY valid JSON: {"subject": "...", "body": "..."}`

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
      response_format: { type: 'json_object' }
    })

    const generated = JSON.parse(completion.choices[0].message.content || '{}')

    return NextResponse.json({
      subject: generated.subject,
      body: generated.body,
      tokensUsed: completion.usage?.total_tokens || 0,
      cost: ((completion.usage?.total_tokens || 0) * 0.0000001).toFixed(6)
    })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}