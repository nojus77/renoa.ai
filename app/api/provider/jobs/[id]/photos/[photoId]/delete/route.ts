import { NextRequest, NextResponse } from 'next/server';
import { del } from '@vercel/blob';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; photoId: string } }
) {
  try {
    const { id: jobId, photoId } = params;

    // Find the photo
    const photo = await prisma.jobPhoto.findUnique({
      where: { id: photoId },
      include: { job: true },
    });

    if (!photo) {
      return NextResponse.json(
        { error: 'Photo not found' },
        { status: 404 }
      );
    }

    // Verify photo belongs to this job
    if (photo.jobId !== jobId) {
      return NextResponse.json(
        { error: 'Photo does not belong to this job' },
        { status: 403 }
      );
    }

    // Delete from Vercel Blob
    try {
      await del(photo.blobPathname);
    } catch (blobError) {
      console.error('Error deleting from Blob storage:', blobError);
      // Continue with database deletion even if blob deletion fails
    }

    // Delete from database
    await prisma.jobPhoto.delete({
      where: { id: photoId },
    });

    return NextResponse.json({
      success: true,
      message: 'Photo deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting job photo:', error);
    return NextResponse.json(
      { error: 'Failed to delete photo' },
      { status: 500 }
    );
  }
}
