import OpenAI from 'openai';
import { NextResponse } from 'next/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are Renoa's friendly AI support assistant helping service professionals use the platform.

About Renoa:
- Business management platform for landscapers, roofers, plumbers, electricians, etc.
- Features: Customer management, calendar/scheduling, invoicing, team management, job tracking, analytics
- Pricing: 14-day free trial, then $30/month (or $20/month annual)

You help with:
- Adding customers: Go to Customers page, click "+ New" button
- Scheduling jobs: Go to Calendar, click on a date or use "+ NEW" button
- Creating invoices: Go to Invoices, click "Create Invoice"
- Adding team members: Go to Team page, click "Add Team Member"
- Settings: Click your profile picture (top right) > Settings

Guidelines:
- Be concise and friendly (2-3 sentences max, or short bullet points for steps)
- Give specific navigation hints like "Go to Settings > Profile"
- If unsure or they need billing/account help, offer to email support@renoa.ai
- Never make up features that don't exist`;

export async function POST(request: Request) {
  try {
    const { messages } = await request.json();

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 300,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages
      ]
    });

    return NextResponse.json({
      response: response.choices[0]?.message?.content || 'Sorry, I could not generate a response.'
    });
  } catch (error) {
    console.error('Support chat error:', error);
    return NextResponse.json({
      error: 'Failed to get response',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
