import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface ChecklistItem {
  id: string;
  label: string;
  required: boolean;
}

// Default checklists by service type
const DEFAULT_CHECKLISTS: Record<string, ChecklistItem[]> = {
  'Lawn Mowing': [
    { id: '1', label: 'Lawn mowed to correct height', required: true },
    { id: '2', label: 'Edges trimmed', required: true },
    { id: '3', label: 'Clippings cleaned up', required: true },
    { id: '4', label: 'Walkways blown clean', required: true },
    { id: '5', label: 'After photos taken', required: true },
  ],
  'Tree Removal': [
    { id: '1', label: 'Tree safely removed', required: true },
    { id: '2', label: 'Stump addressed per agreement', required: true },
    { id: '3', label: 'Debris cleared', required: true },
    { id: '4', label: 'Area raked clean', required: true },
    { id: '5', label: 'Before/after photos taken', required: true },
    { id: '6', label: 'Customer walkthrough completed', required: false },
  ],
  'Gutter Cleaning': [
    { id: '1', label: 'All gutters cleaned', required: true },
    { id: '2', label: 'Downspouts cleared', required: true },
    { id: '3', label: 'Debris bagged/removed', required: true },
    { id: '4', label: 'Water flow tested', required: false },
    { id: '5', label: 'After photos taken', required: true },
  ],
  'Landscaping': [
    { id: '1', label: 'Plants installed correctly', required: true },
    { id: '2', label: 'Mulch applied evenly', required: true },
    { id: '3', label: 'Debris removed', required: true },
    { id: '4', label: 'Watered all plants', required: true },
    { id: '5', label: 'After photos taken', required: true },
  ],
  'Hedge Trimming': [
    { id: '1', label: 'Hedges trimmed to shape', required: true },
    { id: '2', label: 'Clippings cleaned up', required: true },
    { id: '3', label: 'After photos taken', required: true },
  ],
  'Pressure Washing': [
    { id: '1', label: 'All surfaces cleaned', required: true },
    { id: '2', label: 'No damage to surfaces', required: true },
    { id: '3', label: 'Debris cleared', required: true },
    { id: '4', label: 'After photos taken', required: true },
  ],
  'Leaf Removal': [
    { id: '1', label: 'All leaves removed', required: true },
    { id: '2', label: 'Beds cleaned', required: true },
    { id: '3', label: 'Leaves bagged/hauled', required: true },
    { id: '4', label: 'After photos taken', required: true },
  ],
};

// Generic fallback
const GENERIC_CHECKLIST: ChecklistItem[] = [
  { id: '1', label: 'Work completed as specified', required: true },
  { id: '2', label: 'Area cleaned up', required: true },
  { id: '3', label: 'After photos taken', required: true },
  { id: '4', label: 'Customer walkthrough done', required: false },
];

/**
 * GET /api/provider/services/checklist
 * Get checklist for a service type
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get('providerId');
    const serviceType = searchParams.get('serviceType');

    if (!providerId || !serviceType) {
      return NextResponse.json(
        { error: 'Provider ID and service type are required' },
        { status: 400 }
      );
    }

    // Try to get custom checklist
    const customChecklist = await prisma.serviceChecklist.findUnique({
      where: {
        providerId_serviceType: {
          providerId,
          serviceType,
        },
      },
    });

    if (customChecklist) {
      return NextResponse.json({
        items: customChecklist.items as unknown as ChecklistItem[],
        isCustom: true,
      });
    }

    // Return default or generic checklist
    const defaultItems = DEFAULT_CHECKLISTS[serviceType] || GENERIC_CHECKLIST;
    return NextResponse.json({
      items: defaultItems,
      isCustom: false,
    });
  } catch (error) {
    console.error('[Checklist API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch checklist' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/provider/services/checklist
 * Create or update checklist for a service type
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { providerId, serviceType, items } = body;

    if (!providerId || !serviceType || !items) {
      return NextResponse.json(
        { error: 'Provider ID, service type, and items are required' },
        { status: 400 }
      );
    }

    // Validate items structure
    if (!Array.isArray(items)) {
      return NextResponse.json(
        { error: 'Items must be an array' },
        { status: 400 }
      );
    }

    for (const item of items) {
      if (!item.id || !item.label || typeof item.required !== 'boolean') {
        return NextResponse.json(
          { error: 'Each item must have id, label, and required fields' },
          { status: 400 }
        );
      }
    }

    // Upsert the checklist
    const checklist = await prisma.serviceChecklist.upsert({
      where: {
        providerId_serviceType: {
          providerId,
          serviceType,
        },
      },
      update: {
        items,
      },
      create: {
        providerId,
        serviceType,
        items,
      },
    });

    return NextResponse.json({
      success: true,
      checklist,
    });
  } catch (error) {
    console.error('[Checklist API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to save checklist' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/provider/services/checklist
 * Delete custom checklist (revert to default)
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get('providerId');
    const serviceType = searchParams.get('serviceType');

    if (!providerId || !serviceType) {
      return NextResponse.json(
        { error: 'Provider ID and service type are required' },
        { status: 400 }
      );
    }

    await prisma.serviceChecklist.delete({
      where: {
        providerId_serviceType: {
          providerId,
          serviceType,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Checklist API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete checklist' },
      { status: 500 }
    );
  }
}
