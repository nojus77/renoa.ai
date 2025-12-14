import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// You'll need to set this to your provider ID and worker ID
// Find these by logging in and checking localStorage or the database
const PROVIDER_ID = process.env.SEED_PROVIDER_ID || '25555c94-c1e0-40b9-af19-21a56c9e11bd';

async function seedWorkerJobs() {
  console.log('🌱 Seeding sample jobs for worker testing...\n');

  // Get a worker from this provider to assign jobs to
  const worker = await prisma.providerUser.findFirst({
    where: {
      providerId: PROVIDER_ID,
      role: 'field',
      status: 'active',
    },
    select: { id: true, firstName: true, lastName: true, hourlyRate: true },
  });

  if (!worker) {
    console.error('❌ No active field worker found for this provider');
    console.log('   Create a worker first or check the PROVIDER_ID');
    return;
  }

  console.log(`✅ Using worker: ${worker.firstName} ${worker.lastName} (${worker.id})`);
  console.log(`   Hourly rate: $${worker.hourlyRate || 45}/hr\n`);

  const hourlyRate = worker.hourlyRate || 45;

  // Create customers first
  const customers = [
    {
      name: 'Sarah Johnson',
      phone: '(312) 555-0123',
      address: '2847 N Lincoln Ave, Chicago, IL 60614',
      email: 'sarah.johnson@email.com',
    },
    {
      name: 'Robert Chen',
      phone: '(312) 555-0456',
      address: '5621 W Devon Ave, Chicago, IL 60659',
      email: 'robert.chen@email.com',
    },
    {
      name: 'Emily Martinez',
      phone: '(312) 555-0789',
      address: '1234 W Montrose Ave, Chicago, IL 60613',
      email: 'emily.martinez@email.com',
    },
    {
      name: 'David Thompson',
      phone: '(312) 555-0234',
      address: '3456 N Sheffield Ave, Chicago, IL 60657',
      email: 'david.thompson@email.com',
    },
    {
      name: 'Mike Zawowski',
      phone: '(312) 555-0345',
      address: '4235 E Beachclub Rd, Chicago, IL 60611',
      email: 'mike.z@email.com',
    },
    {
      name: 'Jennifer Lee',
      phone: '(312) 555-0567',
      address: '6789 N Clark St, Chicago, IL 60626',
      email: 'jennifer.lee@email.com',
    },
    {
      name: 'Tom Anderson',
      phone: '(312) 555-0890',
      address: '8912 W Lawrence Ave, Chicago, IL 60656',
      email: 'tom.anderson@email.com',
    },
  ];

  const createdCustomers: Record<string, string> = {};

  for (const customer of customers) {
    // Check if customer exists
    const existing = await prisma.customer.findFirst({
      where: {
        providerId: PROVIDER_ID,
        phone: customer.phone,
      },
    });

    if (existing) {
      createdCustomers[customer.name] = existing.id;
      console.log(`⏭️  Customer exists: ${customer.name}`);
    } else {
      const created = await prisma.customer.create({
        data: {
          ...customer,
          providerId: PROVIDER_ID,
          source: 'own',
        },
      });
      createdCustomers[customer.name] = created.id;
      console.log(`✅ Created customer: ${customer.name}`);
    }
  }

  console.log('');

  // Helper to create date at specific time
  const createDate = (daysFromNow: number, hour: number, minute: number = 0) => {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    date.setHours(hour, minute, 0, 0);
    return date;
  };

  // Format timestamp for notes
  const formatTimestamp = (date: Date) => {
    return date.toLocaleString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Upcoming Jobs (future dates)
  const upcomingJobs = [
    {
      customerName: 'Sarah Johnson',
      serviceType: 'Plumbing',
      daysFromNow: 4, // Tuesday-ish
      startHour: 9,
      endHour: 11,
      estimatedValue: 90,
      description: 'Leaking kitchen sink and garbage disposal not working. Customer reports water pooling under sink.',
      notes: `[${formatTimestamp(new Date())}] System: estimate on site\n\n[${formatTimestamp(new Date())}] Dispatcher: Customer mentioned they'll be working from home. Ring doorbell.`,
    },
    {
      customerName: 'Robert Chen',
      serviceType: 'HVAC',
      daysFromNow: 5, // Wednesday-ish
      startHour: 14,
      endHour: 16,
      startMinute: 0,
      endMinute: 30,
      estimatedValue: 125,
      description: 'Annual furnace inspection and cleaning. System is 8 years old, Carrier brand.',
      notes: `[${formatTimestamp(new Date())}] Dispatcher: Repeat customer, very friendly. Has a dog.`,
    },
    {
      customerName: 'Emily Martinez',
      serviceType: 'Snow Removal',
      daysFromNow: 6, // Thursday-ish
      startHour: 6,
      endHour: 8,
      estimatedValue: 80,
      description: 'Clear driveway and front walkway. Salting required. About 6 inches of snow.',
      notes: `[${formatTimestamp(new Date())}] System: Bring extra salt bags\n\n[${formatTimestamp(new Date())}] Dispatcher: Park on street, driveway will be full of snow`,
    },
    {
      customerName: 'David Thompson',
      serviceType: 'Electrical',
      daysFromNow: 7, // Friday-ish
      startHour: 13,
      endHour: 15,
      estimatedValue: 110,
      description: 'Install new ceiling fan in master bedroom and fix flickering lights in hallway.',
      notes: `[${formatTimestamp(new Date())}] Dispatcher: Customer wants estimate first before proceeding with hallway lights`,
    },
  ];

  // Completed Jobs (past dates)
  const completedJobs = [
    {
      customerName: 'Mike Zawowski',
      serviceType: 'HVAC',
      daysFromNow: -1, // Yesterday
      startHour: 13,
      endHour: 15,
      hoursWorked: 2.0,
      isPaid: false,
      estimatedValue: 100,
      description: 'Replace furnace filter and check thermostat calibration',
      notes: `[${formatTimestamp(createDate(-1, 13))}] System: estimate on site\n\n[${formatTimestamp(createDate(-1, 15))}] ${worker.firstName} ${worker.lastName}: Completed. Found thermostat was fine, just replaced filter. Customer happy.`,
    },
    {
      customerName: 'Jennifer Lee',
      serviceType: 'Plumbing',
      daysFromNow: -2, // 2 days ago
      startHour: 15,
      endHour: 17,
      startMinute: 0,
      endMinute: 30,
      hoursWorked: 2.5,
      isPaid: true,
      estimatedValue: 112.5,
      description: 'Burst pipe in basement, water damage control needed',
      notes: `[${formatTimestamp(createDate(-2, 15))}] Dispatcher: Emergency job, customer frantic\n\n[${formatTimestamp(createDate(-2, 17))}] ${worker.firstName} ${worker.lastName}: Fixed pipe, cleaned up water. Recommended dehumidifier rental.`,
    },
    {
      customerName: 'Tom Anderson',
      serviceType: 'Snow Removal',
      daysFromNow: -3, // 3 days ago
      startHour: 7,
      endHour: 8,
      startMinute: 0,
      endMinute: 30,
      hoursWorked: 1.5,
      isPaid: true,
      estimatedValue: 60,
      description: 'Clear driveway and sidewalk after overnight snowfall',
      notes: `[${formatTimestamp(createDate(-3, 8))}] ${worker.firstName} ${worker.lastName}: Done. Applied salt. Customer tipped $20 cash.`,
    },
  ];

  // Create upcoming jobs
  console.log('📅 Creating upcoming jobs...');
  for (const job of upcomingJobs) {
    const startTime = createDate(job.daysFromNow, job.startHour, job.startMinute || 0);
    const endTime = createDate(job.daysFromNow, job.endHour, job.endMinute || 0);

    const customerId = createdCustomers[job.customerName];
    const customer = customers.find((c) => c.name === job.customerName)!;

    // Check if job already exists at this time
    const existing = await prisma.job.findFirst({
      where: {
        providerId: PROVIDER_ID,
        customerId,
        startTime,
      },
    });

    if (existing) {
      console.log(`⏭️  Job exists: ${job.serviceType} for ${job.customerName}`);
      continue;
    }

    await prisma.job.create({
      data: {
        providerId: PROVIDER_ID,
        customerId,
        serviceType: job.serviceType,
        address: customer.address,
        startTime,
        endTime,
        status: 'scheduled',
        estimatedValue: job.estimatedValue,
        internalNotes: job.notes,
        customerNotes: job.description,
        assignedUserIds: [worker.id],
      },
    });

    console.log(`✅ Created: ${job.serviceType} - ${job.customerName} (${startTime.toLocaleDateString()})`);
  }

  // Create completed jobs with work logs
  console.log('\n✓ Creating completed jobs with work logs...');
  for (const job of completedJobs) {
    const startTime = createDate(job.daysFromNow, job.startHour, job.startMinute || 0);
    const endTime = createDate(job.daysFromNow, job.endHour, job.endMinute || 0);

    const customerId = createdCustomers[job.customerName];
    const customer = customers.find((c) => c.name === job.customerName)!;

    // Check if job already exists
    const existing = await prisma.job.findFirst({
      where: {
        providerId: PROVIDER_ID,
        customerId,
        startTime,
      },
    });

    if (existing) {
      console.log(`⏭️  Job exists: ${job.serviceType} for ${job.customerName}`);
      continue;
    }

    const createdJob = await prisma.job.create({
      data: {
        providerId: PROVIDER_ID,
        customerId,
        serviceType: job.serviceType,
        address: customer.address,
        startTime,
        endTime,
        status: 'completed',
        completedAt: endTime,
        completedByUserId: worker.id,
        estimatedValue: job.estimatedValue,
        actualValue: job.estimatedValue,
        internalNotes: job.notes,
        customerNotes: job.description,
        assignedUserIds: [worker.id],
        arrivedAt: startTime,
        onTheWayAt: new Date(startTime.getTime() - 15 * 60 * 1000), // 15 mins before
      },
    });

    // Create work log
    await prisma.workLog.create({
      data: {
        jobId: createdJob.id,
        userId: worker.id,
        providerId: PROVIDER_ID,
        clockIn: startTime,
        clockOut: endTime,
        hoursWorked: job.hoursWorked,
        earnings: job.hoursWorked * hourlyRate,
        isPaid: job.isPaid,
        paidAt: job.isPaid ? endTime : null,
      },
    });

    console.log(
      `✅ Created: ${job.serviceType} - ${job.customerName} (${startTime.toLocaleDateString()}) - $${(
        job.hoursWorked * hourlyRate
      ).toFixed(2)} ${job.isPaid ? '(Paid)' : '(Pending)'}`
    );
  }

  // Summary
  const totalHours = completedJobs.reduce((sum, j) => sum + j.hoursWorked, 0);
  const totalEarnings = totalHours * hourlyRate;
  const pendingPay = completedJobs.filter((j) => !j.isPaid).reduce((sum, j) => sum + j.hoursWorked * hourlyRate, 0);

  console.log('\n════════════════════════════════════════════');
  console.log('📊 SUMMARY');
  console.log('════════════════════════════════════════════');
  console.log(`   Worker: ${worker.firstName} ${worker.lastName}`);
  console.log(`   Worker ID: ${worker.id}`);
  console.log(`   Provider ID: ${PROVIDER_ID}`);
  console.log('');
  console.log(`   📅 Upcoming Jobs: ${upcomingJobs.length}`);
  console.log(`   ✓ Completed Jobs: ${completedJobs.length}`);
  console.log(`   ⏱️ Total Hours: ${totalHours.toFixed(1)}h`);
  console.log(`   💰 Total Earned: $${totalEarnings.toFixed(2)}`);
  console.log(`   ⏳ Pending Pay: $${pendingPay.toFixed(2)}`);
  console.log('════════════════════════════════════════════');
  console.log('\n✨ Done! Login as worker to see the data.');
}

seedWorkerJobs()
  .catch((error) => {
    console.error('❌ Error seeding jobs:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
