import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { put } from '@vercel/blob';

export const dynamic = 'force-dynamic';

/**
 * GET /api/worker/jobs/[id]/media
 * Get photos for a job
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get job to check if it exists
    const job = await prisma.job.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // Get photos from JobPhoto model
    const photos = await prisma.jobPhoto.findMany({
      where: { jobId: id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        url: true,
        type: true,
        createdAt: true,
      },
    });

    // Transform to media format for frontend
    const media = photos.map(photo => ({
      id: photo.id,
      url: photo.url,
      type: photo.type === 'video' ? 'video' : 'photo',
      createdAt: photo.createdAt.toISOString(),
    }));

    return NextResponse.json({ media });
  } catch (error) {
    console.error('Error fetching media:', error);
    return NextResponse.json(
      { error: 'Failed to fetch media' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/worker/jobs/[id]/media
 * Upload photos/videos for a job
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get form data
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const userId = formData.get('userId') as string;

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      );
    }

    // Verify worker is assigned to this job
    const job = await prisma.job.findFirst({
      where: {
        id,
        assignedUserIds: { has: userId },
      },
      select: { id: true },
    });

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found or not assigned to you' },
        { status: 403 }
      );
    }

    // Check if BLOB_READ_WRITE_TOKEN is available
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error('BLOB_READ_WRITE_TOKEN not configured');
      return NextResponse.json(
        { error: 'File storage not configured' },
        { status: 500 }
      );
    }

    const uploadedMedia: Array<{
      id: string;
      url: string;
      type: 'photo' | 'video';
      createdAt: string;
    }> = [];

    // Upload each file
    for (const file of files) {
      const isVideo = file.type.startsWith('video/');
      const fileExtension = file.name.split('.').pop() || (isVideo ? 'mp4' : 'jpg');
      const fileName = `jobs/${id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`;

      try {
        // Upload to Vercel Blob
        const blob = await put(fileName, file, {
          access: 'public',
        });

        // Save to JobPhoto model
        const savedPhoto = await prisma.jobPhoto.create({
          data: {
            jobId: id,
            url: blob.url,
            type: isVideo ? 'video' : 'photo',
            blobPathname: fileName,
          },
        });

        uploadedMedia.push({
          id: savedPhoto.id,
          url: blob.url,
          type: isVideo ? 'video' : 'photo',
          createdAt: savedPhoto.createdAt.toISOString(),
        });
      } catch (uploadError) {
        console.error('Error uploading file:', uploadError);
        // Continue with other files
      }
    }

    if (uploadedMedia.length === 0) {
      return NextResponse.json(
        { error: 'Failed to upload any files' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      media: uploadedMedia,
      count: uploadedMedia.length,
    });
  } catch (error) {
    console.error('Error uploading media:', error);
    return NextResponse.json(
      { error: 'Failed to upload media' },
      { status: 500 }
    );
  }
}
