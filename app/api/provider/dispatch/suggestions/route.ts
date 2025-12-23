import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { startOfDay, endOfDay, parseISO, addMinutes, format, addDays } from 'date-fns';
import {
  calculateHaversineDistance,
  type Coordinates,
} from '@/lib/services/distance-service';

const AVG_SPEED_MPH = 30;
const DEFAULT_START_HOUR = 8;

interface Suggestion {
  id: string;
  type: 'workload_imbalance' | 'unassigned_cluster' | 'eta_conflict' | 'traffic_warning' | 'optimization_opportunity';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  action?: {
    type: 'reassign' | 'auto_assign' | 'reschedule' | 'optimize' | 'view';
    label: string;
    data?: Record<string, unknown>;
  };
}

/**
 * Smart Dispatch Suggestions API
 *
 * Analyzes schedule and suggests improvements:
 * - Workload imbalances between workers
 * - Unassigned job clusters in same area
 * - ETA conflicts (arrival after window)
 * - Traffic warnings for upcoming jobs
 * - Optimization opportunities
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const providerId = searchParams.get('providerId');
    const date = searchParams.get('date');

    if (!providerId) {
      return NextResponse.json({ error: 'Provider ID required' }, { status: 400 });
    }

    const dateObj = date ? parseISO(date) : new Date();
    const suggestions: Suggestion[] = [];

    // Get all workers
    const workers = await prisma.providerUser.findMany({
      where: {
        providerId,
        role: 'field',
        status: 'active',
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        homeLatitude: true,
        homeLongitude: true,
        currentLatitude: true,
        currentLongitude: true,
        lastLocationUpdate: true,
      },
    });

    // Get all jobs for the date
    const allJobs = await prisma.job.findMany({
      where: {
        providerId,
        startTime: {
          gte: startOfDay(dateObj),
          lt: endOfDay(dateObj),
        },
        status: { notIn: ['cancelled'] },
      },
      include: {
        customer: {
          select: { name: true, latitude: true, longitude: true, address: true },
        },
      },
      orderBy: { startTime: 'asc' },
    });

    // Separate assigned and unassigned jobs
    const assignedJobs = allJobs.filter(j => j.assignedUserIds && j.assignedUserIds.length > 0);
    const unassignedJobs = allJobs.filter(j => !j.assignedUserIds || j.assignedUserIds.length === 0);

    // Count jobs per worker
    const workerJobCounts = new Map<string, number>();
    for (const worker of workers) {
      workerJobCounts.set(worker.id, 0);
    }
    for (const job of assignedJobs) {
      for (const workerId of job.assignedUserIds) {
        workerJobCounts.set(workerId, (workerJobCounts.get(workerId) || 0) + 1);
      }
    }

    // === SUGGESTION 1: Workload Imbalance ===
    if (workers.length >= 2) {
      const counts = Array.from(workerJobCounts.values());
      const maxJobs = Math.max(...counts);
      const minJobs = Math.min(...counts);
      const avgJobs = counts.reduce((a, b) => a + b, 0) / counts.length;

      if (maxJobs - minJobs >= 3 && avgJobs > 1) {
        const overloadedWorker = workers.find(w => workerJobCounts.get(w.id) === maxJobs);
        const underloadedWorker = workers.find(w => workerJobCounts.get(w.id) === minJobs);

        if (overloadedWorker && underloadedWorker) {
          suggestions.push({
            id: `workload-${dateObj.toISOString().split('T')[0]}`,
            type: 'workload_imbalance',
            severity: maxJobs - minJobs >= 5 ? 'warning' : 'info',
            title: 'Workload Imbalance Detected',
            description: `${overloadedWorker.firstName} has ${maxJobs} jobs while ${underloadedWorker.firstName} has ${minJobs}. Consider rebalancing.`,
            action: {
              type: 'optimize',
              label: 'Auto-balance',
              data: {
                overloadedWorkerId: overloadedWorker.id,
                underloadedWorkerId: underloadedWorker.id,
              },
            },
          });
        }
      }
    }

    // === SUGGESTION 2: Unassigned Job Clusters ===
    if (unassignedJobs.length > 0) {
      // Find clusters of unassigned jobs in same area
      const jobsWithCoords = unassignedJobs
        .filter(j => (j.latitude || j.customer?.latitude) && (j.longitude || j.customer?.longitude))
        .map(j => ({
          ...j,
          lat: j.latitude || j.customer?.latitude || 0,
          lng: j.longitude || j.customer?.longitude || 0,
        }));

      if (jobsWithCoords.length >= 2) {
        // Simple clustering: find jobs within 3 miles of each other
        const clusters: Array<typeof jobsWithCoords> = [];
        const assigned = new Set<string>();

        for (const job of jobsWithCoords) {
          if (assigned.has(job.id)) continue;

          const cluster = [job];
          assigned.add(job.id);

          for (const other of jobsWithCoords) {
            if (assigned.has(other.id)) continue;

            const dist = calculateHaversineDistance(
              { latitude: job.lat, longitude: job.lng },
              { latitude: other.lat, longitude: other.lng }
            );

            if (dist.miles <= 3) {
              cluster.push(other);
              assigned.add(other.id);
            }
          }

          if (cluster.length >= 2) {
            clusters.push(cluster);
          }
        }

        for (const cluster of clusters) {
          // Find nearest worker to cluster center
          const centerLat = cluster.reduce((sum, j) => sum + j.lat, 0) / cluster.length;
          const centerLng = cluster.reduce((sum, j) => sum + j.lng, 0) / cluster.length;

          let nearestWorker = null;
          let nearestDist = Infinity;

          for (const worker of workers) {
            const workerLat = worker.currentLatitude || worker.homeLatitude;
            const workerLng = worker.currentLongitude || worker.homeLongitude;
            if (!workerLat || !workerLng) continue;

            const dist = calculateHaversineDistance(
              { latitude: workerLat, longitude: workerLng },
              { latitude: centerLat, longitude: centerLng }
            );

            if (dist.miles < nearestDist) {
              nearestDist = dist.miles;
              nearestWorker = worker;
            }
          }

          const area = cluster[0].customer?.address?.split(',').slice(-2).join(',').trim() || 'nearby area';

          suggestions.push({
            id: `cluster-${cluster[0].id}`,
            type: 'unassigned_cluster',
            severity: cluster.length >= 3 ? 'warning' : 'info',
            title: `${cluster.length} Unassigned Jobs in ${area}`,
            description: nearestWorker
              ? `${nearestWorker.firstName} is ${Math.round(nearestDist)} miles away. Assign all ${cluster.length} jobs?`
              : `${cluster.length} jobs are clustered together. Assign to closest worker?`,
            action: {
              type: 'auto_assign',
              label: nearestWorker ? `Assign to ${nearestWorker.firstName}` : 'Auto-assign',
              data: {
                jobIds: cluster.map(j => j.id),
                suggestedWorkerId: nearestWorker?.id,
              },
            },
          });
        }
      }

      // Also flag any single unassigned jobs
      if (unassignedJobs.length > 0 && suggestions.filter(s => s.type === 'unassigned_cluster').length === 0) {
        suggestions.push({
          id: `unassigned-${dateObj.toISOString().split('T')[0]}`,
          type: 'unassigned_cluster',
          severity: unassignedJobs.length >= 3 ? 'warning' : 'info',
          title: `${unassignedJobs.length} Unassigned Job${unassignedJobs.length > 1 ? 's' : ''}`,
          description: `There ${unassignedJobs.length === 1 ? 'is' : 'are'} ${unassignedJobs.length} job${unassignedJobs.length > 1 ? 's' : ''} without a worker assigned.`,
          action: {
            type: 'auto_assign',
            label: 'Auto-assign All',
            data: { jobIds: unassignedJobs.map(j => j.id) },
          },
        });
      }
    }

    // === SUGGESTION 3: ETA Conflicts ===
    // Check if any fixed/window appointments will be missed
    for (const worker of workers) {
      const workerJobs = assignedJobs
        .filter(j => j.assignedUserIds.includes(worker.id))
        .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

      if (workerJobs.length < 2) continue;

      // Estimate ETAs
      let currentTime = new Date(startOfDay(dateObj));
      currentTime.setHours(DEFAULT_START_HOUR, 0, 0, 0);

      let currentLocation: Coordinates | null = worker.homeLatitude && worker.homeLongitude
        ? { latitude: worker.homeLatitude, longitude: worker.homeLongitude }
        : null;

      for (const job of workerJobs) {
        const jobLat = job.latitude || job.customer?.latitude || 0;
        const jobLng = job.longitude || job.customer?.longitude || 0;

        if (jobLat === 0 || jobLng === 0) continue;

        let travelMinutes = 0;
        if (currentLocation) {
          const dist = calculateHaversineDistance(currentLocation, {
            latitude: jobLat,
            longitude: jobLng,
          });
          travelMinutes = Math.ceil(dist.miles / AVG_SPEED_MPH * 60);
        }

        const eta = addMinutes(currentTime, travelMinutes);
        const scheduledTime = new Date(job.startTime);

        // Check for late arrival to fixed/window appointments
        if (job.appointmentType === 'fixed' || job.appointmentType === 'window') {
          const lateByMinutes = Math.round((eta.getTime() - scheduledTime.getTime()) / 60000);

          if (lateByMinutes > 15) {
            suggestions.push({
              id: `eta-conflict-${job.id}`,
              type: 'eta_conflict',
              severity: lateByMinutes > 30 ? 'critical' : 'warning',
              title: 'ETA Conflict',
              description: `${worker.firstName}'s ETA to ${job.customer?.name || 'customer'} is ${format(eta, 'h:mm a')}, but appointment is at ${format(scheduledTime, 'h:mm a')} (${lateByMinutes} min late).`,
              action: {
                type: 'reschedule',
                label: 'Reschedule',
                data: { jobId: job.id, currentETA: eta.toISOString() },
              },
            });
          }
        }

        // Update for next job
        const duration = (job.durationMinutes || 1) * 60;
        currentTime = addMinutes(eta, duration);
        currentLocation = { latitude: jobLat, longitude: jobLng };
      }
    }

    // === SUGGESTION 4: Optimization Opportunities ===
    // Check if route optimization would help
    for (const worker of workers) {
      const workerJobs = assignedJobs
        .filter(j => j.assignedUserIds.includes(worker.id))
        .filter(j => (j.latitude || j.customer?.latitude) && (j.longitude || j.customer?.longitude));

      if (workerJobs.length < 3) continue;

      // Calculate current route distance
      const jobCoords = workerJobs.map(j => ({
        lat: j.latitude || j.customer?.latitude || 0,
        lng: j.longitude || j.customer?.longitude || 0,
      }));

      let currentDistance = 0;
      for (let i = 0; i < jobCoords.length - 1; i++) {
        const dist = calculateHaversineDistance(
          { latitude: jobCoords[i].lat, longitude: jobCoords[i].lng },
          { latitude: jobCoords[i + 1].lat, longitude: jobCoords[i + 1].lng }
        );
        currentDistance += dist.miles;
      }

      // Simple check: if jobs are not roughly sorted by geography, suggest optimization
      // This is a heuristic - actual optimization would be more thorough
      if (currentDistance > workerJobs.length * 5) {
        suggestions.push({
          id: `optimize-${worker.id}`,
          type: 'optimization_opportunity',
          severity: 'info',
          title: `Optimize ${worker.firstName}'s Route`,
          description: `Current route is ${Math.round(currentDistance)} miles. Optimization may reduce drive time.`,
          action: {
            type: 'optimize',
            label: 'Optimize Route',
            data: { workerId: worker.id },
          },
        });
      }
    }

    // Sort suggestions by severity
    const severityOrder = { critical: 0, warning: 1, info: 2 };
    suggestions.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    return NextResponse.json({
      success: true,
      date: format(dateObj, 'yyyy-MM-dd'),
      suggestions,
      summary: {
        total: suggestions.length,
        critical: suggestions.filter(s => s.severity === 'critical').length,
        warnings: suggestions.filter(s => s.severity === 'warning').length,
        info: suggestions.filter(s => s.severity === 'info').length,
      },
      stats: {
        totalJobs: allJobs.length,
        assignedJobs: assignedJobs.length,
        unassignedJobs: unassignedJobs.length,
        workers: workers.length,
      },
    });
  } catch (error) {
    console.error('[Suggestions API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate suggestions' },
      { status: 500 }
    );
  }
}
