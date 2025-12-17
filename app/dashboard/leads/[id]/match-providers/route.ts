import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { openai } from '@/lib/openai-server';

// Haversine formula to calculate distance between two coordinates
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Simple geocoding approximation for US cities
const cityCoordinates: Record<string, { lat: number; lon: number }> = {
  'chicago': { lat: 41.8781, lon: -87.6298 },
  'boston': { lat: 42.3601, lon: -71.0589 },
  'naperville': { lat: 41.7508, lon: -88.1535 },
  'oak park': { lat: 41.8850, lon: -87.7845 },
  'evanston': { lat: 42.0451, lon: -87.6877 },
  'schaumburg': { lat: 42.0334, lon: -88.0834 },
};

function getCoordinates(city: string): { lat: number; lon: number } | null {
  const normalized = city.toLowerCase().trim();
  return cityCoordinates[normalized] || null;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Get the lead
    const lead = await prisma.lead.findUnique({
      where: { id },
    });

    if (!lead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      );
    }

    // Get all active providers that match the service type
    const providers = await prisma.provider.findMany({
      where: {
        status: 'active',
        serviceTypes: {
          hasSome: [lead.serviceInterest.toLowerCase()],
        },
      },
    });

    if (providers.length === 0) {
      return NextResponse.json({
        matches: [],
        message: 'No providers found matching this service type',
      });
    }

    // Calculate scores for each provider
    const scoredProviders = providers.map(provider => {
      let score = 0;
      let reasons: string[] = [];

      // Service match (base score)
      score += 20;
      reasons.push('Service type match');

      // Rating score (0-25 points)
      if (provider.rating) {
        const ratingScore = (provider.rating / 5) * 25;
        score += ratingScore;
        reasons.push(`${provider.rating.toFixed(1)} star rating`);
      }

      // Conversion rate score (0-25 points)
      const conversionRate = provider.totalLeadsSent > 0
        ? provider.leadsConverted / provider.totalLeadsSent
        : 0;
      if (conversionRate > 0) {
        const conversionScore = conversionRate * 25;
        score += conversionScore;
        reasons.push(`${(conversionRate * 100).toFixed(1)}% conversion rate`);
      }

      // Geographic proximity (0-20 points)
      // TODO: Add city field to Provider model
      /*
      const leadCoords = getCoordinates(lead.city);
      const providerCoords = getCoordinates(provider.city);

      if (leadCoords && providerCoords) {
        const distance = calculateDistance(
          leadCoords.lat, leadCoords.lon,
          providerCoords.lat, providerCoords.lon
        );

        if (distance < 10) {
          score += 20;
          reasons.push(`Only ${distance.toFixed(1)} miles away`);
        } else if (distance < 25) {
          score += 15;
          reasons.push(`${distance.toFixed(1)} miles away`);
        } else if (distance < 50) {
          score += 10;
          reasons.push(`${distance.toFixed(1)} miles away`);
        } else {
          score += 5;
          reasons.push(`${distance.toFixed(1)} miles away`);
        }
      }
      */

      // Response time score (0-10 points)
      // TODO: Add responseTime field to Provider model
      /*
      if (provider.responseTime) {
        if (provider.responseTime < 2) {
          score += 10;
          reasons.push('Fast response time');
        } else if (provider.responseTime < 5) {
          score += 5;
          reasons.push('Good response time');
        }
      }
      */

      return {
        provider,
        score: Math.round(score),
        reasons,
      };
    });

    // Sort by score and get top 3
    const topMatches = scoredProviders
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    // Use AI to generate personalized recommendation
    const prompt = `You are a lead routing AI for a home improvement marketplace. Analyze these provider matches and give a brief recommendation.

Lead Details:
- Name: ${lead.firstName} ${lead.lastName}
- Service: ${lead.serviceInterest}
- Location: ${lead.city}, ${lead.state}
- Property Value: $${lead.propertyValue?.toLocaleString() || 'Unknown'}
- Score: ${lead.leadScore}/100

Top 3 Provider Matches:
${topMatches.map((m, i) => `
${i + 1}. ${m.provider.businessName}
   - Match Score: ${m.score}/100
   - Rating: ${m.provider.rating?.toFixed(1) || 'N/A'} stars
   - Years in Business: ${m.provider.yearsInBusiness}
   - Reasons: ${m.reasons.join(', ')}
`).join('\n')}

Provide a 2-3 sentence recommendation on which provider to assign this lead to and why. Be specific and actionable.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at matching home improvement leads to the best service providers. Be concise and actionable.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 200,
    });

    const recommendation = completion.choices[0].message.content;

    return NextResponse.json({
      matches: topMatches.map(m => ({
        provider: m.provider,
        score: m.score,
        reasons: m.reasons,
      })),
      recommendation,
    });
  } catch (error) {
    console.error('Error matching providers:', error);
    return NextResponse.json(
      { error: 'Failed to match providers' },
      { status: 500 }
    );
  }
}