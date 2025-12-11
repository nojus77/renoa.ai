import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const jobId = params.id;

    // Verify job exists
    const job = await prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // Fetch photos for this job
    const photos = await prisma.jobPhoto.findMany({
      where: { jobId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        url: true,
        type: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      photos: photos.map(photo => ({
        id: photo.id,
        url: photo.url,
        type: photo.type,
        createdAt: photo.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Error fetching job photos:', error);
    return NextResponse.json(
      { error: 'Failed to fetch photos' },
      { status: 500 }
    );
  }
}
