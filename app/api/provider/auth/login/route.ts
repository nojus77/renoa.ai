import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = body.email;

    console.log('🔐 Login attempt for:', email);

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Find provider by email
    const provider = await prisma.provider.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!provider) {
      console.log('❌ Provider not found:', email);
      return NextResponse.json(
        { error: 'Email not found in our system. Please check your email address.' },
        { status: 401 }
      );
    }

    console.log('✅ Login successful:', provider.businessName);

    return NextResponse.json({
      success: true,
      provider: {
        id: provider.id,
        businessName: provider.businessName,
        ownerName: provider.ownerName,
        email: provider.email,
        phone: provider.phone,
      },
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}