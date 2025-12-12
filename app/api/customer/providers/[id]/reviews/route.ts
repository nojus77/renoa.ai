import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getCustomerSession } from '@/lib/auth-helpers';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getCustomerSession();
    const providerId = params.id;
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const sortBy = searchParams.get('sortBy') || 'recent'; // recent, helpful, rating
    const filterStars = searchParams.get('stars'); // 1-5

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = { provider_id: providerId };
    if (filterStars) {
      where.rating = parseInt(filterStars);
    }

    // Build orderBy
    let orderBy: any = {};
    switch (sortBy) {
      case 'helpful':
        orderBy = { helpful_count: 'desc' };
        break;
      case 'rating':
        orderBy = { rating: 'desc' };
        break;
      case 'recent':
      default:
        orderBy = { created_at: 'desc' };
        break;
    }

    // Get reviews with customer info
    const reviews = await prisma.reviews.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: {
        customers: {
          select: {
            id: true,
            name: true,
          },
        },
        jobs: {
          select: {
            serviceType: true,
          },
        },
        helpfulness: session?.customerId
          ? {
              where: {
                customer_id: session.customerId,
              },
              select: {
                helpful: true,
              },
            }
          : false,
      },
    });

    // Get total count for pagination
    const totalCount = await prisma.reviews.count({ where });

    // Format response
    const formattedReviews = reviews.map((review) => ({
      id: review.id,
      rating: review.rating,
      comment: (review as any).comment || '',
      serviceType: review.jobs.serviceType,
      createdAt: review.created_at,
      helpfulCount: review.helpful_count,
      customer: {
        name: review.customers.name,
      },
      userVote: Array.isArray(review.helpfulness) && review.helpfulness.length > 0
        ? review.helpfulness[0].helpful
        : null,
    }));

    return NextResponse.json({
      reviews: formattedReviews,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: skip + limit < totalCount,
      },
    });
  } catch (error: any) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews', details: error.message },
      { status: 500 }
    );
  }
}
