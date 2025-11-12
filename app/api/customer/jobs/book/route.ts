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
      promoCode,
    } = body;

    if (!serviceType || !address || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    let appliedPromo = null;
    let discountAmount = 0;

    // If promo code provided, validate and apply it
    if (promoCode) {
      const promotion = await prisma.customerPromotion.findFirst({
        where: {
          customerId,
          promoCode,
          status: 'active',
          expiresAt: { gt: new Date() },
        },
      });

      if (!promotion) {
        return NextResponse.json(
          { error: 'Invalid or expired promo code' },
          { status: 400 }
        );
      }

      // Calculate discount
      if (promotion.discountPercent) {
        discountAmount = (estimatedValue * Number(promotion.discountPercent)) / 100;
      } else if (promotion.discountAmount) {
        discountAmount = Number(promotion.discountAmount);
      }

      // Mark promotion as used
      await prisma.customerPromotion.update({
        where: { id: promotion.id },
        data: {
          status: 'used',
          usedAt: new Date(),
        },
      });

      appliedPromo = promotion;
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

    return NextResponse.json({
      job,
      appliedPromo: appliedPromo
        ? {
            code: appliedPromo.promoCode,
            discountAmount,
            finalPrice: Math.max(0, estimatedValue - discountAmount),
          }
        : null,
    }, { status: 201 });
  } catch (error) {
    console.error('Error booking job:', error);
    return NextResponse.json(
      { error: 'Failed to book service' },
      { status: 500 }
    );
  }
}
