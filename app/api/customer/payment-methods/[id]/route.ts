import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { stripe } from '@/lib/stripe-server';
import { getCustomerSession } from '@/lib/auth-helpers';

const prisma = new PrismaClient();

// DELETE - Remove a payment method
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getCustomerSession();

    if (!session?.customerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const paymentMethodId = params.id;

    // Find customer
    const customer = await prisma.customer.findUnique({
      where: { id: session.customerId },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Find payment method
    const paymentMethod = await prisma.customerPaymentMethod.findUnique({
      where: { id: paymentMethodId },
    });

    if (!paymentMethod) {
      return NextResponse.json({ error: 'Payment method not found' }, { status: 404 });
    }

    // Verify ownership
    if (paymentMethod.customerId !== customer.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Detach from Stripe
    try {
      await stripe.paymentMethods.detach(paymentMethod.stripePaymentMethodId);
    } catch (stripeError: any) {
      console.error('Error detaching payment method from Stripe:', stripeError);
      // Continue with database deletion even if Stripe detach fails
    }

    // Delete from database
    await prisma.customerPaymentMethod.delete({
      where: { id: paymentMethodId },
    });

    return NextResponse.json({ success: true, message: 'Payment method removed' });
  } catch (error: any) {
    console.error('Error deleting payment method:', error);
    return NextResponse.json(
      { error: 'Failed to delete payment method', details: error.message },
      { status: 500 }
    );
  }
}
