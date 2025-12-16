import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { uploadCustomerMessageMedia, validateCustomerMessageFile } from '@/lib/storage/customer-messages';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const providerId = formData.get('providerId') as string | null;
    const customerId = formData.get('customerId') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 });
    }

    if (!providerId || !customerId) {
      return NextResponse.json({ error: 'Provider ID and Customer ID are required' }, { status: 400 });
    }

    // Verify the customer belongs to this provider
    const customer = await prisma.customer.findFirst({
      where: { id: customerId, providerId },
      select: { id: true },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    validateCustomerMessageFile(file);
    const upload = await uploadCustomerMessageMedia({ file, providerId, customerId });

    return NextResponse.json({
      url: upload.url,
      thumbnailUrl: upload.thumbnailUrl,
    });
  } catch (error) {
    console.error('[Provider Customer Message Upload] Error:', error);
    const message = error instanceof Error ? error.message : 'Failed to upload image';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
