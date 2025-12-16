import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { uploadCustomerMessageMedia, validateCustomerMessageFile } from '@/lib/storage/customer-messages';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const userId = formData.get('userId') as string | null;
    const customerId = formData.get('customerId') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 });
    }

    if (!userId || !customerId) {
      return NextResponse.json({ error: 'User ID and Customer ID are required' }, { status: 400 });
    }

    // Get the user and their provider
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { providerId: true },
    });

    if (!user || !user.providerId) {
      return NextResponse.json({ error: 'User not found or not associated with a provider' }, { status: 404 });
    }

    // Verify the customer belongs to this provider
    const customer = await prisma.customer.findFirst({
      where: { id: customerId, providerId: user.providerId },
      select: { id: true },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    validateCustomerMessageFile(file);
    const upload = await uploadCustomerMessageMedia({ file, providerId: user.providerId, customerId });

    return NextResponse.json({
      url: upload.url,
      thumbnailUrl: upload.thumbnailUrl,
    });
  } catch (error) {
    console.error('[Worker Customer Message Upload] Error:', error);
    const message = error instanceof Error ? error.message : 'Failed to upload image';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
