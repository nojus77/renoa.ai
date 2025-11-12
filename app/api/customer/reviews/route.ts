import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';

const prisma = new PrismaClient();

// POST - Submit a review for a job
export async function POST(request: NextRequest) {
  try {
    // Get customer session
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('customer-session');

    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie.value);
    const customerId = session.customerId;

    const body = await request.json();
    const {
      jobId,
      rating,
      qualityRating,
      timelinessRating,
      communicationRating,
      comment,
    } = body;

    if (!jobId || !rating) {
      return NextResponse.json(
        { error: 'Job ID and rating are required' },
        { status: 400 }
      );
    }

    // Verify the job belongs to this customer and is completed
    const job = await prisma.job.findFirst({
      where: {
        id: jobId,
        customerId,
        status: 'completed',
      },
    });

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found or not completed' },
        { status: 404 }
      );
    }

    // Check if review already exists
    const existingReview = await prisma.review.findUnique({
      where: { jobId },
    });

    if (existingReview) {
      return NextResponse.json(
        { error: 'Review already submitted for this job' },
        { status: 400 }
      );
    }

    // Create the review
    const review = await prisma.review.create({
      data: {
        jobId,
        providerId: job.providerId,
        customerId,
        rating,
        qualityRating,
        timelinessRating,
        communicationRating,
        comment,
      },
    });

    // Update provider's average rating
    const providerReviews = await prisma.review.findMany({
      where: { providerId: job.providerId },
      select: { rating: true },
    });

    const avgRating =
      providerReviews.reduce((sum, r) => sum + r.rating, 0) /
      providerReviews.length;

    await prisma.provider.update({
      where: { id: job.providerId },
      data: { rating: avgRating },
    });

    return NextResponse.json({ review });
  } catch (error) {
    console.error('Error submitting review:', error);
    return NextResponse.json(
      { error: 'Failed to submit review' },
      { status: 500 }
    );
  }
}
