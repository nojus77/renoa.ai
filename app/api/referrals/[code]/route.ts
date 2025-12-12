import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Fetch referral code info (public endpoint)
export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const { code } = params;

    // Find any referral with this code
    const referral = await prisma.referrals.findFirst({
      where: { referral_code: code },
      include: {
        customers_referrals_referrer_idTocustomers: {
          select: {
            name: true
          }
        }
      }
    });

    if (!referral) {
      return NextResponse.json(
        { error: 'Invalid referral code' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      referrerName: referral.customers_referrals_referrer_idTocustomers.name,
      code: referral.referral_code,
      creditAmount: Number(referral.credit_amount)
    });
  } catch (error) {
    console.error('Error fetching referral code:', error);
    return NextResponse.json(
      { error: 'Failed to fetch referral code' },
      { status: 500 }
    );
  }
}
