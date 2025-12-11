/**
 * Seed Worker Schedules, Settings, and Metrics
 *
 * Creates realistic schedule data for all test workers to enable smart scheduling.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const PROVIDER_ID = '25555c94-c1e0-40b9-af19-21a56c9e11bd'; // Premier Outdoor Solutions

async function seedWorkerSchedules() {
  console.log('Seeding worker schedules, settings, and metrics...\n');

  // Get all field workers for this provider
  const workers = await prisma.providerUser.findMany({
    where: {
      providerId: PROVIDER_ID,
      role: 'field',
      status: 'active',
    },
  });

  console.log(`Found ${workers.length} field workers\n`);

  let schedulesCreated = 0;
  let settingsCreated = 0;
  let metricsCreated = 0;

  for (const worker of workers) {
    console.log(`Setting up: ${worker.firstName} ${worker.lastName}`);

    // 1. Create weekly schedule (Monday-Friday, 8am-5pm for most)
    const isEarlyBird = Math.random() > 0.7; // 30% are early birds
    const worksWeekends = Math.random() > 0.8; // 20% work weekends

    const weekdayStart = isEarlyBird ? '07:00' : '08:00';
    const weekdayEnd = isEarlyBird ? '16:00' : '17:00';

    // Create Monday-Friday schedules
    for (let day = 1; day <= 5; day++) {
      await prisma.workerSchedule.upsert({
        where: {
          userId_dayOfWeek: {
            userId: worker.id,
            dayOfWeek: day,
          },
        },
        create: {
          userId: worker.id,
          dayOfWeek: day,
          startTime: weekdayStart,
          endTime: weekdayEnd,
          isAvailable: true,
        },
        update: {
          startTime: weekdayStart,
          endTime: weekdayEnd,
          isAvailable: true,
        },
      });
      schedulesCreated++;
    }

    // Weekend schedules (if they work weekends)
    if (worksWeekends) {
      // Saturday
      await prisma.workerSchedule.upsert({
        where: {
          userId_dayOfWeek: {
            userId: worker.id,
            dayOfWeek: 6,
          },
        },
        create: {
          userId: worker.id,
          dayOfWeek: 6,
          startTime: '08:00',
          endTime: '14:00', // Half day
          isAvailable: true,
        },
        update: {
          startTime: '08:00',
          endTime: '14:00',
          isAvailable: true,
        },
      });
      schedulesCreated++;
    } else {
      // Mark as unavailable
      await prisma.workerSchedule.upsert({
        where: {
          userId_dayOfWeek: {
            userId: worker.id,
            dayOfWeek: 6,
          },
        },
        create: {
          userId: worker.id,
          dayOfWeek: 6,
          startTime: '00:00',
          endTime: '00:00',
          isAvailable: false,
        },
        update: {
          isAvailable: false,
        },
      });
    }

    // Sunday - always off
    await prisma.workerSchedule.upsert({
      where: {
        userId_dayOfWeek: {
          userId: worker.id,
          dayOfWeek: 0,
        },
      },
      create: {
        userId: worker.id,
        dayOfWeek: 0,
        startTime: '00:00',
        endTime: '00:00',
        isAvailable: false,
      },
      update: {
        isAvailable: false,
      },
    });

    // 2. Create worker settings
    const maxHoursPerDay = isEarlyBird ? 9 : 8;
    const maxHoursPerWeek = worksWeekends ? 45 : 40;

    await prisma.workerSettings.upsert({
      where: { userId: worker.id },
      create: {
        userId: worker.id,
        maxHoursPerDay,
        maxHoursPerWeek,
        canWorkWeekends: worksWeekends,
        preferredStartTime: weekdayStart,
        preferredZones: [], // Can add ZIP codes later
        maxTravelDistance: 25 + Math.floor(Math.random() * 15), // 25-40 miles
      },
      update: {
        maxHoursPerDay,
        maxHoursPerWeek,
        canWorkWeekends: worksWeekends,
        preferredStartTime: weekdayStart,
      },
    });
    settingsCreated++;

    // 3. Create worker metrics (initial values)
    await prisma.workerMetrics.upsert({
      where: { userId: worker.id },
      create: {
        userId: worker.id,
        weeklyHours: 0,
        monthlyHours: 0,
        jobsCompleted: Math.floor(Math.random() * 50) + 10, // 10-60 jobs
        avgJobRating: 4.2 + Math.random() * 0.7, // 4.2-4.9 stars
        customerComplaints: Math.floor(Math.random() * 3), // 0-2 complaints
        lateArrivals: Math.floor(Math.random() * 5), // 0-4 late arrivals
      },
      update: {},
    });
    metricsCreated++;

    console.log(`   ✓ Schedule: ${weekdayStart}-${weekdayEnd} M-F${worksWeekends ? ' + Sat' : ''}`);
    console.log(`   ✓ Settings: ${maxHoursPerWeek}h/week max`);
    console.log(`   ✓ Metrics initialized`);
  }

  console.log('\n════════════════════════════════════');
  console.log(`✅ Schedules created: ${schedulesCreated}`);
  console.log(`✅ Settings created: ${settingsCreated}`);
  console.log(`✅ Metrics created: ${metricsCreated}`);
  console.log('════════════════════════════════════');
}

async function seedSampleTimeOff() {
  console.log('\nAdding sample time off requests...\n');

  const workers = await prisma.providerUser.findMany({
    where: {
      providerId: PROVIDER_ID,
      role: 'field',
      status: 'active',
    },
    take: 3, // Just 3 workers with time off
  });

  const today = new Date();
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const twoWeeks = new Date(today);
  twoWeeks.setDate(twoWeeks.getDate() + 14);

  const threeWeeks = new Date(today);
  threeWeeks.setDate(threeWeeks.getDate() + 21);

  let timeOffCreated = 0;

  // Worker 1 - has vacation next week
  if (workers[0]) {
    await prisma.workerTimeOff.create({
      data: {
        userId: workers[0].id,
        startDate: nextWeek,
        endDate: new Date(nextWeek.getTime() + 3 * 24 * 60 * 60 * 1000), // 3 days
        reason: 'vacation',
        notes: 'Family trip to Florida',
        approved: true,
      },
    });
    console.log(`✓ ${workers[0].firstName} - Vacation next week (3 days)`);
    timeOffCreated++;
  }

  // Worker 2 - has doctor appointment in 2 weeks
  if (workers[1]) {
    await prisma.workerTimeOff.create({
      data: {
        userId: workers[1].id,
        startDate: twoWeeks,
        endDate: twoWeeks, // Same day
        reason: 'appointment',
        notes: 'Doctor appointment - morning only',
        approved: true,
      },
    });
    console.log(`✓ ${workers[1].firstName} - Doctor appointment (1 day)`);
    timeOffCreated++;
  }

  // Worker 3 - has vacation in 3 weeks
  if (workers[2]) {
    await prisma.workerTimeOff.create({
      data: {
        userId: workers[2].id,
        startDate: threeWeeks,
        endDate: new Date(threeWeeks.getTime() + 4 * 24 * 60 * 60 * 1000), // 5 days
        reason: 'vacation',
        notes: 'Wedding out of state',
        approved: true,
      },
    });
    console.log(`✓ ${workers[2].firstName} - Vacation in 3 weeks (5 days)`);
    timeOffCreated++;
  }

  console.log(`\n✅ Time off requests created: ${timeOffCreated}`);
}

async function main() {
  try {
    await seedWorkerSchedules();
    await seedSampleTimeOff();
    console.log('\n✅ All done! Smart scheduler foundation is ready.');
  } catch (error) {
    console.error('Error seeding worker schedules:', error);
    throw error;
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
