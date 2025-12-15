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
    // Preserve check type for filtering in payment section
    const media = photos.map(photo => ({
      id: photo.id,
      url: photo.url,
      type: photo.type === 'video' ? 'video' : (photo.type === 'check' ? 'check' : 'photo'),
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
    const photoType = (formData.get('photoType') as string) || null; // e.g., 'before', 'after', 'check'

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

    // Find the job first to check assignment
    const jobCheck = await prisma.job.findUnique({
      where: { id },
      select: {
        id: true,
        assignedUserIds: true,
        providerId: true,
      },
    });

    if (!jobCheck) {
      console.error('Media upload: Job not found', { id, userId });
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // Check if worker is assigned OR if they belong to the provider (owner/office can upload too)
    const isAssigned = jobCheck.assignedUserIds.includes(userId);

    // If not assigned, check if user is owner/office of the provider
    let hasAccess = isAssigned;
    if (!hasAccess) {
      const user = await prisma.providerUser.findFirst({
        where: {
          id: userId,
          providerId: jobCheck.providerId,
          role: { in: ['owner', 'office'] },
        },
      });
      hasAccess = !!user;
    }

    if (!hasAccess) {
      console.error('Media upload: Access denied', {
        jobId: id,
        userId,
        assignedUserIds: jobCheck.assignedUserIds,
        isAssigned,
      });
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

    // File validation constants
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime'];

    // Validate files before upload
    const validFiles: File[] = [];
    for (const file of files) {
      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        console.log(`File too large: ${file.name} (${(file.size / 1024 / 1024).toFixed(1)}MB)`);
        continue; // Skip this file
      }

      // Check file type
      if (!ALLOWED_TYPES.includes(file.type) && !file.type.startsWith('image/')) {
        console.log(`Invalid file type: ${file.name} (${file.type})`);
        continue; // Skip this file
      }

      validFiles.push(file);
    }

    if (validFiles.length === 0) {
      return NextResponse.json(
        { error: 'No valid files to upload. Files must be images or videos under 5MB.' },
        { status: 400 }
      );
    }

    const uploadedMedia: Array<{
      id: string;
      url: string;
      type: 'photo' | 'video';
      createdAt: string;
    }> = [];

    // Upload each valid file
    for (const file of validFiles) {
      const isVideo = file.type.startsWith('video/');
      const fileExtension = file.name.split('.').pop() || (isVideo ? 'mp4' : 'jpg');
      const fileName = `jobs/${id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`;

      try {
        // Upload to Vercel Blob
        const blob = await put(fileName, file, {
          access: 'public',
        });

        // Save to JobPhoto model
        // Type can be: 'photo', 'video', 'before', 'after', 'check'
        const mediaType = isVideo ? 'video' : (photoType || 'photo');
        const savedPhoto = await prisma.jobPhoto.create({
          data: {
            jobId: id,
            url: blob.url,
            type: mediaType,
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
