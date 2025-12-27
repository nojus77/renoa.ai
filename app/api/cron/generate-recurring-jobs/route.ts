import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Helper function to calculate next occurrence date based on frequency
function calculateNextOccurrence(lastDate: Date, frequency: string): Date {
  const nextDate = new Date(lastDate);

  switch (frequency) {
    case 'weekly':
      nextDate.setDate(nextDate.getDate() + 7);
      break;
    case 'biweekly':
      nextDate.setDate(nextDate.getDate() + 14);
      break;
    case 'monthly':
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
    case 'quarterly':
      nextDate.setMonth(nextDate.getMonth() + 3);
      break;
    default:
      throw new Error(`Unknown frequency: ${frequency}`);
  }

  return nextDate;
}

export async function GET(request: NextRequest) {
  try {
    // Verify authorization from Vercel Cron
    const authHeader = request.headers.get('authorization');
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

    if (authHeader !== expectedAuth) {
      console.error('❌ Unauthorized cron request');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('🤖 Starting automatic recurring job generation...');
    const now = new Date();
    let totalJobsCreated = 0;
    const providerSummary: Record<string, number> = {};

    // Find all recurring jobs across ALL providers
    const recurringJobs = await prisma.job.findMany({
      where: {
        isRecurring: true,
        OR: [
          { recurringEndDate: null }, // No end date
          { recurringEndDate: { gte: now } }, // End date in the future
        ],
      },
      include: {
        customer: true,
        provider: true,
      },
    });

    console.log(`📅 Found ${recurringJobs.length} recurring jobs across all providers`);

    for (const parentJob of recurringJobs) {
      if (!parentJob.recurringFrequency) {
        console.log(`⚠️ Skipping job ${parentJob.id} - no frequency set`);
        continue;
      }

      // Find the most recent occurrence of this recurring job
      const latestOccurrence = await prisma.job.findFirst({
        where: {
          OR: [
            { id: parentJob.id }, // The parent job itself
            { parentRecurringJobId: parentJob.id }, // Child jobs
          ],
        },
        orderBy: {
          startTime: 'desc',
        },
      });

      if (!latestOccurrence) {
        console.log(`⚠️ No latest occurrence found for job ${parentJob.id}`);
        continue;
      }

      // Calculate when the next occurrence should be
      const nextOccurrenceDate = calculateNextOccurrence(
        latestOccurrence.startTime,
        parentJob.recurringFrequency
      );

      // Only create if next occurrence is due (within the next 24 hours)
      const hoursDiff = (nextOccurrenceDate.getTime() - now.getTime()) / (1000 * 60 * 60);

      if (hoursDiff > 24) {
        console.log(
          `⏭️ Next occurrence for job ${parentJob.id} is in ${Math.round(hoursDiff)} hours - skipping`
        );
        continue;
      }

      // Check if end date has passed
      if (parentJob.recurringEndDate && nextOccurrenceDate > parentJob.recurringEndDate) {
        console.log(
          `🛑 Job ${parentJob.id} has reached its end date - skipping`
        );
        continue;
      }

      // Check if a job already exists for this next occurrence
      const existingJob = await prisma.job.findFirst({
        where: {
          parentRecurringJobId: parentJob.id,
          startTime: {
            gte: new Date(nextOccurrenceDate.getTime() - 60 * 60 * 1000), // Within 1 hour before
            lte: new Date(nextOccurrenceDate.getTime() + 60 * 60 * 1000), // Within 1 hour after
          },
        },
      });

      if (existingJob) {
        console.log(
          `✅ Job already exists for next occurrence of ${parentJob.id} - skipping`
        );
        continue;
      }

      // Calculate end time based on duration
      const duration = (latestOccurrence.endTime.getTime() - latestOccurrence.startTime.getTime()) / (1000 * 60 * 60);
      const nextEndTime = new Date(nextOccurrenceDate.getTime() + duration * 60 * 60 * 1000);

      // Create the new recurring job instance
      const newJob = await prisma.job.create({
        data: {
          providerId: parentJob.providerId,
          customerId: parentJob.customerId,
          serviceType: parentJob.serviceType,
          address: parentJob.address,
          startTime: nextOccurrenceDate,
          endTime: nextEndTime,
          status: 'scheduled',
          source: parentJob.source,
          appointmentType: parentJob.appointmentType || 'anytime', // Copy from parent
          estimatedValue: parentJob.estimatedValue,
          jobInstructions: parentJob.jobInstructions,
          customerNotes: parentJob.customerNotes,
          isRecurring: false, // Child jobs are not themselves recurring
          parentRecurringJobId: parentJob.id, // Link to parent
        },
      });

      console.log(
        `✅ Created recurring job ${newJob.id} for provider ${parentJob.providerId} on ${nextOccurrenceDate.toISOString()}`
      );

      totalJobsCreated++;

      // Track per-provider summary
      const providerName = parentJob.provider.businessName || parentJob.providerId;
      providerSummary[providerName] = (providerSummary[providerName] || 0) + 1;
    }

    console.log(`🎉 Cron job complete! Created ${totalJobsCreated} recurring jobs`);
    console.log('📊 Provider summary:', providerSummary);

    return NextResponse.json({
      success: true,
      message: `Generated ${totalJobsCreated} recurring job(s) across ${Object.keys(providerSummary).length} provider(s)`,
      totalJobsCreated,
      providerSummary,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error('❌ Error in recurring job cron:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate recurring jobs',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
