/**
 * Server-side authentication and authorization helpers
 */

import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { hasPermission, type Permission, type AdminRole } from './permissions';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

export interface DecodedToken {
  id: string;
  email: string;
  role: AdminRole;
}

/**
 * Verify admin token from request headers
 */
export function verifyAdminToken(request: NextRequest): DecodedToken | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Check if the authenticated admin has a specific permission
 */
export function checkPermission(
  admin: DecodedToken | null,
  permission: Permission
): boolean {
  if (!admin) return false;
  return hasPermission(admin.role, permission);
}

/**
 * Require authentication and return admin info
 */
export function requireAuth(request: NextRequest): {
  authorized: false;
  admin: null;
  error: { message: string; status: number };
} | {
  authorized: true;
  admin: DecodedToken;
  error: null;
} {
  const admin = verifyAdminToken(request);

  if (!admin) {
    return {
      authorized: false,
      admin: null,
      error: { message: 'Unauthorized', status: 401 },
    };
  }

  return {
    authorized: true,
    admin,
    error: null,
  };
}

/**
 * Require specific permission
 */
export function requirePermission(
  request: NextRequest,
  permission: Permission
): {
  authorized: false;
  admin: null;
  error: { message: string; status: number };
} | {
  authorized: true;
  admin: DecodedToken;
  error: null;
} {
  const authResult = requireAuth(request);

  if (!authResult.authorized) {
    return authResult;
  }

  if (!checkPermission(authResult.admin, permission)) {
    return {
      authorized: false,
      admin: null,
      error: { message: 'Forbidden - Insufficient permissions', status: 403 },
    };
  }

  return authResult;
}

/**
 * Require any of the specified permissions
 */
export function requireAnyPermission(
  request: NextRequest,
  permissions: Permission[]
): {
  authorized: false;
  admin: null;
  error: { message: string; status: number };
} | {
  authorized: true;
  admin: DecodedToken;
  error: null;
} {
  const authResult = requireAuth(request);

  if (!authResult.authorized) {
    return authResult;
  }

  const hasAny = permissions.some(permission =>
    checkPermission(authResult.admin, permission)
  );

  if (!hasAny) {
    return {
      authorized: false,
      admin: null,
      error: { message: 'Forbidden - Insufficient permissions', status: 403 },
    };
  }

  return authResult;
}
