'use server';

import { cookies } from 'next/headers';
import { createSurveyResponse, findHotelBySlug, getSurveyById, isRadiusConfigured, upsertGuestStay, upsertRadiusUser } from '@aidahos/db';
import { verifyGuest } from '@/lib/verify';
import { GUEST_COOKIE } from '@/lib/constants';
import { defaultSurveyOffer, type SurveyOffer } from '@/lib/survey-offer';
import { deriveScore } from '@/lib/score';

export type LoginResult =
  | { ok: true; guestName: string | null; username: string; survey: SurveyOffer | null }
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
    if (hotel.radiusBackend === 'local_mikrotik') {
      // Local backend: the guest must be written to the hotel's own MikroTik via the
      // RouterOS REST API (apps/api, over Tailscale). Deferred — see plan. For now we
      // don't provision into our FreeRADIUS (that would be the wrong RADIUS).
      console.warn(`[guest] local MikroTik provisioning deferred for ${username} (hotel ${hotel.slug})`);
    } else if (isRadiusConfigured()) {
      await upsertRadiusUser({ username, password: birthDate });
    }
  } catch (e) {
    console.error('guest RADIUS provisioning failed:', e);
    return { ok: false, error: 'provisioning' };
  }

  // Capture the verified reservation into our store (guest_stays). The hotel collects
  // signed KVKK consent at check-in; the PMS stays the source of truth, this is our copy.
  try {
    await upsertGuestStay({
      hotelGroupId: hotel.hotelGroupId,
      hotelId: hotel.id,
      roomNo,
      birthDate,
      firstName: res.guest.firstName ?? null,
      lastName: res.guest.lastName ?? null,
      checkIn: res.guest.checkIn ? new Date(res.guest.checkIn) : null,
      checkOut: res.guest.checkOut ? new Date(res.guest.checkOut) : null,
      agency: res.guest.agency ?? null,
      phone: res.guest.phone ?? null,
      email: res.guest.email ?? null,
      country: res.guest.country ?? null,
      roomType: res.guest.roomType ?? null,
      currency: res.guest.currency ?? null,
    });
  } catch (e) {
    // Non-fatal: capture failure shouldn't block the guest's internet access.
    console.error('guest_stays capture failed:', e);
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

  // Offer the hotel's default survey right after login (unless already answered this stay).
  const survey = await defaultSurveyOffer(hotel.id, roomNo, res.guest.checkIn);

  return { ok: true, guestName: res.guest.guestName, username, survey };
}

export type CaptiveSubmitResult = { ok: true } | { ok: false };

/**
 * Submit a captive-flow survey response. The guest identity (hotel/room/name) is read
 * server-side from the aida_guest session cookie — the client never supplies it.
 */
export async function submitCaptiveSurvey(
  surveyId: string,
  data: Record<string, unknown>,
  device?: string,
): Promise<CaptiveSubmitResult> {
  const jar = await cookies();
  const raw = jar.get(GUEST_COOKIE)?.value;
  if (!raw) return { ok: false };
  let s: { hotelSlug?: string; room?: string; name?: string };
  try {
    s = JSON.parse(raw);
  } catch {
    return { ok: false };
  }
  if (!s.hotelSlug) return { ok: false };

  const hotel = await findHotelBySlug(s.hotelSlug);
  const survey = await getSurveyById(surveyId);
  if (!hotel || !survey || survey.status !== 'published' || survey.hotelId !== hotel.id) return { ok: false };

  await createSurveyResponse({
    surveyId,
    hotelGroupId: survey.hotelGroupId,
    hotelId: hotel.id,
    roomNo: s.room ?? null,
    guestName: s.name ?? null,
    data,
    score: deriveScore(survey.json, data),
    source: 'Captive portal',
    device: device ?? null,
    authMethod: 'Room Number + Surname',
  });
  return { ok: true };
}
