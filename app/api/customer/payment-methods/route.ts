import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { stripe } from '@/lib/stripe-server';
import { getCustomerSession } from '@/lib/auth-helpers';

const prisma = new PrismaClient();

// GET - Fetch all payment methods for the customer
export async function GET(request: NextRequest) {
  try {
    const session = await getCustomerSession();

    if (!session?.customerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find customer
    const customer = await prisma.customer.findUnique({
      where: { id: session.customerId },
      include: {
        paymentMethods: {
          orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
        },
      },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    return NextResponse.json({ paymentMethods: customer.paymentMethods });
  } catch (error: any) {
    console.error('Error fetching payment methods:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment methods', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Save a new payment method
export async function POST(request: NextRequest) {
  try {
    const session = await getCustomerSession();

    if (!session?.customerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { paymentMethodId, setAsDefault = false } = body;

    if (!paymentMethodId) {
      return NextResponse.json({ error: 'Payment method ID is required' }, { status: 400 });
    }

    // Find customer
    const customer = await prisma.customer.findUnique({
      where: { id: session.customerId },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Retrieve payment method details from Stripe
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);

    if (!paymentMethod.card) {
      return NextResponse.json({ error: 'Invalid payment method type' }, { status: 400 });
    }

    // If setting as default, unset all existing defaults
    if (setAsDefault) {
      await prisma.customerPaymentMethod.updateMany({
        where: { customerId: customer.id },
        data: { isDefault: false },
      });
    }

    // Save payment method to database
    const savedPaymentMethod = await prisma.customerPaymentMethod.create({
      data: {
        customerId: customer.id,
        stripePaymentMethodId: paymentMethod.id,
        cardBrand: paymentMethod.card.brand,
        cardLast4: paymentMethod.card.last4,
        expiryMonth: paymentMethod.card.exp_month,
        expiryYear: paymentMethod.card.exp_year,
        isDefault: setAsDefault,
      },
    });

    return NextResponse.json({ paymentMethod: savedPaymentMethod }, { status: 201 });
  } catch (error: any) {
    console.error('Error saving payment method:', error);
    return NextResponse.json(
      { error: 'Failed to save payment method', details: error.message },
      { status: 500 }
    );
  }
}
