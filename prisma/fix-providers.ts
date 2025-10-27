import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixProviders() {
  console.log('Fixing provider data...');
  
  const providers = await prisma.provider.findMany();
  
  for (const provider of providers) {
    await prisma.provider.update({
      where: { id: provider.id },
      data: {
        unpaidCommission: provider.unpaidCommission || 0,
      }
    });
  }
  
  console.log(`✅ Fixed ${providers.length} providers!`);
}

fixProviders()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });