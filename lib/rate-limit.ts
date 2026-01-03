import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { NextRequest, NextResponse } from 'next/server';

// Initialize Redis client - uses environment variables automatically
// UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

// Export redis for use in other modules
export { redis };

// Rate limiters for different contexts
// Auth routes: strict limit to prevent brute force
export const authRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '1 m'), // 5 requests per minute
  analytics: true,
  prefix: 'ratelimit:auth',
});

// General API routes: moderate limit
export const apiRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, '1 m'), // 60 requests per minute
  analytics: true,
  prefix: 'ratelimit:api',
});

// Webhook routes: high limit for external services
export const webhookRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '1 m'), // 100 requests per minute
  analytics: true,
  prefix: 'ratelimit:webhook',
});

// Public routes (unauthenticated): moderate limit
export const publicRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, '1 m'), // 30 requests per minute
  analytics: true,
  prefix: 'ratelimit:public',
});

// Get identifier from request (IP address or user ID)
export function getIdentifier(req: NextRequest, userId?: string): string {
  // Prefer user ID if available (authenticated requests)
  if (userId) {
    return `user:${userId}`;
  }

  // Fall back to IP address
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : req.headers.get('x-real-ip') || 'unknown';
  return `ip:${ip}`;
}

// Rate limit result type
export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

// Check rate limit and return result
export async function checkRateLimit(
  rateLimiter: Ratelimit,
  identifier: string
): Promise<RateLimitResult> {
  const { success, limit, remaining, reset } = await rateLimiter.limit(identifier);

  return {
    success,
    limit,
    remaining,
    reset,
  };
}

// Create rate limit response headers
export function createRateLimitHeaders(result: RateLimitResult): Headers {
  const headers = new Headers();
  headers.set('X-RateLimit-Limit', result.limit.toString());
  headers.set('X-RateLimit-Remaining', result.remaining.toString());
  headers.set('X-RateLimit-Reset', result.reset.toString());
  return headers;
}

// Create rate limit exceeded response
export function createRateLimitExceededResponse(result: RateLimitResult): NextResponse {
  const headers = createRateLimitHeaders(result);

  return new NextResponse(
    JSON.stringify({
      error: 'Too many requests',
      retryAfter: Math.ceil((result.reset - Date.now()) / 1000),
    }),
    {
      status: 429,
      headers: {
        ...Object.fromEntries(headers.entries()),
        'Content-Type': 'application/json',
        'Retry-After': Math.ceil((result.reset - Date.now()) / 1000).toString(),
      },
    }
  );
}

// Higher-level helper for API routes
export async function withRateLimit(
  req: NextRequest,
  rateLimiter: Ratelimit,
  userId?: string
): Promise<{ allowed: boolean; response?: NextResponse; headers: Headers }> {
  // Skip rate limiting if Upstash is not configured
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    console.warn('[Rate Limit] Upstash not configured, skipping rate limiting');
    return { allowed: true, headers: new Headers() };
  }

  const identifier = getIdentifier(req, userId);
  const result = await checkRateLimit(rateLimiter, identifier);
  const headers = createRateLimitHeaders(result);

  if (!result.success) {
    return {
      allowed: false,
      response: createRateLimitExceededResponse(result),
      headers,
    };
  }

  return { allowed: true, headers };
}
