import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Verify authorization from Vercel Cron
    const authHeader = request.headers.get('authorization');
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

    if (authHeader !== expectedAuth) {
      console.error('❌ Unauthorized cron request');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔍 Checking for overdue invoices...');
    const now = new Date();

    // Find invoices that are 10+ days overdue
    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

    // Get all overdue invoices that haven't been paid
    const overdueInvoices = await prisma.invoice.findMany({
      where: {
        status: {
          notIn: ['paid', 'cancelled'],
        },
        dueDate: {
          lt: tenDaysAgo,
        },
      },
      include: {
        customer: true,
        jobs: true,
      },
    });

    console.log(`📋 Found ${overdueInvoices.length} invoices overdue by 10+ days`);

    let notificationsCreated = 0;

    for (const invoice of overdueInvoices) {
      // Check if a notification was already created in the last 7 days for this invoice
      const existingNotification = await prisma.notification.findFirst({
        where: {
          providerId: invoice.providerId,
          type: 'invoice_overdue',
          createdAt: {
            gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          },
          data: {
            path: ['invoiceId'],
            equals: invoice.id,
          },
        },
      });

      if (existingNotification) {
        console.log(`⏭️ Skipping invoice ${invoice.invoiceNumber} - notification already sent recently`);
        continue;
      }

      // Calculate days overdue
      const dueDate = new Date(invoice.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

      // Get customer name
      const customerName = invoice.customer?.name || 'Unknown Customer';

      // Create notification
      await prisma.notification.create({
        data: {
          providerId: invoice.providerId,
          type: 'invoice_overdue',
          title: 'Invoice Overdue',
          message: `Invoice #${invoice.invoiceNumber} for ${customerName} is ${daysOverdue} days overdue ($${Number(invoice.total).toFixed(0)})`,
          link: `/provider/invoices/${invoice.id}`,
          data: {
            invoiceId: invoice.id,
            invoiceNumber: invoice.invoiceNumber,
            daysOverdue,
            amount: Number(invoice.total),
            customerName,
          },
        },
      });

      console.log(`✅ Created overdue notification for invoice ${invoice.invoiceNumber} (${daysOverdue} days overdue)`);
      notificationsCreated++;
    }

    console.log(`🎉 Overdue invoice check complete! Created ${notificationsCreated} notifications`);

    return NextResponse.json({
      success: true,
      message: `Checked ${overdueInvoices.length} overdue invoices, created ${notificationsCreated} notifications`,
      overdueCount: overdueInvoices.length,
      notificationsCreated,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error('❌ Error checking overdue invoices:', error);
    return NextResponse.json(
      {
        error: 'Failed to check overdue invoices',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
