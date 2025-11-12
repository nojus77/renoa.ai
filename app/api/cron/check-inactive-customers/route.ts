import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { createInactivityPromotion } from '@/lib/promotions/generatePromoCode';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Starting inactive customer check...');

    const now = new Date();

    // Get all customers with their last job
    const customers = await prisma.customer.findMany({
      include: {
        jobs: {
          orderBy: { startTime: 'desc' },
          take: 1,
          where: {
            status: { in: ['completed', 'in_progress'] }
          }
        },
        promotions: {
          where: {
            status: 'active',
            triggerType: { in: ['inactivity', 'winback'] }
          }
        }
      }
    });

    let created30Day = 0;
    let created60Day = 0;
    let created90Day = 0;

    for (const customer of customers) {
      // Skip if no completed jobs
      if (customer.jobs.length === 0) continue;

      // Skip if already has an active inactivity/winback promotion
      if (customer.promotions.length > 0) continue;

      const lastJob = customer.jobs[0];
      const lastJobDate = new Date(lastJob.startTime);

      // Calculate days since last job
      const daysSinceLastJob = Math.floor(
        (now.getTime() - lastJobDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Generate appropriate promotion
      if (daysSinceLastJob >= 90) {
        await createInactivityPromotion(customer.id, daysSinceLastJob);
        created90Day++;
        console.log(`Created winback promo for customer ${customer.id} (${daysSinceLastJob} days inactive)`);
      } else if (daysSinceLastJob >= 60) {
        await createInactivityPromotion(customer.id, daysSinceLastJob);
        created60Day++;
        console.log(`Created 60-day promo for customer ${customer.id} (${daysSinceLastJob} days inactive)`);
      } else if (daysSinceLastJob >= 30) {
        await createInactivityPromotion(customer.id, daysSinceLastJob);
        created30Day++;
        console.log(`Created 30-day promo for customer ${customer.id} (${daysSinceLastJob} days inactive)`);
      }
    }

    const total = created30Day + created60Day + created90Day;

    return NextResponse.json({
      success: true,
      generated: {
        '30_day': created30Day,
        '60_day': created60Day,
        '90_day': created90Day,
        total
      },
      timestamp: now.toISOString()
    });
  } catch (error) {
    console.error('Error checking inactive customers:', error);
    return NextResponse.json(
      { error: 'Failed to check inactive customers' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
