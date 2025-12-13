import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/worker/services
 * Get custom services for a provider (via worker's providerId)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Get worker's provider
    const user = await prisma.providerUser.findUnique({
      where: { id: userId },
      select: {
        providerId: true,
        provider: {
          select: {
            customServices: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // customServices is stored as Json[] - array of { name: string }
    const customServices = (user.provider.customServices as Array<{ name: string }>) || [];

    return NextResponse.json({ customServices });
  } catch (error) {
    console.error('Error fetching custom services:', error);
    return NextResponse.json(
      { error: 'Failed to fetch custom services' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/worker/services
 * Add a custom service for a provider
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, serviceName } = body;

    if (!userId || !serviceName) {
      return NextResponse.json(
        { error: 'User ID and service name are required' },
        { status: 400 }
      );
    }

    // Get worker's provider
    const user = await prisma.providerUser.findUnique({
      where: { id: userId },
      select: {
        providerId: true,
        provider: {
          select: {
            customServices: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get existing custom services
    const existingServices = (user.provider.customServices as Array<{ name: string }>) || [];

    // Check if service already exists (case-insensitive)
    const normalizedName = serviceName.trim().toLowerCase();
    const alreadyExists = existingServices.some(
      (s) => s.name.toLowerCase() === normalizedName
    );

    if (alreadyExists) {
      return NextResponse.json({
        success: true,
        message: 'Service already exists',
        customServices: existingServices
      });
    }

    // Add new service
    const newService = { name: serviceName.trim() };
    const updatedServices = [...existingServices, newService];

    // Update provider
    await prisma.provider.update({
      where: { id: user.providerId },
      data: {
        customServices: updatedServices,
      },
    });

    return NextResponse.json({
      success: true,
      customServices: updatedServices,
    });
  } catch (error) {
    console.error('Error adding custom service:', error);
    return NextResponse.json(
      { error: 'Failed to add custom service' },
      { status: 500 }
    );
  }
}
