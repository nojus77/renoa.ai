import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET /api/provider/notifications
 * Fetch recent activity/notifications for a provider
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const providerId = searchParams.get('providerId');

    if (!providerId) {
      return NextResponse.json(
        { error: 'Provider ID required' },
        { status: 400 }
      );
    }

    // Fetch recent activities from different sources
    const [recentJobs, recentCustomers, recentInvoices] = await Promise.all([
      // Recent job status changes (last 30 days)
      prisma.job.findMany({
        where: {
          providerId,
          updatedAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
        include: {
          customer: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          updatedAt: 'desc',
        },
        take: 20,
      }),

      // Recent new customers (last 30 days)
      prisma.customer.findMany({
        where: {
          providerId,
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 10,
      }),

      // Recent invoices/payments (last 30 days)
      prisma.invoice.findMany({
        where: {
          providerId,
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
        include: {
          customer: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 10,
      }),
    ]);

    // Transform into notification format
    const notifications: Array<{
      id: string;
      type: string;
      message: string;
      icon: string;
      timestamp: Date;
      link?: string;
    }> = [];

    // Add job notifications
    recentJobs.forEach(job => {
      if (job.status === 'completed') {
        notifications.push({
          id: `job-${job.id}`,
          type: 'job_completed',
          message: `Job completed for ${job.customer?.name || 'customer'}`,
          icon: 'CheckCircle',
          timestamp: job.updatedAt,
          link: `/provider/jobs/${job.id}`,
        });
      } else if (job.status === 'scheduled' && new Date(job.createdAt).getTime() > Date.now() - 24 * 60 * 60 * 1000) {
        notifications.push({
          id: `job-${job.id}`,
          type: 'job_scheduled',
          message: `New job scheduled with ${job.customer?.name || 'customer'}`,
          icon: 'Calendar',
          timestamp: job.createdAt,
          link: `/provider/jobs/${job.id}`,
        });
      }
    });

    // Add new customer notifications
    recentCustomers.forEach(customer => {
      if (customer.source === 'renoa') {
        notifications.push({
          id: `customer-${customer.id}`,
          type: 'new_lead',
          message: `New lead received: ${customer.name}`,
          icon: 'Star',
          timestamp: customer.createdAt,
          link: `/provider/customers/${customer.id}`,
        });
      } else {
        notifications.push({
          id: `customer-${customer.id}`,
          type: 'new_customer',
          message: `New customer added: ${customer.name}`,
          icon: 'UserPlus',
          timestamp: customer.createdAt,
          link: `/provider/customers/${customer.id}`,
        });
      }
    });

    // Add invoice/payment notifications
    recentInvoices.forEach(invoice => {
      if (invoice.status === 'paid') {
        notifications.push({
          id: `invoice-${invoice.id}`,
          type: 'payment_received',
          message: `Payment of $${invoice.totalAmount} received from ${invoice.customer?.name || 'customer'}`,
          icon: 'DollarSign',
          timestamp: invoice.paidAt || invoice.updatedAt,
          link: `/provider/invoices/${invoice.id}`,
        });
      }
    });

    // Sort by timestamp (most recent first) and take top 10
    notifications.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    const recentNotifications = notifications.slice(0, 10);

    return NextResponse.json({
      notifications: recentNotifications,
      unreadCount: 0, // TODO: Implement read/unread tracking
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}
