import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';

const prisma = new PrismaClient();

// POST - Process payment for an invoice
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get customer session
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('customer-session');

    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie.value);
    const customerId = session.customerId;
    const invoiceId = params.id;

    const body = await request.json();
    const { amount, paymentMethod = 'online' } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Valid payment amount required' },
        { status: 400 }
      );
    }

    // Get invoice and verify ownership
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        customerId,
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    // Calculate remaining balance
    const remainingBalance = Number(invoice.total) - Number(invoice.amountPaid);

    if (amount > remainingBalance) {
      return NextResponse.json(
        { error: 'Payment amount exceeds balance' },
        { status: 400 }
      );
    }

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        invoiceId,
        amount,
        paymentDate: new Date(),
        paymentMethod,
        notes: 'Customer portal payment',
      },
    });

    // Update invoice
    const newAmountPaid = Number(invoice.amountPaid) + amount;
    const newBalance = Number(invoice.total) - newAmountPaid;

    let newStatus = invoice.status;
    if (newBalance === 0) {
      newStatus = 'paid';
    } else if (newAmountPaid > 0 && newBalance > 0) {
      newStatus = 'partial';
    }

    const updatedInvoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        amountPaid: newAmountPaid,
        status: newStatus,
        ...(newStatus === 'paid' && { paidDate: new Date() }),
      },
    });

    return NextResponse.json({
      success: true,
      payment: {
        ...payment,
        amount: Number(payment.amount),
      },
      invoice: {
        ...updatedInvoice,
        amountPaid: Number(updatedInvoice.amountPaid),
        total: Number(updatedInvoice.total),
      },
    });
  } catch (error) {
    console.error('Error processing payment:', error);
    return NextResponse.json(
      { error: 'Failed to process payment' },
      { status: 500 }
    );
  }
}
