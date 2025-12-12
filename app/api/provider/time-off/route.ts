import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET all time off requests for provider's workers
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get('providerId');
    const status = searchParams.get('status'); // 'pending', 'approved', 'denied'

    if (!providerId) {
      return NextResponse.json({ error: 'Provider ID is required' }, { status: 400 });
    }

    // Get all user IDs for this provider
    const users = await prisma.providerUser.findMany({
      where: { providerId },
      select: { id: true, firstName: true, lastName: true },
    });

    const userIds = users.map((u) => u.id);
    const userMap = Object.fromEntries(
      users.map((u) => [u.id, `${u.firstName} ${u.lastName}`])
    );

    // Get time off requests for those users
    const whereClause: Record<string, unknown> = {
      userId: { in: userIds },
    };

    if (status) {
      whereClause.status = status;
    }

    const requests = await prisma.workerTimeOff.findMany({
      where: whereClause,
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    });

    // Add worker names to requests
    const requestsWithNames = requests.map((req) => ({
      ...req,
      workerName: userMap[req.userId] || 'Unknown',
    }));

    return NextResponse.json({ requests: requestsWithNames });
  } catch (error) {
    console.error('Error fetching time off requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch time off requests' },
      { status: 500 }
    );
  }
}
