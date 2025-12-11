import { NextRequest, NextResponse } from 'next/server';
import { del } from '@vercel/blob';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { providerId } = body;

    if (!providerId) {
      return NextResponse.json(
        { error: 'Provider ID is required' },
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

    // Delete from Blob if exists
    if (provider.profilePhotoBlobPath) {
      try {
        await del(provider.profilePhotoBlobPath);
      } catch (error) {
        console.error('Error deleting photo from Blob:', error);
        // Continue with database update even if deletion fails
      }
    }

    // Update provider record to remove photo URLs
    await prisma.provider.update({
      where: { id: providerId },
      data: {
        profilePhotoUrl: null,
        profilePhotoBlobPath: null,
        avatar: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Profile photo deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting profile photo:', error);
    return NextResponse.json(
      { error: 'Failed to delete photo' },
      { status: 500 }
    );
  }
}
