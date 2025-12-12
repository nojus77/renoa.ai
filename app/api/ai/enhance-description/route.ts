import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { description, businessName, category } = await request.json();

    if (!description || description.trim().length < 3) {
      return NextResponse.json(
        { error: 'Please provide a brief description to enhance' },
        { status: 400 }
      );
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const prompt = `You are a professional copywriter for service businesses. Take the following brief business description and expand it into a professional 2-3 sentence description that sounds trustworthy and competent. Keep it concise and avoid marketing fluff.

Business Name: ${businessName || 'Unknown'}
Category: ${category || 'Service Business'}
User's Input: ${description}

Write only the enhanced description, nothing else. No quotes, no introductions, just the description.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 200,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const enhancedDescription = response.choices[0]?.message?.content?.trim() || '';

    return NextResponse.json({ enhancedDescription });
  } catch (error) {
    console.error('Error enhancing description:', error);
    return NextResponse.json(
      { error: 'Failed to enhance description' },
      { status: 500 }
    );
  }
}
