import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { renderToBuffer } from '@react-pdf/renderer';
import { InvoicePDF } from '@/components/provider/InvoicePDF';
import React from 'react';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const invoiceId = params.id;

    // Fetch invoice with all related data
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        provider: true,
        customer: true,
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

    // Format data for PDF
    const invoiceData = {
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: invoice.invoiceDate.toISOString(),
      dueDate: invoice.dueDate.toISOString(),
      status: invoice.status,
      subtotal: Number(invoice.subtotal),
      taxRate: invoice.taxRate ? Number(invoice.taxRate) : null,
      taxAmount: Number(invoice.taxAmount),
      discountAmount: Number(invoice.discountAmount),
      total: Number(invoice.total),
      amountPaid: Number(invoice.amountPaid),
      notes: invoice.notes,
      terms: invoice.terms,
      paymentInstructions: invoice.paymentInstructions,
      provider: {
        businessName: invoice.provider.businessName,
        ownerName: invoice.provider.ownerName,
        email: invoice.provider.email,
        phone: invoice.provider.phone,
        businessAddress: invoice.provider.businessAddress || undefined,
        city: invoice.provider.city || undefined,
        state: invoice.provider.state || undefined,
        zipCode: invoice.provider.zipCode || undefined,
        taxId: invoice.provider.taxId || undefined,
        salesTaxNumber: undefined, // TODO: Add salesTaxNumber field to Provider model if needed
        website: invoice.provider.website || undefined,
      },
      customer: {
        name: invoice.customer.name,
        email: invoice.customer.email || '',
        phone: invoice.customer.phone,
        address: invoice.customer.address,
      },
      lineItems: invoice.lineItems.map(item => ({
        description: item.description,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        total: Number(item.total),
      })),
    };

    // Generate PDF
    const pdfBuffer = await renderToBuffer(
      React.createElement(InvoicePDF, { invoice: invoiceData }) as React.ReactElement
    );

    // Return PDF as downloadable file
    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}
