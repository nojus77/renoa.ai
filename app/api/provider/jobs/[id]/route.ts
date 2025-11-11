import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Fetch single job details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const job = await prisma.lead.findUnique({
      where: { id: params.id },
      include: {
        invoices: {
          select: {
            id: true,
            invoiceNumber: true,
            status: true,
            total: true,
            amountPaid: true,
            dueDate: true,
          },
        },
      },
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      job: {
        id: job.id,
        customerName: `${job.firstName} ${job.lastName}`,
        customerEmail: job.email,
        customerPhone: job.phone,
        address: `${job.address}, ${job.city}, ${job.state} ${job.zip}`,
        serviceType: job.serviceInterest,
        startTime: job.providerProposedDate,
        status: job.status,
        contractValue: job.contractValue,
        notes: job.notes,
        leadSource: job.leadSource,
        createdAt: job.createdAt,
        invoices: job.invoices,
      },
    });
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
    const { status, actualValue, notes, customerNotes } = body;

    // Build update data object
    const updateData: any = {};

    if (status !== undefined) {
      updateData.status = status;
    }

    if (actualValue !== undefined) {
      updateData.contractValue = actualValue;
    }

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    if (customerNotes !== undefined) {
      updateData.customerNotes = customerNotes;
    }

    // Update the lead
    const updatedLead = await prisma.lead.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json({ success: true, job: updatedLead });
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
    await prisma.lead.delete({
      where: { id: params.id },
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
