import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getCustomerSession } from '@/lib/auth-helpers';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getCustomerSession();

    if (!session?.customerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const jobId = params.id;

    // Verify customer owns this job
    const job = await prisma.job.findFirst({
      where: {
        id: jobId,
        customerId: session.customerId,
      },
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Fetch all photos for this job
    const photos = await prisma.jobPhoto.findMany({
      where: {
        jobId,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Group photos by type
    const beforePhotos = photos.filter((p) => p.type === 'before');
    const inProgressPhotos = photos.filter((p) => p.type === 'in_progress' || p.type === 'during');
    const afterPhotos = photos.filter((p) => p.type === 'after');

    return NextResponse.json({
      all: photos,
      before: beforePhotos,
      inProgress: inProgressPhotos,
      after: afterPhotos,
      total: photos.length,
    });
  } catch (error: any) {
    console.error('Error fetching job photos:', error);
    return NextResponse.json(
      { error: 'Failed to fetch photos', details: error.message },
      { status: 500 }
    );
  }
}
