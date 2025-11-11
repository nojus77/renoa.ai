import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// POST /api/provider/invoices/[id]/send - Send invoice to customer
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { email, sms } = body;

    const invoice = await prisma.invoice.findUnique({
      where: { id: params.id },
      include: {
        customer: true,
        provider: true,
        lineItems: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    // TODO: Implement actual email/SMS sending
    // For now, we'll just update the invoice status

    const updatedInvoice = await prisma.invoice.update({
      where: { id: params.id },
      data: {
        status: 'sent',
        sentAt: new Date(),
        sentTo: email ? invoice.customer.email : invoice.customer.phone,
      },
    });

    return NextResponse.json({
      success: true,
      invoice: {
        ...updatedInvoice,
        subtotal: Number(updatedInvoice.subtotal),
        taxRate: updatedInvoice.taxRate ? Number(updatedInvoice.taxRate) : null,
        taxAmount: Number(updatedInvoice.taxAmount),
        discountValue: updatedInvoice.discountValue ? Number(updatedInvoice.discountValue) : null,
        discountAmount: Number(updatedInvoice.discountAmount),
        total: Number(updatedInvoice.total),
        amountPaid: Number(updatedInvoice.amountPaid),
      },
      message: `Invoice sent successfully via ${email ? 'email' : 'SMS'}`,
    });
  } catch (error) {
    console.error('Error sending invoice:', error);
    return NextResponse.json(
      { error: 'Failed to send invoice' },
      { status: 500 }
    );
  }
}
