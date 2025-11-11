import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Fetch single job details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const job = await prisma.job.findUnique({
      where: { id: params.id },
      include: {
        customer: true,
        photos: true,
        provider: {
          select: {
            businessName: true,
            phone: true,
            email: true,
          },
        },
      },
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Transform to include customer details
    const transformedJob = {
      id: job.id,
      customerName: job.customer.name,
      customerEmail: job.customer.email,
      customerPhone: job.customer.phone,
      customerAddress: job.address,
      serviceType: job.serviceType,
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
      provider: job.provider,
    };

    return NextResponse.json({ success: true, job: transformedJob });
  } catch (error) {
    console.error('Error fetching job:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job' },
      { status: 500 }
    );
  }
}

// PATCH - Update job details
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const {
      serviceType,
      address,
      startTime,
      endTime,
      status,
      estimatedValue,
      actualValue,
      internalNotes,
      customerNotes,
    } = body;

    const updateData: any = {};

    if (serviceType !== undefined) updateData.serviceType = serviceType;
    if (address !== undefined) updateData.address = address;
    if (startTime !== undefined) updateData.startTime = new Date(startTime);
    if (endTime !== undefined) updateData.endTime = new Date(endTime);
    if (status !== undefined) updateData.status = status;
    if (estimatedValue !== undefined) updateData.estimatedValue = estimatedValue ? parseFloat(estimatedValue) : null;
    if (actualValue !== undefined) updateData.actualValue = actualValue ? parseFloat(actualValue) : null;
    if (internalNotes !== undefined) updateData.internalNotes = internalNotes;
    if (customerNotes !== undefined) updateData.customerNotes = customerNotes;

    const job = await prisma.job.update({
      where: { id: params.id },
      data: updateData,
      include: {
        customer: true,
        photos: true,
      },
    });

    return NextResponse.json({ success: true, job });
  } catch (error) {
    console.error('Error updating job:', error);
    return NextResponse.json(
      { error: 'Failed to update job' },
      { status: 500 }
    );
  }
}

// DELETE - Delete job
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.job.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: 'Job deleted successfully' });
  } catch (error) {
    console.error('Error deleting job:', error);
    return NextResponse.json(
      { error: 'Failed to delete job' },
      { status: 500 }
    );
  }
}
