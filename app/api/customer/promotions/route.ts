import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';

const prisma = new PrismaClient();

// GET - Get active promotions for customer's area
export async function GET(request: NextRequest) {
  try {
    // Get customer session
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('customer-session');

    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie.value);
    const customerId = session.customerId;

    // Get customer info for location
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: { address: true, providerId: true },
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    const now = new Date();

    // Get active promotions (Renoa promotions + provider promotions)
    const promotions = await prisma.promotion.findMany({
      where: {
        isActive: true,
        validFrom: { lte: now },
        validUntil: { gte: now },
        OR: [
          { maxUses: null }, // Unlimited uses
          {
            maxUses: { gt: prisma.promotion.fields.currentUses },
          },
        ],
      },
      include: {
        provider: {
          select: {
            id: true,
            businessName: true,
            rating: true,
            phone: true,
            email: true,
          },
        },
      },
      orderBy: [
        { isRenoaPromo: 'desc' }, // Renoa promotions first
        { validUntil: 'asc' }, // Expiring soon first
        { discountValue: 'desc' }, // Higher discounts first
      ],
      take: 10, // Limit to 10 promotions
    });

    // Calculate savings for each promotion
    const promotionsWithSavings = promotions.map(promo => ({
      ...promo,
      estimatedSavings:
        promo.discountType === 'percentage'
          ? `${promo.discountValue}% off`
          : `$${promo.discountValue.toFixed(2)} off`,
      isFromYourProvider: promo.providerId === customer.providerId,
      providerName: promo.isRenoaPromo ? 'Renoa' : promo.provider?.businessName || 'Provider',
    }));

    return NextResponse.json({ promotions: promotionsWithSavings });
  } catch (error) {
    console.error('Error fetching promotions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch promotions' },
      { status: 500 }
    );
  }
}
