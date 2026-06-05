'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createAuth } from '@aidahos/auth';
import {
  ensureMembership,
  getHotelById,
  getHotelsForGroup,
  getUserByEmail,
  getUserById,
  getUserMemberships,
  replaceMembership,
  setUserRole,
  updateUserProfile,
  writeAudit,
} from '@aidahos/db';
import { canAccessHotel, getSession } from '@/lib/auth';

/**
 * Group admin creates a sub-user (hotel manager) under one of their group's hotels.
 * Scoped: the target hotel must belong to the admin's group. No open sign-up.
 */
export async function createSubUser(hotelId: string, formData: FormData) {
  const session = await getSession();
  if (!session || session.user.role !== 'admin') throw new Error('forbidden');

  const current = await getHotelById(hotelId);
  if (!current) throw new Error('hotel not found');
  const groupId = current.hotelGroupId;
  if (!(await canAccessHotel(current.id, groupId))) throw new Error('forbidden');

  const name = String(formData.get('name') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');
  const targetHotelId = String(formData.get('hotelId') ?? '');

  if (name.length < 2 || !email.includes('@') || password.length < 8) {
    throw new Error('invalid input (name, email, password ≥ 8)');
  }

  // The target hotel must be in the admin's group.
  const groupHotels = await getHotelsForGroup(groupId);
  if (!groupHotels.some((h) => h.id === targetHotelId)) {
    throw new Error('hotel not in your group');
  }

  const auth = createAuth({ allowSignUp: true });
  let user = await getUserByEmail(email);
  if (!user) {
    await auth.api.signUpEmail({ body: { email, password, name } });
    user = await getUserByEmail(email);
  }
  if (!user) throw new Error('could not create user');

  await setUserRole(user.id, 'user');
  await ensureMembership({ userId: user.id, scope: 'hotel', hotelId: targetHotelId, hotelGroupId: groupId, role: 'user' });
  await writeAudit({
    actorUserId: session.user.id,
    hotelGroupId: groupId,
    hotelId: targetHotelId,
    action: 'user.create_sub',
    target: email,
    meta: { role: 'user' },
  });

  revalidatePath(`/h/${hotelId}/users`);
  redirect(`/h/${hotelId}/users`);
}

/**
 * Group admin edits a user that belongs to their group.
 * Scoped & safe: target must be in the admin's group; role cannot be escalated
 * (the user keeps their existing group role). Only name, ban status and the
 * assigned hotel (for hotel-managers) can change.
 */
export async function updateGroupUser(hotelId: string, targetUserId: string, formData: FormData) {
  const session = await getSession();
  if (!session || session.user.role !== 'admin') throw new Error('forbidden');

  const current = await getHotelById(hotelId);
  if (!current) throw new Error('hotel not found');
  const groupId = current.hotelGroupId;
  if (!(await canAccessHotel(current.id, groupId))) throw new Error('forbidden');

  const target = await getUserById(targetUserId);
  if (!target) throw new Error('user not found');

  // The target must have a membership in the admin's group.
  const mems = await getUserMemberships(targetUserId);
  const m = mems.find((x) => x.hotelGroupId === groupId);
  if (!m) throw new Error('forbidden');
  const currentRole = m.role; // 'admin' (group owner) or 'user' (hotel manager)

  const name = String(formData.get('name') ?? '').trim();
  const banned = formData.get('banned') === 'on';
  const targetHotelId = String(formData.get('hotelId') ?? '') || null;
  if (name.length < 2) throw new Error('name required');

  await updateUserProfile(targetUserId, { name, banned });

  if (currentRole === 'user') {
    // Reassign within the group only.
    const groupHotels = await getHotelsForGroup(groupId);
    if (!targetHotelId || !groupHotels.some((h) => h.id === targetHotelId)) {
      throw new Error('hotel not in your group');
    }
    await replaceMembership(targetUserId, { role: 'user', hotelId: targetHotelId });
  } else {
    // Group owner: keep their group-scoped admin role intact.
    await replaceMembership(targetUserId, { role: 'admin', hotelGroupId: groupId });
  }

  await writeAudit({
    actorUserId: session.user.id,
    hotelGroupId: groupId,
    hotelId: currentRole === 'user' ? targetHotelId : null,
    action: 'user.update_group',
    target: target.email,
    meta: { role: currentRole, banned },
  });

  revalidatePath(`/h/${hotelId}/users`);
  redirect(`/h/${hotelId}/users/${targetUserId}`);
}
