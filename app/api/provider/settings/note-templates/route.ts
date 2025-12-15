import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET - Fetch customer note templates
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get('providerId');

    if (!providerId) {
      return NextResponse.json({ error: 'Provider ID is required' }, { status: 400 });
    }

    const provider = await prisma.provider.findUnique({
      where: { id: providerId },
      select: { customerNoteTemplates: true },
    });

    if (!provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      templates: provider.customerNoteTemplates || [],
    });
  } catch (error) {
    console.error('Error fetching note templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch note templates' },
      { status: 500 }
    );
  }
}

// PUT - Save customer note templates
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { providerId, templates } = body;

    if (!providerId) {
      return NextResponse.json({ error: 'Provider ID is required' }, { status: 400 });
    }

    if (!Array.isArray(templates)) {
      return NextResponse.json({ error: 'Templates must be an array' }, { status: 400 });
    }

    // Filter out empty strings and limit template length
    const cleanedTemplates = templates
      .map((t: string) => t.trim())
      .filter((t: string) => t.length > 0)
      .slice(0, 20); // Max 20 templates

    await prisma.provider.update({
      where: { id: providerId },
      data: { customerNoteTemplates: cleanedTemplates },
    });

    return NextResponse.json({
      success: true,
      templates: cleanedTemplates,
    });
  } catch (error) {
    console.error('Error saving note templates:', error);
    return NextResponse.json(
      { error: 'Failed to save note templates' },
      { status: 500 }
    );
  }
}
