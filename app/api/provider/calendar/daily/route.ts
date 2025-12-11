import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface WorkerJob {
  id: string;
  serviceType: string;
  customerName: string;
  customerAddress: string;
  startTime: Date;
  endTime: Date;
  status: string;
  address: string;
}

interface WorkerData {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  photo: string | null;
  color: string;
  role: string;
  workingHours: { start: string; end: string };
  jobs: WorkerJob[];
  capacity: { scheduled: number; total: number; percentage: number };
  conflicts: Array<{ jobA: string; jobB: string; overlapMinutes: number }>;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const providerId = searchParams.get('providerId');
    const dateStr = searchParams.get('date');
    const includeUnassigned = searchParams.get('includeUnassigned') !== 'false';

    if (!providerId) {
      return NextResponse.json(
        { error: 'Provider ID is required' },
        { status: 400 }
      );
    }

    // Parse date or use today
    const targetDate = dateStr ? new Date(dateStr) : new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Get active team members
    const teamMembers = await prisma.providerUser.findMany({
      where: {
        providerId,
        status: 'active',
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        profilePhotoUrl: true,
        color: true,
        role: true,
        workingHours: true,
      },
      orderBy: [
        { role: 'asc' },
        { firstName: 'asc' },
      ],
    });

    // Get all jobs for the day
    const allJobs = await prisma.job.findMany({
      where: {
        providerId,
        startTime: { gte: startOfDay },
        endTime: { lte: endOfDay },
        status: { notIn: ['cancelled'] },
      },
      select: {
        id: true,
        serviceType: true,
        startTime: true,
        endTime: true,
        status: true,
        address: true,
        assignedUserIds: true,
        assignedCrewId: true,
        estimatedValue: true,
        customer: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
      },
      orderBy: { startTime: 'asc' },
    });

    // Helper to check for overlapping jobs
    const findConflicts = (jobs: typeof allJobs) => {
      const conflicts: Array<{ jobA: string; jobB: string; overlapMinutes: number }> = [];
      for (let i = 0; i < jobs.length; i++) {
        for (let j = i + 1; j < jobs.length; j++) {
          const jobA = jobs[i];
          const jobB = jobs[j];
          // Check if jobs overlap
          if (jobA.startTime < jobB.endTime && jobA.endTime > jobB.startTime) {
            const overlapStart = new Date(Math.max(jobA.startTime.getTime(), jobB.startTime.getTime()));
            const overlapEnd = new Date(Math.min(jobA.endTime.getTime(), jobB.endTime.getTime()));
            const overlapMinutes = (overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60);
            conflicts.push({
              jobA: jobA.id,
              jobB: jobB.id,
              overlapMinutes,
            });
          }
        }
      }
      return conflicts;
    };

    // Process workers with their jobs
    const workers: WorkerData[] = teamMembers.map(member => {
      // Get jobs assigned to this worker
      const memberJobs = allJobs.filter(job =>
        job.assignedUserIds.includes(member.id)
      );

      // Calculate scheduled hours
      const scheduledMinutes = memberJobs.reduce((total, job) => {
        const duration = (job.endTime.getTime() - job.startTime.getTime()) / (1000 * 60);
        return total + duration;
      }, 0);
      const scheduledHours = scheduledMinutes / 60;

      // Get working hours (default 8am-5pm, 8 hours)
      const workingHours = (member.workingHours as { start?: string; end?: string } | null) || { start: '08:00', end: '17:00' };
      const defaultStart = workingHours.start || '08:00';
      const defaultEnd = workingHours.end || '17:00';

      // Calculate total available hours
      const [startHour, startMin] = defaultStart.split(':').map(Number);
      const [endHour, endMin] = defaultEnd.split(':').map(Number);
      const totalHours = (endHour + endMin / 60) - (startHour + startMin / 60);

      // Find conflicts for this worker
      const conflicts = findConflicts(memberJobs);

      return {
        id: member.id,
        name: `${member.firstName} ${member.lastName}`,
        firstName: member.firstName,
        lastName: member.lastName,
        photo: member.profilePhotoUrl,
        color: member.color || '#6b7280',
        role: member.role,
        workingHours: { start: defaultStart, end: defaultEnd },
        jobs: memberJobs.map(job => ({
          id: job.id,
          serviceType: job.serviceType,
          customerName: job.customer.name,
          customerAddress: job.customer.address,
          startTime: job.startTime,
          endTime: job.endTime,
          status: job.status,
          address: job.address,
        })),
        capacity: {
          scheduled: Math.round(scheduledHours * 10) / 10,
          total: totalHours,
          percentage: Math.round((scheduledHours / totalHours) * 100),
        },
        conflicts,
      };
    });

    // Get unassigned jobs if requested
    let unassignedJobs: Array<{
      id: string;
      serviceType: string;
      customerName: string;
      customerAddress: string;
      startTime: Date;
      endTime: Date;
      duration: number;
      priority: 'urgent' | 'today' | 'future';
      estimatedValue: number | null;
      suggestedWorkers: string[];
    }> = [];

    if (includeUnassigned) {
      const unassigned = allJobs.filter(job =>
        job.assignedUserIds.length === 0 && !job.assignedCrewId
      );

      unassignedJobs = unassigned.map(job => {
        const duration = (job.endTime.getTime() - job.startTime.getTime()) / (1000 * 60 * 60);
        const now = new Date();

        // Determine priority
        let priority: 'urgent' | 'today' | 'future' = 'today';
        if (job.startTime < now) {
          priority = 'urgent'; // Job start time has passed
        } else if (job.startTime.getTime() - now.getTime() < 2 * 60 * 60 * 1000) {
          priority = 'urgent'; // Within 2 hours
        }

        // Simple suggestion: workers with lowest capacity
        const suggestedWorkers = workers
          .filter(w => w.role !== 'owner') // Prefer field workers
          .sort((a, b) => a.capacity.percentage - b.capacity.percentage)
          .slice(0, 3)
          .map(w => w.id);

        return {
          id: job.id,
          serviceType: job.serviceType,
          customerName: job.customer.name,
          customerAddress: job.customer.address,
          startTime: job.startTime,
          endTime: job.endTime,
          duration: Math.round(duration * 10) / 10,
          priority,
          estimatedValue: job.estimatedValue,
          suggestedWorkers,
        };
      });
    }

    // Calculate stats
    const totalJobs = allJobs.length;
    const assignedJobs = allJobs.filter(j => j.assignedUserIds.length > 0 || j.assignedCrewId).length;
    const totalScheduledHours = workers.reduce((sum, w) => sum + w.capacity.scheduled, 0);
    const totalCapacityHours = workers.reduce((sum, w) => sum + w.capacity.total, 0);

    return NextResponse.json({
      date: targetDate.toISOString().split('T')[0],
      workers,
      unassignedJobs,
      stats: {
        totalJobs,
        assignedJobs,
        unassignedJobs: totalJobs - assignedJobs,
        totalHours: Math.round(totalScheduledHours * 10) / 10,
        totalCapacity: Math.round(totalCapacityHours * 10) / 10,
        capacityUsed: totalCapacityHours > 0
          ? Math.round((totalScheduledHours / totalCapacityHours) * 100)
          : 0,
        workersScheduled: workers.filter(w => w.jobs.length > 0).length,
        totalWorkers: workers.length,
      },
    });
  } catch (error) {
    console.error('Error fetching daily calendar:', error);
    return NextResponse.json(
      { error: 'Failed to fetch calendar data' },
      { status: 500 }
    );
  }
}
