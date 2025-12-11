/**
 * Migration Script: Create Owner ProviderUser accounts for existing Providers
 *
 * This script creates an "owner" ProviderUser for each existing Provider
 * to enable the multi-user team system while maintaining backward compatibility.
 *
 * Run with: npx tsx scripts/migrate-provider-to-owner.ts
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function migrateProviders() {
  try {
    console.log('🚀 Starting provider-to-owner migration...\n');

    // Get all providers
    const providers = await prisma.provider.findMany({
      select: {
        id: true,
        email: true,
        ownerName: true,
        businessName: true,
      },
    });

    console.log(`📊 Found ${providers.length} provider(s) to migrate\n`);

    let created = 0;
    let skipped = 0;
    let errors = 0;

    for (const provider of providers) {
      console.log(`Processing: ${provider.businessName} (${provider.email})`);

      // Check if ProviderUser already exists for this provider's email
      const existingUser = await prisma.providerUser.findUnique({
        where: { email: provider.email },
      });

      if (existingUser) {
        console.log(`  ⏭️  Skipped - Owner user already exists`);
        skipped++;
        continue;
      }

      try {
        // Parse owner name into first and last name
        const nameParts = provider.ownerName?.trim().split(' ') || ['Owner'];
        const firstName = nameParts[0] || 'Owner';
        const lastName = nameParts.slice(1).join(' ') || provider.businessName || 'Admin';

        // Create simple temporary password
        // They'll be prompted to change it on first login
        const tempPassword = '123456';
        const passwordHash = await bcrypt.hash(tempPassword, 10);

        // Create owner ProviderUser
        await prisma.providerUser.create({
          data: {
            providerId: provider.id,
            email: provider.email,
            passwordHash,
            firstName,
            lastName,
            role: 'owner',
            status: 'active',
            skills: [],
          },
        });

        console.log(`  ✅ Created owner user: ${firstName} ${lastName}`);
        created++;
      } catch (error) {
        console.error(`  ❌ Error creating user:`, error);
        errors++;
      }

      console.log('');
    }

    console.log('━'.repeat(60));
    console.log('📊 Migration Summary:');
    console.log(`   ✅ Created: ${created}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   ❌ Errors: ${errors}`);
    console.log('━'.repeat(60));

    if (created > 0) {
      console.log('\n⚠️  IMPORTANT:');
      console.log('   All providers can now login with:');
      console.log('   - Email: their existing provider email');
      console.log('   - Password: 123456');
      console.log('   - They should change their password after first login\n');
    }

  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
migrateProviders()
  .then(() => {
    console.log('✨ Migration completed successfully!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  });
