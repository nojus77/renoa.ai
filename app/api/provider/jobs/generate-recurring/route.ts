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

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get('providerId');

    if (!providerId) {
      return NextResponse.json(
        { error: 'providerId is required' },
        { status: 400 }
      );
    }

    const now = new Date();
    let jobsCreated = 0;

    // Find all recurring jobs for this provider
    const recurringJobs = await prisma.job.findMany({
      where: {
        providerId,
        isRecurring: true,
        OR: [
          { recurringEndDate: null }, // No end date
          { recurringEndDate: { gte: now } }, // End date in the future
        ],
      },
      include: {
        customer: true,
      },
    });

    console.log(`📅 Found ${recurringJobs.length} recurring jobs for provider ${providerId}`);

    for (const parentJob of recurringJobs) {
      if (!parentJob.recurringFrequency) {
        console.log(`⚠️ Skipping job ${parentJob.id} - no frequency set`);
        continue;
      }

      // Find the most recent occurrence of this recurring job
      // This could be either the parent job itself or a child job
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
          estimatedValue: parentJob.estimatedValue,
          internalNotes: parentJob.internalNotes,
          customerNotes: parentJob.customerNotes,
          isRecurring: false, // Child jobs are not themselves recurring
          parentRecurringJobId: parentJob.id, // Link to parent
        },
      });

      console.log(
        `✅ Created recurring job instance ${newJob.id} for ${nextOccurrenceDate.toISOString()}`
      );
      jobsCreated++;
    }

    return NextResponse.json({
      success: true,
      message: `Generated ${jobsCreated} recurring job(s)`,
      jobsCreated,
    });
  } catch (error) {
    console.error('❌ Error generating recurring jobs:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate recurring jobs',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
