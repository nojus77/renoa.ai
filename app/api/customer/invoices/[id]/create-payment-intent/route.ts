import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe-server';
import { cookies } from 'next/headers';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: invoiceId } = await params;

    // Get customer session
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('customer-session');

    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie.value);
    const customerId = session.customerId;

    const body = await request.json();
    const { paymentMethodId } = body;

    // Get invoice with customer and provider details
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        customer: true,
        provider: true,
        payments: true,
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    // Verify the customer owns this invoice
    if (invoice.customerId !== customerId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Check if invoice is already paid
    if (invoice.status === 'paid') {
      return NextResponse.json(
        { error: 'Invoice is already paid' },
        { status: 400 }
      );
    }

    // Calculate remaining balance
    const remainingBalance = Number(invoice.total) - Number(invoice.amountPaid);

    if (remainingBalance <= 0) {
      return NextResponse.json(
        { error: 'No balance remaining on this invoice' },
        { status: 400 }
      );
    }

    // Convert to cents for Stripe
    const amountInCents = Math.round(remainingBalance * 100);

    // Check if payment intent already exists for this invoice
    if (invoice.stripePaymentIntentId) {
      try {
        // Retrieve existing payment intent
        const existingIntent = await stripe.paymentIntents.retrieve(
          invoice.stripePaymentIntentId
        );

        // If it's still requires_payment_method or requires_confirmation, we can reuse it
        if (
          existingIntent.status === 'requires_payment_method' ||
          existingIntent.status === 'requires_confirmation'
        ) {
          // Update amount if it changed
          if (existingIntent.amount !== amountInCents) {
            const updatedIntent = await stripe.paymentIntents.update(
              invoice.stripePaymentIntentId,
              {
                amount: amountInCents,
                payment_method: paymentMethodId || undefined,
              }
            );

            return NextResponse.json({
              clientSecret: updatedIntent.client_secret,
              paymentIntentId: updatedIntent.id,
              amount: remainingBalance,
            });
          }

          return NextResponse.json({
            clientSecret: existingIntent.client_secret,
            paymentIntentId: existingIntent.id,
            amount: remainingBalance,
          });
        }
      } catch (error) {
        console.error('Error retrieving existing payment intent:', error);
        // Continue to create a new one
      }
    }

    // Create new payment intent
    const paymentIntentData: any = {
      amount: amountInCents,
      currency: 'usd',
      metadata: {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        customerId: invoice.customerId,
        providerId: invoice.providerId,
        customerName: invoice.customer.name,
        providerName: invoice.provider.businessName,
      },
      description: `Invoice ${invoice.invoiceNumber} - ${invoice.provider.businessName}`,
    };

    // If payment method ID is provided, attach it
    if (paymentMethodId) {
      paymentIntentData.payment_method = paymentMethodId;
      paymentIntentData.confirm = false; // Will be confirmed client-side
    }

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentData);

    // Store payment intent ID in invoice
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        stripePaymentIntentId: paymentIntent.id,
        lastPaymentError: null, // Clear any previous errors
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: remainingBalance,
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}
