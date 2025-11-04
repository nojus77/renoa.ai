import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { 
      action,              // "confirm" or "propose"
      proposedDate,        // New date provider is suggesting
      schedulingNotes 
    } = body;

    console.log('📅 Schedule action:', action, 'for lead:', id);

    // Validate action
    if (!action || !['confirm', 'propose'].includes(action)) {
      return NextResponse.json(
        { error: 'Action must be "confirm" or "propose"' },
        { status: 400 }
      );
    }

    // Get the current lead
    const lead = await prisma.lead.findUnique({
      where: { id }
    });

    if (!lead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      );
    }

    // Prepare update data based on action
    let updateData: any = {
      schedulingNotes: schedulingNotes || lead.schedulingNotes
    };

    if (action === 'confirm') {
      // Provider is confirming the customer's preferred date
      if (!lead.customerPreferredDate) {
        return NextResponse.json(
          { error: 'No customer preferred date to confirm' },
          { status: 400 }
        );
      }
      
      updateData.providerProposedDate = lead.customerPreferredDate;
      updateData.schedulingStatus = 'confirmed';
      
      console.log('✅ Confirming customer date:', lead.customerPreferredDate);
      
    } else if (action === 'propose') {
      // Provider is proposing a new date
      if (!proposedDate) {
        return NextResponse.json(
          { error: 'Proposed date is required' },
          { status: 400 }
        );
      }
      
      updateData.providerProposedDate = new Date(proposedDate);
      updateData.schedulingStatus = 'pending'; // Waiting for customer confirmation
      
      console.log('📆 Provider proposing new date:', proposedDate);
    }

    // Update the lead
    const updatedLead = await prisma.lead.update({
      where: { id },
      data: updateData
    });

    console.log('✅ Schedule updated successfully');

    // TODO: Send email/SMS notification to customer
    // if (action === 'confirm') {
    //   await sendConfirmationEmail(lead.email, updatedLead.providerProposedDate);
    // } else if (action === 'propose') {
    //   await sendProposalEmail(lead.email, updatedLead.providerProposedDate);
    // }

    return NextResponse.json({
      success: true,
      lead: updatedLead,
      message: action === 'confirm' 
        ? '✅ Appointment confirmed!' 
        : '📅 New date proposed! Customer will be notified.'
    });

  } catch (error) {
    console.error('❌ Error updating schedule:', error);
    return NextResponse.json(
      { error: 'Failed to update schedule' },
      { status: 500 }
    );
  }
}