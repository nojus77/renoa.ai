import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { providerId } = await request.json();

    if (!providerId) {
      return NextResponse.json(
        { error: 'Provider ID is required' },
        { status: 400 }
      );
    }

    // Update the lead
    const updatedLead = await prisma.lead.update({
      where: { id },
      data: {
        assignedProviderId: providerId,
        status: 'contacted',
      },
    });

    // Increment provider's leads received
    await prisma.provider.update({
      where: { id: providerId },
      data: {
        leadsReceived: {
          increment: 1,
        },
      },
    });

    return NextResponse.json(updatedLead);
  } catch (error) {
    console.error('Error assigning lead:', error);
    return NextResponse.json(
      { error: 'Failed to assign lead' },
      { status: 500 }
    );
  }
}