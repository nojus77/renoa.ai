import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getCustomerSession } from '@/lib/auth-helpers';

const prisma = new PrismaClient();

// PATCH - Set a payment method as default
export async function PATCH(
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
    const paymentMethod = await prisma.customer_payment_methods.findUnique({
      where: { id: paymentMethodId },
    });

    if (!paymentMethod) {
      return NextResponse.json({ error: 'Payment method not found' }, { status: 404 });
    }

    // Verify ownership
    if (paymentMethod.customer_id !== customer.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Unset all existing defaults for this customer
    await prisma.customer_payment_methods.updateMany({
      where: { customer_id: customer.id },
      data: { is_default: false },
    });

    // Set this payment method as default
    const updatedPaymentMethod = await prisma.customer_payment_methods.update({
      where: { id: paymentMethodId },
      data: { is_default: true },
    });

    return NextResponse.json({
      success: true,
      paymentMethod: updatedPaymentMethod,
    });
  } catch (error: unknown) {
    console.error('Error setting default payment method:', error);
    return NextResponse.json(
      { error: 'Failed to set default payment method', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
