import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { startOfWeek, startOfDay, endOfDay } from 'date-fns';

const prisma = new PrismaClient();

/**
 * GET /api/provider/crews
 * List all crews for a provider
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const providerId = searchParams.get('providerId');

    if (!providerId) {
      return NextResponse.json(
        { error: 'Provider ID required' },
        { status: 400 }
      );
    }

    const crews = await prisma.crew.findMany({
      where: {
        providerId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Get week start for stats calculation
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });

    // Fetch user details and stats for each crew
    const crewsWithStats = await Promise.all(
      crews.map(async (crew) => {
        const users = await prisma.providerUser.findMany({
          where: {
            id: { in: crew.userIds },
          },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            profilePhotoUrl: true,
            color: true,
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
            },
          },
        });

        // Calculate hours this week for each member
        const usersWithStats = await Promise.all(users.map(async (user) => {
          const jobs = await prisma.job.findMany({
            where: {
              assignedUserIds: { has: user.id },
              startTime: { gte: weekStart },
            },
            select: {
              startTime: true,
              endTime: true,
            },
          });

          const hoursThisWeek = jobs.reduce((sum, job) => {
            const hours = (new Date(job.endTime).getTime() - new Date(job.startTime).getTime()) / (1000 * 60 * 60);
            return sum + hours;
          }, 0);

          return {
            ...user,
            hoursThisWeek: Math.round(hoursThisWeek * 10) / 10,
          };
        }));

        // Get jobs assigned to this crew this week
        const crewJobs = await prisma.job.count({
          where: {
            assignedCrewId: crew.id,
            startTime: { gte: weekStart },
          },
        });

        // Get next upcoming job for this crew
        const now = new Date();
        const nextJob = await prisma.job.findFirst({
          where: {
            assignedCrewId: crew.id,
            startTime: { gte: now },
            status: { in: ['scheduled', 'confirmed'] },
          },
          orderBy: { startTime: 'asc' },
          select: {
            id: true,
            startTime: true,
            serviceType: true,
            customer: {
              select: {
                name: true,
              },
            },
          },
        });

        // Get unassigned jobs for today (that could go to this crew)
        const todayStart = startOfDay(now);
        const todayEnd = endOfDay(now);
        const unassignedToday = await prisma.job.count({
          where: {
            providerId: crew.providerId,
            startTime: { gte: todayStart, lte: todayEnd },
            assignedCrewId: null,
            assignedUserIds: { isEmpty: true },
          },
        });

        // Get all unique skills from crew members
        const crewSkills = [...new Set(usersWithStats.flatMap(m =>
          m.workerSkills?.map(ws => ws.skill.name) || []
        ))];

        return {
          ...crew,
          users: usersWithStats,
          memberCount: crew.userIds.length,
          jobsThisWeek: crewJobs,
          nextJob,
          unassignedToday,
          skills: crewSkills,
        };
      })
    );

    return NextResponse.json({ crews: crewsWithStats });
  } catch (error) {
    console.error('Error fetching crews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch crews' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/provider/crews
 * Create a new crew
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { providerId, name, userIds = [], leaderId, color = '#10b981' } = body;

    if (!providerId || !name) {
      return NextResponse.json(
        { error: 'Missing required fields: providerId, name' },
        { status: 400 }
      );
    }

    // Verify all user IDs belong to this provider
    if (userIds.length > 0) {
      const users = await prisma.providerUser.findMany({
        where: {
          id: { in: userIds },
          providerId,
        },
      });

      if (users.length !== userIds.length) {
        return NextResponse.json(
          { error: 'Some user IDs do not belong to this provider' },
          { status: 400 }
        );
      }
    }

    // Verify leader ID if provided
    if (leaderId && !userIds.includes(leaderId)) {
      return NextResponse.json(
        { error: 'Leader must be a member of the crew' },
        { status: 400 }
      );
    }

    const crew = await prisma.crew.create({
      data: {
        providerId,
        name,
        userIds,
        leaderId,
        color,
      },
    });

    // Fetch user details
    const users = await prisma.providerUser.findMany({
      where: {
        id: { in: crew.userIds },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        profilePhotoUrl: true,
      },
    });

    return NextResponse.json({
      success: true,
      crew: {
        ...crew,
        users,
        memberCount: crew.userIds.length,
      },
    });
  } catch (error) {
    console.error('Error creating crew:', error);
    return NextResponse.json(
      { error: 'Failed to create crew' },
      { status: 500 }
    );
  }
}
