import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe-server';
import { cookies } from 'next/headers';

// POST - Process payment for an invoice with Stripe
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
    const { paymentMethodId, paymentIntentId } = body;

    // Get invoice with customer details
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        customerId,
      },
      include: {
        customer: true,
        provider: true,
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    // Check if already paid
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
        { error: 'No balance remaining' },
        { status: 400 }
      );
    }

    // Check if customer has saved payment methods
    if (!paymentMethodId && !paymentIntentId) {
      // Return indication that payment method is needed
      return NextResponse.json({
        requiresPaymentMethod: true,
        amount: remainingBalance,
        message: 'Please provide a payment method',
      });
    }

    let paymentIntent;

    if (paymentIntentId) {
      // Confirm existing payment intent
      try {
        paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId);
      } catch (error: any) {
        console.error('Error confirming payment intent:', error);

        // Store error in invoice
        await prisma.invoice.update({
          where: { id: invoiceId },
          data: {
            lastPaymentError: error.message || 'Payment confirmation failed',
          },
        });

        return NextResponse.json(
          { error: error.message || 'Payment confirmation failed' },
          { status: 400 }
        );
      }
    } else if (paymentMethodId) {
      // Create and confirm payment intent with saved payment method
      const amountInCents = Math.round(remainingBalance * 100);

      try {
        paymentIntent = await stripe.paymentIntents.create({
          amount: amountInCents,
          currency: 'usd',
          payment_method: paymentMethodId,
          confirm: true,
          metadata: {
            invoiceId: invoice.id,
            invoiceNumber: invoice.invoiceNumber,
            customerId: invoice.customerId,
            providerId: invoice.providerId,
            customerName: invoice.customer.name,
            providerName: invoice.provider.businessName,
          },
          description: `Invoice ${invoice.invoiceNumber} - ${invoice.provider.businessName}`,
          return_url: `${process.env.NEXT_PUBLIC_APP_URL}/customer-portal/invoices/${invoiceId}`,
        });

        // Store payment intent ID
        await prisma.invoice.update({
          where: { id: invoiceId },
          data: {
            stripePaymentIntentId: paymentIntent.id,
            lastPaymentError: null,
          },
        });
      } catch (error: any) {
        console.error('Error creating payment intent:', error);

        await prisma.invoice.update({
          where: { id: invoiceId },
          data: {
            lastPaymentError: error.message || 'Payment failed',
          },
        });

        return NextResponse.json(
          { error: error.message || 'Payment failed' },
          { status: 400 }
        );
      }
    }

    // Check payment intent status
    if (paymentIntent?.status === 'succeeded') {
      // Payment succeeded immediately (for saved cards)
      // Note: The webhook will handle the payment record creation
      // But we can return success here
      return NextResponse.json({
        success: true,
        status: 'succeeded',
        message: 'Payment successful',
      });
    } else if (paymentIntent?.status === 'requires_action') {
      // 3D Secure or other authentication required
      return NextResponse.json({
        requiresAction: true,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      });
    } else if (paymentIntent?.status === 'processing') {
      // Payment is processing
      return NextResponse.json({
        success: true,
        status: 'processing',
        message: 'Payment is being processed',
      });
    } else {
      // Unexpected status
      return NextResponse.json(
        { error: `Unexpected payment status: ${paymentIntent?.status}` },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error processing payment:', error);
    return NextResponse.json(
      { error: 'Failed to process payment' },
      { status: 500 }
    );
  }
}
