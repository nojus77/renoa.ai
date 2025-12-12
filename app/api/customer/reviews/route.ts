import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';
import crypto from 'crypto';

const prisma = new PrismaClient();

// POST - Submit a review for a job
export async function POST(request: NextRequest) {
  try {
    // Get customer session
    const cookieStore = await cookies();
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
    const existingReview = await prisma.reviews.findUnique({
      where: { job_id: jobId },
    });

    if (existingReview) {
      return NextResponse.json(
        { error: 'Review already submitted for this job' },
        { status: 400 }
      );
    }

    // Create the review
    const review = await prisma.reviews.create({
      data: {
        id: crypto.randomUUID(),
        job_id: jobId,
        provider_id: job.providerId,
        customer_id: customerId,
        rating,
        quality_rating: qualityRating,
        timeliness_rating: timelinessRating,
        communication_rating: communicationRating,
        comment,
        updated_at: new Date(),
      },
    });

    // Update provider's average rating
    const providerReviews = await prisma.reviews.findMany({
      where: { provider_id: job.providerId },
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
