import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';

const prisma = new PrismaClient();

// GET - Fetch customer's active promotions
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('customer-session');

    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { customerId } = JSON.parse(session.value);

    // Get all promotions for this customer
    const promotions = await prisma.customer_promotions.findMany({
      where: { customer_id: customerId },
      orderBy: [
        { status: 'asc' }, // active first
        { created_at: 'desc' }
      ]
    });

    // Separate active and inactive
    const now = new Date();
    const activePromotions = promotions.filter(
      p => p.status === 'active' && p.expires_at > now
    );
    const expiredPromotions = promotions.filter(
      p => p.status === 'expired' || (p.status === 'active' && p.expires_at <= now)
    );
    const usedPromotions = promotions.filter(
      p => p.status === 'used'
    );

    // Auto-expire promotions that have passed their expiration
    for (const promo of promotions) {
      if (promo.status === 'active' && promo.expires_at <= now) {
        await prisma.customer_promotions.update({
          where: { id: promo.id },
          data: { status: 'expired' }
        });
      }
    }

    // Get best active promotion (highest value)
    const bestPromo = activePromotions.length > 0
      ? activePromotions.reduce((best, current) => {
          const bestValue = best.discount_percent
            ? Number(best.discount_percent)
            : best.discount_amount
            ? Number(best.discount_amount)
            : 0;
          const currentValue = current.discount_percent
            ? Number(current.discount_percent)
            : current.discount_amount
            ? Number(current.discount_amount)
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
