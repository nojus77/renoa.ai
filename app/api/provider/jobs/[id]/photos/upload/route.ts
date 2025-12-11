import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { prisma } from '@/lib/prisma';

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const jobId = params.id;

    // Get form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string || 'before';

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPG, PNG, and WebP are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds 5MB limit' },
        { status: 400 }
      );
    }

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

    // Upload to Vercel Blob
    const filename = `job-photos/${jobId}/${type}-${Date.now()}-${file.name}`;
    const blob = await put(filename, file, {
      access: 'public',
    });

    // Create database record
    const jobPhoto = await prisma.jobPhoto.create({
      data: {
        jobId,
        type,
        url: blob.url,
        blobPathname: blob.pathname,
      },
    });

    return NextResponse.json({
      success: true,
      photo: {
        id: jobPhoto.id,
        url: jobPhoto.url,
        type: jobPhoto.type,
        createdAt: jobPhoto.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error uploading job photo:', error);
    return NextResponse.json(
      { error: 'Failed to upload photo' },
      { status: 500 }
    );
  }
}
