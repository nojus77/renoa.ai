import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// POST - Add custom service type
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { providerId, serviceName } = body;

    if (!providerId || !serviceName) {
      return NextResponse.json(
        { error: 'Provider ID and service name are required' },
        { status: 400 }
      );
    }

    // Fetch current custom services
    const provider = await prisma.provider.findUnique({
      where: { id: providerId },
      select: { customServices: true },
    });

    if (!provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    // Add new service if it doesn't already exist
    const customServices = provider.customServices as any[];
    const serviceExists = customServices.some(
      (s: any) => s.name?.toLowerCase() === serviceName.toLowerCase()
    );

    if (serviceExists) {
      return NextResponse.json(
        { error: 'Service already exists' },
        { status: 400 }
      );
    }

    const newService = {
      id: `custom-${Date.now()}`,
      name: serviceName,
      icon: '⚙️',
    };

    const updatedServices = [...customServices, newService];

    // Update provider
    await prisma.provider.update({
      where: { id: providerId },
      data: { customServices: updatedServices },
    });

    return NextResponse.json({ success: true, service: newService });
  } catch (error) {
    console.error('Error adding custom service:', error);
    return NextResponse.json(
      { error: 'Failed to add custom service' },
      { status: 500 }
    );
  }
}

// GET - Fetch custom services for a provider
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get('providerId');

    if (!providerId) {
      return NextResponse.json({ error: 'Provider ID is required' }, { status: 400 });
    }

    const provider = await prisma.provider.findUnique({
      where: { id: providerId },
      select: { customServices: true },
    });

    if (!provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    return NextResponse.json({ customServices: provider.customServices || [] });
  } catch (error) {
    console.error('Error fetching custom services:', error);
    return NextResponse.json(
      { error: 'Failed to fetch custom services' },
      { status: 500 }
    );
  }
}
