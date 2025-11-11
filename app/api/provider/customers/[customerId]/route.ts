import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { customerId: string } }
) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const providerId = searchParams.get('providerId');

    if (!providerId) {
      return NextResponse.json({ error: 'Provider ID required' }, { status: 400 });
    }

    // Fetch all jobs for this customer
    const jobs = await prisma.lead.findMany({
      where: {
        id: params.customerId,
        assignedProviderId: providerId,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        address: true,
        city: true,
        state: true,
        zip: true,
        leadSource: true,
        status: true,
        contractValue: true,
        createdAt: true,
        providerProposedDate: true,
        serviceInterest: true,
        notes: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (jobs.length === 0) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Build customer details from jobs
    const firstJob = jobs[0];
    const customer = {
      id: params.customerId,
      name: `${firstJob.firstName} ${firstJob.lastName}`,
      firstName: firstJob.firstName,
      lastName: firstJob.lastName,
      email: firstJob.email,
      phone: firstJob.phone,
      address: `${firstJob.address}, ${firstJob.city}, ${firstJob.state} ${firstJob.zip}`,
      source: firstJob.leadSource === 'landing_page_hero' || firstJob.leadSource?.includes('renoa') ? 'renoa' : 'own',
      isActive: false,
      createdAt: jobs[jobs.length - 1].createdAt, // First job created
      tags: [] as string[],
      rating: undefined,
      isFavorite: false, // TODO: Store in database
      totalJobs: jobs.length,
      totalRevenue: jobs.reduce((sum, job) => sum + Number(job.contractValue || 0), 0),
      averageJobValue: 0,
      lastJobDate: null as string | null,
      jobs: jobs.map(job => ({
        id: job.id,
        date: job.providerProposedDate || job.createdAt,
        serviceType: job.serviceInterest || 'GENERAL',
        status: job.status || 'scheduled',
        value: job.contractValue || 0,
      })),
      notes: [] as any[], // TODO: Fetch from notes table
    };

    // Calculate average job value
    customer.averageJobValue = customer.totalRevenue / customer.totalJobs;

    // Find last job date
    const jobsWithDates = jobs.filter(j => j.providerProposedDate);
    if (jobsWithDates.length > 0) {
      const sorted = jobsWithDates.sort((a, b) =>
        new Date(b.providerProposedDate!).getTime() - new Date(a.providerProposedDate!).getTime()
      );
      customer.lastJobDate = sorted[0].providerProposedDate?.toISOString() || null;
    }

    // Check if active (has job in last 3 months)
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    customer.isActive = jobs.some(job =>
      job.providerProposedDate &&
      new Date(job.providerProposedDate) > threeMonthsAgo
    );

    // Add tags
    if (customer.totalJobs >= 5) customer.tags.push('Premium');
    if (customer.totalJobs >= 3) customer.tags.push('Recurring');
    if (customer.totalRevenue >= 5000) customer.tags.push('VIP');

    return NextResponse.json({ customer });
  } catch (error) {
    console.error('Error fetching customer details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customer details' },
      { status: 500 }
    );
  }
}

// PUT - Update customer details
export async function PUT(
  request: NextRequest,
  { params }: { params: { customerId: string } }
) {
  try {
    const body = await request.json();
    const { firstName, lastName, email, phone, address, city, state, zip, notes } = body;

    const updateData: any = {};

    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (city !== undefined) updateData.city = city;
    if (state !== undefined) updateData.state = state;
    if (zip !== undefined) updateData.zip = zip;
    if (notes !== undefined) updateData.notes = notes;

    const updatedCustomer = await prisma.lead.update({
      where: { id: params.customerId },
      data: updateData,
    });

    return NextResponse.json({ success: true, customer: updatedCustomer });
  } catch (error) {
    console.error('Error updating customer:', error);
    return NextResponse.json(
      { error: 'Failed to update customer' },
      { status: 500 }
    );
  }
}

// DELETE - Delete customer and all their jobs
export async function DELETE(
  request: NextRequest,
  { params }: { params: { customerId: string } }
) {
  try {
    // Delete all leads/jobs for this customer
    await prisma.lead.deleteMany({
      where: { id: params.customerId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting customer:', error);
    return NextResponse.json(
      { error: 'Failed to delete customer' },
      { status: 500 }
    );
  }
}
