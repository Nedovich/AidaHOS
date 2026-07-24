'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import {
  deleteStaffAccount,
  deleteStaffUser,
  deleteRadiusGroup,
  getHotelById,
  getRadiusUser,
  getStaffAccount,
  listStaffAccounts,
  listStaffUsersRadiusStats,
  staffUsername,
  upsertStaffAccount,
  upsertStaffUser,
  upsertRadiusGroup,
  type StaffAccount,
} from '@aidahos/db';
import { getSession } from '@/lib/auth';
import { mikrotikClientFromHotel, type HotspotProfile } from '@/lib/mikrotik';

/* ── helpers ── */

async function requireHotel(hotelId: string) {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');
  const hotel = await getHotelById(hotelId);
  if (!hotel) throw new Error('Hotel not found');
  return hotel;
}

/* ── staff USERS (FreeRADIUS + staff_accounts) ── */

export async function listStaffUsersAction(hotelId: string): Promise<StaffAccount[]> {
  const hotel = await requireHotel(hotelId);
  const radiusStats = await listStaffUsersRadiusStats(hotel.slug);
  return listStaffAccounts(hotelId, radiusStats);
}

export async function createStaffUserAction(
  hotelId: string,
  input: { localUsername: string; displayName: string; password: string; mikrotikGroup: string; jobTitle?: string | null; accessUntil?: string | null },
): Promise<void> {
  const hotel = await requireHotel(hotelId);
  const radUsername = staffUsername(hotel.slug, input.localUsername);

  // Write credentials + profile to FreeRADIUS
  await upsertStaffUser({ hotelSlug: hotel.slug, ...input });

  // Write display name + metadata to AidaHOS DB
  await upsertStaffAccount({
    hotelId,
    radiusUsername: radUsername,
    localUsername: input.localUsername,
    displayName: input.displayName,
    mikrotikGroup: input.mikrotikGroup,
    jobTitle: input.jobTitle ?? null,
    accessUntil: input.accessUntil ?? null,
  });

  revalidatePath(`/h/${hotelId}/staff`);
  redirect(`/h/${hotelId}/staff`);
}

export async function updateStaffUserAction(
  hotelId: string,
  radiusUsername: string,
  input: { displayName: string; password?: string; mikrotikGroup: string; jobTitle?: string | null; accessUntil?: string | null },
): Promise<void> {
  const hotel = await requireHotel(hotelId);
  const prefix = `staff-${hotel.slug}-`;
  const localUsername = radiusUsername.startsWith(prefix) ? radiusUsername.slice(prefix.length) : radiusUsername;

  // If no new password, keep existing one from radcheck
  let password = input.password;
  if (!password) {
    const existing = await getRadiusUser(radiusUsername);
    password = existing?.password ?? '';
  }

  await upsertStaffUser({ hotelSlug: hotel.slug, localUsername, displayName: input.displayName, password, mikrotikGroup: input.mikrotikGroup });
  await upsertStaffAccount({
    hotelId,
    radiusUsername,
    localUsername,
    displayName: input.displayName,
    mikrotikGroup: input.mikrotikGroup,
    jobTitle: input.jobTitle ?? null,
    accessUntil: input.accessUntil ?? null,
  });

  revalidatePath(`/h/${hotelId}/staff`);
  redirect(`/h/${hotelId}/staff`);
}

export async function deleteStaffUserAction(hotelId: string, radiusUsername: string): Promise<void> {
  await requireHotel(hotelId);
  await deleteStaffUser(radiusUsername);       // removes radcheck + radreply
  await deleteStaffAccount(radiusUsername);    // removes staff_accounts row
  revalidatePath(`/h/${hotelId}/staff`);
  redirect(`/h/${hotelId}/staff`);
}

/* ── staff PROFILES (MikroTik) ── */

async function getClient(hotelId: string) {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');
  const hotel = await getHotelById(hotelId);
  if (!hotel) throw new Error('Hotel not found');
  return mikrotikClientFromHotel(hotel);
}

export async function listStaffProfilesAction(hotelId: string): Promise<HotspotProfile[]> {
  const client = await getClient(hotelId);
  return client.listHotspotProfiles();
}

export async function createStaffProfileAction(
  hotelId: string,
  input: { name: string; rateLimit: string; sharedUsers: number; sessionTimeout?: string; idleTimeout?: string },
): Promise<void> {
  const client = await getClient(hotelId);
  await client.createHotspotProfile(input);
  if (input.rateLimit) await upsertRadiusGroup(input.name, input.rateLimit);
  revalidatePath(`/h/${hotelId}/staff/profiles`);
  redirect(`/h/${hotelId}/staff/profiles`);
}

export async function updateStaffProfileAction(
  hotelId: string,
  mtId: string,
  input: { name: string; rateLimit: string; sharedUsers: number; sessionTimeout?: string; idleTimeout?: string },
): Promise<void> {
  const client = await getClient(hotelId);
  await client.updateHotspotProfile(mtId, input);
  if (input.rateLimit) await upsertRadiusGroup(input.name, input.rateLimit);
  revalidatePath(`/h/${hotelId}/staff/profiles`);
  redirect(`/h/${hotelId}/staff/profiles`);
}

export async function deleteStaffProfileAction(hotelId: string, mtId: string, profileName: string): Promise<void> {
  const client = await getClient(hotelId);
  await client.deleteHotspotProfile(mtId);
  await deleteRadiusGroup(profileName);
  revalidatePath(`/h/${hotelId}/staff/profiles`);
  redirect(`/h/${hotelId}/staff/profiles`);
}

export { getStaffAccount };
