import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getCustomerSession } from '@/lib/auth-helpers';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getCustomerSession();

    if (!session?.customerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get or create loyalty points for customer
    let loyalty = await prisma.loyaltyPoints.findUnique({
      where: { customerId: session.customerId },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    // Create if doesn't exist
    if (!loyalty) {
      loyalty = await prisma.loyaltyPoints.create({
        data: {
          customerId: session.customerId,
          points: 0,
          lifetimePoints: 0,
          tier: 'bronze',
        },
        include: {
          transactions: true,
        },
      });
    }

    return NextResponse.json(loyalty);
  } catch (error: any) {
    console.error('Error fetching loyalty points:', error);
    return NextResponse.json(
      { error: 'Failed to fetch loyalty points', details: error.message },
      { status: 500 }
    );
  }
}
