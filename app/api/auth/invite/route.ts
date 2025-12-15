import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/**
 * Generate a random temporary password
 */
function generateTempPassword(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { providerId, userId, email, firstName, lastName, role, skills = [] } = body;

    console.log('=== INVITE API CALLED ===');
    console.log('Body:', { providerId, userId, email, firstName, lastName, role, skillsCount: skills.length });

    // Validate required fields
    if (!providerId || !userId) {
      console.log('❌ Missing providerId or userId');
      return NextResponse.json(
        { error: 'Missing providerId or userId in request' },
        { status: 400 }
      );
    }

    if (!email || !firstName || !lastName || !role) {
      return NextResponse.json(
        { error: 'Missing required fields: email, firstName, lastName, role' },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ['owner', 'office', 'field'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be: owner, office, or field' },
        { status: 400 }
      );
    }

    // Get the current user to verify they're an owner
    const currentUser = await prisma.providerUser.findUnique({
      where: { id: userId },
    });

    console.log('Current user:', currentUser ? { id: currentUser.id, role: currentUser.role, providerId: currentUser.providerId } : 'NOT FOUND');

    if (!currentUser) {
      console.log('❌ User not found');
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Verify the user belongs to this provider
    if (currentUser.providerId !== providerId) {
      console.log('❌ Provider mismatch:', { currentUserProviderId: currentUser.providerId, requestProviderId: providerId });
      return NextResponse.json(
        { error: 'Unauthorized - provider mismatch' },
        { status: 403 }
      );
    }

    // Check if current user has permission to invite
    if (currentUser.role !== 'owner') {
      console.log('❌ Not owner - role is:', currentUser.role);
      return NextResponse.json(
        { error: 'Only owners can invite team members' },
        { status: 403 }
      );
    }

    console.log('✅ Permission checks passed');

    // Check if email is already in use
    const existingUser = await prisma.providerUser.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already in use' },
        { status: 409 }
      );
    }

    // Generate temporary password
    const tempPassword = generateTempPassword();
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    // Fetch provider's business hours to use as default working hours
    const provider = await prisma.provider.findUnique({
      where: { id: currentUser.providerId },
      select: { workingHours: true },
    });

    // Default working hours if provider doesn't have any set
    const defaultWorkingHours = {
      monday: { enabled: true, start: '09:00', end: '17:00' },
      tuesday: { enabled: true, start: '09:00', end: '17:00' },
      wednesday: { enabled: true, start: '09:00', end: '17:00' },
      thursday: { enabled: true, start: '09:00', end: '17:00' },
      friday: { enabled: true, start: '09:00', end: '17:00' },
      saturday: { enabled: false, start: '09:00', end: '17:00' },
      sunday: { enabled: false, start: '09:00', end: '17:00' },
    };

    // Use provider's working hours if available, otherwise use defaults
    const workingHours = provider?.workingHours || defaultWorkingHours;

    // Create the new user
    const newUser = await prisma.providerUser.create({
      data: {
        providerId: currentUser.providerId,
        email,
        passwordHash,
        firstName,
        lastName,
        role,
        skills: [], // Keep empty for backward compatibility
        status: 'active',
        workingHours: workingHours as any, // Inherit business hours as default
      },
    });

    // If field worker with skills, create skill relationships
    if (role === 'field' && skills.length > 0) {
      // skills is now an array of skill IDs
      await Promise.all(
        skills.map((skillId: string) =>
          prisma.providerUserSkill.create({
            data: {
              userId: newUser.id,
              skillId,
              level: 'basic', // Default to basic level for new workers
            },
          })
        )
      );
    }

    console.log('✅ User created successfully:', newUser.id);

    // Create notification for new team member
    await prisma.notification.create({
      data: {
        providerId: currentUser.providerId,
        type: 'new_team_member',
        title: 'New Team Member',
        message: `${firstName} ${lastName} has joined your team as ${role}`,
        data: {
          memberId: newUser.id,
          memberName: `${firstName} ${lastName}`,
          role,
          email,
        },
        read: false,
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role,
        skills: newUser.skills,
      },
      tempPassword, // Return temp password so owner can share it
    });
  } catch (error: any) {
    console.error('❌ Error inviting user:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to invite user' },
      { status: 500 }
    );
  }
}
