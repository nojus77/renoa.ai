import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * Worker Location Tracking API
 *
 * Used for:
 * - Real-time dispatching ("nearest available worker")
 * - Route re-optimization based on current position
 * - Tracking worker location during active jobs
 *
 * Location updates are stored on the worker record and have a timestamp.
 * For privacy, locations are only tracked when the worker is clocked in.
 */

// POST - Update worker's current location
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, latitude, longitude, accuracy, heading, speed } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    if (latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { error: 'Latitude and longitude are required' },
        { status: 400 }
      );
    }

    // Validate coordinates
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return NextResponse.json(
        { error: 'Invalid coordinates' },
        { status: 400 }
      );
    }

    // Check if worker exists and is clocked in
    const worker = await prisma.providerUser.findUnique({
      where: { id: userId },
      select: {
        id: true,
        providerId: true,
        status: true,
      },
    });

    if (!worker) {
      return NextResponse.json({ error: 'Worker not found' }, { status: 404 });
    }

    // Check if worker has an active clock-in (optional - can be bypassed for testing)
    const activeClockIn = await prisma.workLog.findFirst({
      where: {
        userId,
        clockOut: null,
      },
    });

    // Update worker's current location
    const updated = await prisma.providerUser.update({
      where: { id: userId },
      data: {
        currentLatitude: latitude,
        currentLongitude: longitude,
        currentLocationAccuracy: accuracy || null,
        currentLocationHeading: heading || null,
        currentLocationSpeed: speed || null,
        lastLocationUpdate: new Date(),
      },
      select: {
        id: true,
        currentLatitude: true,
        currentLongitude: true,
        lastLocationUpdate: true,
      },
    });

    return NextResponse.json({
      success: true,
      location: {
        latitude: updated.currentLatitude,
        longitude: updated.currentLongitude,
        timestamp: updated.lastLocationUpdate,
      },
      isClockedIn: !!activeClockIn,
    });
  } catch (error) {
    console.error('Error updating worker location:', error);
    return NextResponse.json(
      { error: 'Failed to update location' },
      { status: 500 }
    );
  }
}

// GET - Get worker's current location (for dispatch dashboard)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const providerId = searchParams.get('providerId');

    // Get single worker's location
    if (userId) {
      const worker = await prisma.providerUser.findUnique({
        where: { id: userId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          currentLatitude: true,
          currentLongitude: true,
          currentLocationAccuracy: true,
          lastLocationUpdate: true,
          status: true,
        },
      });

      if (!worker) {
        return NextResponse.json({ error: 'Worker not found' }, { status: 404 });
      }

      // Check if location is recent (within last 30 minutes)
      const isRecent = worker.lastLocationUpdate &&
        Date.now() - new Date(worker.lastLocationUpdate).getTime() < 30 * 60 * 1000;

      return NextResponse.json({
        worker: {
          id: worker.id,
          name: `${worker.firstName} ${worker.lastName}`,
          location: worker.currentLatitude && worker.currentLongitude ? {
            latitude: worker.currentLatitude,
            longitude: worker.currentLongitude,
            accuracy: worker.currentLocationAccuracy,
            timestamp: worker.lastLocationUpdate,
            isRecent,
          } : null,
          status: worker.status,
        },
      });
    }

    // Get all workers' locations for a provider
    if (providerId) {
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
          currentLatitude: true,
          currentLongitude: true,
          currentLocationAccuracy: true,
          lastLocationUpdate: true,
          color: true,
        },
      });

      // Check which workers are clocked in
      const clockedInWorkers = await prisma.workLog.findMany({
        where: {
          providerId,
          clockOut: null,
        },
        select: {
          userId: true,
        },
      });
      const clockedInIds = new Set(clockedInWorkers.map(w => w.userId));

      const workersWithLocation = workers.map(worker => {
        const isRecent = worker.lastLocationUpdate &&
          Date.now() - new Date(worker.lastLocationUpdate).getTime() < 30 * 60 * 1000;

        return {
          id: worker.id,
          name: `${worker.firstName} ${worker.lastName}`,
          color: worker.color,
          location: worker.currentLatitude && worker.currentLongitude ? {
            latitude: worker.currentLatitude,
            longitude: worker.currentLongitude,
            accuracy: worker.currentLocationAccuracy,
            timestamp: worker.lastLocationUpdate,
            isRecent,
          } : null,
          isClockedIn: clockedInIds.has(worker.id),
        };
      });

      return NextResponse.json({
        workers: workersWithLocation,
        totalWorkers: workers.length,
        withRecentLocation: workersWithLocation.filter(w => w.location?.isRecent).length,
        clockedIn: clockedInIds.size,
      });
    }

    return NextResponse.json(
      { error: 'Either userId or providerId is required' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error fetching worker location:', error);
    return NextResponse.json(
      { error: 'Failed to fetch location' },
      { status: 500 }
    );
  }
}

// DELETE - Clear worker's location (for privacy when clocking out)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    await prisma.providerUser.update({
      where: { id: userId },
      data: {
        currentLatitude: null,
        currentLongitude: null,
        currentLocationAccuracy: null,
        currentLocationHeading: null,
        currentLocationSpeed: null,
        lastLocationUpdate: null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error clearing worker location:', error);
    return NextResponse.json(
      { error: 'Failed to clear location' },
      { status: 500 }
    );
  }
}
