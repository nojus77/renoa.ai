import { prisma } from '@/lib/prisma';

async function fixLeadStatus() {
  console.log('🔄 Updating lead statuses...');

  try {
    // Update all leads with assigned providers to 'matched' status
    const result = await prisma.lead.updateMany({
      where: {
        assignedProviderId: {
          not: null,
        },
        status: 'new',
      },
      data: {
        status: 'matched',
      },
    });

    console.log(`✅ Updated ${result.count} lead(s) to 'matched' status`);
  } catch (error) {
    console.error('❌ Failed:', error);
  }
}

fixLeadStatus()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));