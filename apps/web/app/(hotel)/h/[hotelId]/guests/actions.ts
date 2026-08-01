'use server';

import { revalidatePath } from 'next/cache';
import { getHotelById, getGuestStayById, deleteRadiusUser, guestUsername, isRadiusConfigured } from '@aidahos/db';
import { canAccessHotel, getSession } from '@/lib/auth';
import { mikrotikClientFromHotel } from '@/lib/mikrotik';

async function assertHotelAccess(hotelId: string) {
  const session = await getSession();
  if (!session || session.user.role === 'customer') throw new Error('forbidden');
  const hotel = await getHotelById(hotelId);
  if (!hotel) throw new Error('not-found');
  if (!(await canAccessHotel(hotel.id, hotel.hotelGroupId))) throw new Error('forbidden');
  return hotel;
}

export async function disconnectGuestAction(
  hotelId: string,
  guestStayId: string,
): Promise<{ ok: boolean; routerOk: boolean; radiusOk: boolean; error?: string }> {
  try {
    const hotel = await assertHotelAccess(hotelId);
    const stay = await getGuestStayById(guestStayId);
    if (!stay) return { ok: false, routerOk: false, radiusOk: false, error: 'not-found' };

    const username = guestUsername(hotel.slug, stay.roomNo, stay.id);
    const mt = mikrotikClientFromHotel(hotel);

    // Step 1: kick from MikroTik. If this throws, stop — RADIUS untouched.
    await mt.disconnectHotspotUser(username);

    // Step 2: only after MikroTik success, remove RADIUS creds.
    let radiusOk = true;
    if (isRadiusConfigured()) {
      await deleteRadiusUser(username);
    }

    revalidatePath(`/h/${hotelId}/guests`);
    return { ok: true, routerOk: true, radiusOk };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, routerOk: false, radiusOk: false, error: msg };
  }
}

export async function disconnectRouterAction(
  hotelId: string,
  guestStayId: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const hotel = await assertHotelAccess(hotelId);
    const stay = await getGuestStayById(guestStayId);
    if (!stay) return { ok: false, error: 'not-found' };
    const username = guestUsername(hotel.slug, stay.roomNo, stay.id);
    const mt = mikrotikClientFromHotel(hotel);
    await mt.disconnectHotspotUser(username);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function disconnectRadiusAction(
  hotelId: string,
  guestStayId: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const hotel = await assertHotelAccess(hotelId);
    const stay = await getGuestStayById(guestStayId);
    if (!stay) return { ok: false, error: 'not-found' };
    const username = guestUsername(hotel.slug, stay.roomNo, stay.id);
    if (isRadiusConfigured()) {
      await deleteRadiusUser(username);
    }
    revalidatePath(`/h/${hotelId}/guests`);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
