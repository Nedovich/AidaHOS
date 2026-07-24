import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { GUEST_COOKIE } from '@/lib/constants';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ hotelSlug: string }> },
) {
  const { hotelSlug } = await params;
  const token = req.nextUrl.searchParams.get('token');
  if (!token) return NextResponse.redirect(new URL(`/${hotelSlug}`, req.url));

  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret) return NextResponse.redirect(new URL(`/${hotelSlug}`, req.url));

  // Verify HMAC signature
  const dotIdx = token.lastIndexOf('.');
  if (dotIdx === -1) return NextResponse.redirect(new URL(`/${hotelSlug}`, req.url));

  const payloadB64 = token.slice(0, dotIdx);
  const sigB64 = token.slice(dotIdx + 1);

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify'],
  );
  const sigBytes = Buffer.from(sigB64, 'base64url');
  const valid = await crypto.subtle.verify('HMAC', key, sigBytes, new TextEncoder().encode(payloadB64));
  if (!valid) return NextResponse.redirect(new URL(`/${hotelSlug}`, req.url));

  // Decode and validate payload
  let payload: { hotelSlug: string; exp: number };
  try {
    payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString());
  } catch {
    return NextResponse.redirect(new URL(`/${hotelSlug}`, req.url));
  }

  if (payload.hotelSlug !== hotelSlug || Date.now() > payload.exp) {
    return NextResponse.redirect(new URL(`/${hotelSlug}`, req.url));
  }

  // Set a preview session cookie — no room/name, just marks the portal as open
  const jar = await cookies();
  jar.set(
    GUEST_COOKIE,
    JSON.stringify({
      hotelSlug,
      room: null,
      name: 'Admin Preview',
      checkIn: null,
      checkOut: null,
    }),
    { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 },
  );

  return NextResponse.redirect(new URL(`/${hotelSlug}`, req.url));
}
