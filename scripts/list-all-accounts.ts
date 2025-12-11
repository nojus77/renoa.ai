import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listAllAccounts() {
  try {
    console.log('\n📋 All Accounts in Database:\n');
    console.log('═'.repeat(80));

    // Check Users table
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log('\n🔹 USERS (User table):');
    if (users.length === 0) {
      console.log('   No users found.');
    } else {
      users.forEach((user, index) => {
        console.log(`\n   ${index + 1}. ${user.firstName} ${user.lastName}`);
        console.log(`      Email: ${user.email}`);
        console.log(`      Role: ${user.role}`);
        console.log(`      ID: ${user.id}`);
      });
    }

    // Check Providers table
    const providers = await prisma.provider.findMany({
      select: {
        id: true,
        email: true,
        businessName: true,
        ownerName: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log('\n\n🔹 PROVIDERS (Provider table):');
    if (providers.length === 0) {
      console.log('   No providers found.');
    } else {
      providers.forEach((provider, index) => {
        console.log(`\n   ${index + 1}. ${provider.businessName}`);
        console.log(`      Email: ${provider.email}`);
        console.log(`      Owner: ${provider.ownerName}`);
        console.log(`      ID: ${provider.id}`);
      });
    }

    // Check ProviderUsers table
    const providerUsers = await prisma.providerUser.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        provider: {
          select: {
            businessName: true,
          },
        },
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log('\n\n🔹 PROVIDER USERS (ProviderUser table - team members):');
    if (providerUsers.length === 0) {
      console.log('   No provider users found.');
    } else {
      providerUsers.forEach((user, index) => {
        console.log(`\n   ${index + 1}. ${user.firstName} ${user.lastName}`);
        console.log(`      Email: ${user.email}`);
        console.log(`      Role: ${user.role}`);
        console.log(`      Company: ${user.provider.businessName}`);
        console.log(`      ID: ${user.id}`);
      });
    }

    console.log('\n' + '═'.repeat(80));
    console.log(`\nTotal Accounts: ${users.length + providers.length + providerUsers.length}`);
    console.log(`  - Users: ${users.length}`);
    console.log(`  - Providers: ${providers.length}`);
    console.log(`  - Provider Users: ${providerUsers.length}\n`);
  } catch (error) {
    console.error('Error fetching accounts:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listAllAccounts();
