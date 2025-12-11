import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      providerId,
      paymentTerms,
      acceptedPaymentMethods,
      autoInvoiceOnCompletion,
    } = body;

    if (!providerId) {
      return NextResponse.json(
        { error: 'Provider ID is required' },
        { status: 400 }
      );
    }

    // Update provider payment settings
    const provider = await prisma.provider.update({
      where: { id: providerId },
      data: {
        paymentTerms: paymentTerms || undefined,
        acceptedPaymentMethods: acceptedPaymentMethods || undefined,
        autoInvoiceOnCompletion: autoInvoiceOnCompletion !== undefined ? autoInvoiceOnCompletion : undefined,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        paymentTerms: true,
        acceptedPaymentMethods: true,
        autoInvoiceOnCompletion: true,
      },
    });

    return NextResponse.json({
      success: true,
      provider
    });
  } catch (error) {
    console.error('Error updating payment settings:', error);
    return NextResponse.json(
      { error: 'Failed to update payment settings' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get('providerId');

    if (!providerId) {
      return NextResponse.json(
        { error: 'Provider ID is required' },
        { status: 400 }
      );
    }

    const provider = await prisma.provider.findUnique({
      where: { id: providerId },
      select: {
        id: true,
        paymentTerms: true,
        acceptedPaymentMethods: true,
        autoInvoiceOnCompletion: true,
      },
    });

    if (!provider) {
      return NextResponse.json(
        { error: 'Provider not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ provider });
  } catch (error) {
    console.error('Error fetching payment settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment settings' },
      { status: 500 }
    );
  }
}
