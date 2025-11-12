import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Fetch single job
export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const jobId = params.jobId;

    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        customer: true,
        provider: true,
        photos: true,
      },
    });

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // Check if invoice exists for this job
    const invoice = await prisma.invoice.findFirst({
      where: { jobId },
      select: {
        id: true,
        invoiceNumber: true,
        status: true,
      },
    });

    // Map the job data to include flattened customer fields and invoice info
    const jobData = {
      ...job,
      customerName: job.customer?.name || '',
      customerEmail: job.customer?.email || null,
      customerPhone: job.customer?.phone || '',
      customerAddress: job.customer?.address || job.address || '',
      isRenoaLead: job.source === 'renoa',
      invoice: invoice || null,
    };

    return NextResponse.json({ job: jobData });
  } catch (error) {
    console.error('Error fetching job:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job' },
      { status: 500 }
    );
  }
}

// PATCH - Update a job
export async function PATCH(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const jobId = params.jobId;
    const body = await request.json();

    const {
      serviceType,
      date,
      startTime,
      duration,
      estimatedValue,
      actualValue,
      internalNotes,
      customerNotes,
      status,
    } = body;

    // Build update data object dynamically
    const updateData: any = {};

    // If updating full job details
    if (serviceType && date && startTime && duration) {
      const startDateTime = new Date(`${date}T${startTime}`);
      const durationHours = parseFloat(duration);
      const endDateTime = new Date(startDateTime.getTime() + durationHours * 60 * 60 * 1000);

      updateData.serviceType = serviceType;
      updateData.startTime = startDateTime;
      updateData.endTime = endDateTime;
      updateData.estimatedValue = estimatedValue ? parseFloat(estimatedValue) : null;
      updateData.internalNotes = internalNotes || null;
      updateData.customerNotes = customerNotes || null;
    }

    // Allow status-only updates
    if (status) {
      updateData.status = status;
    }

    // Allow actualValue updates (for job completion)
    if (actualValue !== undefined) {
      updateData.actualValue = parseFloat(actualValue) || null;
    }

    // Allow notes-only updates
    if (internalNotes !== undefined) {
      updateData.internalNotes = internalNotes;
    }
    if (customerNotes !== undefined) {
      updateData.customerNotes = customerNotes;
    }

    // Update job
    const updatedJob = await prisma.job.update({
      where: { id: jobId },
      data: updateData,
      include: {
        customer: true,
        provider: true,
      },
    });

    return NextResponse.json({ job: updatedJob });
  } catch (error) {
    console.error('Error updating job:', error);
    return NextResponse.json(
      { error: 'Failed to update job' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a job
export async function DELETE(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const jobId = params.jobId;

    await prisma.job.delete({
      where: { id: jobId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting job:', error);
    return NextResponse.json(
      { error: 'Failed to delete job' },
      { status: 500 }
    );
  }
}
