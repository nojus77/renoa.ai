// Shared verification code store
// In production, replace this with Redis

export const verificationCodes = new Map<string, { code: string; expires: number }>();

export function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function storeCode(key: string, code: string, expiresInMinutes: number = 10) {
  verificationCodes.set(key, {
    code,
    expires: Date.now() + expiresInMinutes * 60 * 1000,
  });
}

export function verifyCode(key: string, code: string): { valid: boolean; error?: string } {
  const stored = verificationCodes.get(key);

  if (!stored) {
    return { valid: false, error: 'No verification code found. Please request a new one.' };
  }

  if (Date.now() > stored.expires) {
    verificationCodes.delete(key);
    return { valid: false, error: 'Verification code expired. Please request a new one.' };
  }

  if (stored.code !== code) {
    return { valid: false, error: 'Invalid verification code' };
  }

  // Code is valid, delete it
  verificationCodes.delete(key);
  return { valid: true };
}
