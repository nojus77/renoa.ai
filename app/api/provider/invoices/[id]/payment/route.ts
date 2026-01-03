import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// POST /api/provider/invoices/[id]/payment - Record payment
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { amount, paymentDate, paymentMethod, transactionId, notes, recordedBy } = body;

    if (!amount || !paymentDate || !paymentMethod) {
      return NextResponse.json(
        { error: 'Missing required payment fields' },
        { status: 400 }
      );
    }

    // Validate payment amount is a positive number
    const paymentAmount = Number(amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      return NextResponse.json(
        { error: 'Payment amount must be a positive number' },
        { status: 400 }
      );
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: params.id },
    });

    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    // Validate payment doesn't exceed remaining balance
    const remainingBalance = Number(invoice.total) - Number(invoice.amountPaid);
    if (paymentAmount > remainingBalance + 0.01) { // Allow small tolerance for rounding
      return NextResponse.json(
        { error: 'Payment amount cannot exceed invoice remaining balance' },
        { status: 400 }
      );
    }

    // Create payment record (use validated amount)
    const payment = await prisma.payment.create({
      data: {
        invoiceId: params.id,
        amount: paymentAmount,
        paymentDate: new Date(paymentDate),
        paymentMethod,
        transactionId,
        notes,
        recordedBy,
      },
    });

    // Calculate new amount paid (use validated paymentAmount)
    const newAmountPaid = Number(invoice.amountPaid) + paymentAmount;
    const total = Number(invoice.total);

    // Determine new status
    let newStatus = invoice.status;
    let paidDate = invoice.paidDate;

    if (newAmountPaid >= total) {
      newStatus = 'paid';
      paidDate = new Date(paymentDate);
    } else if (newAmountPaid > 0) {
      newStatus = 'partial';
    }

    // Update invoice
    const updatedInvoice = await prisma.invoice.update({
      where: { id: params.id },
      data: {
        amountPaid: newAmountPaid,
        status: newStatus,
        paidDate,
      },
      include: {
        customer: true,
        lineItems: {
          orderBy: { order: 'asc' },
        },
        payments: {
          orderBy: { paymentDate: 'desc' },
        },
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
        subtotal: Number(updatedInvoice.subtotal),
        taxRate: updatedInvoice.taxRate ? Number(updatedInvoice.taxRate) : null,
        taxAmount: Number(updatedInvoice.taxAmount),
        discountValue: updatedInvoice.discountValue ? Number(updatedInvoice.discountValue) : null,
        discountAmount: Number(updatedInvoice.discountAmount),
        total: Number(updatedInvoice.total),
        amountPaid: Number(updatedInvoice.amountPaid),
        lineItems: updatedInvoice.lineItems.map((item) => ({
          ...item,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          total: Number(item.total),
        })),
        payments: updatedInvoice.payments.map((p) => ({
          ...p,
          amount: Number(p.amount),
        })),
      },
    });
  } catch (error) {
    console.error('Error recording payment:', error);
    return NextResponse.json(
      { error: 'Failed to record payment' },
      { status: 500 }
    );
  }
}
