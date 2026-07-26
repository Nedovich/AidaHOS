'use server';

import { cookies } from 'next/headers';
import { createEventRegistration, createSurveyResponse, findHotelBySlug, getGuestStayByKey, getSurveyById, isRadiusConfigured, markSurveyShown, upsertGuestStay, upsertRadiusUser } from '@aidahos/db';
import { verifyGuest } from '@/lib/verify';
import { GUEST_COOKIE } from '@/lib/constants';
import { defaultSurveyOffer, type SurveyOffer } from '@/lib/survey-offer';
import { deriveScore } from '@/lib/score';

export type LoginResult =
  | { ok: true; guestName: string | null; username: string; survey: SurveyOffer | null; showCheckoutSurvey: boolean }
  | { ok: false; error: 'invalid' | 'not_found' | 'provisioning' | 'expired' | 'not_started' };

const DOB = /^\d{8}$/; // DDMMYYYY
// Internet is allowed only within the stay window. Grace past the stored check-out date
// so a midnight-stored check-out still covers the usual ~noon hotel check-out.
const CHECKOUT_GRACE_MS = 12 * 60 * 60 * 1000;

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

  // Stay window: internet access is allowed only between check-in and check-out. Block
  // (and don't provision) outside it — so a guest can't get online before arrival or
  // after departure. The check-out sweep removes lingering creds; this stops new logins.
  const now = Date.now();
  const checkInMs = res.guest.checkIn ? new Date(res.guest.checkIn).getTime() : null;
  const checkOutMs = res.guest.checkOut ? new Date(res.guest.checkOut).getTime() : null;
  if (checkInMs != null && now < checkInMs) return { ok: false, error: 'not_started' };
  if (checkOutMs != null && now > checkOutMs + CHECKOUT_GRACE_MS) return { ok: false, error: 'expired' };

  // Compute survey trigger timestamp: checkout - hotel.surveyTriggerDays (midnight of that day).
  const checkOut = res.guest.checkOut ? new Date(res.guest.checkOut) : null;
  let surveyTriggerAt: Date | null = null;
  if (checkOut) {
    const d = new Date(checkOut);
    d.setDate(d.getDate() - (hotel.surveyTriggerDays ?? 3));
    d.setHours(0, 0, 0, 0);
    surveyTriggerAt = d;
  }

  // Determine Session-Timeout:
  // - If survey not yet shown AND trigger time has passed → cap to now+60s (force portal drop)
  // - If survey not yet shown AND trigger in future → cap to trigger time
  // - If survey already shown (or no trigger) → cap to checkout + 1 day
  // We'll refine this after upsertGuestStay (need surveyShownAt from DB).
  // For now compute based on trigger time alone; after upsert we patch if needed.
  const triggerMs = surveyTriggerAt?.getTime() ?? null;
  const checkoutPlus1Ms = checkOutMs != null ? checkOutMs + 24 * 60 * 60 * 1000 : null;

  let sessionTimeoutSeconds: number | null = null;
  if (checkoutPlus1Ms != null) {
    if (triggerMs != null && now < triggerMs) {
      // Survey not yet due — cap to trigger time
      sessionTimeoutSeconds = Math.max(60, Math.floor((triggerMs - now) / 1000));
    } else {
      // Survey due or no trigger — cap to checkout + 1 day
      sessionTimeoutSeconds = Math.max(60, Math.floor((checkoutPlus1Ms - now) / 1000));
    }
  }

  const username = `${hotel.slug}-${roomNo}`;
  try {
    if (hotel.radiusBackend === 'local_mikrotik') {
      // Local backend: the guest must be written to the hotel's own MikroTik via the
      // RouterOS REST API (apps/api, over Tailscale). Deferred — see plan. For now we
      // don't provision into our FreeRADIUS (that would be the wrong RADIUS).
      console.warn(`[guest] local MikroTik provisioning deferred for ${username} (hotel ${hotel.slug})`);
    } else if (isRadiusConfigured()) {
      await upsertRadiusUser({ username, password: birthDate, sessionTimeoutSeconds });
    }
  } catch (e) {
    console.error('guest RADIUS provisioning failed:', e);
    return { ok: false, error: 'provisioning' };
  }

  // Capture the verified reservation into our store (guest_stays). The hotel collects
  // signed KVKK consent at check-in; the PMS stays the source of truth, this is our copy.
  let stayId: string | null = null;
  let surveyShownAt: Date | null = null;
  let resolvedTriggerMs: number | null = surveyTriggerAt?.getTime() ?? null;
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
      surveyTriggerAt, // only written on first insert, not on re-login (see upsertGuestStay)
    });
    // Fetch back to get stayId and surveyShownAt (needed for checkout survey logic).
    const stay = await getGuestStayByKey(hotel.id, roomNo, birthDate);
    stayId = stay?.id ?? null;
    surveyShownAt = stay?.surveyShownAt ?? null;
    // If DB has a manual override for triggerAt, use that for timeout calculation.
    const dbTriggerAt = stay?.surveyTriggerAt ?? surveyTriggerAt;
    resolvedTriggerMs = dbTriggerAt?.getTime() ?? null;
    const dbTriggerMs = resolvedTriggerMs;
    if (checkoutPlus1Ms != null) {
      if (surveyShownAt) {
        // Already shown — cap to checkout + 1 day
        sessionTimeoutSeconds = Math.max(60, Math.floor((checkoutPlus1Ms - now) / 1000));
      } else if (dbTriggerMs != null && now < dbTriggerMs) {
        sessionTimeoutSeconds = Math.max(60, Math.floor((dbTriggerMs - now) / 1000));
      } else {
        sessionTimeoutSeconds = Math.max(60, Math.floor((checkoutPlus1Ms - now) / 1000));
      }
    }
  } catch (e) {
    // Non-fatal: capture failure shouldn't block the guest's internet access.
    console.error('guest_stays capture failed:', e);
  }

  // Persist a guest session so re-opening the portal skips the login screen.
  // Expires at checkout (fallback: 12h). Low-sensitivity (internet access itself is
  // gated by RADIUS, not this cookie), so a plain JSON value is fine.
  const checkOutDate = res.guest.checkOut ? new Date(res.guest.checkOut) : null;
  const expires = checkOutDate && checkOutDate.getTime() > Date.now() ? checkOutDate : new Date(Date.now() + 12 * 60 * 60 * 1000);
  const jar = await cookies();
  jar.set(
    GUEST_COOKIE,
    JSON.stringify({
      hotelSlug: hotel.slug,
      room: roomNo,
      name: res.guest.guestName,
      checkIn: res.guest.checkIn ? new Date(res.guest.checkIn).toISOString() : null,
      checkOut: checkOutDate ? checkOutDate.toISOString() : null,
    }),
    { httpOnly: true, sameSite: 'lax', path: '/', expires },
  );

  // Show checkout survey popup if trigger time has passed and not yet shown this stay.
  const showCheckoutSurvey = !surveyShownAt && resolvedTriggerMs != null && now >= resolvedTriggerMs;

  // Mark survey as shown if we're about to show it, so next login skips it.
  if (showCheckoutSurvey && stayId) {
    try { await markSurveyShown(stayId); } catch { /* non-fatal */ }
  }

  // Offer the hotel's default survey right after login (unless already answered this stay).
  const survey = await defaultSurveyOffer(hotel.id, roomNo, res.guest.checkIn);

  return { ok: true, guestName: res.guest.guestName, username, survey, showCheckoutSurvey };
}

/**
 * Staff (personel) captive-portal login.
 * User enters their short username (e.g. "aysan") + password.
 * We look up the hotel slug and prepend "staff-{slug}-" to form the real RADIUS username,
 * then return it so the MikroTik gateway can authenticate.
 */
export async function loginStaff(
  hotelSlug: string,
  localUsername: string,
): Promise<{ ok: true; username: string } | { ok: false; error: string }> {
  const trimUser = localUsername.trim().toLowerCase();
  if (!trimUser) return { ok: false, error: 'invalid' };
  const trimPass = '333';

  const hotel = await findHotelBySlug(hotelSlug);
  if (!hotel) return { ok: false, error: 'not_found' };

  const username = `staff-${hotel.slug}-${trimUser}`;

  // Verify the credentials exist in radcheck
  let displayName: string | null = null;
  try {
    const { getRadiusUser, getStaffAccount } = await import('@aidahos/db');
    const radiusUser = await getRadiusUser(username);
    if (!radiusUser || radiusUser.password !== trimPass) {
      return { ok: false, error: 'invalid' };
    }
    const staffAccount = await getStaffAccount(username);
    displayName = staffAccount?.displayName ?? null;
  } catch {
    return { ok: false, error: 'provisioning' };
  }

  // Set a session cookie so the portal shows the staff member's real name.
  const jar = await cookies();
  jar.set(
    GUEST_COOKIE,
    JSON.stringify({
      hotelSlug: hotel.slug,
      room: null,
      name: displayName,
      checkIn: null,
      checkOut: null,
    }),
    { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 8 * 60 * 60 },
  );

  return { ok: true, username };
}

export type EventRegistrationResult = { ok: true } | { ok: false; error?: string };

/**
 * Register the logged-in guest for an event.
 * Guest identity is read from the session cookie — the client never sends it.
 */
export async function registerForEvent(
  hotelSlug: string,
  eventId: string,
): Promise<EventRegistrationResult> {
  const jar = await cookies();
  const raw = jar.get('aida_guest')?.value;
  if (!raw) return { ok: false, error: 'no_session' };
  let s: { hotelSlug?: string; room?: string; name?: string };
  try { s = JSON.parse(raw); } catch { return { ok: false }; }
  if (!s.hotelSlug) return { ok: false };

  const hotel = await findHotelBySlug(hotelSlug);
  if (!hotel) return { ok: false, error: 'not_found' };

  const res = await createEventRegistration({
    eventId,
    hotelId: hotel.id,
    hotelGroupId: hotel.hotelGroupId,
    roomNo: s.room ?? null,
    guestName: s.name ?? null,
    phone: null,
    email: null,
  });
  return res;
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
