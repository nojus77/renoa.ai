import { prisma } from '@/lib/prisma';

async function migrateProviderLeads() {
  console.log('🔄 Starting migration: contacted → matched for provider leads...');

  try {
    const leadsToUpdate = await prisma.lead.findMany({
      where: {
        assignedProviderId: { not: null },
        status: 'contacted',
      },
      include: {
        assignedProvider: true,
      }
    });

    console.log(`📊 Found ${leadsToUpdate.length} provider leads in "contacted" status`);

    if (leadsToUpdate.length === 0) {
      console.log('✅ No leads need migration. All done!');
      return;
    }

    const result = await prisma.lead.updateMany({
      where: {
        assignedProviderId: { not: null },
        status: 'contacted',
      },
      data: {
        status: 'matched',
      }
    });

    console.log(`✅ Successfully migrated ${result.count} leads from "contacted" to "matched"`);
    console.log('📝 Note: Providers must now ACCEPT leads to see contact info');
    
    const providerSummary = leadsToUpdate.reduce((acc, lead) => {
      const providerName = lead.assignedProvider?.businessName || 'Unknown';
      acc[providerName] = (acc[providerName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('\n📋 Migration summary by provider:');
    Object.entries(providerSummary).forEach(([provider, count]) => {
      console.log(`  - ${provider}: ${count} lead(s) now awaiting acceptance`);
    });

    console.log('\n🎉 Migration complete!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

migrateProviderLeads()
  .then(() => {
    console.log('✅ Script finished successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });