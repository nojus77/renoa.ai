import { PrismaClient } from '@prisma/client';
import { format } from 'date-fns';

const prisma = new PrismaClient();

const PROVIDER_ID = '25555c94-c1e0-40b9-af19-21a56c9e11bd'; // Premier Outdoor Solutions

async function fixJobTimes() {
  console.log('Finding all jobs on Dec 12...\n');

  // Get ALL jobs on Dec 12 (any time)
  const jobs = await prisma.job.findMany({
    where: {
      providerId: PROVIDER_ID,
      startTime: {
        gte: new Date('2025-12-12T00:00:00Z'),
        lt: new Date('2025-12-13T00:00:00Z')
      }
    },
    orderBy: { serviceType: 'asc' }
  });

  console.log(`Found ${jobs.length} jobs\n`);

  if (jobs.length === 0) {
    console.log('❌ No jobs found on Dec 12 for Premier Outdoor Solutions');
    console.log('   Provider ID:', PROVIDER_ID);
    return;
  }

  // Fix times for Dec 12 jobs (should be 9am-2pm EST = 14:00-19:00 UTC)
  const targetStartHours = [9, 10, 11, 12, 13, 14]; // EST

  for (let i = 0; i < jobs.length; i++) {
    const job = jobs[i];
    const oldStart = new Date(job.startTime);
    const oldEnd = new Date(job.endTime);

    const targetHour = targetStartHours[i] || (9 + i);

    // Create new time: Dec 12, targetHour:00 AM EST = (targetHour + 5) UTC
    const newStart = new Date('2025-12-12T00:00:00Z');
    newStart.setUTCHours(targetHour + 5, 0, 0, 0);

    const newEnd = new Date(newStart);
    const duration = (oldEnd.getTime() - oldStart.getTime()) / (1000 * 60); // minutes
    newEnd.setMinutes(newStart.getMinutes() + duration);

    console.log(`${job.serviceType}:`);
    console.log(`  OLD: ${oldStart.toISOString()} (${format(oldStart, 'h:mm a')})`);
    console.log(`  NEW: ${newStart.toISOString()} (${targetHour}:00 AM EST)`);
    console.log(`  Duration: ${duration} minutes`);

    await prisma.job.update({
      where: { id: job.id },
      data: {
        startTime: newStart,
        endTime: newEnd
      }
    });

    console.log(`  ✅ Updated\n`);
  }

  console.log('\n✅ Done! All jobs are now 9am-2pm EST on Dec 12');
  console.log('   (Stored as 14:00-19:00 UTC in database)');
}

fixJobTimes()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
