'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import {
  createHotelGroup,
  ensureMembership,
  findHotelGroupBySlug,
  getUserById,
  setUserRole,
  updateHotelGroup,
  writeAudit,
} from '@aidahos/db';
import { getSession } from '@/lib/auth';
import { slugify } from '@/lib/slug';

async function uniqueSlug(name: string): Promise<string> {
  const base = slugify(name);
  let slug = base;
  let n = 2;
  while (await findHotelGroupBySlug(slug)) slug = `${base}-${n++}`;
  return slug;
}

/**
 * Assign an existing user as the group's owner → makes them an admin of the group.
 * Mirrors the group's display owner name/email from the user. Audited.
 */
async function assignOwner(actorId: string, hotelGroupId: string, ownerUserId: string | null) {
  if (!ownerUserId) return;
  const user = await getUserById(ownerUserId);
  if (!user) return;
  await ensureMembership({ userId: user.id, scope: 'hotel_group', hotelGroupId, role: 'admin' });
  if (user.role !== 'super_admin' && user.role !== 'admin') await setUserRole(user.id, 'admin');
  await updateHotelGroup(hotelGroupId, { ownerName: user.name, ownerEmail: user.email });
  await writeAudit({ actorUserId: actorId, hotelGroupId, action: 'account.owner_assigned', target: user.email, meta: { role: 'admin' } });
}

/** Create a hotel group (account) + optionally assign an owner. super_admin only. Audited. */
export async function createAccount(formData: FormData) {
  const session = await getSession();
  if (!session || session.user.role !== 'super_admin') throw new Error('forbidden');

  const name = String(formData.get('name') ?? '').trim();
  if (name.length < 2) throw new Error('name required');
  const ownerUserId = String(formData.get('ownerUserId') ?? '') || null;

  const group = await createHotelGroup({
    name,
    slug: await uniqueSlug(name),
    region: String(formData.get('region') ?? '').trim() || null,
    plan: String(formData.get('plan') ?? 'scale'),
  });
  await writeAudit({ actorUserId: session.user.id, hotelGroupId: group.id, action: 'account.create', target: group.name });
  await assignOwner(session.user.id, group.id, ownerUserId);

  revalidatePath('/accounts');
  redirect(`/accounts/${group.id}`);
}

type TenantStatus = 'active' | 'trial' | 'suspended' | 'archived';

/** Edit a hotel group + optionally (re)assign owner. super_admin only. Audited. */
export async function updateAccountAction(id: string, formData: FormData) {
  const session = await getSession();
  if (!session || session.user.role !== 'super_admin') throw new Error('forbidden');

  const name = String(formData.get('name') ?? '').trim();
  const status = String(formData.get('status') ?? 'active') as TenantStatus;
  if (name.length < 2) throw new Error('name required');
  const ownerUserId = String(formData.get('ownerUserId') ?? '') || null;

  await updateHotelGroup(id, {
    name,
    status,
    region: String(formData.get('region') ?? '').trim() || null,
    plan: String(formData.get('plan') ?? 'scale'),
  });
  await writeAudit({ actorUserId: session.user.id, hotelGroupId: id, action: 'account.update', target: name });
  await assignOwner(session.user.id, id, ownerUserId);

  revalidatePath(`/accounts/${id}`);
  revalidatePath('/accounts');
  redirect(`/accounts/${id}`);
}
