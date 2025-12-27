import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, newPassword } = body;

    // TODO: Add admin authentication check here
    // For now, we'll trust the caller is authenticated
    // In production, verify the session is an admin user

    if (!email?.trim()) {
      return NextResponse.json(
        { error: 'Email is required' },
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

    // Hash the new password
    const passwordHash = await bcrypt.hash(newPassword, 10);
    const emailLower = email.toLowerCase().trim();

    // Try to find and update in ProviderUser table
    const providerUser = await prisma.providerUser.findUnique({
      where: { email: emailLower },
      include: {
        provider: {
          select: {
            businessName: true,
          },
        },
      },
    });

    if (providerUser) {
      await prisma.providerUser.update({
        where: { id: providerUser.id },
        data: { passwordHash, updatedAt: new Date() },
      });

      return NextResponse.json({
        success: true,
        message: `Password successfully reset for Team Member: ${providerUser.firstName} ${providerUser.lastName}`,
        accountType: 'ProviderUser',
        details: {
          name: `${providerUser.firstName} ${providerUser.lastName}`,
          email: providerUser.email,
          role: providerUser.role,
          company: providerUser.provider.businessName,
        },
      });
    }

    // No account found
    return NextResponse.json(
      { error: `No account found with email: ${email}` },
      { status: 404 }
    );
  } catch (error) {
    console.error('Admin password reset error:', error);
    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 }
    );
  }
}

// GET endpoint to search for users by email
export async function GET(request: NextRequest) {
  try {
    // TODO: Add admin authentication check here

    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter is required' },
        { status: 400 }
      );
    }

    const emailLower = email.toLowerCase().trim();
    const results = [];

    // Search in ProviderUser table
    const providerUser = await prisma.providerUser.findUnique({
      where: { email: emailLower },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        provider: {
          select: {
            businessName: true,
          },
        },
      },
    });

    if (providerUser) {
      results.push({
        type: 'ProviderUser',
        id: providerUser.id,
        email: providerUser.email,
        name: `${providerUser.firstName} ${providerUser.lastName}`,
        role: providerUser.role,
        company: providerUser.provider.businessName,
      });
    }

    if (results.length === 0) {
      return NextResponse.json(
        { error: `No account found with email: ${email}` },
        { status: 404 }
      );
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Search user error:', error);
    return NextResponse.json(
      { error: 'Failed to search for user' },
      { status: 500 }
    );
  }
}