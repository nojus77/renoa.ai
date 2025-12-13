import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { createNotification } from '@/lib/notifications';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const providerId = searchParams.get('providerId');
    const search = searchParams.get('search');
    const filter = searchParams.get('filter'); // all, premium, hoa, new
    const sort = searchParams.get('sort'); // name, spent, recent, since

    if (!providerId) {
      return NextResponse.json({ error: 'Provider ID required' }, { status: 400 });
    }

    // Build where clause
    const where: any = {
      providerId,
    };

    // Apply search filter
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Apply tag filter
    if (filter && filter !== 'all') {
      if (filter === 'new') {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        where.createdAt = { gte: thirtyDaysAgo };
      } else {
        // Filter by tags (premium, hoa, etc)
        where.tags = { has: filter };
      }
    }

    // Fetch customers with job counts
    const customers = await prisma.customer.findMany({
      where,
      include: {
        jobs: {
          select: {
            id: true,
            estimatedValue: true,
            actualValue: true,
            startTime: true,
            serviceType: true,
            status: true,
          },
          orderBy: {
            startTime: 'desc',
          },
        },
      },
    });

    // Transform data to include calculated fields
    const transformedCustomers = customers.map(customer => {
      const jobCount = customer.jobs.length;
      const totalSpent = customer.jobs.reduce((sum, job) => {
        return sum + (job.actualValue || job.estimatedValue || 0);
      }, 0);
      const lastJob = customer.jobs[0];
      const lastJobDate = lastJob ? lastJob.startTime : null;
      const lastJobService = lastJob ? lastJob.serviceType : null;

      // Check if active this month
      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const hasJobThisMonth = customer.jobs.some(
        job => new Date(job.startTime) >= thisMonth
      );

      return {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        source: customer.source,
        tags: customer.tags,
        notes: customer.notes,
        createdAt: customer.createdAt,
        updatedAt: customer.updatedAt,
        jobCount,
        totalSpent,
        averageJobValue: jobCount > 0 ? totalSpent / jobCount : 0,
        lastJobDate,
        lastJobService,
        isActiveThisMonth: hasJobThisMonth,
      };
    });

    // Apply sorting
    if (sort === 'name') {
      transformedCustomers.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sort === 'spent') {
      transformedCustomers.sort((a, b) => b.totalSpent - a.totalSpent);
    } else if (sort === 'recent') {
      transformedCustomers.sort((a, b) => {
        if (!a.lastJobDate) return 1;
        if (!b.lastJobDate) return -1;
        return new Date(b.lastJobDate).getTime() - new Date(a.lastJobDate).getTime();
      });
    } else {
      // Default: sort by creation date (newest first)
      transformedCustomers.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }

    return NextResponse.json({ customers: transformedCustomers });
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      providerId,
      name,
      email,
      phone,
      address,
      tags,
      notes,
    } = body;

    if (!providerId || !name || !phone) {
      return NextResponse.json({
        error: 'Missing required fields: providerId, name, phone'
      }, { status: 400 });
    }

    // Create new customer
    const customer = await prisma.customer.create({
      data: {
        providerId,
        name,
        email: email || null,
        phone,
        address: address || '',
        source: 'own',
        tags: tags || [],
        notes: notes || null,
      },
    });

    // Create notification for new customer
    await createNotification({
      providerId,
      type: 'new_customer',
      title: 'New Customer',
      message: `${name} was added as a new customer`,
      link: `/provider/customers/${customer.id}`,
    });

    return NextResponse.json({ success: true, customer });
  } catch (error) {
    console.error('Error creating customer:', error);
    return NextResponse.json(
      { error: 'Failed to create customer' },
      { status: 500 }
    );
  }
}
