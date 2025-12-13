import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe-server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { amount, tipAmount } = await request.json();

    // Get job with customer info
    const job = await prisma.job.findUnique({
      where: { id },
      include: {
        customer: true,
        provider: true,
      },
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    if (!job.customer.phone && !job.customer.email) {
      return NextResponse.json(
        { error: 'Customer has no phone or email' },
        { status: 400 }
      );
    }

    const totalAmount = (amount || job.actualValue || job.estimatedValue || 0) + (tipAmount || 0);

    if (totalAmount <= 0) {
      return NextResponse.json(
        { error: 'Invalid payment amount' },
        { status: 400 }
      );
    }

    // Create Stripe Checkout Session for a payment link
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: job.customer.email || undefined,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: job.serviceType,
              description: `Service by ${job.provider.businessName}`,
            },
            unit_amount: Math.round(totalAmount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      metadata: {
        jobId: job.id,
        customerId: job.customerId,
        providerId: job.providerId,
        tipAmount: tipAmount?.toString() || '0',
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.renoa.com'}/customer/payment-success?job=${job.id}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.renoa.com'}/customer/payment-cancelled?job=${job.id}`,
    });

    // Update job with stripe session info
    await prisma.job.update({
      where: { id },
      data: {
        stripeSessionId: session.id,
        stripePaymentUrl: session.url,
        paymentStatus: 'pending',
      },
    });

    // Send SMS to customer (placeholder - uses console.log)
    const paymentUrl = session.url;
    if (job.customer.phone) {
      const message = `Hi ${job.customer.name}! Your total for ${job.serviceType} is $${totalAmount.toFixed(2)}. Pay securely here: ${paymentUrl}`;
      console.log('📱 SMS would be sent to:', job.customer.phone);
      console.log('Message:', message);
    }

    // Send email if available
    if (job.customer.email) {
      console.log('📧 Payment link email would be sent to:', job.customer.email);
    }

    return NextResponse.json({
      success: true,
      paymentUrl: session.url,
      sessionId: session.id,
      message: 'Payment link sent to customer',
    });
  } catch (error) {
    console.error('Error creating payment link:', error);
    return NextResponse.json(
      { error: 'Failed to create payment link' },
      { status: 500 }
    );
  }
}
