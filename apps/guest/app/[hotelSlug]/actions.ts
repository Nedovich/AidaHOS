'use server';

import { cookies } from 'next/headers';
import { checkoutTimingDays, createEventRegistration, createSurveyResponse, createGuestPopupSend, findHotelBySlug, getGuestStayByKey, getPopupAutomation, getSimGuestByRoom, getSurveyById, guestUsername, isRadiusConfigured, listDuePopupSendsForStay, listPopupSendsForStay, listUpcomingPopupSendsForStay, markGuestPopupSendShown, upsertGuestStay, upsertRadiusUser, type PopupContentMap } from '@aidahos/db';
import { verifyGuest } from '@/lib/verify';
import { GUEST_COOKIE } from '@/lib/constants';
import { defaultSurveyOffer, type SurveyOffer } from '@/lib/survey-offer';
import { deriveScore } from '@/lib/score';

export interface DuePopup {
  id: string;
  popupType: 'survey' | 'event' | 'announcement';
  surveyId: string | null;
  eventId: string | null;
  content: PopupContentMap;
}

export type LoginResult =
  | { ok: true; guestName: string | null; username: string; survey: SurveyOffer | null; duePopups: DuePopup[] }
  | { ok: false; error: 'invalid' | 'not_found' | 'provisioning' | 'expired' | 'not_started' };

/**
 * Auto-login result. Unlike LoginResult it also carries the RADIUS password, because the
 * caller never typed it: the client needs it to build the gateway redirect. It travels the
 * same path the manual login already sends it on (query string → MikroTik), and only ever
 * to a browser that already proved it holds this stay's session cookie.
 */
export type AutoLoginResult =
  | { ok: true; guestName: string | null; username: string; password: string; survey: SurveyOffer | null; duePopups: DuePopup[] }
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
 *      authenticate the guest. username = guestUsername(slug, room, stayId), password = birthDate.
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

  const checkOut = res.guest.checkOut ? new Date(res.guest.checkOut) : null;

  // Initial Session-Timeout: checkout + 1 day as safe default.
  // Refined after DB queries using guest_popup_sends (upcoming sends).
  const checkoutPlus1Ms = checkOutMs != null ? checkOutMs + 24 * 60 * 60 * 1000 : null;
  let sessionTimeoutSeconds: number | null = null;
  if (checkoutPlus1Ms != null) {
    sessionTimeoutSeconds = Math.max(60, Math.floor((checkoutPlus1Ms - now) / 1000));
  }

  // Capture the verified reservation into our store (guest_stays) FIRST: the RADIUS
  // username is derived from the stay id (see guestUsername), so the row must exist
  // before we can provision. The PMS stays the source of truth; this is our copy, and
  // the hotel collects signed KVKK consent at check-in.
  let stayId: string | null = null;
  let dueSends: Array<{ id: string; popupType: 'survey' | 'event' | 'announcement'; surveyId: string | null; eventId: string | null; content: PopupContentMap | null }> = [];
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
      tcNo: res.guest.tcNo ?? null,
      idNo: res.guest.idNo ?? null,
    });
    // Fetch back to get stayId (needed for popup send lookup).
    const stay = await getGuestStayByKey(hotel.id, roomNo, birthDate);
    stayId = stay?.id ?? null;

    // On first login: if an active 'checkout' automation exists for this hotel and no
    // guest_popup_sends row exists yet for this stay, auto-create the initial scheduled
    // send from the automation's timing/survey/content. No automation → nothing scheduled
    // (automations are the single source of truth; hotel.surveyTriggerDays is no longer read).
    if (stayId && checkOut) {
      const checkoutAutomation = await getPopupAutomation(hotel.id, 'checkout');
      if (checkoutAutomation && checkoutAutomation.status === 'active') {
        const days = checkoutTimingDays(checkoutAutomation.timing as 'd3' | 'd2' | 'd1' | 'd0');
        const triggerAt = new Date(checkOut);
        triggerAt.setDate(triggerAt.getDate() - days);
        triggerAt.setHours(0, 0, 0, 0);

        const existingSends = await listPopupSendsForStay(stayId);
        if (existingSends.length === 0) {
          try {
            await createGuestPopupSend({
              hotelId: hotel.id,
              hotelGroupId: hotel.hotelGroupId,
              guestStayId: stayId,
              popupType: 'survey',
              surveyId: checkoutAutomation.surveyId,
              eventId: null,
              content: (checkoutAutomation.content ?? {}) as PopupContentMap,
              triggerAt,
            });
          } catch (e) {
            console.error('auto-create survey send from automation failed:', e);
          }
        }
      }
    }

    // Check for due popup sends from the guest_popup_sends table.
    if (stayId) {
      dueSends = await listDuePopupSendsForStay(stayId);
    }

    // Session-Timeout: use the EARLIEST upcoming (future, unshown) send's triggerAt.
    // If no upcoming sends → fall back to checkout + 1 day.
    if (checkoutPlus1Ms != null && stayId) {
      const upcomingSends = await listUpcomingPopupSendsForStay(stayId);
      const nearestTriggerMs = upcomingSends[0]?.triggerAt
        ? new Date(upcomingSends[0].triggerAt).getTime()
        : null;

      if (dueSends.length > 0) {
        // Due sends exist — popup about to be shown, cap to checkout + 1 day
        sessionTimeoutSeconds = Math.max(60, Math.floor((checkoutPlus1Ms - now) / 1000));
      } else if (nearestTriggerMs != null) {
        // Upcoming send found — timeout at that send's triggerAt
        sessionTimeoutSeconds = Math.max(60, Math.floor((nearestTriggerMs - now) / 1000));
      } else {
        // No sends at all — checkout + 1 day
        sessionTimeoutSeconds = Math.max(60, Math.floor((checkoutPlus1Ms - now) / 1000));
      }
    }
  } catch (e) {
    // Non-fatal: capture failure shouldn't block the guest's internet access.
    console.error('guest_stays capture failed:', e);
  }

  // Provision RADIUS. Deliberately after the stay capture: the username carries the stay
  // id, and by now sessionTimeoutSeconds also reflects the next scheduled popup, so this
  // is a single write instead of provisioning twice.
  if (!stayId) return { ok: false, error: 'provisioning' };
  const username = guestUsername(hotel.slug, roomNo, stayId);
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

  // Build the due-popups payload for the guest app (survey/event/announcement).
  const duePopups: DuePopup[] = dueSends.map((s) => ({
    id: s.id,
    popupType: s.popupType,
    surveyId: s.surveyId,
    eventId: s.eventId,
    content: s.content ?? {},
  }));

  // shownAt is NOT set here — it's set by markPopupShown once the guest actually sees the
  // modal. Marking at login time would hide the popup before it was ever displayed
  // (the captive flow bounces through MikroTik before rendering anything).

  // Default survey only fills in when no due popup is waiting — due popups take priority.
  const survey = duePopups.length > 0
    ? null
    : await defaultSurveyOffer(hotel.id, roomNo, res.guest.checkIn);

  return { ok: true, guestName: res.guest.guestName, username, survey, duePopups };
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

/** Mark a popup send as shown when the guest sees it (called from the client after render). */
export async function markPopupShown(sendId: string): Promise<void> {
  try { await markGuestPopupSendShown(sendId); } catch { /* non-fatal */ }
}

/**
 * Re-login a returning guest without the room+birth-date form.
 *
 * After the popup cron kicks a guest off the gateway, their browser lands back on the
 * captive portal. They still hold a valid GUEST_COOKIE, so instead of making them retype
 * their credentials we look the reservation up by room and replay loginGuest with the
 * birth-date from the PMS/sim record.
 *
 * The cookie alone is not treated as proof: the stay's check-in must still match the one
 * captured at login time. If the room has since turned over to a new guest, the check-in
 * differs and we refuse — the old guest falls back to the normal login form.
 */
export async function autoLoginGuest(hotelSlug: string): Promise<AutoLoginResult> {
  const raw = (await cookies()).get(GUEST_COOKIE)?.value;
  if (!raw) return { ok: false, error: 'invalid' };

  let cookieRoom: string | null = null;
  let cookieCheckIn: string | null = null;
  try {
    const s = JSON.parse(raw) as { hotelSlug?: string; room?: string; checkIn?: string };
    if (s.hotelSlug !== hotelSlug) return { ok: false, error: 'invalid' };
    cookieRoom = s.room ?? null;
    cookieCheckIn = s.checkIn ?? null;
  } catch {
    return { ok: false, error: 'invalid' };
  }
  if (!cookieRoom) return { ok: false, error: 'invalid' };

  const hotel = await findHotelBySlug(hotelSlug);
  if (!hotel) return { ok: false, error: 'not_found' };

  const live = await getSimGuestByRoom(hotel.id, cookieRoom);
  if (!live?.birthDate) return { ok: false, error: 'invalid' };

  // Room turnover guard: the reservation in the room must be the same one the cookie
  // was issued for. A mismatch means a new guest checked in — refuse the auto-login.
  const liveCheckIn = live.checkIn ? new Date(live.checkIn).getTime() : null;
  const cookieCheckInMs = cookieCheckIn ? new Date(cookieCheckIn).getTime() : null;
  if (liveCheckIn == null || cookieCheckInMs == null || liveCheckIn !== cookieCheckInMs) {
    return { ok: false, error: 'invalid' };
  }

  // Same path as a manual login (verification, RADIUS provisioning, stay capture,
  // session-timeout, due-popup lookup) — only the birth-date source differs.
  const res = await loginGuest(hotelSlug, cookieRoom, live.birthDate);
  if (!res.ok) return res;
  return { ...res, password: live.birthDate };
}
