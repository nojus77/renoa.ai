import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get('providerId');
    const alertType = searchParams.get('alertType');

    if (!providerId) {
      return NextResponse.json(
        { error: 'Provider ID is required' },
        { status: 400 }
      );
    }

    if (!alertType) {
      return NextResponse.json(
        { error: 'Alert type is required' },
        { status: 400 }
      );
    }

    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    const next7Days = new Date(todayEnd);
    next7Days.setDate(next7Days.getDate() + 7);

    let jobs: any[] = [];

    switch (alertType) {
      case 'schedule-conflicts': {
        // Get all jobs in next 7 days with their assigned workers
        const upcomingJobs = await prisma.job.findMany({
          where: {
            providerId,
            status: { notIn: ['completed', 'cancelled', 'no_show'] },
            startTime: { gte: todayStart, lte: next7Days },
          },
          include: {
            customer: { select: { name: true } },
          },
          orderBy: { startTime: 'asc' },
        });

        // Find conflicting jobs (same worker, overlapping times)
        const conflictingJobIds = new Set<string>();
        for (let i = 0; i < upcomingJobs.length; i++) {
          for (let j = i + 1; j < upcomingJobs.length; j++) {
            const job1 = upcomingJobs[i];
            const job2 = upcomingJobs[j];
            // Check if they share any worker
            const sharedWorkers = job1.assignedUserIds.filter(id => job2.assignedUserIds.includes(id));
            if (sharedWorkers.length > 0) {
              // Check time overlap
              if (job1.startTime < job2.endTime && job2.startTime < job1.endTime) {
                conflictingJobIds.add(job1.id);
                conflictingJobIds.add(job2.id);
              }
            }
          }
        }

        jobs = upcomingJobs
          .filter(job => conflictingJobIds.has(job.id))
          .map(job => ({
            id: job.id,
            customerName: job.customer?.name || 'Unknown Customer',
            serviceType: job.serviceType,
            address: job.address,
            startTime: job.startTime.toISOString(),
            endTime: job.endTime?.toISOString(),
            status: job.status,
            amount: job.actualValue || job.estimatedValue || null,
          }));
        break;
      }

      case 'overdue-jobs': {
        const overdueJobs = await prisma.job.findMany({
          where: {
            providerId,
            status: { in: ['scheduled', 'in_progress'] },
            endTime: { lt: now },
          },
          include: {
            customer: { select: { name: true } },
          },
          orderBy: { endTime: 'desc' },
          take: 20,
        });

        // Get worker names
        const userIds = Array.from(new Set(overdueJobs.flatMap(job => job.assignedUserIds)));
        const users = userIds.length > 0 ? await prisma.providerUser.findMany({
          where: { id: { in: userIds } },
          select: { id: true, firstName: true, lastName: true },
        }) : [];
        const userMap = new Map(users.map(u => [u.id, `${u.firstName} ${u.lastName}`]));

        jobs = overdueJobs.map(job => ({
          id: job.id,
          customerName: job.customer?.name || 'Unknown Customer',
          serviceType: job.serviceType,
          address: job.address,
          startTime: job.startTime.toISOString(),
          endTime: job.endTime?.toISOString(),
          status: job.status,
          amount: job.actualValue || job.estimatedValue || null,
          workerName: job.assignedUserIds.length > 0 ? userMap.get(job.assignedUserIds[0]) || null : null,
        }));
        break;
      }

      case 'unconfirmed-soon': {
        const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
        const unconfirmedJobs = await prisma.job.findMany({
          where: {
            providerId,
            status: 'pending',
            startTime: { gte: now, lte: twoHoursFromNow },
          },
          include: {
            customer: { select: { name: true } },
          },
          orderBy: { startTime: 'asc' },
        });

        // Get worker names
        const userIds = Array.from(new Set(unconfirmedJobs.flatMap(job => job.assignedUserIds)));
        const users = userIds.length > 0 ? await prisma.providerUser.findMany({
          where: { id: { in: userIds } },
          select: { id: true, firstName: true, lastName: true },
        }) : [];
        const userMap = new Map(users.map(u => [u.id, `${u.firstName} ${u.lastName}`]));

        jobs = unconfirmedJobs.map(job => ({
          id: job.id,
          customerName: job.customer?.name || 'Unknown Customer',
          serviceType: job.serviceType,
          address: job.address,
          startTime: job.startTime.toISOString(),
          endTime: job.endTime?.toISOString(),
          status: job.status,
          amount: job.actualValue || job.estimatedValue || null,
          workerName: job.assignedUserIds.length > 0 ? userMap.get(job.assignedUserIds[0]) || null : null,
        }));
        break;
      }

      case 'unassigned-jobs': {
        const unassignedJobs = await prisma.job.findMany({
          where: {
            providerId,
            status: { in: ['scheduled', 'pending'] },
            startTime: { gte: todayStart, lte: next7Days },
            assignedUserIds: { isEmpty: true },
          },
          include: {
            customer: { select: { name: true } },
          },
          orderBy: { startTime: 'asc' },
        });

        jobs = unassignedJobs.map(job => ({
          id: job.id,
          customerName: job.customer?.name || 'Unknown Customer',
          serviceType: job.serviceType,
          address: job.address,
          startTime: job.startTime.toISOString(),
          endTime: job.endTime?.toISOString(),
          status: job.status,
          amount: job.actualValue || job.estimatedValue || null,
          workerName: null,
        }));
        break;
      }

      case 'overdue-invoices': {
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const overdueInvoices = await prisma.invoice.findMany({
          where: {
            providerId,
            status: { in: ['sent', 'viewed', 'overdue'] },
            dueDate: { lt: thirtyDaysAgo },
          },
          include: {
            customer: { select: { name: true } },
            jobs: { select: { serviceType: true, address: true } },
          },
          orderBy: { dueDate: 'asc' },
          take: 20,
        });

        // For invoices, return invoice-like structure
        jobs = overdueInvoices.map(invoice => ({
          id: invoice.id,
          customerName: invoice.customer?.name || 'Unknown Customer',
          serviceType: invoice.jobs?.serviceType || 'Invoice',
          address: invoice.jobs?.address || '',
          startTime: invoice.dueDate.toISOString(),
          status: invoice.status,
          amount: Number(invoice.total),
        }));
        break;
      }

      case 'today-jobs': {
        const todaysJobs = await prisma.job.findMany({
          where: {
            providerId,
            startTime: { gte: todayStart, lte: todayEnd },
            status: { notIn: ['cancelled'] },
          },
          include: {
            customer: { select: { name: true, phone: true } },
          },
          orderBy: { startTime: 'asc' },
        });

        // Get worker names
        const userIds = Array.from(new Set(todaysJobs.flatMap(job => job.assignedUserIds)));
        const users = userIds.length > 0 ? await prisma.providerUser.findMany({
          where: { id: { in: userIds } },
          select: { id: true, firstName: true, lastName: true },
        }) : [];
        const userMap = new Map(users.map(u => [u.id, `${u.firstName} ${u.lastName}`]));

        jobs = todaysJobs.map(job => ({
          id: job.id,
          customerName: job.customer?.name || 'Unknown Customer',
          serviceType: job.serviceType,
          address: job.address,
          startTime: job.startTime.toISOString(),
          endTime: job.endTime?.toISOString(),
          status: job.status,
          amount: job.actualValue || job.estimatedValue || null,
          workerName: job.assignedUserIds.length > 0
            ? job.assignedUserIds.map(id => userMap.get(id)).filter(Boolean).join(', ')
            : null,
          phone: job.customer?.phone || '',
        }));
        break;
      }

      default:
        return NextResponse.json(
          { error: 'Invalid alert type' },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true, jobs });
  } catch (error) {
    console.error('Error fetching alert jobs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch alert jobs' },
      { status: 500 }
    );
  }
}
