import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { providerId, newPassword } = body;

    // TODO: Add admin authentication check here
    // For now, we'll trust the caller is authenticated
    // In production, verify the session is an admin user

    if (!providerId?.trim()) {
      return NextResponse.json(
        { error: 'Provider ID is required' },
        { status: 400 }
      );
    }

    if (!newPassword?.trim()) {
      return NextResponse.json(
        { error: 'New password is required' },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Find the provider
    const provider = await prisma.provider.findUnique({
      where: { id: providerId },
    });

    if (!provider) {
      return NextResponse.json(
        { error: 'Provider not found' },
        { status: 404 }
      );
    }

    // Hash the new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update the provider's password
    await prisma.provider.update({
      where: { id: providerId },
      data: {
        passwordHash,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Password successfully reset for ${provider.businessName}`,
    });
  } catch (error) {
    console.error('Admin password reset error:', error);
    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch all providers for the dropdown
export async function GET(request: NextRequest) {
  try {
    // TODO: Add admin authentication check here

    const providers = await prisma.provider.findMany({
      select: {
        id: true,
        businessName: true,
        email: true,
        ownerName: true,
      },
      orderBy: {
        businessName: 'asc',
      },
    });

    return NextResponse.json({ providers });
  } catch (error) {
    console.error('Get providers error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch providers' },
      { status: 500 }
    );
  }
}
