import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const providerId = params.id;

    // Get provider details
    const provider = await prisma.provider.findUnique({
      where: { id: providerId },
      select: {
        id: true,
        ownerName: true,
        email: true,
        phone: true,
        businessName: true,
        bio: true,
        profilePhotoUrl: true,
        yearsInBusiness: true,
        serviceTypes: true,
        createdAt: true,
      },
    });

    if (!provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    // Get reviews statistics
    const reviews = await prisma.reviews.findMany({
      where: { provider_id: providerId },
      select: {
        rating: true,
      },
    });

    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0;

    // Calculate rating distribution
    const ratingDistribution = {
      5: reviews.filter((r) => r.rating === 5).length,
      4: reviews.filter((r) => r.rating === 4).length,
      3: reviews.filter((r) => r.rating === 3).length,
      2: reviews.filter((r) => r.rating === 2).length,
      1: reviews.filter((r) => r.rating === 1).length,
    };

    // Get completed jobs count
    const completedJobs = await prisma.job.count({
      where: {
        providerId,
        status: 'completed',
      },
    });

    return NextResponse.json({
      provider,
      stats: {
        averageRating: parseFloat(averageRating.toFixed(1)),
        totalReviews,
        completedJobs,
        ratingDistribution,
      },
    });
  } catch (error: any) {
    console.error('Error fetching provider:', error);
    return NextResponse.json(
      { error: 'Failed to fetch provider details', details: error.message },
      { status: 500 }
    );
  }
}
