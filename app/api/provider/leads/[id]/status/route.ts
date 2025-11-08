import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { status, contractValue } = await request.json();

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }

    const validStatuses = ['matched', 'accepted', 'converted', 'unqualified'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: any = { status };
    
    // If converting, save the contract value
    if (status === 'converted' && contractValue) {
      updateData.contractValue = contractValue;
    }

    const updatedLead = await prisma.lead.update({
      where: { id },
      data: updateData,
    });

    if (status === 'converted') {
      const lead = await prisma.lead.findUnique({
        where: { id },
        include: {
          assignedProvider: true,
        }
      });

      if (lead?.assignedProvider) {
        const provider = lead.assignedProvider;
        
        // Calculate new total revenue and average job value
        const totalRevenue = provider.totalRevenue + (contractValue || 0);
        const newConvertedCount = provider.leadsConverted + 1;
        const averageJobValue = totalRevenue / newConvertedCount;

        await prisma.provider.update({
          where: { id: provider.id },
          data: {
            leadsConverted: {
              increment: 1,
            },
            totalRevenue: totalRevenue,
            averageJobValue: averageJobValue,
          },
        });

        console.log(`✅ Provider stats updated for ${provider.businessName}`);
        console.log(`   - Total Revenue: $${totalRevenue}`);
        console.log(`   - Average Job Value: $${averageJobValue}`);
        
        // TODO: Send celebration email
        // await sendConversionCelebrationEmail({
        //   providerEmail: provider.email,
        //   providerName: provider.ownerName,
        //   leadName: `${lead.firstName} ${lead.lastName}`,
        //   serviceType: lead.serviceInterest,
        //   leadScore: lead.leadScore,
        //   contractValue: contractValue
        // });
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