import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Get Premier Outdoor Solutions provider (the one with 20 workers)
  const provider = await prisma.provider.findFirst({
    where: { businessName: 'Premier Outdoor Solutions' }
  });

  if (!provider) {
    console.error('Premier Outdoor Solutions provider not found');
    return;
  }

  console.log(`Creating jobs for provider: ${provider.businessName} (${provider.id})`);

  // Get existing customers
  const customers = await prisma.customer.findMany({
    where: { providerId: provider.id },
    take: 6
  });

  if (customers.length < 6) {
    console.error(`Need at least 6 customers, found ${customers.length}`);
    return;
  }

  // Date: Friday, December 12th, 2025 (8am EST = 1pm UTC)
  const baseDate = new Date('2025-12-12T13:00:00Z');

  const jobs = [
    {
      customerId: customers[0].id,
      providerId: provider.id,
      serviceType: 'Lawn Mowing',
      address: customers[0].address,
      startTime: new Date(baseDate.getTime()),
      endTime: new Date(baseDate.getTime() + 60 * 60 * 1000), // 1 hour
      status: 'scheduled',
      jobPriority: 7, // medium-high priority (1-10 scale)
      crewSizeRequired: 1,
      durationMinutes: 1.0, // 1 hour in decimal
    },
    {
      customerId: customers[1].id,
      providerId: provider.id,
      serviceType: 'Lawn Edging',
      address: customers[1].address,
      startTime: new Date(baseDate.getTime() + 2 * 60 * 60 * 1000), // 10am
      endTime: new Date(baseDate.getTime() + 3 * 60 * 60 * 1000),
      status: 'scheduled',
      jobPriority: 4, // low priority
      crewSizeRequired: 1,
      durationMinutes: 1.0,
    },
    {
      customerId: customers[2].id,
      providerId: provider.id,
      serviceType: 'Trimming & Pruning',
      address: customers[2].address,
      startTime: new Date(baseDate.getTime() + 3 * 60 * 60 * 1000), // 11am
      endTime: new Date(baseDate.getTime() + 5 * 60 * 60 * 1000), // 2 hours
      status: 'scheduled',
      jobPriority: 9, // high priority
      crewSizeRequired: 1,
      durationMinutes: 2.0,
    },
    {
      customerId: customers[3].id,
      providerId: provider.id,
      serviceType: 'Mulching',
      address: customers[3].address,
      startTime: new Date(baseDate.getTime() + 5 * 60 * 60 * 1000), // 1pm
      endTime: new Date(baseDate.getTime() + 7 * 60 * 60 * 1000), // 2 hours
      status: 'scheduled',
      jobPriority: 6, // medium priority
      crewSizeRequired: 2,
      durationMinutes: 2.0,
    },
    {
      customerId: customers[4].id,
      providerId: provider.id,
      serviceType: 'Leaf Removal',
      address: customers[4].address,
      startTime: new Date(baseDate.getTime() + 4 * 60 * 60 * 1000), // 12pm
      endTime: new Date(baseDate.getTime() + 5.5 * 60 * 60 * 1000), // 1.5 hours
      status: 'scheduled',
      jobPriority: 8, // high priority
      crewSizeRequired: 1,
      durationMinutes: 1.5,
    },
    {
      customerId: customers[5].id,
      providerId: provider.id,
      serviceType: 'Planting',
      address: customers[5].address,
      startTime: new Date(baseDate.getTime() + 6 * 60 * 60 * 1000), // 2pm
      endTime: new Date(baseDate.getTime() + 7.5 * 60 * 60 * 1000), // 1.5 hours
      status: 'scheduled',
      jobPriority: 6, // medium priority
      crewSizeRequired: 1,
      durationMinutes: 1.5,
    },
  ];

  console.log('\nCreating 6 test jobs for Friday, December 12th, 2025...\n');

  for (const jobData of jobs) {
    const job = await prisma.job.create({
      data: jobData
    });

    const customer = customers.find(c => c.id === job.customerId);
    console.log(`✅ Created ${job.serviceType} job`);
    console.log(`   Customer: ${customer?.name}`);
    console.log(`   Address: ${job.address}`);
    console.log(`   Time: ${job.startTime.toLocaleString('en-US', { timeZone: 'America/New_York' })}`);
    console.log(`   Duration: ${job.durationMinutes} hours`);
    console.log(`   Crew Size: ${job.crewSizeRequired}`);
    console.log(`   Priority: ${job.jobPriority}/10`);
    console.log('');
  }

  console.log('✅ All 6 test jobs created successfully for Friday, Dec 12th!');
  console.log('\nThese jobs are unassigned and ready for the smart scheduler to process.');
  console.log('Use the "Auto-Assign All" button in the calendar to test the worker swap feature.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
