import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.user.role !== 'super_admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const hotelSlug = req.nextUrl.searchParams.get('hotelSlug');
  if (!hotelSlug) return NextResponse.json({ error: 'Missing hotelSlug' }, { status: 400 });

  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret) return NextResponse.json({ error: 'Not configured' }, { status: 500 });

  // Build a short-lived signed token: base64(payload).signature
  const exp = Date.now() + 5 * 60 * 1000; // 5 minutes
  const payload = JSON.stringify({ hotelSlug, exp });
  const payloadB64 = Buffer.from(payload).toString('base64url');

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payloadB64));
  const sigB64 = Buffer.from(sig).toString('base64url');
  const token = `${payloadB64}.${sigB64}`;

  const { guestBaseUrl } = await import('@/lib/urls');
  const url = `${guestBaseUrl()}/${hotelSlug}/preview?token=${encodeURIComponent(token)}`;

  return NextResponse.redirect(url);
}
