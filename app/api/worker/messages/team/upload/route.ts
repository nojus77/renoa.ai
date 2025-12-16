import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { uploadTeamMessageMedia, validateTeamMessageFile } from '@/lib/storage/team-messages';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const userId = formData.get('userId') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const worker = await prisma.providerUser.findUnique({
      where: { id: userId },
      select: { providerId: true },
    });

    if (!worker?.providerId) {
      return NextResponse.json({ error: 'Worker not found' }, { status: 404 });
    }

    validateTeamMessageFile(file);
    const upload = await uploadTeamMessageMedia({
      file,
      providerId: worker.providerId,
      userId,
    });

    return NextResponse.json({
      url: upload.url,
      thumbnailUrl: upload.thumbnailUrl,
    });
  } catch (error) {
    console.error('[Worker Team Message Upload] Error:', error);
    const message = error instanceof Error ? error.message : 'Failed to upload image';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
