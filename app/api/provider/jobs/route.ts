import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      providerId,
      customerId,
      customerName,
      customerEmail,
      customerPhone,
      customerAddress,
      serviceType,
      startTime,
      duration = 2, // Duration in hours, default 2
      estimatedValue,
      internalNotes,
      customerNotes,
      status = 'scheduled',
    } = body;

    if (!providerId || !serviceType || !startTime) {
      return NextResponse.json({ error: 'Missing required fields: providerId, serviceType, startTime' }, { status: 400 });
    }

    let finalCustomerId = customerId;

    // If no customerId provided, create a new customer
    if (!customerId) {
      if (!customerName || !customerPhone) {
        return NextResponse.json({ error: 'customerName and customerPhone required for new customer' }, { status: 400 });
      }

      const newCustomer = await prisma.customer.create({
        data: {
          providerId,
          name: customerName,
          email: customerEmail || null,
          phone: customerPhone,
          address: customerAddress || '',
          source: 'own', // Provider manually added this customer
        },
      });

      finalCustomerId = newCustomer.id;
    }

    // Calculate endTime from startTime + duration
    const startDate = new Date(startTime);
    const endDate = new Date(startDate.getTime() + duration * 60 * 60 * 1000);

    // Create the job
    const job = await prisma.job.create({
      data: {
        providerId,
        customerId: finalCustomerId,
        serviceType,
        address: customerAddress || '',
        startTime: startDate,
        endTime: endDate,
        status,
        source: 'own', // Provider manually created this job
        estimatedValue: estimatedValue ? parseFloat(estimatedValue) : null,
        internalNotes: internalNotes || null,
        customerNotes: customerNotes || null,
      },
      include: {
        customer: true, // Include customer data in response
      },
    });

    return NextResponse.json({ success: true, job });
  } catch (error) {
    console.error('Error creating job:', error);
    return NextResponse.json(
      { error: 'Failed to create job' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const providerId = searchParams.get('providerId');

    if (!providerId) {
      return NextResponse.json({ error: 'Provider ID required' }, { status: 400 });
    }

    // Fetch all jobs for this provider using the Job model
    const jobs = await prisma.job.findMany({
      where: {
        providerId,
      },
      include: {
        customer: true, // Include customer details
        photos: true,   // Include job photos
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    // Transform to include customer name and other fields for frontend
    const transformedJobs = jobs.map(job => ({
      id: job.id,
      customerName: job.customer.name,
      customerEmail: job.customer.email,
      customerPhone: job.customer.phone,
      serviceType: job.serviceType,
      address: job.address,
      startTime: job.startTime,
      endTime: job.endTime,
      status: job.status,
      source: job.source,
      isRenoaLead: job.source === 'renoa',
      estimatedValue: job.estimatedValue,
      actualValue: job.actualValue,
      internalNotes: job.internalNotes,
      customerNotes: job.customerNotes,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
      customer: job.customer,
      photos: job.photos,
    }));

    return NextResponse.json({ jobs: transformedJobs });
  } catch (error) {
    console.error('Error fetching provider jobs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch jobs' },
      { status: 500 }
    );
  }
}
