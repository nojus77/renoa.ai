import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';

const prisma = new PrismaClient();

// GET - Fetch customer's credit balance
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

    // Get all customer credits
    const credits = await prisma.customerCredit.findMany({
      where: {
        customerId,
        // Only include credits that haven't expired
        OR: [
          { expiresAt: null },
          { expiresAt: { gte: new Date() } }
        ]
      },
      orderBy: { createdAt: 'asc' } // Oldest first for FIFO usage
    });

    // Calculate available balance
    const totalAvailable = credits.reduce(
      (sum, credit) => sum + (Number(credit.amount) - Number(credit.usedAmount)),
      0
    );

    return NextResponse.json({
      credits,
      totalAvailable
    });
  } catch (error) {
    console.error('Error fetching credits:', error);
    return NextResponse.json(
      { error: 'Failed to fetch credits' },
      { status: 500 }
    );
  }
}

// POST - Apply credits to an invoice/payment
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
    const { amount: requestedAmount } = body;

    if (!requestedAmount || requestedAmount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      );
    }

    // Get available credits (FIFO - oldest first)
    const credits = await prisma.customerCredit.findMany({
      where: {
        customerId,
        OR: [
          { expiresAt: null },
          { expiresAt: { gte: new Date() } }
        ]
      },
      orderBy: { createdAt: 'asc' }
    });

    let remainingAmount = requestedAmount;
    const updatedCredits = [];

    // Apply credits in FIFO order
    for (const credit of credits) {
      const available = Number(credit.amount) - Number(credit.usedAmount);

      if (available <= 0 || remainingAmount <= 0) continue;

      const toUse = Math.min(available, remainingAmount);

      // Update credit
      const updated = await prisma.customerCredit.update({
        where: { id: credit.id },
        data: {
          usedAmount: {
            increment: toUse
          }
        }
      });

      updatedCredits.push(updated);
      remainingAmount -= toUse;

      if (remainingAmount <= 0) break;
    }

    const appliedAmount = requestedAmount - remainingAmount;

    return NextResponse.json({
      appliedAmount,
      remainingAmount,
      updatedCredits
    });
  } catch (error) {
    console.error('Error applying credits:', error);
    return NextResponse.json(
      { error: 'Failed to apply credits' },
      { status: 500 }
    );
  }
}
