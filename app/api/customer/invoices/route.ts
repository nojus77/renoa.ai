import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Get customer session
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('customer-session');

    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie.value);
    const customerId = session.customerId;

    // Get all invoices for this customer
    const invoices = await prisma.invoice.findMany({
      where: {
        customerId,
      },
      include: {
        provider: {
          select: {
            businessName: true,
            phone: true,
            email: true,
          },
        },
        lineItems: {
          orderBy: { order: 'asc' },
        },
      },
      orderBy: {
        invoiceDate: 'desc',
      },
    });

    // Convert Decimal to number for JSON serialization
    const serializedInvoices = invoices.map(invoice => ({
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
    }));

    return NextResponse.json({ invoices: serializedInvoices });
  } catch (error) {
    console.error('Error fetching customer invoices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invoices' },
      { status: 500 }
    );
  }
}
