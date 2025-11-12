import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { generateCode, storeCode } from '@/lib/verification-store';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { method, phone, email } = body;

    if (!method || (method !== 'phone' && method !== 'email')) {
      return NextResponse.json(
        { error: 'Invalid login method' },
        { status: 400 }
      );
    }

    if (method === 'phone' && !phone) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    if (method === 'email' && !email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Check if customer exists
    const customer = await prisma.customer.findFirst({
      where: method === 'phone' ? { phone } : { email },
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'No account found with this ' + method },
        { status: 404 }
      );
    }

    // Generate verification code
    const code = generateCode();
    const key = method === 'phone' ? phone : email;

    // Store code with 10-minute expiration
    storeCode(key, code, 10);

    // In production, you would send the code via SMS (Twilio) or Email
    console.log(`Verification code for ${key}: ${code}`);

    // For development, return code in response (REMOVE IN PRODUCTION!)
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json({
        success: true,
        devCode: code, // Only for development
        message: 'Verification code sent (check console)'
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Verification code sent'
    });
  } catch (error) {
    console.error('Error sending verification code:', error);
    return NextResponse.json(
      { error: 'Failed to send verification code' },
      { status: 500 }
    );
  }
}
