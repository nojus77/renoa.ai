import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const session = cookieStore.get('customer-session');

    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { customerId, providerId } = JSON.parse(session.value);
    const body = await request.json();
    const { bundleId, date, address, notes, addons } = body;

    if (!bundleId || !date || !address) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Fetch bundle details
    const bundle = await prisma.service_bundles.findUnique({
      where: { id: bundleId },
    });

    if (!bundle) {
      return NextResponse.json({ error: 'Bundle not found' }, { status: 404 });
    }

    // Calculate total price (bundle + addons)
    const addonsTotal = addons?.reduce((sum: number, addon: any) => sum + addon.price, 0) || 0;
    const totalValue = Number(bundle.bundle_price) + addonsTotal;

    // Create jobs for each service in the bundle
    const serviceTypes = bundle.service_types as string[];
    const jobs = [];

    const startTime = new Date(date);
    const endTime = new Date(startTime);
    endTime.setHours(endTime.getHours() + 2); // Default 2 hours per service

    for (const serviceType of serviceTypes) {
      const job = await prisma.job.create({
        data: {
          providerId,
          customerId,
          serviceType,
          address,
          startTime,
          endTime,
          status: 'scheduled',
          source: 'own',
          booking_source: 'package_bundle',
          estimatedValue: Number(bundle.bundle_price) / serviceTypes.length,
          customerNotes: notes || undefined,
          bundle_id: bundleId,
          upsells: addons || undefined,
        },
      });
      jobs.push(job);

      // Increment start/end time for next service
      startTime.setDate(startTime.getDate() + 1);
      endTime.setDate(endTime.getDate() + 1);
    }

    return NextResponse.json({
      success: true,
      jobs,
      totalValue,
      bundleName: bundle.name,
    }, { status: 201 });
  } catch (error) {
    console.error('Error booking package:', error);
    return NextResponse.json({ error: 'Failed to book package' }, { status: 500 });
  }
}
