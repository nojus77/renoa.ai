import { PrismaClient } from '@prisma/client';
import { subDays, addHours, setHours, setMinutes } from 'date-fns';

const prisma = new PrismaClient();

// Provider ID for Elite Climate Control - adjust if needed
const PROVIDER_ID = process.env.SEED_PROVIDER_ID || '25555c94-c1e0-40b9-af19-21a56c9e11bd';

// HVAC service types
const serviceTypes = [
  'HVAC Maintenance',
  'Furnace Repair',
  'AC Installation',
  'AC Repair',
  'Furnace Installation',
  'Duct Cleaning',
  'Heat Pump Service',
  'Thermostat Installation',
];

// Chicago customer data for test jobs
const testJobCustomers = [
  { name: 'Michael Thompson', phone: '(773) 555-1201', address: '6234 N Oleander Ave, Chicago, IL 60631' },
  { name: 'Sarah Johnson', phone: '(773) 555-1202', address: '5847 N Kostner Ave, Chicago, IL 60646' },
  { name: 'Robert Williams', phone: '(773) 555-1203', address: '10234 S Longwood Dr, Chicago, IL 60643' },
  { name: 'Jennifer Davis', phone: '(773) 555-1204', address: '3456 W 111th St, Chicago, IL 60655' },
  { name: 'Christopher Brown', phone: '(773) 555-1205', address: '6712 N Olcott Ave, Chicago, IL 60631' },
  { name: 'Amanda Martinez', phone: '(773) 555-1206', address: '9876 S Hamilton Ave, Chicago, IL 60643' },
  { name: 'David Anderson', phone: '(773) 555-1207', address: '5423 N Keeler Ave, Chicago, IL 60630' },
  { name: 'Lisa Wilson', phone: '(773) 555-1208', address: '6543 N Northwest Hwy, Chicago, IL 60631' },
  { name: 'James Taylor', phone: '(773) 555-1209', address: '11234 S Homan Ave, Chicago, IL 60655' },
  { name: 'Maria Garcia', phone: '(773) 555-1210', address: '9567 S Hoyne Ave, Chicago, IL 60643' },
  { name: 'Kevin Murphy', phone: '(773) 555-1211', address: '7890 N Central Ave, Chicago, IL 60646' },
  { name: 'Patricia Lee', phone: '(773) 555-1212', address: '4532 W 103rd St, Chicago, IL 60655' },
  { name: 'Brian Clark', phone: '(773) 555-1213', address: '8765 S Western Ave, Chicago, IL 60643' },
  { name: 'Nancy Rodriguez', phone: '(773) 555-1214', address: '6321 N Nagle Ave, Chicago, IL 60631' },
  { name: 'Steven White', phone: '(773) 555-1215', address: '5678 N Cicero Ave, Chicago, IL 60646' },
];

// Generate random amount between min and max
function randomAmount(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Pick random item from array
function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Generate a random time on a given date (between 8am and 5pm)
function randomWorkTime(date: Date): Date {
  const hour = 8 + Math.floor(Math.random() * 9); // 8am to 4pm
  const minute = Math.floor(Math.random() * 4) * 15; // 0, 15, 30, or 45
  return setMinutes(setHours(date, hour), minute);
}

async function seedTestJobs() {
  console.log('🔧 Seeding test jobs for Elite Climate Control...\n');

  // Verify provider exists
  const provider = await prisma.provider.findUnique({
    where: { id: PROVIDER_ID },
    select: { id: true, businessName: true },
  });

  if (!provider) {
    console.error(`❌ Provider not found with ID: ${PROVIDER_ID}`);
    console.log('Please set SEED_PROVIDER_ID environment variable or update the script.');
    process.exit(1);
  }

  console.log(`✅ Found provider: ${provider.businessName}\n`);

  // Get or create test worker
  let testWorker = await prisma.providerUser.findFirst({
    where: {
      providerId: PROVIDER_ID,
      firstName: 'John',
      lastName: 'Smith',
    },
  });

  if (!testWorker) {
    console.log('📋 Creating test worker John Smith...');
    testWorker = await prisma.providerUser.create({
      data: {
        providerId: PROVIDER_ID,
        firstName: 'John',
        lastName: 'Smith',
        email: 'test.johnsmith@eliteclimate.example.com',
        phone: '(773) 555-9999',
        role: 'worker',
        passwordHash: 'test-worker-no-login', // Worker doesn't need to log in
      },
    });
    console.log('✅ Created test worker: John Smith\n');
  } else {
    console.log('✅ Found existing test worker: John Smith\n');
  }

  // Generate job dates: mix of last month, last week, this week, and today
  const now = new Date();
  const jobDates: { date: Date; weight: number }[] = [];

  // Last month: 5 jobs
  for (let i = 25; i <= 30; i++) {
    jobDates.push({ date: subDays(now, i), weight: 0.25 });
  }

  // Last week: 8 jobs
  for (let i = 7; i <= 14; i++) {
    jobDates.push({ date: subDays(now, i), weight: 0.4 });
  }

  // This week: 5 jobs
  for (let i = 1; i <= 6; i++) {
    jobDates.push({ date: subDays(now, i), weight: 0.35 });
  }

  // Today: 2 scheduled jobs
  jobDates.push({ date: now, weight: 0.1 });
  jobDates.push({ date: now, weight: 0.1 });

  console.log('📋 Creating test jobs...\n');

  let created = 0;
  const usedCustomers = new Set<number>();

  // Create 18 test jobs
  for (let i = 0; i < 18; i++) {
    // Pick a unique customer for each job
    let customerIndex: number;
    do {
      customerIndex = Math.floor(Math.random() * testJobCustomers.length);
    } while (usedCustomers.has(customerIndex) && usedCustomers.size < testJobCustomers.length);
    usedCustomers.add(customerIndex);
    if (usedCustomers.size >= testJobCustomers.length) usedCustomers.clear();

    const customerData = testJobCustomers[customerIndex];

    // Find or create customer
    let customer = await prisma.customer.findFirst({
      where: {
        providerId: PROVIDER_ID,
        name: `TEST JOB - ${customerData.name}`,
      },
    });

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          providerId: PROVIDER_ID,
          name: `TEST JOB - ${customerData.name}`,
          email: `testjob.${customerData.name.toLowerCase().replace(/\s+/g, '')}@example.com`,
          phone: customerData.phone,
          address: customerData.address,
          source: 'test-seed',
          tags: ['test-job'],
        },
      });
    }

    // Pick job date
    const jobDateEntry = jobDates[Math.min(i, jobDates.length - 1)];
    const startTime = randomWorkTime(jobDateEntry.date);
    const duration = randomItem([1, 1.5, 2, 2.5, 3]); // 1-3 hours
    const endTime = addHours(startTime, duration);

    // Determine status (90% completed, 10% scheduled)
    const isCompleted = i < 16; // First 16 are completed, last 2 are scheduled
    const status = isCompleted ? 'completed' : 'scheduled';

    // Generate amount
    const estimatedValue = randomAmount(150, 800);
    const actualValue = isCompleted ? estimatedValue + randomAmount(-50, 100) : null;

    const serviceType = randomItem(serviceTypes);

    const job = await prisma.job.create({
      data: {
        providerId: PROVIDER_ID,
        customerId: customer.id,
        serviceType,
        address: customerData.address,
        startTime,
        endTime,
        status,
        estimatedValue,
        actualValue,
        assignedUserIds: [testWorker.id],
        source: 'test-seed',
        internalNotes: `Test job #${i + 1} - ${serviceType}`,
      },
    });

    const statusEmoji = isCompleted ? '✅' : '📅';
    console.log(`${statusEmoji} Created: ${serviceType} for ${customerData.name} ($${actualValue || estimatedValue}) - ${status}`);
    created++;
  }

  console.log('\n════════════════════════════════════════════');
  console.log('📊 SUMMARY');
  console.log('════════════════════════════════════════════');
  console.log(`   Provider: ${provider.businessName}`);
  console.log(`   Created: ${created} test jobs`);
  console.log(`   Completed: 16 jobs`);
  console.log(`   Scheduled: 2 jobs`);
  console.log(`   Worker: John Smith`);
  console.log('════════════════════════════════════════════\n');

  // Show job stats
  const stats = await prisma.job.groupBy({
    by: ['status'],
    where: {
      providerId: PROVIDER_ID,
      source: 'test-seed',
    },
    _count: true,
    _sum: { actualValue: true, estimatedValue: true },
  });

  console.log('📋 Test jobs by status:\n');
  for (const stat of stats) {
    const revenue = stat._sum.actualValue || stat._sum.estimatedValue || 0;
    console.log(`   ${stat.status}: ${stat._count} jobs ($${revenue.toLocaleString()})`);
  }

  console.log('\n✨ Done! Test jobs are ready for dashboard testing.\n');
}

seedTestJobs()
  .catch((e) => {
    console.error('Error seeding test jobs:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
