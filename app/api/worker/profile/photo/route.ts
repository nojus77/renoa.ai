import { NextRequest, NextResponse } from 'next/server';
import { put, del } from '@vercel/blob';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * POST /api/worker/profile/photo
 * Upload worker profile photo
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
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
      return NextResponse.json({ error: 'Photo too large. Max 5MB.' }, { status: 400 });
    }

    // Get current user
    const user = await prisma.providerUser.findUnique({
      where: { id: userId },
      select: {
        id: true,
        profilePhotoBlobPath: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Delete old photo from Blob if exists
    if (user.profilePhotoBlobPath) {
      try {
        await del(user.profilePhotoBlobPath);
      } catch (error) {
        console.error('Error deleting old photo:', error);
      }
    }

    // Upload new photo to Vercel Blob
    const filename = `worker-photos/${userId}/${Date.now()}-${file.name}`;
    const blob = await put(filename, file, {
      access: 'public',
    });

    // Update user record
    const updatedUser = await prisma.providerUser.update({
      where: { id: userId },
      data: {
        profilePhotoUrl: blob.url,
        profilePhotoBlobPath: blob.pathname,
      },
      select: {
        id: true,
        profilePhotoUrl: true,
      },
    });

    return NextResponse.json({
      success: true,
      url: updatedUser.profilePhotoUrl,
    });
  } catch (error) {
    console.error('Error uploading worker photo:', error);
    return NextResponse.json({ error: 'Failed to upload photo' }, { status: 500 });
  }
}

/**
 * DELETE /api/worker/profile/photo
 * Delete worker profile photo
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const user = await prisma.providerUser.findUnique({
      where: { id: userId },
      select: {
        id: true,
        profilePhotoBlobPath: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Delete from Blob storage
    if (user.profilePhotoBlobPath) {
      try {
        await del(user.profilePhotoBlobPath);
      } catch (error) {
        console.error('Error deleting photo from Blob:', error);
      }
    }

    // Clear URL in database
    await prisma.providerUser.update({
      where: { id: userId },
      data: {
        profilePhotoUrl: null,
        profilePhotoBlobPath: null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting worker photo:', error);
    return NextResponse.json({ error: 'Failed to delete photo' }, { status: 500 });
  }
}
