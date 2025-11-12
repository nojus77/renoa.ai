import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('customer-session');

    if (!sessionCookie?.value) {
      return NextResponse.json({ customer: null }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie.value);

    return NextResponse.json({ customer: session });
  } catch (error) {
    console.error('Error getting session:', error);
    return NextResponse.json({ customer: null }, { status: 401 });
  }
}
