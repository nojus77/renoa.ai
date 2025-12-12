import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { providerUserId, newPassword } = body;

    // TODO: Add admin authentication check here
    // For now, we'll trust the caller is authenticated
    // In production, verify the session is an admin user

    if (!providerUserId?.trim()) {
      return NextResponse.json(
        { error: 'Provider User ID is required' },
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

    // Find the provider user
    const providerUser = await prisma.providerUser.findUnique({
      where: { id: providerUserId },
      include: {
        provider: {
          select: { businessName: true },
        },
      },
    });

    if (!providerUser) {
      return NextResponse.json(
        { error: 'Provider user not found' },
        { status: 404 }
      );
    }

    // Hash the new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update the provider user's password
    await prisma.providerUser.update({
      where: { id: providerUserId },
      data: {
        passwordHash,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Password successfully reset for ${providerUser.firstName} ${providerUser.lastName} (${providerUser.provider.businessName})`,
    });
  } catch (error) {
    console.error('Admin password reset error:', error);
    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch all provider users for the dropdown
export async function GET(request: NextRequest) {
  try {
    // TODO: Add admin authentication check here

    const providerUsers = await prisma.providerUser.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        provider: {
          select: {
            businessName: true,
          },
        },
      },
      orderBy: [
        { provider: { businessName: 'asc' } },
        { lastName: 'asc' },
      ],
    });

    return NextResponse.json({ providerUsers });
  } catch (error) {
    console.error('Get provider users error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch provider users' },
      { status: 500 }
    );
  }
}
