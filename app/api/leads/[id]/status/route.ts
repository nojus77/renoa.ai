import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { status } = await request.json();

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }

    // Update lead status
    const updatedLead = await prisma.lead.update({
      where: { id },
      data: { status },
    });

    // If converted, update provider's conversion stats
    if (status === 'converted') {
      const lead = await prisma.lead.findUnique({
        where: { id },
      });

      if (lead?.assignedProviderId) {
        const provider = await prisma.provider.findUnique({
          where: { id: lead.assignedProviderId },
        });

        if (provider) {
          const leadsConverted = (provider.leadsConverted || 0) + 1;
          const conversionRate = leadsConverted / (provider.leadsReceived || 1);

          await prisma.provider.update({
            where: { id: lead.assignedProviderId },
            data: {
              leadsConverted,
              conversionRate,
            },
          });
        }
      }
    }

    return NextResponse.json(updatedLead);
  } catch (error) {
    console.error('Error updating lead status:', error);
    return NextResponse.json(
      { error: 'Failed to update lead status' },
      { status: 500 }
    );
  }
}