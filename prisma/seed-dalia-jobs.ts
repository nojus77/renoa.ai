import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Provider ID - adjust if needed
const PROVIDER_ID = process.env.SEED_PROVIDER_ID || '25555c94-c1e0-40b9-af19-21a56c9e11bd';

async function seedDaliaJobs() {
  console.log('🌱 Seeding jobs for Dalia Grajauskas...\n');

  // Find or create Dalia
  let dalia = await prisma.providerUser.findFirst({
    where: {
      providerId: PROVIDER_ID,
      firstName: 'Dalia',
      lastName: 'Grajauskas',
    },
  });

  if (!dalia) {
    console.log('Creating worker: Dalia Grajauskas...');
    const passwordHash = await bcrypt.hash('dalia123', 10);
    dalia = await prisma.providerUser.create({
      data: {
        providerId: PROVIDER_ID,
        email: 'dalia@fieldcrew.test',
        passwordHash,
        firstName: 'Dalia',
        lastName: 'Grajauskas',
        phone: '(773) 555-0001',
        role: 'field',
        status: 'active',
        color: '#A3E635', // Lime green
        hourlyRate: 45,
        payType: 'hourly',
      },
    });
    console.log(`✅ Created worker: Dalia Grajauskas (${dalia.id})`);
  } else {
    console.log(`✅ Found worker: Dalia Grajauskas (${dalia.id})`);
  }

  const hourlyRate = dalia.hourlyRate || 45;

  // New customers for Dalia's jobs
  const customers = [
    {
      name: 'James Peterson',
      phone: '(773) 555-1234',
      address: '3421 N Broadway, Chicago, IL 60657',
      email: 'james.peterson@email.com',
    },
    {
      name: 'Maria Kowalski',
      phone: '(773) 555-2345',
      address: '5847 W Irving Park Rd, Chicago, IL 60634',
      email: 'maria.kowalski@email.com',
    },
    {
      name: 'Andrew Sullivan',
      phone: '(773) 555-3456',
      address: '2156 W Belmont Ave, Chicago, IL 60618',
      email: 'andrew.sullivan@email.com',
    },
    {
      name: 'Lisa Chang',
      phone: '(773) 555-4567',
      address: '4892 N Lincoln Ave, Chicago, IL 60625',
      email: 'lisa.chang@email.com',
    },
    {
      name: 'Robert Williams',
      phone: '(773) 555-5678',
      address: '6234 S Pulaski Rd, Chicago, IL 60629',
      email: 'robert.williams@email.com',
    },
    {
      name: 'Patricia Brown',
      phone: '(773) 555-6789',
      address: '7821 W Devon Ave, Chicago, IL 60631',
      email: 'patricia.brown@email.com',
    },
  ];

  const createdCustomers: Record<string, string> = {};

  console.log('\n📋 Creating customers...');
  for (const customer of customers) {
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

  // Helper to create dates relative to today
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const createDateRelative = (daysFromToday: number, hour: number, minute: number = 0) => {
    const date = new Date(today);
    date.setDate(date.getDate() + daysFromToday);
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

  // Upcoming Jobs for Dalia (relative to today)
  const upcomingJobs = [
    {
      customerName: 'James Peterson',
      serviceType: 'Plumbing',
      startTime: createDateRelative(0, 14, 0), // Today at 2pm
      endTime: createDateRelative(0, 16, 0),   // Today at 4pm
      estimatedValue: 90,
      description: 'Kitchen faucet replacement and fix leaking pipe under bathroom sink',
      notes: `[${formatTimestamp(new Date())}] System: Bring various size washers and pipe sealant\n\n[${formatTimestamp(new Date())}] Dispatcher: Customer works night shift, will be home in afternoon`,
    },
    {
      customerName: 'Maria Kowalski',
      serviceType: 'Snow Removal',
      startTime: createDateRelative(1, 6, 30), // Tomorrow 6:30am
      endTime: createDateRelative(1, 8, 0),    // Tomorrow 8:00am
      estimatedValue: 60,
      description: 'Clear driveway, front walkway, and sidewalk. Apply salt.',
      notes: `[${formatTimestamp(new Date())}] Dispatcher: Elderly customer, please be thorough with salting to prevent falls`,
    },
    {
      customerName: 'Andrew Sullivan',
      serviceType: 'HVAC',
      startTime: createDateRelative(1, 13, 0),  // Tomorrow 1pm
      endTime: createDateRelative(1, 15, 30),   // Tomorrow 3:30pm
      estimatedValue: 125,
      description: 'Furnace making strange noises. Customer reports burning smell occasionally.',
      notes: `[${formatTimestamp(new Date())}] System: Possible blower motor issue - bring replacement parts\n\n[${formatTimestamp(new Date())}] Dispatcher: Call customer when 15 minutes away`,
    },
    {
      customerName: 'Lisa Chang',
      serviceType: 'Electrical',
      startTime: createDateRelative(2, 10, 0),  // Day after tomorrow 10am
      endTime: createDateRelative(2, 12, 0),    // Day after tomorrow 12pm
      estimatedValue: 110,
      description: 'Multiple outlets not working in living room and kitchen. Circuit breaker keeps tripping.',
      notes: `[${formatTimestamp(new Date())}] Dispatcher: Customer has small children, please be mindful of tools/equipment`,
    },
    {
      customerName: 'Robert Williams',
      serviceType: 'Furnace Repair',
      startTime: createDateRelative(3, 9, 0),   // 3 days from now 9am
      endTime: createDateRelative(3, 11, 30),   // 3 days from now 11:30am
      estimatedValue: 150,
      description: 'Furnace not producing heat. Pilot light keeps going out.',
      notes: `[${formatTimestamp(new Date())}] System: May need new thermocouple - bring replacement\n\n[${formatTimestamp(new Date())}] Dispatcher: Urgent - customer has elderly parent at home`,
    },
  ];

  // Completed Jobs for Dalia (yesterday and 2 days ago)
  const completedJobs = [
    {
      customerName: 'Patricia Brown',
      serviceType: 'HVAC',
      startTime: createDateRelative(-1, 11, 0), // Yesterday 11am
      endTime: createDateRelative(-1, 13, 0),   // Yesterday 1pm
      hoursWorked: 2.0,
      isPaid: true,
      estimatedValue: 100,
      description: 'Annual furnace cleaning and filter replacement',
      notes: `[${formatTimestamp(createDateRelative(-1, 11, 0))}] Dispatcher: Regular maintenance customer\n\n[${formatTimestamp(createDateRelative(-1, 13, 0))}] Dalia Grajauskas: Completed routine maintenance. System running well. Recommended new filter in 3 months.`,
    },
    {
      customerName: 'James Peterson',
      serviceType: 'Plumbing',
      startTime: createDateRelative(-2, 16, 0), // 2 days ago 4pm
      endTime: createDateRelative(-2, 18, 30),  // 2 days ago 6:30pm
      hoursWorked: 2.5,
      isPaid: false,
      estimatedValue: 112.5,
      description: 'Clogged main drain line, water backing up in basement',
      notes: `[${formatTimestamp(createDateRelative(-2, 16, 0))}] System: Emergency call\n\n[${formatTimestamp(createDateRelative(-2, 18, 30))}] Dalia Grajauskas: Used snake to clear blockage. Advised customer about tree roots. May need professional drain cleaning soon.`,
    },
  ];

  // Create upcoming jobs
  console.log('\n📅 Creating upcoming jobs for Dalia...');
  for (const job of upcomingJobs) {
    const customerId = createdCustomers[job.customerName];
    const customer = customers.find((c) => c.name === job.customerName)!;

    // Check if job already exists
    const existing = await prisma.job.findFirst({
      where: {
        providerId: PROVIDER_ID,
        customerId,
        startTime: job.startTime,
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
        startTime: job.startTime,
        endTime: job.endTime,
        status: 'scheduled',
        estimatedValue: job.estimatedValue,
        jobInstructions: job.notes,
        customerNotes: job.description,
        assignedUserIds: [dalia.id],
      },
    });

    console.log(`✅ Created: ${job.serviceType} - ${job.customerName} (${job.startTime.toLocaleDateString()})`);
  }

  // Create completed jobs with work logs
  console.log('\n✓ Creating completed jobs with work logs for Dalia...');
  for (const job of completedJobs) {
    const customerId = createdCustomers[job.customerName];
    const customer = customers.find((c) => c.name === job.customerName)!;

    // Check if job already exists
    const existing = await prisma.job.findFirst({
      where: {
        providerId: PROVIDER_ID,
        customerId,
        startTime: job.startTime,
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
        startTime: job.startTime,
        endTime: job.endTime,
        status: 'completed',
        completedAt: job.endTime,
        completedByUserId: dalia.id,
        estimatedValue: job.estimatedValue,
        actualValue: job.estimatedValue,
        jobInstructions: job.notes,
        customerNotes: job.description,
        assignedUserIds: [dalia.id],
        arrivedAt: job.startTime,
        onTheWayAt: new Date(job.startTime.getTime() - 15 * 60 * 1000),
      },
    });

    // Create work log
    await prisma.workLog.create({
      data: {
        jobId: createdJob.id,
        userId: dalia.id,
        providerId: PROVIDER_ID,
        clockIn: job.startTime,
        clockOut: job.endTime,
        hoursWorked: job.hoursWorked,
        earnings: job.hoursWorked * hourlyRate,
        isPaid: job.isPaid,
        paidAt: job.isPaid ? job.endTime : null,
      },
    });

    const earnings = job.hoursWorked * hourlyRate;
    console.log(
      `✅ Created: ${job.serviceType} - ${job.customerName} (${job.startTime.toLocaleDateString()}) - $${earnings.toFixed(2)} ${job.isPaid ? '(Paid)' : '(Pending)'}`
    );
  }

  // Summary
  const totalHours = completedJobs.reduce((sum, j) => sum + j.hoursWorked, 0);
  const totalEarnings = totalHours * hourlyRate;
  const pendingPay = completedJobs.filter((j) => !j.isPaid).reduce((sum, j) => sum + j.hoursWorked * hourlyRate, 0);
  const paidPay = completedJobs.filter((j) => j.isPaid).reduce((sum, j) => sum + j.hoursWorked * hourlyRate, 0);

  console.log('\n════════════════════════════════════════════');
  console.log('📊 SUMMARY FOR DALIA GRAJAUSKAS');
  console.log('════════════════════════════════════════════');
  console.log(`   Worker: Dalia Grajauskas`);
  console.log(`   Worker ID: ${dalia.id}`);
  console.log(`   Email: dalia@fieldcrew.test`);
  console.log(`   Password: dalia123`);
  console.log('');
  console.log(`   📅 Upcoming Jobs: ${upcomingJobs.length}`);
  console.log(`      - Today: 1 job (Plumbing @ 2pm)`);
  console.log(`      - Tomorrow: 2 jobs (Snow Removal @ 6:30am, HVAC @ 1pm)`);
  console.log(`      - In 2 days: 1 job (Electrical @ 10am)`);
  console.log(`      - In 3 days: 1 job (Furnace Repair @ 9am)`);
  console.log('');
  console.log(`   ✓ Completed Jobs: ${completedJobs.length}`);
  console.log(`   ⏱️ Total Hours Worked: ${totalHours.toFixed(1)}h`);
  console.log(`   💰 Total Earned: $${totalEarnings.toFixed(2)}`);
  console.log(`   ✓ Paid: $${paidPay.toFixed(2)}`);
  console.log(`   ⏳ Pending Pay: $${pendingPay.toFixed(2)}`);
  console.log('════════════════════════════════════════════');
  console.log('\n✨ Done! Login as Dalia to see the data.');
  console.log('   Email: dalia@fieldcrew.test');
  console.log('   Password: dalia123');
}

seedDaliaJobs()
  .catch((error) => {
    console.error('❌ Error seeding jobs:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
