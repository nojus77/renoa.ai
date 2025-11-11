import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { customerId: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get('providerId');

    if (!providerId) {
      return NextResponse.json({ error: 'Provider ID is required' }, { status: 400 });
    }

    // TODO: Fetch notes from a dedicated customer notes table
    // For now, return empty array
    const notes: any[] = [];

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
  { params }: { params: { customerId: string } }
) {
  try {
    const body = await request.json();
    const { content, providerId } = body;

    if (!content || !providerId) {
      return NextResponse.json(
        { error: 'Content and provider ID are required' },
        { status: 400 }
      );
    }

    // TODO: Store note in a dedicated customer notes table
    // For now, we'll append to the lead notes field as a temporary solution
    const lead = await prisma.lead.findFirst({
      where: {
        id: params.customerId,
        assignedProviderId: providerId
      },
    });

    if (!lead) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    const timestamp = new Date().toISOString();
    const noteEntry = `[${timestamp}] ${content}`;
    const updatedNotes = lead.notes
      ? `${lead.notes}\n\n${noteEntry}`
      : noteEntry;

    await prisma.lead.update({
      where: { id: lead.id },
      data: { notes: updatedNotes },
    });

    return NextResponse.json({
      success: true,
      note: {
        content,
        createdAt: timestamp,
      }
    });
  } catch (error) {
    console.error('Error saving note:', error);
    return NextResponse.json(
      { error: 'Failed to save note' },
      { status: 500 }
    );
  }
}
