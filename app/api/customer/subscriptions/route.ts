import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';

const prisma = new PrismaClient();

// GET - List all subscriptions for logged-in customer
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

    const subscriptions = await prisma.customerSubscription.findMany({
      where: { customerId },
      include: {
        provider: {
          select: {
            id: true,
            businessName: true,
            phone: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ subscriptions });
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscriptions' },
      { status: 500 }
    );
  }
}

// POST - Create new subscription
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
    const { serviceType, frequency, price, startDate } = body;

    if (!serviceType || !frequency || !price || !startDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Calculate next scheduled date based on frequency
    const start = new Date(startDate);
    let nextScheduledDate = new Date(start);

    switch (frequency) {
      case 'weekly':
        nextScheduledDate.setDate(nextScheduledDate.getDate() + 7);
        break;
      case 'biweekly':
        nextScheduledDate.setDate(nextScheduledDate.getDate() + 14);
        break;
      case 'monthly':
        nextScheduledDate.setMonth(nextScheduledDate.getMonth() + 1);
        break;
    }

    const subscription = await prisma.customerSubscription.create({
      data: {
        customerId,
        providerId,
        serviceType,
        frequency,
        price: parseFloat(price),
        discountPercent: 10, // 10% discount for subscriptions
        status: 'active',
        startDate: start,
        nextScheduledDate,
      },
      include: {
        provider: {
          select: {
            id: true,
            businessName: true,
            phone: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ subscription }, { status: 201 });
  } catch (error) {
    console.error('Error creating subscription:', error);
    return NextResponse.json(
      { error: 'Failed to create subscription' },
      { status: 500 }
    );
  }
}
