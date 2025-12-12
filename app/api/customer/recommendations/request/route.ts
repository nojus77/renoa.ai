import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('customer-session');

    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { customerId, providerId } = JSON.parse(session.value);
    const body = await request.json();
    const {
      recommendationId,
      serviceType,
      address,
      customerNotes,
    } = body;

    if (!recommendationId || !serviceType || !address) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create a job request from the recommendation
    const job = await prisma.job.create({
      data: {
        providerId,
        customerId,
        serviceType,
        address,
        startTime: new Date(), // Placeholder - will be scheduled later
        endTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours later
        status: 'pending',
        source: 'own',
        booking_source: `recommendation_${recommendationId}`,
        customerNotes,
      },
    });

    // Update conversion tracking for the recommendation
    await prisma.service_recommendations.update({
      where: { id: recommendationId },
      data: {
        conversion_rate: {
          increment: 1,
        },
      },
    });

    return NextResponse.json({ job }, { status: 201 });
  } catch (error) {
    console.error('Error creating recommendation job:', error);
    return NextResponse.json(
      { error: 'Failed to request service' },
      { status: 500 }
    );
  }
}
