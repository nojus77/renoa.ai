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
      serviceType,
      address,
      startTime,
      endTime,
      estimatedValue,
      customerNotes,
      bookingSource,
    } = body;

    if (!serviceType || !address || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create the job
    const job = await prisma.job.create({
      data: {
        providerId,
        customerId,
        serviceType,
        address,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        status: 'scheduled',
        source: 'own',
        bookingSource: bookingSource || 'rebook_customer',
        estimatedValue: estimatedValue ? parseFloat(estimatedValue) : null,
        customerNotes,
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
        customer: {
          select: {
            name: true,
            phone: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ job }, { status: 201 });
  } catch (error) {
    console.error('Error booking job:', error);
    return NextResponse.json(
      { error: 'Failed to book service' },
      { status: 500 }
    );
  }
}
