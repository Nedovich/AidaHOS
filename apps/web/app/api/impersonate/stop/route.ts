import { NextResponse } from 'next/server';
import { auth } from '@aidahos/auth';
import { writeAudit } from '@aidahos/db';
import { getSession } from '@/lib/auth';
import { headers } from 'next/headers';

export async function POST() {
  const session = await getSession();
  const impersonatedBy = session?.session?.impersonatedBy ?? null;
  const impersonatedUserId = session?.user?.id ?? null;

  const reqHeaders = await headers();
  const response = await auth.api.stopImpersonating({
    headers: reqHeaders,
    asResponse: true,
  });

  if (impersonatedBy && impersonatedUserId) {
    try {
      await writeAudit({
        actorUserId: impersonatedBy,
        impersonatedUserId,
        action: 'impersonation.stop',
      });
    } catch (e) {
      console.error('[impersonate] audit write failed:', e);
    }
  }

  const res = NextResponse.json({ ok: true });
  response.headers.forEach((value, key) => {
    if (key.toLowerCase() === 'set-cookie') {
      res.headers.append('set-cookie', value);
    }
  });
  return res;
}
