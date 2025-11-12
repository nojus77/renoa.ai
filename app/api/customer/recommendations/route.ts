import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
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
    const recommendations = await prisma.serviceRecommendation.findMany({
      where: {
        baseService: {
          in: serviceTypes,
        },
        isActive: true,
      },
      orderBy: [
        { displayOrder: 'asc' },
        { conversionRate: 'desc' },
      ],
    });

    // Group recommendations by base service and limit to top 3 per service
    const groupedRecommendations: Record<string, any[]> = {};

    for (const rec of recommendations) {
      if (!groupedRecommendations[rec.baseService]) {
        groupedRecommendations[rec.baseService] = [];
      }

      if (groupedRecommendations[rec.baseService].length < 3) {
        groupedRecommendations[rec.baseService].push(rec);
      }
    }

    // Flatten and return recommendations with base service context
    const flattenedRecommendations = Object.entries(groupedRecommendations).flatMap(
      ([baseService, recs]) =>
        recs.map(rec => ({
          ...rec,
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
    const recommendations = await prisma.serviceRecommendation.findMany({
      where: {
        baseService: serviceType,
        isActive: true,
      },
      orderBy: [
        { displayOrder: 'asc' },
        { conversionRate: 'desc' },
      ],
      take: 3,
    });

    return NextResponse.json({ recommendations });
  } catch (error) {
    console.error('Error fetching service recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recommendations' },
      { status: 500 }
    );
  }
}
