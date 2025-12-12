import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { stripe } from '@/lib/stripe-server';
import { getCustomerSession } from '@/lib/auth-helpers';
import crypto from 'crypto';

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
        customer_payment_methods: {
          orderBy: [{ is_default: 'desc' }, { created_at: 'desc' }],
        },
      },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    return NextResponse.json({ paymentMethods: customer.customer_payment_methods });
  } catch (error: unknown) {
    console.error('Error fetching payment methods:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment methods', details: error instanceof Error ? error.message : 'Unknown error' },
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
      await prisma.customer_payment_methods.updateMany({
        where: { customer_id: customer.id },
        data: { is_default: false },
      });
    }

    // Save payment method to database
    const savedPaymentMethod = await prisma.customer_payment_methods.create({
      data: {
        id: crypto.randomUUID(),
        customer_id: customer.id,
        stripe_payment_method_id: paymentMethod.id,
        card_brand: paymentMethod.card.brand,
        card_last4: paymentMethod.card.last4,
        expiry_month: paymentMethod.card.exp_month,
        expiry_year: paymentMethod.card.exp_year,
        is_default: setAsDefault,
        updated_at: new Date(),
      },
    });

    return NextResponse.json({ paymentMethod: savedPaymentMethod }, { status: 201 });
  } catch (error: unknown) {
    console.error('Error saving payment method:', error);
    return NextResponse.json(
      { error: 'Failed to save payment method', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
