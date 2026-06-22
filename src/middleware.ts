import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { rateLimiters, checkRateLimit, getClientIp } from '@/lib/rate-limit';

/**
 * Middleware for rate limiting and security
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Security headers
  const response = NextResponse.next();
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Admin dashboard authentication
  if (pathname.startsWith('/admin')) {
    const adminToken = request.cookies.get('admin_token')?.value;
    const expectedToken = process.env.ADMIN_PASSWORD || 'admin123'; // Default for dev

    if (adminToken !== expectedToken) {
      return NextResponse.redirect(new URL('/admin-login', request.url));
    }
  }

  // Cron job authentication
  if (pathname.startsWith('/api/cron/')) {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return response;
  }

  // Rate limiting for different endpoints
  const clientIp = getClientIp(request);

  // Admin endpoints rate limiting
  if (pathname.startsWith('/api/admin/')) {
    const result = await checkRateLimit(rateLimiters.admin, clientIp);
    
    if (!result.success) {
      return NextResponse.json(
        {
          error: 'Too many requests',
          limit: result.limit,
          remaining: result.remaining,
          reset: result.reset,
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': result.limit.toString(),
            'X-RateLimit-Remaining': result.remaining.toString(),
            'X-RateLimit-Reset': result.reset.toString(),
          },
        }
      );
    }

    response.headers.set('X-RateLimit-Limit', result.limit.toString());
    response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
  }

  // Token launch rate limiting
  if (pathname.includes('/token-launch') || pathname.includes('/workflow/trigger')) {
    const result = await checkRateLimit(rateLimiters.tokenLaunch, clientIp);
    
    if (!result.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded for token launches' },
        { status: 429 }
      );
    }
  }

  // AI analysis rate limiting
  if (pathname.includes('/analyze')) {
    const result = await checkRateLimit(rateLimiters.aiAnalysis, clientIp);
    
    if (!result.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded for AI analysis' },
        { status: 429 }
      );
    }
  }

  // General API rate limiting
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/admin/')) {
    const result = await checkRateLimit(rateLimiters.api, clientIp);
    
    if (!result.success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      );
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/api/:path*',
    '/admin/:path*',
  ],
};
