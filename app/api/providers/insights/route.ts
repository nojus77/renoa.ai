import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function GET() {
  try {
    const providers = await prisma.provider.findMany();

    if (providers.length === 0) {
      return NextResponse.json({
        insights: 'No provider data available for analysis.',
      });
    }

    const totalRevenue = providers.reduce((sum, p) => sum + p.totalRevenue, 0);
    const activeProviders = providers.filter(p => p.status === 'active').length;
    const avgConversion = providers.reduce((sum, p) => {
      const conversionRate = p.totalLeadsSent > 0 ? p.leadsConverted / p.totalLeadsSent : 0;
      return sum + conversionRate;
    }, 0) / providers.length;
    const topProvider = providers.sort((a, b) => b.totalRevenue - a.totalRevenue)[0];
    const lowPerformer = providers.sort((a, b) => {
      const aRate = a.totalLeadsSent > 0 ? a.leadsConverted / a.totalLeadsSent : 0;
      const bRate = b.totalLeadsSent > 0 ? b.leadsConverted / b.totalLeadsSent : 0;
      return aRate - bRate;
    })[0];

    const prompt = `You are a business analyst reviewing a home improvement service provider network. Analyze this data and provide actionable insights:

**Provider Network Summary:**
- Total Providers: ${providers.length}
- Active: ${activeProviders}
- Total Revenue Generated: $${totalRevenue.toLocaleString()}
- Average Conversion Rate: ${(avgConversion * 100).toFixed(1)}%

**Top Performer:** ${topProvider.businessName} ($${topProvider.totalRevenue.toLocaleString()} revenue)

**Needs Attention:** ${lowPerformer.businessName} (low conversion rate)

**Provider Details:**
${providers.map(p => {
  const conversionRate = p.totalLeadsSent > 0 ? (p.leadsConverted / p.totalLeadsSent) : 0;
  return `- ${p.businessName}: $${p.totalRevenue.toLocaleString()} revenue, ${p.totalLeadsSent} leads sent, ${p.leadsConverted} converted (${(conversionRate * 100).toFixed(1)}%)`;
}).join('\n')}

Provide a concise analysis (3-4 paragraphs) covering:
1. Overall network health and performance trends
2. Key strengths and opportunities
3. Specific actionable recommendations
4. Commission payment priorities

Be direct, data-driven, and actionable. Use bullet points for recommendations.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a business intelligence analyst specializing in home services marketplaces. Provide clear, actionable insights.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 800,
    });

    const insights = completion.choices[0].message.content;

    return NextResponse.json({ insights });
  } catch (error) {
    console.error('Error generating insights:', error);
    return NextResponse.json(
      { error: 'Failed to generate insights' },
      { status: 500 }
    );
  }
}