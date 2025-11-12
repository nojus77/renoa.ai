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
    const referral = await prisma.referral.findFirst({
      where: { referralCode: code },
      include: {
        referrer: {
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
      referrerName: referral.referrer.name,
      code: referral.referralCode,
      creditAmount: referral.creditAmount
    });
  } catch (error) {
    console.error('Error fetching referral code:', error);
    return NextResponse.json(
      { error: 'Failed to fetch referral code' },
      { status: 500 }
    );
  }
}
