import { cookies } from 'next/headers';

export async function getCustomerSession() {
  try {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('customer-session');

    if (!sessionCookie?.value) {
      return null;
    }

    const session = JSON.parse(sessionCookie.value);
    return session;
  } catch (error) {
    console.error('Error getting customer session:', error);
    return null;
  }
}
