import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Find provider by email
    const provider = await prisma.provider.findFirst({
      where: {
        email: email.toLowerCase().trim(),
      },
    });

    if (!provider) {
      return NextResponse.json(
        { error: 'No provider account found with this email' },
        { status: 404 }
      );
    }

    if (provider.status !== 'active') {
      return NextResponse.json(
        { error: 'Your account is not active. Please contact support.' },
        { status: 403 }
      );
    }

    // Return provider data (in a real app, you'd create a JWT token here)
    return NextResponse.json({
      provider: {
        id: provider.id,
        businessName: provider.businessName,
        email: provider.email,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}