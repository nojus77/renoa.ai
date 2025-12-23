import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/worker/jobs/[id]/notes
 * Get notes for a job
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    // Verify worker is assigned to this job
    const job = await prisma.job.findFirst({
      where: {
        id,
        ...(userId ? { assignedUserIds: { has: userId } } : {}),
      },
      select: {
        id: true,
        internalNotes: true,
        customerNotes: true,
      },
    });

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // Parse notes from internal notes field
    // Notes are stored as: [timestamp] Author Name: content
    // Original dispatcher instructions are plain text without the timestamp format
    const notes: Array<{
      id: string;
      content: string;
      author: string;
      authorRole: 'worker' | 'dispatcher';
      createdAt: string;
    }> = [];

    // Also extract dispatcher instructions (non-timestamped content)
    let dispatcherInstructions = '';

    if (job.internalNotes) {
      // Split by double newlines to get individual notes
      const noteBlocks = job.internalNotes.split('\n\n').filter(Boolean);
      let index = 0;

      for (const block of noteBlocks) {
        // Parse notes that follow the format: [timestamp] author: content (content can be multiline)
        const match = block.match(/^\[([^\]]+)\]\s*([^:]+):\s*([\s\S]+)/);
        if (match) {
          // This is a timestamped note - add to notes list
          notes.push({
            id: `note-${index++}`,
            createdAt: match[1],
            author: match[2].trim(),
            content: match[3].trim(),
            authorRole: match[2].toLowerCase().includes('dispatcher') ? 'dispatcher' : 'worker',
          });
        } else {
          // Skip metadata blocks like "[Created by Name]" - these are not instructions
          const trimmedBlock = block.trim();
          if (trimmedBlock.match(/^\[Created by [^\]]+\]$/)) {
            continue;
          }

          // This is dispatcher instructions (plain text without timestamp format)
          // Accumulate all non-timestamped text as dispatcher instructions
          if (trimmedBlock) {
            // Also strip out any "[Created by Name]" prefix from actual instructions
            const cleanedBlock = trimmedBlock.replace(/^\[Created by [^\]]+\]\s*/, '');
            if (cleanedBlock) {
              if (dispatcherInstructions) {
                dispatcherInstructions += '\n\n' + cleanedBlock;
              } else {
                dispatcherInstructions = cleanedBlock;
              }
            }
          }
        }
      }
    }

    return NextResponse.json({ notes, dispatcherInstructions });
  } catch (error) {
    console.error('Error fetching notes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notes' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/worker/jobs/[id]/notes
 * Add a note to a job
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { content, userId } = body;

    if (!content || !userId) {
      return NextResponse.json(
        { error: 'Content and userId are required' },
        { status: 400 }
      );
    }

    // Verify worker is assigned to this job
    const job = await prisma.job.findFirst({
      where: {
        id,
        assignedUserIds: { has: userId },
      },
      select: {
        id: true,
        internalNotes: true,
      },
    });

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found or not assigned to you' },
        { status: 403 }
      );
    }

    // Get worker name
    const worker = await prisma.providerUser.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true },
    });

    const workerName = worker
      ? `${worker.firstName || ''} ${worker.lastName || ''}`.trim() || 'Worker'
      : 'Worker';

    // Append note to internal notes
    const timestamp = new Date().toLocaleString();
    const newNote = `[${timestamp}] ${workerName}: ${content}`;
    const updatedNotes = job.internalNotes
      ? `${job.internalNotes}\n\n${newNote}`
      : newNote;

    await prisma.job.update({
      where: { id },
      data: { internalNotes: updatedNotes },
    });

    return NextResponse.json({
      success: true,
      note: {
        id: `note-${Date.now()}`,
        content,
        author: workerName,
        authorRole: 'worker',
        createdAt: timestamp,
      },
    });
  } catch (error) {
    console.error('Error adding note:', error);
    return NextResponse.json(
      { error: 'Failed to add note' },
      { status: 500 }
    );
  }
}
