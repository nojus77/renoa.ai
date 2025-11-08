import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export const dynamic = 'force-dynamic';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface EstimateRequest {
  service: string;
  zip: string;
  projectDetails: Record<string, any>;
}

interface EstimateResponse {
  min: number;
  max: number;
  confidence: 'low' | 'medium' | 'high';
  explanation: string;
}

export async function POST(request: NextRequest) {
  try {
    const { service, zip, projectDetails }: EstimateRequest = await request.json();

    console.log('🤖 AI Estimation Request:');
    console.log('   Service:', service);
    console.log('   ZIP:', zip);
    console.log('   Details:', projectDetails);

    // Build detailed prompt from project details
    const detailsText = Object.entries(projectDetails)
      .map(([key, value]) => {
        if (Array.isArray(value)) {
          return `${key}: ${value.join(', ')}`;
        }
        return `${key}: ${value}`;
      })
      .join('\n');

    const prompt = `You are a home services pricing expert with knowledge of typical market rates across the United States.

Provide a realistic price estimate for this project:

SERVICE: ${service.replace('_', ' ')}
LOCATION ZIP: ${zip}
PROJECT DETAILS:
${detailsText}

Based on typical market rates in the ${zip} area and the specific project details provided, estimate the cost range.

Consider:
- Labor costs typical for this service in this region
- Material costs
- Project complexity and scope
- Current market conditions
- Whether this is a small/medium/large project based on the details

Respond ONLY with valid JSON in this exact format (no markdown, no code blocks):
{
  "min": <number representing minimum cost in dollars>,
  "max": <number representing maximum cost in dollars>,
  "confidence": "<low|medium|high>",
  "explanation": "<1-2 sentence explanation of the estimate>"
}

Use these guidelines for confidence:
- "high" = Very standard project with clear scope
- "medium" = Typical project but may vary based on specifics
- "low" = Wide variation possible, needs in-person assessment

Ensure the estimate is reasonable and based on current 2024-2025 market rates.`;

    console.log('📤 Sending request to OpenAI...');

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a professional home services cost estimator. Always respond with valid JSON only, no markdown formatting.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const responseText = completion.choices[0].message.content?.trim() || '';
    console.log('📥 Raw OpenAI response:', responseText);

    // Parse the response, removing any markdown code blocks if present
    let cleanedResponse = responseText;
    if (responseText.includes('```')) {
      cleanedResponse = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    }

    const estimate: EstimateResponse = JSON.parse(cleanedResponse);

    // Validate the response structure
    if (typeof estimate.min !== 'number' || typeof estimate.max !== 'number') {
      throw new Error('Invalid estimate format from AI');
    }

    if (!['low', 'medium', 'high'].includes(estimate.confidence)) {
      estimate.confidence = 'medium';
    }

    console.log('✅ AI Estimate:', estimate);

    return NextResponse.json(estimate);

  } catch (error: any) {
    console.error('❌ Error generating estimate:', error);
    console.error('   Error message:', error.message);

    // Return a fallback estimate if AI fails
    return NextResponse.json(
      {
        min: 1000,
        max: 5000,
        confidence: 'low',
        explanation: 'Unable to generate accurate estimate. A provider will assess your specific needs and provide a detailed quote.'
      },
      { status: 200 } // Still return 200 with fallback estimate
    );
  }
}
