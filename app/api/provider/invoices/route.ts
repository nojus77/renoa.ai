import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/provider/invoices - List invoices with filters and stats
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const providerId = searchParams.get('providerId');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    if (!providerId) {
      return NextResponse.json(
        { error: 'Provider ID is required' },
        { status: 400 }
      );
    }

    // Build filters
    const where: any = {
      providerId,
    };

    if (status && status !== 'all') {
      if (status === 'unpaid') {
        where.status = { in: ['sent', 'viewed', 'overdue'] };
      } else if (status === 'overdue') {
        where.status = 'overdue';
        // Update overdue invoices
        await prisma.invoice.updateMany({
          where: {
            providerId,
            status: { in: ['sent', 'viewed'] },
            dueDate: { lt: new Date() },
          },
          data: { status: 'overdue' },
        });
      } else {
        where.status = status;
      }
    }

    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    // Get invoices
    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
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
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate stats
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const stats = await prisma.invoice.aggregate({
      where: { providerId },
      _sum: {
        total: true,
        amountPaid: true,
      },
    });

    const paidThisMonth = await prisma.invoice.aggregate({
      where: {
        providerId,
        status: 'paid',
        paidDate: { gte: firstDayOfMonth },
      },
      _sum: { total: true },
    });

    const outstanding = await prisma.invoice.aggregate({
      where: {
        providerId,
        status: { in: ['sent', 'viewed', 'partial'] },
      },
      _sum: { total: true, amountPaid: true },
    });

    const overdue = await prisma.invoice.aggregate({
      where: {
        providerId,
        status: 'overdue',
      },
      _sum: { total: true, amountPaid: true },
    });

    const statsData = {
      outstanding: Number(outstanding._sum.total || 0) - Number(outstanding._sum.amountPaid || 0),
      paidThisMonth: Number(paidThisMonth._sum.total || 0),
      overdue: Number(overdue._sum.total || 0) - Number(overdue._sum.amountPaid || 0),
    };

    return NextResponse.json({
      invoices: invoices.map((inv) => ({
        ...inv,
        subtotal: Number(inv.subtotal),
        taxRate: inv.taxRate ? Number(inv.taxRate) : null,
        taxAmount: Number(inv.taxAmount),
        discountValue: inv.discountValue ? Number(inv.discountValue) : null,
        discountAmount: Number(inv.discountAmount),
        total: Number(inv.total),
        amountPaid: Number(inv.amountPaid),
        lineItems: inv.lineItems.map((item) => ({
          ...item,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          total: Number(item.total),
        })),
        payments: inv.payments.map((payment) => ({
          ...payment,
          amount: Number(payment.amount),
        })),
      })),
      stats: statsData,
    });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invoices' },
      { status: 500 }
    );
  }
}

// POST /api/provider/invoices - Create new invoice
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      providerId,
      customerId,
      jobId,
      invoiceDate,
      dueDate,
      lineItems,
      taxRate,
      discountType,
      discountValue,
      notes,
      terms,
      paymentInstructions,
      status,
    } = body;

    if (!providerId || !customerId || !lineItems || lineItems.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Calculate subtotal
    const subtotal = lineItems.reduce(
      (sum: number, item: any) => sum + item.quantity * item.unitPrice,
      0
    );

    // Calculate tax
    const taxAmount = taxRate ? (subtotal * taxRate) / 100 : 0;

    // Calculate discount
    let discountAmount = 0;
    if (discountType && discountValue) {
      if (discountType === 'percentage') {
        discountAmount = (subtotal * discountValue) / 100;
      } else {
        discountAmount = discountValue;
      }
    }

    // Calculate total
    const total = subtotal + taxAmount - discountAmount;

    // Generate invoice number
    const lastInvoice = await prisma.invoice.findFirst({
      where: { providerId },
      orderBy: { createdAt: 'desc' },
      select: { invoiceNumber: true },
    });

    let invoiceNumber = 'INV-000001';
    if (lastInvoice) {
      const lastNumber = parseInt(lastInvoice.invoiceNumber.split('-')[1]);
      invoiceNumber = `INV-${String(lastNumber + 1).padStart(6, '0')}`;
    }

    // Create invoice with line items
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        providerId,
        customerId,
        jobId,
        status: status || 'draft',
        invoiceDate: new Date(invoiceDate),
        dueDate: new Date(dueDate),
        subtotal,
        taxRate: taxRate || 0,
        taxAmount,
        discountType,
        discountValue: discountValue || 0,
        discountAmount,
        total,
        notes,
        terms: terms || 'Payment is due within the specified due date. Late payments may incur additional fees.',
        paymentInstructions,
        lineItems: {
          create: lineItems.map((item: any, index: number) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.quantity * item.unitPrice,
            order: index,
          })),
        },
      },
      include: {
        customer: true,
        lineItems: true,
      },
    });

    return NextResponse.json({
      ...invoice,
      subtotal: Number(invoice.subtotal),
      taxRate: invoice.taxRate ? Number(invoice.taxRate) : null,
      taxAmount: Number(invoice.taxAmount),
      discountValue: invoice.discountValue ? Number(invoice.discountValue) : null,
      discountAmount: Number(invoice.discountAmount),
      total: Number(invoice.total),
      amountPaid: Number(invoice.amountPaid),
      lineItems: invoice.lineItems.map((item) => ({
        ...item,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        total: Number(item.total),
      })),
    });
  } catch (error) {
    console.error('Error creating invoice:', error);
    return NextResponse.json(
      { error: 'Failed to create invoice' },
      { status: 500 }
    );
  }
}
