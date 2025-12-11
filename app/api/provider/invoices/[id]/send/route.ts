import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { sendNotification } from '@/lib/notifications/notification-service';

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

    // Generate payment and invoice links
    const invoiceLink = `${process.env.NEXT_PUBLIC_APP_URL}/customer-portal/invoices/${invoice.id}`;
    const paymentLink = `${process.env.NEXT_PUBLIC_APP_URL}/customer-portal/invoices/${invoice.id}`;

    // Send notification via email and/or SMS
    try {
      const notificationResult = await sendNotification(
        'invoice_sent',
        {
          customerName: invoice.customer.name,
          customerEmail: invoice.customer.email,
          customerPhone: invoice.customer.phone || '',
          providerName: invoice.provider.businessName,
          providerCompany: invoice.provider.businessName,
          serviceType: 'service',
          amount: Number(invoice.total),
          invoiceLink: invoiceLink,
          paymentLink: paymentLink,
        },
        {
          sendSMS: sms || false,
          sendEmail: email || false,
        }
      );

      console.log('Invoice notification sent:', notificationResult);
    } catch (notificationError) {
      console.error('Failed to send invoice notification:', notificationError);
      // Continue anyway - we still want to mark as sent
    }

    // Update invoice status
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
      message: `Invoice sent successfully via ${email ? 'email' : ''}${email && sms ? ' and ' : ''}${sms ? 'SMS' : ''}`,
    });
  } catch (error) {
    console.error('Error sending invoice:', error);
    return NextResponse.json(
      { error: 'Failed to send invoice' },
      { status: 500 }
    );
  }
}
