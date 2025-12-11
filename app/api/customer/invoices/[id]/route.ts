import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';

const prisma = new PrismaClient();

export async function GET(
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

    // Get invoice details
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        customerId, // Ensure customer owns this invoice
      },
      include: {
        provider: {
          select: {
            id: true,
            businessName: true,
            ownerName: true,
            phone: true,
            email: true,
          },
        },
        customer: {
          select: {
            name: true,
            email: true,
            phone: true,
            address: true,
          },
        },
        lineItems: {
          orderBy: { order: 'asc' },
        },
        payments: {
          orderBy: { paymentDate: 'desc' },
        },
        jobs: {
          select: {
            id: true,
            serviceType: true,
            status: true,
          },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    // Convert Decimal to number for JSON serialization
    const serializedInvoice = {
      ...invoice,
      subtotal: Number(invoice.subtotal),
      taxRate: invoice.taxRate ? Number(invoice.taxRate) : null,
      taxAmount: Number(invoice.taxAmount),
      discountValue: invoice.discountValue ? Number(invoice.discountValue) : null,
      discountAmount: Number(invoice.discountAmount),
      total: Number(invoice.total),
      amountPaid: Number(invoice.amountPaid),
      lineItems: invoice.lineItems.map(item => ({
        ...item,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        total: Number(item.total),
      })),
      payments: invoice.payments.map(payment => ({
        ...payment,
        amount: Number(payment.amount),
      })),
    };

    return NextResponse.json({ invoice: serializedInvoice });
  } catch (error) {
    console.error('Error fetching invoice:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invoice' },
      { status: 500 }
    );
  }
}
