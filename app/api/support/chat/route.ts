import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';

const anthropic = new Anthropic();

const SYSTEM_PROMPT = `You are Renoa's friendly AI support assistant helping service professionals use the platform.

About Renoa:
- Business management platform for landscapers, roofers, plumbers, electricians, HVAC techs, painters, cleaners, and other home service professionals
- Features: Customer management, calendar/scheduling, invoicing, team management, job tracking, lead management, analytics dashboard
- Pricing: 14-day free trial, then $30/month (or $20/month billed annually)

You help with:
- Adding customers, scheduling jobs, creating and sending invoices
- Setting up services and pricing, managing team members
- Navigating settings (profile, availability, notifications, payments, security)
- Understanding the calendar and drag-drop scheduling
- Setting up skills and assigning workers to jobs
- Managing leads and converting them to jobs
- Using the analytics and reporting features

Guidelines:
- Be concise and friendly (2-3 sentences max, or use bullet points for multi-step instructions)
- Give specific navigation hints like "Go to Settings > Profile" or "Click the + button in the top right"
- If you're unsure about something or they need billing/account help, suggest emailing support@renoa.ai
- Never make up features that don't exist
- If they seem frustrated, acknowledge it and offer to connect them with a human`;

export async function POST(request: Request) {
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages array required' }, { status: 400 });
    }

    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 300,
      system: SYSTEM_PROMPT,
      messages: messages.map((msg: { role: string; content: string }) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      }))
    });

    const textContent = response.content.find(block => block.type === 'text');
    const responseText = textContent && textContent.type === 'text' ? textContent.text : '';

    return NextResponse.json({ response: responseText });
  } catch (error) {
    console.error('Support chat error:', error);
    return NextResponse.json({ error: 'Failed to get response' }, { status: 500 });
  }
}
