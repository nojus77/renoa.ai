import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
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
      sameProvider = true,
    } = body;

    if (!recommendationId || !serviceType || !address) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create a lead with recommendation tracking
    const lead = await prisma.lead.create({
      data: {
        providerId: sameProvider ? providerId : providerId, // For now, always use same provider
        name: '', // Will be filled from customer data
        phone: '', // Will be filled from customer data
        email: '', // Will be filled from customer data
        serviceType,
        address,
        preferredDate: null,
        customerNotes,
        source: 'own',
        recommendationSource: `recommendation_${recommendationId}`,
        status: 'new',
      },
    });

    // Update conversion tracking for the recommendation
    await prisma.serviceRecommendation.update({
      where: { id: recommendationId },
      data: {
        conversionRate: {
          increment: 1, // Simple increment - could be made more sophisticated
        },
      },
    });

    return NextResponse.json({ lead }, { status: 201 });
  } catch (error) {
    console.error('Error creating recommendation lead:', error);
    return NextResponse.json(
      { error: 'Failed to request service' },
      { status: 500 }
    );
  }
}
