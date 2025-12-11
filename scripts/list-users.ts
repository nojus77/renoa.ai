import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listUsers() {
  try {
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

    console.log('\n📋 All Users in Database:\n');
    console.log('═'.repeat(80));

    if (users.length === 0) {
      console.log('No users found.');
    } else {
      users.forEach((user, index) => {
        console.log(`\n${index + 1}. ${user.firstName} ${user.lastName}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   ID: ${user.id}`);
        console.log(`   Created: ${user.createdAt.toLocaleDateString()}`);
      });

      console.log('\n' + '═'.repeat(80));
      console.log(`\nTotal Users: ${users.length}\n`);
    }
  } catch (error) {
    console.error('Error fetching users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listUsers();
