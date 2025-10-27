import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendLeadAssignmentEmail } from '@/lib/emails/send-email';

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

    // Get the lead
    const lead = await prisma.lead.findUnique({
      where: { id },
    });

    if (!lead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      );
    }

    // Get the provider
    const provider = await prisma.provider.findUnique({
      where: { id: providerId },
    });

    if (!provider) {
      return NextResponse.json(
        { error: 'Provider not found' },
        { status: 404 }
      );
    }

    // Update the lead
    const updatedLead = await prisma.lead.update({
      where: { id },
      data: {
        assignedProviderId: providerId,
        status: 'new',
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

    // Send email notification to provider
    try {
      await sendLeadAssignmentEmail({
        to: provider.email,
        providerName: provider.businessName,
        leadName: `${lead.firstName} ${lead.lastName}`,
        leadEmail: lead.email,
        leadPhone: lead.phone,
        leadAddress: lead.address,
        leadCity: lead.city,
        leadState: lead.state,
        service: lead.serviceInterest,
        leadScore: lead.leadScore,
        propertyValue: lead.propertyValue,
        notes: lead.notes,
      });
      console.log('Email sent to provider:', provider.email);
    } catch (emailError) {
      console.error('Failed to send email, but lead was assigned:', emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json(updatedLead);
  } catch (error) {
    console.error('Error assigning lead:', error);
    return NextResponse.json(
      { error: 'Failed to assign lead' },
      { status: 500 }
    );
  }
}