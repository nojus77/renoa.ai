import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('customer-session');

    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { customerId } = JSON.parse(session.value);

    // Get customer's completed jobs to determine what services they've used
    const completedJobs = await prisma.job.findMany({
      where: {
        customerId,
        status: 'completed',
      },
      select: {
        serviceType: true,
      },
      distinct: ['serviceType'],
    });

    if (completedJobs.length === 0) {
      // No completed jobs, return empty recommendations
      return NextResponse.json({ recommendations: [] });
    }

    // Get unique service types
    const serviceTypes = completedJobs.map(job => job.serviceType);

    // Fetch recommendations based on completed services
    const recommendations = await prisma.service_recommendations.findMany({
      where: {
        base_service: {
          in: serviceTypes,
        },
        is_active: true,
      },
      orderBy: [
        { display_order: 'asc' },
        { conversion_rate: 'desc' },
      ],
    });

    // Group recommendations by base service and limit to top 3 per service
    const groupedRecommendations: Record<string, typeof recommendations> = {};

    for (const rec of recommendations) {
      if (!groupedRecommendations[rec.base_service]) {
        groupedRecommendations[rec.base_service] = [];
      }

      if (groupedRecommendations[rec.base_service].length < 3) {
        groupedRecommendations[rec.base_service].push(rec);
      }
    }

    // Flatten and return recommendations with base service context
    const flattenedRecommendations = Object.entries(groupedRecommendations).flatMap(
      ([baseService, recs]) =>
        recs.map(rec => ({
          ...rec,
          recommended_price: Number(rec.recommended_price), // Convert Decimal to number
          conversion_rate: Number(rec.conversion_rate), // Convert Decimal to number
          baseServiceContext: baseService,
        }))
    );

    return NextResponse.json({
      recommendations: flattenedRecommendations.slice(0, 6), // Limit to 6 total for dashboard
    });
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recommendations' },
      { status: 500 }
    );
  }
}

// GET recommendations for a specific service type
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { serviceType } = body;

    if (!serviceType) {
      return NextResponse.json(
        { error: 'Service type is required' },
        { status: 400 }
      );
    }

    // Fetch recommendations for the specific service
    const recommendations = await prisma.service_recommendations.findMany({
      where: {
        base_service: serviceType,
        is_active: true,
      },
      orderBy: [
        { display_order: 'asc' },
        { conversion_rate: 'desc' },
      ],
      take: 3,
    });

    // Convert Decimal fields to numbers
    const formattedRecommendations = recommendations.map(rec => ({
      ...rec,
      recommended_price: Number(rec.recommended_price),
      conversion_rate: Number(rec.conversion_rate),
    }));

    return NextResponse.json({ recommendations: formattedRecommendations });
  } catch (error) {
    console.error('Error fetching service recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recommendations' },
      { status: 500 }
    );
  }
}
