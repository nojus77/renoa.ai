import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    console.log('🔍 Finding matching providers for lead:', id);

    const lead = await prisma.lead.findUnique({
      where: { id },
    });

    if (!lead) {
      console.log('❌ Lead not found:', id);
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      );
    }

    console.log('📍 Lead location:', lead.city, lead.state, '- Zip:', lead.zip);
    console.log('🛠️  Service:', lead.serviceInterest);

    const allProviders = await prisma.provider.findMany({
      where: {
        status: 'active',
      },
    });

    console.log('👥 Total active providers:', allProviders.length);

    if (allProviders.length === 0) {
      return NextResponse.json(
        { error: 'No active providers in the system' },
        { status: 404 }
      );
    }

    const matchingProviders = allProviders.filter(provider => {
      console.log(`\nChecking provider: ${provider.businessName}`);
      console.log('  Service types:', provider.serviceTypes);
      console.log('  Service areas:', provider.serviceAreas);

      const serviceMatch = provider.serviceTypes && 
        provider.serviceTypes.includes(lead.serviceInterest);
      
      console.log('  Service match:', serviceMatch);

      let areaMatch = false;
      
      if (provider.serviceAreas && Array.isArray(provider.serviceAreas) && provider.serviceAreas.length > 0) {
        areaMatch = provider.serviceAreas.some(area => {
          if (typeof area === 'string') {
            return area === lead.zip;  // ✅ Using lead.zip
          } else if (typeof area === 'object' && area !== null) {
            const areaObj = area as any;
            return areaObj.zipCode === lead.zip ||  // ✅ Using lead.zip
                   areaObj.city?.toLowerCase() === lead.city?.toLowerCase();
          }
          return false;
        });

        if (!areaMatch && lead.city) {
          areaMatch = provider.serviceAreas.some(area => {
            if (typeof area === 'object' && area !== null) {
              const areaObj = area as any;
              return areaObj.city?.toLowerCase() === lead.city?.toLowerCase();
            }
            return false;
          });
        }
      }

      console.log('  Area match:', areaMatch);

      return serviceMatch && areaMatch;
    });

    console.log('\n✅ Found matching providers:', matchingProviders.length);

    if (matchingProviders.length === 0) {
      return NextResponse.json(
        { 
          error: `No providers available in ${lead.city} for ${lead.serviceInterest}`,
          details: {
            city: lead.city,
            state: lead.state,
            zipCode: lead.zip,  // ✅ Using lead.zip
            service: lead.serviceInterest,
            totalProviders: allProviders.length,
          }
        },
        { status: 404 }
      );
    }

    const sortedProviders = matchingProviders.sort((a, b) => {
      const aCapacity = a.leadCapacity - a.currentLeadCount;
      const bCapacity = b.leadCapacity - b.currentLeadCount;
      return bCapacity - aCapacity;
    });

    const selectedProvider = sortedProviders[0];

    console.log('🎯 Selected provider:', selectedProvider.businessName);

    const updatedLead = await prisma.lead.update({
      where: { id },
      data: {
        status: 'matched',
        assignedProviderId: selectedProvider.id,
      },
      include: {
        assignedProvider: true,
      },
    });

    await prisma.provider.update({
      where: { id: selectedProvider.id },
      data: {
        currentLeadCount: {
          increment: 1,
        },
        totalLeadsSent: {
          increment: 1,
        },
        lastActivityAt: new Date(),
      },
    });

    console.log('✅ Lead matched successfully');

    return NextResponse.json({
  success: true,
  lead: updatedLead,
  provider: selectedProvider,  // ✅ Add this!
  message: `Matched with ${selectedProvider.businessName}`,
});

  } catch (error) {
    console.error('❌ Error matching lead:', error);
    return NextResponse.json(
      { error: 'Failed to match lead with provider' },
      { status: 500 }
    );
  }
}