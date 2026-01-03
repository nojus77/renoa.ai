import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { startOfWeek, isSameDay } from 'date-fns';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const providerId = searchParams.get('providerId');

    // Pagination params
    const cursor = searchParams.get('cursor');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!providerId) {
      return NextResponse.json(
        { error: 'Provider ID required' },
        { status: 400 }
      );
    }

    // Fetch team members for this provider with pagination
    const users = await prisma.providerUser.findMany({
      where: {
        providerId,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        status: true,
        skills: true,
        color: true,
        hourlyRate: true,
        workingHours: true,
        createdAt: true,
        updatedAt: true,
        profilePhotoUrl: true,
        canCreateJobs: true,
        jobsNeedApproval: true,
        workerSkills: {
          include: {
            skill: {
              select: {
                id: true,
                name: true,
                category: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
      orderBy: [
        { role: 'asc' }, // Owners first
        { createdAt: 'asc' },
      ],
      take: limit + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    });

    // Check if there are more results
    const hasMore = users.length > limit;
    const usersToProcess = hasMore ? users.slice(0, -1) : users;
    const nextCursor = hasMore ? usersToProcess[usersToProcess.length - 1]?.id : null;

    // Add stats for each member
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }); // Monday
    const today = new Date();

    const usersWithStats = await Promise.all(usersToProcess.map(async (user) => {
      // Only calculate stats for field workers
      if (user.role !== 'field') {
        return {
          ...user,
          hoursThisWeek: 0,
          jobsCompleted: 0,
          availableToday: true,
        };
      }

      // Get shifts for this worker this week (actual clocked hours)
      const shifts = await prisma.workerShift.findMany({
        where: {
          userId: user.id,
          providerId,
          clockIn: { gte: weekStart },
        },
        select: {
          clockIn: true,
          clockOut: true,
          hoursWorked: true,
        },
      });

      // Calculate actual clocked hours this week
      let hoursThisWeek = 0;
      for (const shift of shifts) {
        if (shift.clockOut && shift.hoursWorked) {
          // Completed shift - use stored hours
          hoursThisWeek += shift.hoursWorked;
        } else if (!shift.clockOut) {
          // Active shift - calculate elapsed time
          const elapsed = (new Date().getTime() - new Date(shift.clockIn).getTime()) / (1000 * 60 * 60);
          hoursThisWeek += elapsed;
        }
      }

      // Get jobs for this worker (for availability calculation)
      const jobs = await prisma.job.findMany({
        where: {
          assignedUserIds: { has: user.id },
          startTime: { gte: weekStart },
        },
        select: {
          startTime: true,
          endTime: true,
          status: true,
        },
      });

      // Count completed jobs (all time)
      const jobsCompleted = await prisma.job.count({
        where: {
          assignedUserIds: { has: user.id },
          status: 'completed',
        },
      });

      // Check availability today
      const todayJobs = jobs.filter(j => isSameDay(new Date(j.startTime), today));
      const todayHours = todayJobs.reduce((sum, job) => {
        const hours = (new Date(job.endTime).getTime() - new Date(job.startTime).getTime()) / (1000 * 60 * 60);
        return sum + hours;
      }, 0);
      const availableToday = todayHours < 8; // Available if working less than 8 hours today

      // Get next upcoming job
      const nextJob = await prisma.job.findFirst({
        where: {
          assignedUserIds: { has: user.id },
          startTime: { gte: today },
          status: { in: ['scheduled', 'confirmed'] },
        },
        orderBy: { startTime: 'asc' },
        select: {
          id: true,
          startTime: true,
          serviceType: true,
        },
      });

      // Check if worker is currently clocked in
      const isClockedIn = shifts.some(s => !s.clockOut);

      return {
        ...user,
        hoursThisWeek: Math.round(hoursThisWeek * 10) / 10,
        jobsCompleted,
        availableToday,
        isClockedIn,
        nextJob,
      };
    }));

    return NextResponse.json({
      users: usersWithStats,
      nextCursor,
      hasMore,
    });
  } catch (error) {
    console.error('Error fetching team members:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team members' },
      { status: 500 }
    );
  }
}
