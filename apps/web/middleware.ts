import { NextResponse, type NextRequest } from 'next/server';
import { getSessionCookie } from 'better-auth/cookies';

/**
 * Edge gate: redirect unauthenticated requests on protected route groups to /login.
 * Fine-grained role/membership checks (super_admin vs admin vs hotel scope) run in the
 * server components/layouts, where the DB + RLS context are available.
 */
export function middleware(req: NextRequest) {
  const hasSession = getSessionCookie(req);
  if (!hasSession) {
    const url = new URL('/login', req.url);
    url.searchParams.set('redirect', req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

// Protect the admin surfaces; public pages (/, /login, /api/*) are untouched.
export const config = {
  matcher: ['/dashboard/:path*', '/accounts/:path*', '/users/:path*', '/hotels/:path*', '/h/:path*'],
};
