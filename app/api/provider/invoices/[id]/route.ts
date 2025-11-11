import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/provider/invoices/[id] - Get invoice details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: params.id },
      include: {
        customer: true,
        provider: true,
        lineItems: {
          orderBy: { order: 'asc' },
        },
        payments: {
          orderBy: { paymentDate: 'desc' },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

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
      payments: invoice.payments.map((payment) => ({
        ...payment,
        amount: Number(payment.amount),
      })),
    });
  } catch (error) {
    console.error('Error fetching invoice:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invoice' },
      { status: 500 }
    );
  }
}

// PATCH /api/provider/invoices/[id] - Update invoice
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const {
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

    // Check if invoice exists and is editable
    const existingInvoice = await prisma.invoice.findUnique({
      where: { id: params.id },
    });

    if (!existingInvoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    if (existingInvoice.status === 'paid') {
      return NextResponse.json(
        { error: 'Cannot edit paid invoice' },
        { status: 400 }
      );
    }

    // Calculate amounts if line items are provided
    let updateData: any = {
      customerId,
      jobId,
      invoiceDate: invoiceDate ? new Date(invoiceDate) : undefined,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      taxRate: taxRate !== undefined ? taxRate : undefined,
      discountType,
      discountValue: discountValue !== undefined ? discountValue : undefined,
      notes,
      terms,
      paymentInstructions,
      status,
    };

    if (lineItems) {
      // Calculate subtotal
      const subtotal = lineItems.reduce(
        (sum: number, item: any) => sum + item.quantity * item.unitPrice,
        0
      );

      // Calculate tax
      const finalTaxRate = taxRate !== undefined ? taxRate : existingInvoice.taxRate;
      const taxAmount = finalTaxRate ? (subtotal * Number(finalTaxRate)) / 100 : 0;

      // Calculate discount
      let discountAmount = 0;
      const finalDiscountType = discountType || existingInvoice.discountType;
      const finalDiscountValue = discountValue !== undefined ? discountValue : existingInvoice.discountValue;

      if (finalDiscountType && finalDiscountValue) {
        if (finalDiscountType === 'percentage') {
          discountAmount = (subtotal * Number(finalDiscountValue)) / 100;
        } else {
          discountAmount = Number(finalDiscountValue);
        }
      }

      // Calculate total
      const total = subtotal + taxAmount - discountAmount;

      updateData = {
        ...updateData,
        subtotal,
        taxAmount,
        discountAmount,
        total,
      };

      // Delete existing line items and create new ones
      await prisma.invoiceLineItem.deleteMany({
        where: { invoiceId: params.id },
      });
    }

    // Update invoice
    const invoice = await prisma.invoice.update({
      where: { id: params.id },
      data: updateData,
      include: {
        customer: true,
        lineItems: true,
        payments: true,
      },
    });

    // Create new line items if provided
    if (lineItems) {
      await prisma.invoiceLineItem.createMany({
        data: lineItems.map((item: any, index: number) => ({
          invoiceId: params.id,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.quantity * item.unitPrice,
          order: index,
        })),
      });

      // Fetch updated invoice with line items
      const updatedInvoice = await prisma.invoice.findUnique({
        where: { id: params.id },
        include: {
          customer: true,
          lineItems: {
            orderBy: { order: 'asc' },
          },
          payments: true,
        },
      });

      return NextResponse.json({
        ...updatedInvoice,
        subtotal: Number(updatedInvoice!.subtotal),
        taxRate: updatedInvoice!.taxRate ? Number(updatedInvoice!.taxRate) : null,
        taxAmount: Number(updatedInvoice!.taxAmount),
        discountValue: updatedInvoice!.discountValue ? Number(updatedInvoice!.discountValue) : null,
        discountAmount: Number(updatedInvoice!.discountAmount),
        total: Number(updatedInvoice!.total),
        amountPaid: Number(updatedInvoice!.amountPaid),
        lineItems: updatedInvoice!.lineItems.map((item) => ({
          ...item,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          total: Number(item.total),
        })),
        payments: updatedInvoice!.payments.map((payment) => ({
          ...payment,
          amount: Number(payment.amount),
        })),
      });
    }

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
      payments: invoice.payments.map((payment) => ({
        ...payment,
        amount: Number(payment.amount),
      })),
    });
  } catch (error) {
    console.error('Error updating invoice:', error);
    return NextResponse.json(
      { error: 'Failed to update invoice' },
      { status: 500 }
    );
  }
}

// DELETE /api/provider/invoices/[id] - Delete invoice
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: params.id },
    });

    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    if (invoice.status === 'paid' || invoice.status === 'partial') {
      return NextResponse.json(
        { error: 'Cannot delete paid or partially paid invoice' },
        { status: 400 }
      );
    }

    await prisma.invoice.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    return NextResponse.json(
      { error: 'Failed to delete invoice' },
      { status: 500 }
    );
  }
}
