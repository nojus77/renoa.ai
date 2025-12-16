import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { uploadTeamMessageMedia, validateTeamMessageFile } from '@/lib/storage/team-messages';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const providerId = formData.get('providerId') as string | null;
    const userId = formData.get('userId') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 });
    }

    if (!providerId || !userId) {
      return NextResponse.json({ error: 'Provider ID and User ID are required' }, { status: 400 });
    }

    const user = await prisma.providerUser.findFirst({
      where: { id: userId, providerId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    validateTeamMessageFile(file);
    const upload = await uploadTeamMessageMedia({ file, providerId, userId });

    return NextResponse.json({
      url: upload.url,
      thumbnailUrl: upload.thumbnailUrl,
    });
  } catch (error) {
    console.error('[Provider Team Message Upload] Error:', error);
    const message = error instanceof Error ? error.message : 'Failed to upload image';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
