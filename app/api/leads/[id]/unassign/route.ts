import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    console.log('🔄 Unassigning lead:', id);

    const lead = await prisma.lead.findUnique({
      where: { id },
      include: { assignedProvider: true }
    });

    if (!lead) {
      console.log('❌ Lead not found:', id);
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Decrement old provider's lead count if assigned
    if (lead.assignedProviderId) {
      console.log('📉 Decrementing lead count for provider:', lead.assignedProvider?.businessName);

      await prisma.provider.update({
        where: { id: lead.assignedProviderId },
        data: {
          currentLeadCount: { decrement: 1 }
        }
      });
    }

    // Unassign lead
    const updatedLead = await prisma.lead.update({
      where: { id },
      data: {
        assignedProviderId: null,
        status: 'new'
      }
    });

    console.log('✅ Lead unassigned successfully');

    return NextResponse.json({
      success: true,
      lead: updatedLead,
      message: 'Lead unassigned successfully'
    });
  } catch (error: any) {
    console.error('❌ Error unassigning lead:', error);
    return NextResponse.json(
      { error: 'Failed to unassign lead', details: error.message },
      { status: 500 }
    );
  }
}
