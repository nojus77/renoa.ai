import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixEarnings() {
  console.log('Fetching work logs with $0 earnings...');

  const workLogs = await prisma.workLog.findMany({
    where: {
      OR: [{ earnings: 0 }, { earnings: null }],
      clockOut: { not: null }, // Only completed jobs
    },
    include: {
      job: { select: { id: true, actualValue: true, estimatedValue: true, assignedUserIds: true, serviceType: true } },
      user: { select: { id: true, firstName: true, lastName: true, payType: true, hourlyRate: true, commissionRate: true } }
    }
  });

  console.log(`Found ${workLogs.length} work logs with $0 earnings\n`);

  let fixedCount = 0;
  let skippedCount = 0;

  for (const log of workLogs) {
    const jobValue = Number(log.job.actualValue || log.job.estimatedValue || 0);
    const workerCount = log.job.assignedUserIds?.length || 1;
    const workerShare = jobValue / workerCount;

    let earnings = 0;
    let reason = '';

    if (log.user.payType === 'commission' && log.user.commissionRate) {
      earnings = workerShare * (log.user.commissionRate / 100);
      reason = `${log.user.commissionRate}% of $${workerShare.toFixed(2)} share`;
    } else if (log.user.payType === 'hourly' && log.user.hourlyRate) {
      earnings = (log.hoursWorked || 0) * log.user.hourlyRate;
      reason = `${log.hoursWorked?.toFixed(2)}h × $${log.user.hourlyRate}/hr`;
    }

    earnings = Math.round(earnings * 100) / 100;

    if (earnings > 0) {
      await prisma.workLog.update({
        where: { id: log.id },
        data: { earnings }
      });
      console.log(`✓ Fixed: ${log.user.firstName} ${log.user.lastName} - ${log.job.serviceType}`);
      console.log(`  Job: $${jobValue} / ${workerCount} workers = $${workerShare.toFixed(2)} → ${reason} = $${earnings.toFixed(2)}`);
      fixedCount++;
    } else {
      console.log(`○ Skipped: ${log.user.firstName} ${log.user.lastName} - ${log.job.serviceType}`);
      console.log(`  Reason: No pay config (payType: ${log.user.payType}, hourlyRate: ${log.user.hourlyRate}, commissionRate: ${log.user.commissionRate})`);
      skippedCount++;
    }
  }

  console.log(`\n========================================`);
  console.log(`Fixed: ${fixedCount} work logs`);
  console.log(`Skipped: ${skippedCount} work logs (no pay config)`);
  console.log(`========================================`);

  await prisma.$disconnect();
}

fixEarnings().catch(console.error);
