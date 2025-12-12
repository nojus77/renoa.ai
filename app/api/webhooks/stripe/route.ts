import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe-server';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';
import { sendNotification } from '@/lib/notifications/notification-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      console.error('No Stripe signature found in headers');
      return NextResponse.json(
        { error: 'No signature provided' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return NextResponse.json(
        { error: `Webhook Error: ${err.message}` },
        { status: 400 }
      );
    }

    console.log('Stripe webhook event received:', event.type, event.id);

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  try {
    console.log('=== Processing payment_intent.succeeded ===');
    console.log('Payment Intent ID:', paymentIntent.id);
    console.log('Payment Intent Amount:', paymentIntent.amount);
    console.log('Payment Intent Metadata:', JSON.stringify(paymentIntent.metadata));

    const invoiceId = paymentIntent.metadata.invoiceId;

    if (!invoiceId) {
      console.error('❌ No invoiceId found in payment intent metadata');
      return;
    }

    console.log('Looking up invoice with ID:', invoiceId);

    // Get invoice with related data
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        customer: true,
        provider: true,
        payments: true,
      },
    });

    if (!invoice) {
      console.error('❌ Invoice not found:', invoiceId);
      return;
    }

    console.log('✓ Invoice found:', {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      status: invoice.status,
      total: invoice.total,
      amountPaid: invoice.amountPaid,
      stripePaymentIntentId: invoice.stripePaymentIntentId,
    });

    // Convert amount from cents to dollars
    const paymentAmount = paymentIntent.amount / 100;
    console.log('Payment amount (converted from cents):', paymentAmount);

    // Create payment record
    console.log('Creating payment record...');
    const payment = await prisma.payment.create({
      data: {
        invoiceId: invoice.id,
        amount: paymentAmount,
        paymentMethod: 'credit_card', // Stripe card payment (using enum value)
        transactionId: paymentIntent.id,
        paymentDate: new Date(),
        notes: `Stripe payment: ${paymentIntent.id}`,
      },
    });

    console.log('✓ Payment record created:', payment.id);

    // Calculate new amount paid and remaining balance
    const newAmountPaid = Number(invoice.amountPaid) + paymentAmount;
    const remainingBalance = Number(invoice.total) - newAmountPaid;

    console.log('Calculating new amounts:', {
      previousAmountPaid: invoice.amountPaid,
      paymentAmount,
      newAmountPaid,
      invoiceTotal: invoice.total,
      remainingBalance,
    });

    // Determine new invoice status
    let newStatus: 'sent' | 'partial' | 'paid' = invoice.status === 'draft' ? 'sent' : (invoice.status as 'sent' | 'partial' | 'paid');
    let paidDate: Date | null = invoice.paidDate;

    if (remainingBalance <= 0.01) {
      // Fully paid (accounting for floating point rounding)
      newStatus = 'paid';
      paidDate = new Date();
      console.log('Invoice will be marked as PAID (remainingBalance <= 0.01)');
    } else if (newAmountPaid > 0) {
      // Partially paid
      newStatus = 'partial';
      console.log('Invoice will be marked as PARTIAL (remainingBalance > 0.01)');
    }

    // Update invoice
    console.log('Updating invoice...');
    const updatedInvoice = await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        amountPaid: newAmountPaid,
        status: newStatus,
        paidDate: paidDate,
        lastPaymentError: null, // Clear any previous errors
        updatedAt: new Date(),
      },
    });

    console.log(`✓ Invoice ${invoice.invoiceNumber} updated to status: ${newStatus}`);
    console.log('Updated invoice data:', {
      id: updatedInvoice.id,
      status: updatedInvoice.status,
      amountPaid: updatedInvoice.amountPaid,
      paidDate: updatedInvoice.paidDate,
    });

    // Send confirmation email to customer
    try {
      await sendNotification(
        'payment_received',
        {
          customerName: invoice.customer.name,
          customerEmail: invoice.customer.email || '',
          customerPhone: invoice.customer.phone || '',
          providerName: invoice.provider.businessName,
          providerCompany: invoice.provider.businessName,
          serviceType: 'service',
          amount: paymentAmount,
          invoiceLink: `${process.env.NEXT_PUBLIC_APP_URL}/customer-portal/invoices/${invoice.id}`,
          ratingLink: `${process.env.NEXT_PUBLIC_APP_URL}/customer-portal/invoices/${invoice.id}/rate`,
        },
        {
          sendSMS: false, // Only send email for payments
          sendEmail: true,
        }
      );
      console.log('Payment confirmation email sent to customer');
    } catch (emailError) {
      console.error('Failed to send customer confirmation email:', emailError);
      // Don't throw - payment was successful even if email fails
    }

  } catch (error) {
    console.error('Error handling payment succeeded:', error);
    throw error;
  }
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  try {
    console.log('Processing payment_intent.payment_failed:', paymentIntent.id);

    const invoiceId = paymentIntent.metadata.invoiceId;

    if (!invoiceId) {
      console.error('No invoiceId found in payment intent metadata');
      return;
    }

    // Get invoice
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        customer: true,
        provider: true,
      },
    });

    if (!invoice) {
      console.error('Invoice not found:', invoiceId);
      return;
    }

    // Extract error message
    const errorMessage = paymentIntent.last_payment_error?.message || 'Payment failed';

    // Update invoice with error
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        lastPaymentError: errorMessage,
        updatedAt: new Date(),
      },
    });

    console.log(`Invoice ${invoice.invoiceNumber} payment failed: ${errorMessage}`);

    // Send failure notification to customer
    try {
      await sendNotification(
        'payment_failed',
        {
          customerName: invoice.customer.name,
          customerEmail: invoice.customer.email || '',
          customerPhone: invoice.customer.phone || '',
          providerName: invoice.provider.businessName,
          providerCompany: invoice.provider.businessName,
          serviceType: 'service',
          amount: Number(invoice.total), // Send the invoice total
          invoiceLink: `${process.env.NEXT_PUBLIC_APP_URL}/customer-portal/invoices/${invoice.id}`,
        },
        {
          sendSMS: false, // Only send email for failures
          sendEmail: true,
        }
      );
      console.log('Payment failure email sent to customer');
    } catch (emailError) {
      console.error('Failed to send payment failure email:', emailError);
      // Don't throw - we still want to log the failure
    }

  } catch (error) {
    console.error('Error handling payment failed:', error);
    throw error;
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  try {
    console.log('Processing customer.subscription.updated:', subscription.id);

    const providerId = subscription.metadata.providerId;

    if (!providerId) {
      console.error('No providerId found in subscription metadata');
      return;
    }

    // Update provider subscription data
    await prisma.provider.update({
      where: { id: providerId },
      data: {
        stripeSubscriptionId: subscription.id,
        subscriptionStatus: subscription.status,
        currentPeriodEnd: new Date((subscription as unknown as { current_period_end: number }).current_period_end * 1000),
        activeSeats: subscription.items.data[0]?.quantity || 1,
      },
    });

    console.log(`Provider ${providerId} subscription updated to status: ${subscription.status}`);
  } catch (error) {
    console.error('Error handling subscription updated:', error);
    throw error;
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  try {
    console.log('Processing customer.subscription.deleted:', subscription.id);

    const providerId = subscription.metadata.providerId;

    if (!providerId) {
      console.error('No providerId found in subscription metadata');
      return;
    }

    // Mark subscription as cancelled
    await prisma.provider.update({
      where: { id: providerId },
      data: {
        subscriptionStatus: 'cancelled',
      },
    });

    console.log(`Provider ${providerId} subscription cancelled`);

    // TODO: Optionally send notification to provider owner
  } catch (error) {
    console.error('Error handling subscription deleted:', error);
    throw error;
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  try {
    console.log('Processing invoice.payment_succeeded:', invoice.id);

    // This is for subscription invoices, not customer job invoices
    const stripeInvoice = invoice as unknown as { subscription?: string | null; subscription_details?: { metadata?: { providerId?: string } } };
    if (stripeInvoice.subscription) {
      const providerId = stripeInvoice.subscription_details?.metadata?.providerId;

      if (providerId) {
        console.log(`Subscription invoice paid for provider: ${providerId}`);
        // Update any necessary records
      }
    }
  } catch (error) {
    console.error('Error handling invoice payment succeeded:', error);
    throw error;
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  try {
    console.log('Processing invoice.payment_failed:', invoice.id);

    // This is for subscription invoices
    const stripeInvoice = invoice as unknown as { subscription?: string | null };
    if (stripeInvoice.subscription) {
      const subscription = await stripe.subscriptions.retrieve(stripeInvoice.subscription as string);
      const providerId = subscription.metadata.providerId;

      if (providerId) {
        // Mark subscription as past_due
        await prisma.provider.update({
          where: { id: providerId },
          data: {
            subscriptionStatus: 'past_due',
          },
        });

        console.log(`Provider ${providerId} subscription marked as past_due`);

        // TODO: Send notification to provider owner about failed payment
      }
    }
  } catch (error) {
    console.error('Error handling invoice payment failed:', error);
    throw error;
  }
}
