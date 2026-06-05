'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { auth } from '@aidahos/auth';
import { ensureMembership, getHotelById, replaceMembership, updateUserProfile, writeAudit } from '@aidahos/db';
import { getSession } from '@/lib/auth';

type NewUserRole = 'super_admin' | 'admin' | 'user';

/** Create a user (admins only — no open sign-up) and assign their tenant. Audited. */
export async function createUserAction(formData: FormData) {
  const session = await getSession();
  if (!session || session.user.role !== 'super_admin') throw new Error('forbidden');

  const name = String(formData.get('name') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');
  const role = String(formData.get('role') ?? 'user') as NewUserRole;
  const hotelGroupId = String(formData.get('hotelGroupId') ?? '') || null;
  const hotelId = String(formData.get('hotelId') ?? '') || null;

  if (name.length < 2 || !email.includes('@') || password.length < 8) {
    throw new Error('invalid input (name, email, password ≥ 8)');
  }

  const created = await auth.api.createUser({
    headers: await headers(),
    body: { email, password, name, role },
  });
  const userId = created.user.id;

  if (role === 'admin' && hotelGroupId) {
    await ensureMembership({ userId, scope: 'hotel_group', hotelGroupId, role: 'admin' });
  } else if (role === 'user' && hotelId) {
    const hotel = await getHotelById(hotelId);
    await ensureMembership({
      userId,
      scope: 'hotel',
      hotelId,
      hotelGroupId: hotel?.hotelGroupId ?? null,
      role: 'user',
    });
  }

  await writeAudit({
    actorUserId: session.user.id,
    hotelGroupId,
    hotelId,
    action: 'user.create',
    target: email,
    meta: { role },
  });

  revalidatePath('/users');
  redirect('/users');
}

/** Edit a user: name, role, tenant reassignment, ban status. super_admin only. Audited. */
export async function updateUserAction(id: string, formData: FormData) {
  const session = await getSession();
  if (!session || session.user.role !== 'super_admin') throw new Error('forbidden');

  const name = String(formData.get('name') ?? '').trim();
  const role = String(formData.get('role') ?? 'user') as NewUserRole;
  const hotelGroupId = String(formData.get('hotelGroupId') ?? '') || null;
  const hotelId = String(formData.get('hotelId') ?? '') || null;
  const banned = formData.get('banned') === 'on';
  if (name.length < 2) throw new Error('name required');

  await updateUserProfile(id, { name, role, banned });
  if (role === 'super_admin') {
    await replaceMembership(id, { role });
  } else if (role === 'admin') {
    await replaceMembership(id, { role, hotelGroupId });
  } else {
    await replaceMembership(id, { role, hotelId });
  }

  await writeAudit({ actorUserId: session.user.id, hotelGroupId, hotelId, action: 'user.update', target: id, meta: { role, banned } });

  revalidatePath('/users');
  redirect('/users');
}
