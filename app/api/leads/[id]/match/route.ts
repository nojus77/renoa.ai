import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    console.log('🔍 Finding match for lead:', id);

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

    console.log('📍 Lead location:', lead.city, '- Service:', lead.serviceInterest);

    // Find matching providers
    const providers = await prisma.provider.findMany({
      where: {
        status: 'active',
        serviceTypes: {
          has: lead.serviceInterest,
        },
        serviceAreas: {
          has: lead.city,
        },
      },
    });

    console.log('📊 Found', providers.length, 'matching providers');

    if (providers.length === 0) {
      return NextResponse.json(
        { error: `No matching providers found in ${lead.city} for ${lead.serviceInterest}` },
        { status: 404 }
      );
    }

    // Calculate match scores
    const scoredProviders = providers.map(provider => {
      let score = 0;

      // Rating score (0-40 points)
      score += (provider.rating / 5) * 40;

      // Conversion rate (0-30 points)
      const conversionRate = provider.totalLeadsSent > 0 
        ? (provider.leadsConverted / provider.totalLeadsSent) 
        : 0;
      score += conversionRate * 30;

      // Capacity score (0-20 points)
      const capacityUsed = provider.currentLeadCount / provider.leadCapacity;
      score += (1 - capacityUsed) * 20;

      // Years in business (0-10 points)
      score += Math.min(provider.yearsInBusiness / 10, 1) * 10;

      return {
        ...provider,
        matchScore: Math.round(score),
      };
    });

    // Get the best match
    const bestMatch = scoredProviders.sort((a, b) => b.matchScore - a.matchScore)[0];

    console.log('✨ Best match:', bestMatch.businessName, '- Score:', bestMatch.matchScore);

    // Assign the lead to the best provider
    await prisma.lead.update({
      where: { id },
      data: {
        assignedProviderId: bestMatch.id,
        status: 'contacted',
      },
    });

    // Update provider stats
    await prisma.provider.update({
      where: { id: bestMatch.id },
      data: {
        currentLeadCount: { increment: 1 },
        totalLeadsSent: { increment: 1 },
      },
    });

    return NextResponse.json({
      success: true,
      provider: {
        id: bestMatch.id,
        name: bestMatch.businessName,
        email: bestMatch.email,
        rating: bestMatch.rating,
        matchScore: bestMatch.matchScore,
      },
      allMatches: scoredProviders.map(p => ({
        id: p.id,
        name: p.businessName,
        matchScore: p.matchScore,
        rating: p.rating,
      })),
    });

  } catch (error: any) {
    console.error('💥 Error matching lead:', error);
    return NextResponse.json(
      { error: 'Failed to match lead', details: error.message },
      { status: 500 }
    );
  }
}