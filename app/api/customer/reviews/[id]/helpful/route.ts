import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getCustomerSession } from '@/lib/auth-helpers';

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getCustomerSession();
    if (!session?.customerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const reviewId = params.id;
    const { helpful } = await request.json();

    if (typeof helpful !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid request: helpful must be boolean' },
        { status: 400 }
      );
    }

    // Check if review exists
    const review = await prisma.reviews.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    // Check if user already voted
    const existingVote = await prisma.review_helpfulness.findUnique({
      where: {
        review_id_customer_id: {
          review_id: reviewId,
          customer_id: session.customerId,
        },
      },
    });

    if (existingVote) {
      // Update existing vote
      const oldHelpful = existingVote.helpful;

      await prisma.review_helpfulness.update({
        where: {
          review_id_customer_id: {
            review_id: reviewId,
            customer_id: session.customerId,
          },
        },
        data: {
          helpful,
        },
      });

      // Update helpful_count on review
      if (oldHelpful !== helpful) {
        const increment = helpful ? 1 : -1;
        await prisma.reviews.update({
          where: { id: reviewId },
          data: {
            helpful_count: {
              increment,
            },
          },
        });
      }

      return NextResponse.json({
        success: true,
        message: 'Vote updated',
        helpful,
      });
    } else {
      // Create new vote
      await prisma.review_helpfulness.create({
        data: {
          review_id: reviewId,
          customer_id: session.customerId,
          helpful,
        },
      });

      // Update helpful_count if voting helpful
      if (helpful) {
        await prisma.reviews.update({
          where: { id: reviewId },
          data: {
            helpful_count: {
              increment: 1,
            },
          },
        });
      }

      return NextResponse.json({
        success: true,
        message: 'Vote recorded',
        helpful,
      });
    }
  } catch (error: any) {
    console.error('Error recording vote:', error);
    return NextResponse.json(
      { error: 'Failed to record vote', details: error.message },
      { status: 500 }
    );
  }
}
