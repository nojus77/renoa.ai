import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { authRateLimiter, withRateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  // Rate limit: 5 requests per minute for login attempts
  const { allowed, response } = await withRateLimit(request, authRateLimiter);
  if (!allowed) {
    return response;
  }

  try {
    const body = await request.json();
    const { email, password } = body;

    console.log('🔐 Login attempt for:', email);

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // MULTI-USER LOGIN: If password is provided
    if (password) {
      const user = await prisma.providerUser.findUnique({
        where: { email: normalizedEmail },
        include: { provider: true },
      });

      if (!user) {
        console.log('❌ User not found:', email);
        return NextResponse.json(
          { error: 'Invalid email or password' },
          { status: 401 }
        );
      }

      // Check if user is active - COMPLETELY BLOCK inactive users
      if (user.status !== 'active') {
        console.log('❌ User is inactive:', email);
        return NextResponse.json(
          { error: 'Your account has been deactivated. Contact your employer.' },
          { status: 403 }
        );
      }

      // Update lastLoginAt for billing fraud prevention tracking
      await prisma.providerUser.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });

      // Verify password
      const passwordValid = await bcrypt.compare(password, user.passwordHash);
      if (!passwordValid) {
        console.log('❌ Invalid password for:', email);
        return NextResponse.json(
          { error: 'Invalid email or password' },
          { status: 401 }
        );
      }

      console.log('✅ Multi-user login successful:', user.email, 'Role:', user.role);

      return NextResponse.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          providerId: user.providerId,
        },
        provider: {
          id: user.provider.id,
          businessName: user.provider.businessName,
          ownerName: user.provider.ownerName,
          email: user.provider.email,
          phone: user.provider.phone,
        },
      });
    }

    // LEGACY PASSWORDLESS LOGIN: Auto-migrate existing providers
    // Find provider by email
    const provider = await prisma.provider.findUnique({
      where: { email: normalizedEmail },
    });

    if (!provider) {
      console.log('❌ Provider not found:', email);
      return NextResponse.json(
        { error: 'Email not found in our system. Please check your email address.' },
        { status: 401 }
      );
    }

    // Check if owner ProviderUser already exists for this provider
    let ownerUser = await prisma.providerUser.findUnique({
      where: { email: normalizedEmail },
    });

    // AUTO-MIGRATION: Create owner user if doesn't exist
    if (!ownerUser) {
      console.log('🔄 Auto-creating owner user for provider:', provider.businessName);

      const nameParts = provider.ownerName?.trim().split(' ') || ['Owner'];
      const firstName = nameParts[0] || 'Owner';
      const lastName = nameParts.slice(1).join(' ') || provider.businessName || 'Admin';

      // Generate secure random password (16 chars with letters, numbers, symbols)
      const crypto = await import('crypto');
      const tempPassword = crypto.randomBytes(12).toString('base64').slice(0, 16);
      const passwordHash = await bcrypt.hash(tempPassword, 10);

      ownerUser = await prisma.providerUser.create({
        data: {
          providerId: provider.id,
          email: provider.email,
          passwordHash,
          firstName,
          lastName,
          role: 'owner',
          status: 'active',
          skills: [],
        },
      });

      console.log('✅ Auto-created owner user:', firstName, lastName);
      console.log('📧 Temporary password generated for', provider.email, '- user must reset password');

      // TODO: Send email with temporary password to provider.email
      // For now, return flag indicating password setup is required
    }

    console.log('✅ Legacy provider login successful (auto-migrated):', provider.businessName);

    // Return user + provider data - require password setup for migrated accounts
    return NextResponse.json({
      success: true,
      user: {
        id: ownerUser.id,
        email: ownerUser.email,
        firstName: ownerUser.firstName,
        lastName: ownerUser.lastName,
        role: ownerUser.role,
        providerId: ownerUser.providerId,
      },
      provider: {
        id: provider.id,
        businessName: provider.businessName,
        ownerName: provider.ownerName,
        email: provider.email,
        phone: provider.phone,
      },
      needsPasswordSetup: true, // Flag to prompt password change - user MUST set new password
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}