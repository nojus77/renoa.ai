import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';

const prisma = new PrismaClient();

// GET - Fetch customer's active promotions
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

    // Get all promotions for this customer
    const promotions = await prisma.customerPromotion.findMany({
      where: { customerId },
      orderBy: [
        { status: 'asc' }, // active first
        { createdAt: 'desc' }
      ]
    });

    // Separate active and inactive
    const now = new Date();
    const activePromotions = promotions.filter(
      p => p.status === 'active' && p.expiresAt > now
    );
    const expiredPromotions = promotions.filter(
      p => p.status === 'expired' || (p.status === 'active' && p.expiresAt <= now)
    );
    const usedPromotions = promotions.filter(
      p => p.status === 'used'
    );

    // Auto-expire promotions that have passed their expiration
    for (const promo of promotions) {
      if (promo.status === 'active' && promo.expiresAt <= now) {
        await prisma.customerPromotion.update({
          where: { id: promo.id },
          data: { status: 'expired' }
        });
      }
    }

    // Get best active promotion (highest value)
    const bestPromo = activePromotions.length > 0
      ? activePromotions.reduce((best, current) => {
          const bestValue = best.discountPercent
            ? Number(best.discountPercent)
            : best.discountAmount
            ? Number(best.discountAmount)
            : 0;
          const currentValue = current.discountPercent
            ? Number(current.discountPercent)
            : current.discountAmount
            ? Number(current.discountAmount)
            : 0;
          return currentValue > bestValue ? current : best;
        })
      : null;

    return NextResponse.json({
      active: activePromotions,
      expired: expiredPromotions,
      used: usedPromotions,
      bestPromo
    });
  } catch (error) {
    console.error('Error fetching promotions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch promotions' },
      { status: 500 }
    );
  }
}
