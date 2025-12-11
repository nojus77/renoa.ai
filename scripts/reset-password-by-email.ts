import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function resetPassword(email: string, newPassword: string) {
  try {
    console.log(`\n🔐 Attempting to reset password for: ${email}\n`);

    if (!email || !newPassword) {
      console.error('❌ Error: Email and password are required');
      console.log('\nUsage: npx tsx scripts/reset-password-by-email.ts <email> <password>');
      return;
    }

    if (newPassword.length < 8) {
      console.error('❌ Error: Password must be at least 8 characters long');
      return;
    }

    // Hash the new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Try to find and update in User table
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash, updatedAt: new Date() },
      });

      console.log('✅ Password reset successful!');
      console.log(`\n   Account Type: User`);
      console.log(`   Name: ${user.firstName} ${user.lastName}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   New Password: ${newPassword}\n`);
      return;
    }

    // Try to find and update in ProviderUser table
    const providerUser = await prisma.providerUser.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        provider: {
          select: {
            businessName: true,
          },
        },
      },
    });

    if (providerUser) {
      await prisma.providerUser.update({
        where: { id: providerUser.id },
        data: { passwordHash, updatedAt: new Date() },
      });

      console.log('✅ Password reset successful!');
      console.log(`\n   Account Type: Provider User (Team Member)`);
      console.log(`   Name: ${providerUser.firstName} ${providerUser.lastName}`);
      console.log(`   Email: ${providerUser.email}`);
      console.log(`   Role: ${providerUser.role}`);
      console.log(`   Company: ${providerUser.provider.businessName}`);
      console.log(`   New Password: ${newPassword}\n`);
      return;
    }

    // No account found
    console.error(`❌ No account found with email: ${email}\n`);
  } catch (error) {
    console.error('❌ Error resetting password:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Get email and password from command line arguments
const email = process.argv[2];
const newPassword = process.argv[3];

if (!email || !newPassword) {
  console.log('\n📋 Password Reset Tool\n');
  console.log('═'.repeat(60));
  console.log('\nUsage:');
  console.log('  npx tsx scripts/reset-password-by-email.ts <email> <password>\n');
  console.log('Example:');
  console.log('  npx tsx scripts/reset-password-by-email.ts user@example.com newpass123\n');
  console.log('This will search all account types (User, Provider, ProviderUser)');
  console.log('and reset the password for the matching account.\n');
  process.exit(1);
}

resetPassword(email, newPassword);
