'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { auth } from '@aidahos/auth';
import { writeAudit } from '@aidahos/db';
import { getSession } from '@/lib/auth';

/** super_admin starts impersonating another user (e.g. an admin). Audited. */
export async function impersonate(userId: string) {
  const session = await getSession();
  if (!session || session.user.role !== 'super_admin') throw new Error('forbidden');

  await auth.api.impersonateUser({ headers: await headers(), body: { userId } });
  await writeAudit({
    actorUserId: session.user.id,
    impersonatedUserId: userId,
    action: 'impersonation.start',
    target: userId,
  });
  redirect('/');
}

/** End an impersonation session and return to the super_admin. Audited. */
export async function stopImpersonate() {
  const session = await getSession();
  const impersonatedBy = session?.session?.impersonatedBy ?? null;
  const impersonatedUserId = session?.user?.id ?? null;

  await auth.api.stopImpersonating({ headers: await headers() });
  await writeAudit({
    actorUserId: impersonatedBy,
    impersonatedUserId,
    action: 'impersonation.stop',
  });
  revalidatePath('/', 'layout');
  redirect('/dashboard');
}
