import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@aidahos/auth';
import { writeAudit } from '@aidahos/db';
import { getSession } from '@/lib/auth';
import { headers } from 'next/headers';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.user.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { userId } = await req.json() as { userId: string };
  if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 });

  const reqHeaders = await headers();
  const response = await auth.api.impersonateUser({
    headers: reqHeaders,
    body: { userId },
    asResponse: true,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    return NextResponse.json({ error: 'Impersonation failed', detail: body }, { status: response.status });
  }

  try {
    await writeAudit({
      actorUserId: session.user.id,
      impersonatedUserId: userId,
      action: 'impersonation.start',
      target: userId,
    });
  } catch (e) {
    console.error('[impersonate] audit write failed:', e);
  }

  // Forward all Set-Cookie headers from BetterAuth to the browser
  const res = NextResponse.json({ ok: true });
  response.headers.forEach((value, key) => {
    if (key.toLowerCase() === 'set-cookie') {
      res.headers.append('set-cookie', value);
    }
  });
  return res;
}
