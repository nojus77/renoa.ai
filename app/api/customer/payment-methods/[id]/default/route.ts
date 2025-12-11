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

    // Unset all existing defaults for this customer
    await prisma.customerPaymentMethod.updateMany({
      where: { customerId: customer.id },
      data: { isDefault: false },
    });

    // Set this payment method as default
    const updatedPaymentMethod = await prisma.customerPaymentMethod.update({
      where: { id: paymentMethodId },
      data: { isDefault: true },
    });

    return NextResponse.json({
      success: true,
      paymentMethod: updatedPaymentMethod,
    });
  } catch (error: any) {
    console.error('Error setting default payment method:', error);
    return NextResponse.json(
      { error: 'Failed to set default payment method', details: error.message },
      { status: 500 }
    );
  }
}
