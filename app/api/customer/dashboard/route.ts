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

    // Get next upcoming job
    const nextJob = await prisma.job.findFirst({
      where: {
        customerId,
        status: { in: ['scheduled', 'in_progress'] },
        startTime: { gte: new Date() },
      },
      orderBy: { startTime: 'asc' },
      include: {
        provider: {
          select: {
            businessName: true,
            phone: true,
            email: true,
          },
        },
      },
    });

    // Get active jobs (in progress)
    const activeJobs = await prisma.job.findMany({
      where: {
        customerId,
        status: 'in_progress',
      },
      orderBy: { startTime: 'desc' },
      take: 5,
    });

    // Get recent jobs
    const recentJobs = await prisma.job.findMany({
      where: { customerId },
      orderBy: { startTime: 'desc' },
      take: 3,
      include: {
        provider: {
          select: {
            businessName: true,
          },
        },
      },
    });

    // Get unpaid invoices
    const unpaidInvoices = await prisma.invoice.findMany({
      where: {
        customerId,
        status: { in: ['sent', 'viewed', 'partial', 'overdue'] },
      },
      orderBy: { dueDate: 'asc' },
    });

    // Calculate total unpaid amount
    const totalUnpaid = unpaidInvoices.reduce((sum, inv) => {
      const total = Number(inv.total);
      const paid = Number(inv.amountPaid || 0);
      return sum + (total - paid);
    }, 0);

    // Get provider info
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        provider: {
          select: {
            id: true,
            businessName: true,
            phone: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      nextJob: nextJob ? {
        ...nextJob,
        estimatedValue: nextJob.estimatedValue ? Number(nextJob.estimatedValue) : null,
        actualValue: nextJob.actualValue ? Number(nextJob.actualValue) : null,
      } : null,
      activeJobsCount: activeJobs.length,
      recentJobs: recentJobs.map(job => ({
        ...job,
        estimatedValue: job.estimatedValue ? Number(job.estimatedValue) : null,
        actualValue: job.actualValue ? Number(job.actualValue) : null,
      })),
      unpaidInvoicesCount: unpaidInvoices.length,
      totalUnpaid,
      provider: customer?.provider,
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
