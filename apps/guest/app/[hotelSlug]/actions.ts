'use server';

import { cookies } from 'next/headers';
import { findHotelBySlug, isRadiusConfigured, upsertRadiusUser } from '@aidahos/db';
import { verifyGuest } from '@/lib/verify';
import { GUEST_COOKIE } from '@/lib/constants';

export type LoginResult =
  | { ok: true; guestName: string | null; username: string }
  | { ok: false; error: 'invalid' | 'not_found' | 'provisioning' };

const DOB = /^\d{8}$/; // DDMMYYYY

/**
 * Captive-portal guest login.
 *   1. Resolve the hotel from the portal slug.
 *   2. Verify room-no + birth-date (DEV: hotel_simulation; PROD: on-prem PMS).
 *   3. On success, provision RADIUS creds in radcheck so the MikroTik gateway can
 *      authenticate the guest. username = `${slug}-${room}`, password = birthDate.
 */
export async function loginGuest(hotelSlug: string, room: string, dob: string): Promise<LoginResult> {
  const roomNo = room.trim();
  const birthDate = dob.replace(/\D/g, '');
  if (roomNo.length < 1 || !DOB.test(birthDate)) return { ok: false, error: 'invalid' };

  const hotel = await findHotelBySlug(hotelSlug);
  if (!hotel) return { ok: false, error: 'not_found' };

  const res = await verifyGuest(hotel.id, roomNo, birthDate);
  if (!res.ok) return { ok: false, error: 'invalid' };

  const username = `${hotel.slug}-${roomNo}`;
  try {
    if (isRadiusConfigured()) {
      await upsertRadiusUser({ username, password: birthDate });
    }
  } catch (e) {
    console.error('guest RADIUS provisioning failed:', e);
    return { ok: false, error: 'provisioning' };
  }

  // Persist a guest session so re-opening the portal skips the login screen.
  // Expires at checkout (fallback: 12h). Low-sensitivity (internet access itself is
  // gated by RADIUS, not this cookie), so a plain JSON value is fine.
  const checkOut = res.guest.checkOut ? new Date(res.guest.checkOut) : null;
  const expires = checkOut && checkOut.getTime() > Date.now() ? checkOut : new Date(Date.now() + 12 * 60 * 60 * 1000);
  const jar = await cookies();
  jar.set(
    GUEST_COOKIE,
    JSON.stringify({
      hotelSlug: hotel.slug,
      room: roomNo,
      name: res.guest.guestName,
      checkIn: res.guest.checkIn ? new Date(res.guest.checkIn).toISOString() : null,
      checkOut: checkOut ? checkOut.toISOString() : null,
    }),
    { httpOnly: true, sameSite: 'lax', path: '/', expires },
  );

  return { ok: true, guestName: res.guest.guestName, username };
}
