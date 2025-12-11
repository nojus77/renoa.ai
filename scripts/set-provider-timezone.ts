import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const PROVIDER_ID = '25555c94-c1e0-40b9-af19-21a56c9e11bd'; // Premier Outdoor Solutions

async function setTimezone() {
  console.log('Checking provider timezone...\n');

  // Get current provider
  const provider = await prisma.provider.findUnique({
    where: { id: PROVIDER_ID },
    select: {
      id: true,
      businessName: true,
      timeZone: true
    }
  });

  if (!provider) {
    console.error('❌ Provider not found');
    return;
  }

  console.log(`Provider: ${provider.businessName}`);
  console.log(`Current timezone: ${provider.timeZone || 'NOT SET'}\n`);

  // Update timezone if needed
  if (provider.timeZone !== 'America/Chicago') {
    await prisma.provider.update({
      where: { id: PROVIDER_ID },
      data: {
        timeZone: 'America/Chicago'
      }
    });

    console.log('✅ Provider timezone updated to America/Chicago');
  } else {
    console.log('✅ Provider timezone already set to America/Chicago');
  }

  console.log('\nTimezone reference:');
  console.log('  • America/Chicago (CST/CDT)');
  console.log('  • America/New_York (EST/EDT)');
  console.log('  • America/Los_Angeles (PST/PDT)');
  console.log('  • America/Denver (MST/MDT)');
}

setTimezone()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
