import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Fetch single customer with full details
export async function GET(
  request: NextRequest,
  { params }: { params: { customerId: string } }
) {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: params.customerId },
      include: {
        jobs: {
          include: {
            photos: true,
          },
          orderBy: {
            startTime: 'desc',
          },
        },
      },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Calculate stats
    const jobCount = customer.jobs.length;
    const totalSpent = customer.jobs.reduce((sum, job) => {
      return sum + (job.actualValue || job.estimatedValue || 0);
    }, 0);
    const averageJobValue = jobCount > 0 ? totalSpent / jobCount : 0;
    const lastJob = customer.jobs[0];
    const completedJobs = customer.jobs.filter(j => j.status === 'completed').length;

    // Calculate days since last job
    let daysSinceLastJob = null;
    if (lastJob) {
      const now = new Date();
      const lastJobDate = new Date(lastJob.startTime);
      daysSinceLastJob = Math.floor((now.getTime() - lastJobDate.getTime()) / (1000 * 60 * 60 * 24));
    }

    return NextResponse.json({
      success: true,
      customer: {
        ...customer,
        stats: {
          totalJobs: jobCount,
          completedJobs,
          totalSpent,
          averageJobValue,
          daysSinceLastJob,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching customer:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customer' },
      { status: 500 }
    );
  }
}

// PUT - Update customer
export async function PUT(
  request: NextRequest,
  { params }: { params: { customerId: string } }
) {
  try {
    const body = await request.json();
    const {
      name,
      email,
      phone,
      address,
      tags,
      notes,
    } = body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email || null;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (tags !== undefined) updateData.tags = tags;
    if (notes !== undefined) updateData.notes = notes;

    const customer = await prisma.customer.update({
      where: { id: params.customerId },
      data: updateData,
    });

    return NextResponse.json({ success: true, customer });
  } catch (error) {
    console.error('Error updating customer:', error);
    return NextResponse.json(
      { error: 'Failed to update customer' },
      { status: 500 }
    );
  }
}

// DELETE - Delete customer
export async function DELETE(
  request: NextRequest,
  { params }: { params: { customerId: string } }
) {
  try {
    // Check if customer has jobs
    const customer = await prisma.customer.findUnique({
      where: { id: params.customerId },
      include: {
        jobs: {
          select: { id: true },
        },
      },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    if (customer.jobs.length > 0) {
      return NextResponse.json({
        error: 'Cannot delete customer with existing jobs',
        jobCount: customer.jobs.length,
      }, { status: 400 });
    }

    await prisma.customer.delete({
      where: { id: params.customerId },
    });

    return NextResponse.json({ success: true, message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Error deleting customer:', error);
    return NextResponse.json(
      { error: 'Failed to delete customer' },
      { status: 500 }
    );
  }
}
