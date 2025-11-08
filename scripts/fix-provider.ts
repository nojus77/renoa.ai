import { prisma } from '../lib/prisma';

async function fixProvider() {
  // Update your provider with correct service areas
  const provider = await prisma.provider.findFirst({
    where: {
      businessName: 'Elite Landscaping Co'
    }
  });

  if (provider) {
    await prisma.provider.update({
      where: { id: provider.id },
      data: {
        serviceTypes: ['landscaping', 'lawn care', 'tree service', 'hardscaping'],
        serviceAreas: ['60601', '60602', '60603', '60604', '60605', '60606', '60607', '60610', '60611', '60612'],
        status: 'active',
      }
    });
    console.log('✅ Provider updated!');
  }
}

fixProvider();