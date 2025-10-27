import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get('providerId');

    if (!providerId) {
      return NextResponse.json(
        { error: 'Provider ID is required' },
        { status: 400 }
      );
    }

    // Get all notes for this lead from this provider
    const notes = await prisma.leadNote.findMany({
      where: {
        leadId: id,
        providerId: providerId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ notes });
  } catch (error) {
    console.error('Error fetching notes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notes' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { note, providerId } = await request.json();

    if (!note || !providerId) {
      return NextResponse.json(
        { error: 'Note and provider ID are required' },
        { status: 400 }
      );
    }

    // Create new note
    const newNote = await prisma.leadNote.create({
      data: {
        leadId: id,
        providerId: providerId,
        note: note,
      },
    });

    return NextResponse.json({ note: newNote });
  } catch (error) {
    console.error('Error creating note:', error);
    return NextResponse.json(
      { error: 'Failed to create note' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { noteId, note } = await request.json();

    if (!noteId || !note) {
      return NextResponse.json(
        { error: 'Note ID and note text are required' },
        { status: 400 }
      );
    }

    // Update existing note
    const updatedNote = await prisma.leadNote.update({
      where: { id: noteId },
      data: { note },
    });

    return NextResponse.json({ note: updatedNote });
  } catch (error) {
    console.error('Error updating note:', error);
    return NextResponse.json(
      { error: 'Failed to update note' },
      { status: 500 }
    );
  }
}