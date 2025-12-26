import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { authRateLimiter, withRateLimit } from '@/lib/rate-limit';

const sesClient = new SESClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

export async function POST(request: NextRequest) {
  // Rate limit: 5 requests per minute for auth routes
  const { allowed, response, headers } = await withRateLimit(request, authRateLimiter);
  if (!allowed) {
    return response;
  }

  try {
    const body = await request.json();
    const { email } = body;

    if (!email?.trim()) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Find provider user by email (ProviderUser table has passwords)
    const providerUser = await prisma.providerUser.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    // Always return success to prevent email enumeration
    if (!providerUser) {
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent.',
      });
    }

    // Generate random token
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    // Delete any existing tokens for this email
    await prisma.passwordResetToken.deleteMany({
      where: { email: email.toLowerCase().trim() },
    });

    // Create new reset token
    await prisma.passwordResetToken.create({
      data: {
        email: email.toLowerCase().trim(),
        token,
        expires,
      },
    });

    // Send reset email
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const resetUrl = `${appUrl}/provider/reset-password?token=${token}`;

    const emailParams = {
      Source: 'noreply@renoa.ai',
      Destination: {
        ToAddresses: [email],
      },
      Message: {
        Subject: {
          Data: 'Reset Your Password - Renoa AI',
          Charset: 'UTF-8',
        },
        Body: {
          Html: {
            Data: `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
              </head>
              <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                  <h1 style="color: white; margin: 0; font-size: 28px;">Renoa AI</h1>
                </div>
                <div style="background: #ffffff; padding: 40px; border: 1px solid #e5e5e5; border-top: none; border-radius: 0 0 10px 10px;">
                  <h2 style="color: #1a1a1a; margin-top: 0;">Reset Your Password</h2>
                  <p style="color: #666; font-size: 16px;">
                    We received a request to reset your password for your Renoa AI provider account. Click the button below to create a new password:
                  </p>
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetUrl}" style="background: #f97316; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; font-size: 16px;">Reset Password</a>
                  </div>
                  <p style="color: #666; font-size: 14px;">
                    Or copy and paste this link into your browser:
                  </p>
                  <p style="color: #f97316; font-size: 14px; word-break: break-all;">
                    ${resetUrl}
                  </p>
                  <p style="color: #666; font-size: 14px; margin-top: 30px;">
                    This link will expire in <strong>1 hour</strong>.
                  </p>
                  <p style="color: #666; font-size: 14px;">
                    If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.
                  </p>
                  <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 30px 0;">
                  <p style="color: #999; font-size: 12px; text-align: center;">
                    © ${new Date().getFullYear()} Renoa AI. All rights reserved.
                  </p>
                </div>
              </body>
              </html>
            `,
            Charset: 'UTF-8',
          },
          Text: {
            Data: `Reset Your Password - Renoa AI\n\nWe received a request to reset your password. Click the link below to create a new password:\n\n${resetUrl}\n\nThis link will expire in 1 hour.\n\nIf you didn't request this, you can safely ignore this email.`,
            Charset: 'UTF-8',
          },
        },
      },
    };

    await sesClient.send(new SendEmailCommand(emailParams));

    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email, a password reset link has been sent.',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Failed to process password reset request' },
      { status: 500 }
    );
  }
}
