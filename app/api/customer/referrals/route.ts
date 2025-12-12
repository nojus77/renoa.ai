import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';
import { generateReferralCode } from '@/lib/referrals/generateReferralCode';
import crypto from 'crypto';

const prisma = new PrismaClient();

// GET - Fetch customer's referral data and stats
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

    // Get customer info
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: { name: true }
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Get or generate referral code
    let referralCode = '';
    const existingCode = await prisma.referrals.findFirst({
      where: { referrer_id: customerId },
      select: { referral_code: true }
    });

    if (existingCode) {
      referralCode = existingCode.referral_code;
    } else {
      referralCode = await generateReferralCode(customer.name);
    }

    // Get all referrals made by this customer
    const referrals = await prisma.referrals.findMany({
      where: { referrer_id: customerId },
      include: {
        customers_referrals_referred_customer_idTocustomers: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    // Get customer credits
    const credits = await prisma.customer_credits.findMany({
      where: { customer_id: customerId },
      orderBy: { created_at: 'desc' }
    });

    // Calculate stats
    const totalEarned = credits
      .filter(c => c.source === 'referral')
      .reduce((sum, c) => sum + Number(c.amount), 0);

    const availableCredit = credits.reduce(
      (sum, c) => sum + (Number(c.amount) - Number(c.used_amount)),
      0
    );

    const thisMonthReferrals = referrals.filter(r => {
      const createdDate = new Date(r.created_at);
      const now = new Date();
      return (
        createdDate.getMonth() === now.getMonth() &&
        createdDate.getFullYear() === now.getFullYear()
      );
    }).length;

    return NextResponse.json({
      referralCode,
      referrals,
      credits,
      stats: {
        totalEarned,
        availableCredit,
        thisMonthReferrals,
        totalReferrals: referrals.length,
        successfulReferrals: referrals.filter(r => r.status === 'credited').length
      }
    });
  } catch (error) {
    console.error('Error fetching referral data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch referral data' },
      { status: 500 }
    );
  }
}

// POST - Create a new referral
export async function POST(request: NextRequest) {
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
    const body = await request.json();
    const { referredEmail, referredPhone } = body;

    if (!referredEmail && !referredPhone) {
      return NextResponse.json(
        { error: 'Email or phone is required' },
        { status: 400 }
      );
    }

    // Get customer info for code generation
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: { name: true }
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Generate or get existing referral code
    let referralCode = '';
    const existingCode = await prisma.referrals.findFirst({
      where: { referrer_id: customerId },
      select: { referral_code: true }
    });

    if (existingCode) {
      referralCode = existingCode.referral_code;
    } else {
      referralCode = await generateReferralCode(customer.name);
    }

    // Check if this person was already referred
    const existingReferral = await prisma.referrals.findFirst({
      where: {
        referrer_id: customerId,
        OR: [
          { referred_email: referredEmail || '' },
          { referred_phone: referredPhone || '' }
        ]
      }
    });

    if (existingReferral) {
      return NextResponse.json(
        { error: 'You have already referred this person' },
        { status: 400 }
      );
    }

    // Create referral
    const referral = await prisma.referrals.create({
      data: {
        id: crypto.randomUUID(),
        referrer_id: customerId,
        referred_email: referredEmail || '',
        referred_phone: referredPhone || '',
        referral_code: referralCode,
        status: 'pending',
        updated_at: new Date(),
      }
    });

    return NextResponse.json({ referral }, { status: 201 });
  } catch (error) {
    console.error('Error creating referral:', error);
    return NextResponse.json(
      { error: 'Failed to create referral' },
      { status: 500 }
    );
  }
}
