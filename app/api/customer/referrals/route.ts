import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';
import { generateReferralCode } from '@/lib/referrals/generateReferralCode';

const prisma = new PrismaClient();

// GET - Fetch customer's referral data and stats
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
    const existingCode = await prisma.referral.findFirst({
      where: { referrerId: customerId },
      select: { referralCode: true }
    });

    if (existingCode) {
      referralCode = existingCode.referralCode;
    } else {
      referralCode = await generateReferralCode(customer.name);
    }

    // Get all referrals made by this customer
    const referrals = await prisma.referral.findMany({
      where: { referrerId: customerId },
      include: {
        referredCustomer: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Get customer credits
    const credits = await prisma.customerCredit.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' }
    });

    // Calculate stats
    const totalEarned = credits
      .filter(c => c.source === 'referral')
      .reduce((sum, c) => sum + Number(c.amount), 0);

    const availableCredit = credits.reduce(
      (sum, c) => sum + (Number(c.amount) - Number(c.usedAmount)),
      0
    );

    const thisMonthReferrals = referrals.filter(r => {
      const createdDate = new Date(r.createdAt);
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
    const cookieStore = cookies();
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
    const existingCode = await prisma.referral.findFirst({
      where: { referrerId: customerId },
      select: { referralCode: true }
    });

    if (existingCode) {
      referralCode = existingCode.referralCode;
    } else {
      referralCode = await generateReferralCode(customer.name);
    }

    // Check if this person was already referred
    const existingReferral = await prisma.referral.findFirst({
      where: {
        referrerId: customerId,
        OR: [
          { referredEmail: referredEmail || '' },
          { referredPhone: referredPhone || '' }
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
    const referral = await prisma.referral.create({
      data: {
        referrerId: customerId,
        referredEmail: referredEmail || '',
        referredPhone: referredPhone || '',
        referralCode,
        status: 'pending'
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
