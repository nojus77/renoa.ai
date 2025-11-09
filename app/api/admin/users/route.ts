import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Resend } from 'resend';
import { customAlphabet } from 'nanoid';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';
const resend = new Resend(process.env.RESEND_API_KEY);

// Generate random password (12 characters, alphanumeric + special chars)
const generatePassword = customAlphabet('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*', 12);

// Verify admin token and extract user info
function verifyAdminToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: string;
      email: string;
      role: string;
    };
    return decoded;
  } catch {
    return null;
  }
}

// GET - List all admins
export async function GET(request: NextRequest) {
  const admin = verifyAdminToken(request);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('Fetching admins from database...');
    const admins = await prisma.admin.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        lastLoginAt: true,
        createdAt: true,
        mustChangePassword: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    console.log(`Found ${admins.length} admins`);
    return NextResponse.json({ admins });
  } catch (error) {
    console.error('Error fetching admins:', error);
    // Return more detailed error info in development
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error details:', errorMessage);
    return NextResponse.json(
      { error: 'Internal server error', details: process.env.NODE_ENV === 'development' ? errorMessage : undefined },
      { status: 500 }
    );
  }
}

// POST - Create new admin
export async function POST(request: NextRequest) {
  const admin = verifyAdminToken(request);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Only super_admin can create new admins
  if (admin.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { email, name, role } = body;

    if (!email || !name) {
      return NextResponse.json(
        { error: 'Email and name are required' },
        { status: 400 }
      );
    }

    // Check if admin already exists
    const existing = await prisma.admin.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Admin with this email already exists' },
        { status: 400 }
      );
    }

    // Generate random temporary password
    const temporaryPassword = generatePassword();

    // Hash password
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

    // Create admin
    const newAdmin = await prisma.admin.create({
      data: {
        email: email.toLowerCase(),
        name,
        hashedPassword,
        role: role || 'admin',
        mustChangePassword: true, // Force password change on first login
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        mustChangePassword: true,
      },
    });

    // Send welcome email with temporary password
    let emailSent = false;
    let emailError = null;

    try {
      await resend.emails.send({
        from: 'Renoa.ai <noreply@renoa.ai>',
        to: email,
        subject: 'Welcome to Renoa.ai Admin Portal',
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .container {
      background: #ffffff;
      border-radius: 8px;
      padding: 32px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 32px;
    }
    .logo {
      font-size: 28px;
      font-weight: bold;
      color: #10b981;
      margin-bottom: 8px;
    }
    .title {
      font-size: 24px;
      font-weight: 600;
      color: #1f2937;
      margin: 0 0 16px 0;
    }
    .content {
      color: #4b5563;
      margin-bottom: 24px;
    }
    .credentials {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      padding: 20px;
      margin: 24px 0;
    }
    .credential-row {
      display: flex;
      margin-bottom: 12px;
    }
    .credential-row:last-child {
      margin-bottom: 0;
    }
    .credential-label {
      font-weight: 600;
      color: #374151;
      min-width: 120px;
    }
    .credential-value {
      color: #10b981;
      font-family: monospace;
      font-size: 14px;
    }
    .button {
      display: inline-block;
      background: #10b981;
      color: #ffffff;
      padding: 12px 32px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      margin: 24px 0;
    }
    .warning {
      background: #fef3c7;
      border: 1px solid #fbbf24;
      border-radius: 6px;
      padding: 16px;
      margin: 24px 0;
      color: #92400e;
    }
    .footer {
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid #e5e7eb;
      color: #6b7280;
      font-size: 14px;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">Renoa.ai</div>
    </div>

    <h1 class="title">Welcome to the Admin Portal</h1>

    <div class="content">
      <p>Hi ${name},</p>

      <p>Your admin account has been created for the Renoa.ai Admin Portal. You can now access the dashboard to manage leads, analytics, and system settings.</p>
    </div>

    <div class="credentials">
      <div class="credential-row">
        <span class="credential-label">Email:</span>
        <span class="credential-value">${email}</span>
      </div>
      <div class="credential-row">
        <span class="credential-label">Temporary Password:</span>
        <span class="credential-value">${temporaryPassword}</span>
      </div>
    </div>

    <center>
      <a href="https://renoa.ai/admin/login" class="button">Log In to Dashboard</a>
    </center>

    <div class="warning">
      <strong>Important:</strong> You will be required to change your password after your first login. Please keep this email secure until you have updated your password.
    </div>

    <div class="content">
      <p><strong>Next Steps:</strong></p>
      <ol>
        <li>Click the button above to access the login page</li>
        <li>Enter your email and temporary password</li>
        <li>You'll be prompted to create a new secure password</li>
        <li>Start managing your admin dashboard</li>
      </ol>
    </div>

    <div class="footer">
      <p>If you have any questions or need assistance, please contact your system administrator.</p>
      <p>&copy; ${new Date().getFullYear()} Renoa.ai. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
        `,
      });
      emailSent = true;
    } catch (error) {
      console.error('Error sending welcome email:', error);
      emailError = error instanceof Error ? error.message : 'Unknown error';
    }

    return NextResponse.json({
      admin: newAdmin,
      emailSent,
      emailError: emailError ? `Warning: Admin created but email failed to send: ${emailError}` : null,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating admin:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Remove admin
export async function DELETE(request: NextRequest) {
  const admin = verifyAdminToken(request);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Only super_admin can delete admins
  if (admin.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Admin ID is required' },
        { status: 400 }
      );
    }

    // Don't allow deleting yourself
    if (id === admin.id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    await prisma.admin.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting admin:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
