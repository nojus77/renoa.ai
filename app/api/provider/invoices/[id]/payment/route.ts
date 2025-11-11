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

    const invoice = await prisma.invoice.findUnique({
      where: { id: params.id },
    });

    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        invoiceId: params.id,
        amount,
        paymentDate: new Date(paymentDate),
        paymentMethod,
        transactionId,
        notes,
        recordedBy,
      },
    });

    // Calculate new amount paid
    const newAmountPaid = Number(invoice.amountPaid) + Number(amount);
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
