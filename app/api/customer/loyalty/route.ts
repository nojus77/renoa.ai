import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getCustomerSession } from '@/lib/auth-helpers';
import crypto from 'crypto';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getCustomerSession();

    if (!session?.customerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get or create loyalty points for customer
    let loyalty = await prisma.loyalty_points.findUnique({
      where: { customer_id: session.customerId },
      include: {
        loyalty_transactions: {
          orderBy: { created_at: 'desc' },
          take: 10,
        },
      },
    });

    // Create if doesn't exist
    if (!loyalty) {
      loyalty = await prisma.loyalty_points.create({
        data: {
          id: crypto.randomUUID(),
          customer_id: session.customerId,
          points: 0,
          lifetime_points: 0,
          tier: 'bronze',
          updated_at: new Date(),
        },
        include: {
          loyalty_transactions: true,
        },
      });
    }

    return NextResponse.json(loyalty);
  } catch (error: unknown) {
    console.error('Error fetching loyalty points:', error);
    return NextResponse.json(
      { error: 'Failed to fetch loyalty points', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
