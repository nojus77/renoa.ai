import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const formData = await request.formData();
    const status = formData.get('status') as string;

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }

    // Build update data
    const updateData: any = {
      status,
      updatedAt: new Date(),
    };

    // Handle status-specific data
    if (status === 'in_progress') {
      const clockIn = formData.get('clockIn') === 'true';
      const startTime = formData.get('startTime');

      if (clockIn && startTime) {
        // Store start time in metadata or separate tracking table
        updateData.metadata = {
          clockedInAt: startTime,
        };
      }
    }

    if (status === 'completed') {
      const actualCost = formData.get('actualCost');
      const timeSpent = formData.get('timeSpent');

      if (actualCost) {
        updateData.contractValue = parseFloat(actualCost as string);
      }

      if (timeSpent) {
        updateData.metadata = {
          timeSpent: parseFloat(timeSpent as string),
        };
      }

      // Note: Photo uploads would be handled here
      // For now, we'll just track that photos were uploaded
      const photoKeys = Array.from(formData.keys()).filter(key => key.startsWith('afterPhoto'));
      if (photoKeys.length > 0) {
        updateData.metadata = {
          ...updateData.metadata,
          afterPhotosCount: photoKeys.length,
        };
      }
    }

    if (status === 'cancelled') {
      const cancelReason = formData.get('cancelReason');
      const cancelNotes = formData.get('cancelNotes');

      updateData.cancellationReason = cancelReason;
      if (cancelNotes) {
        updateData.notes = (updateData.notes || '') + `\n\nCancellation: ${cancelNotes}`;
      }
    }

    // Update the job
    const updatedJob = await prisma.lead.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json({ success: true, job: updatedJob });
  } catch (error) {
    console.error('Error updating job status:', error);
    return NextResponse.json(
      { error: 'Failed to update status' },
      { status: 500 }
    );
  }
}
