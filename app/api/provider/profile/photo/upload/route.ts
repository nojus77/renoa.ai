import { NextRequest, NextResponse } from 'next/server';
import { put, del } from '@vercel/blob';
import { prisma } from '@/lib/prisma';

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request: NextRequest) {
  try {
    // Get form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const providerId = formData.get('providerId') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!providerId) {
      return NextResponse.json(
        { error: 'Provider ID is required' },
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

    // Get current provider
    const provider = await prisma.provider.findUnique({
      where: { id: providerId },
      select: {
        id: true,
        profilePhotoBlobPath: true,
      },
    });

    if (!provider) {
      return NextResponse.json(
        { error: 'Provider not found' },
        { status: 404 }
      );
    }

    // Delete old photo from Blob if exists
    if (provider.profilePhotoBlobPath) {
      try {
        await del(provider.profilePhotoBlobPath);
      } catch (error) {
        console.error('Error deleting old photo from Blob:', error);
        // Continue with upload even if deletion fails
      }
    }

    // Upload new photo to Vercel Blob
    const filename = `profile-photos/${providerId}/${Date.now()}-${file.name}`;
    const blob = await put(filename, file, {
      access: 'public',
    });

    // Update provider record
    const updatedProvider = await prisma.provider.update({
      where: { id: providerId },
      data: {
        profilePhotoUrl: blob.url,
        profilePhotoBlobPath: blob.pathname,
        avatar: blob.url, // Also update the avatar field for backward compatibility
      },
      select: {
        id: true,
        profilePhotoUrl: true,
        avatar: true,
      },
    });

    return NextResponse.json({
      success: true,
      url: updatedProvider.profilePhotoUrl || updatedProvider.avatar,
    });
  } catch (error) {
    console.error('Error uploading profile photo:', error);
    return NextResponse.json(
      { error: 'Failed to upload photo' },
      { status: 500 }
    );
  }
}
