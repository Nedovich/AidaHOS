import { cookies } from 'next/headers';
import { findHotelBySlug, getSimGuestByRoom, listDuePopupSendsForRoom, listGuestEvents, parsePortalStore, withDefaults } from '@aidahos/db';
import { GuestApp, type GuestSession } from '@/components/guest/guest-app';
import { CHECKOUT_GRACE_MS, GUEST_COOKIE } from '@/lib/constants';
import { mapGuestEvents } from '@/lib/events-map';
import { defaultSurveyOffer } from '@/lib/survey-offer';
import { autoLoginGuest, loginGuest, loginStaff, markPopupShown, registerForEvent } from './actions';

// Guest portal for a hotel. In production the MikroTik captive portal redirects
// guests here (its login.html forwards the hotspot vars as query params). The visual
// app is mock content + per-hotel branding, but the login is real: room-no + birth-date
// are verified, provisioned into RADIUS, then submitted back to the gateway.
export default async function GuestHome({
  params,
  searchParams,
}: {
  params: Promise<{ hotelSlug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { hotelSlug } = await params;
  const sp = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? '';

  const hotel = await findHotelBySlug(hotelSlug);
  const loginAction = loginGuest.bind(null, hotelSlug);
  const autoLoginAction = autoLoginGuest.bind(null, hotelSlug);
  const staffLoginAction = loginStaff.bind(null, hotelSlug);
  const registerForEventAction = registerForEvent.bind(null, hotelSlug);

  // MikroTik hotspot context (passed by login.html). `ll` = link-login-only.
  const ll = one(sp.ll);
  const portal = ll ? { loginUrl: ll, orig: one(sp.orig), mac: one(sp.mac) } : null;
  const connected = one(sp.connected) === '1';

  // Persisted guest session — if a valid (not-yet-checked-out) cookie exists for this
  // hotel, skip the login screen and show the app with the real guest.
  let session: GuestSession | null = null;
  try {
    const raw = (await cookies()).get(GUEST_COOKIE)?.value;
    if (raw) {
      const s = JSON.parse(raw) as { hotelSlug?: string; room?: string; name?: string; checkIn?: string; checkOut?: string };
      const active = !s.checkOut || new Date(s.checkOut).getTime() + CHECKOUT_GRACE_MS > Date.now();
      if (s.hotelSlug === hotelSlug && active) {
        session = { room: s.room ?? null, name: s.name ?? null, checkIn: s.checkIn ?? null, checkOut: s.checkOut ?? null };
      }
    }
  } catch {
    session = null;
  }

  // Live-refresh the guest's name/dates from the DB (the cookie is only a login-time
  // snapshot, so a PMS/sim change mid-stay wouldn't otherwise show). Falls back to the
  // cookie values if the room is no longer found.
  if (session?.room && hotel) {
    const live = await getSimGuestByRoom(hotel.id, session.room);
    if (live) {
      session = {
        room: live.roomNo,
        name: live.guestName ?? session.name,
        checkIn: live.checkIn ? live.checkIn.toISOString() : session.checkIn,
        checkOut: live.checkOut ? live.checkOut.toISOString() : session.checkOut,
      };
    }
  }

  // On the post-login return (?connected=1), check for due popup sends first.
  // Due popups take priority; the default survey fills in only when nothing is scheduled.
  let surveyOffer = null;
  let initialDuePopups: Array<{ id: string; popupType: 'survey' | 'event' | 'announcement'; surveyId: string | null; eventId: string | null; content: Record<string, unknown> }> = [];
  if (connected && session?.room && hotel) {
    const dueSends = await listDuePopupSendsForRoom(hotel.id, session.room);
    if (dueSends.length > 0) {
      initialDuePopups = dueSends.map((s) => ({
        id: s.id,
        popupType: s.popupType,
        surveyId: s.surveyId,
        eventId: s.eventId,
        content: (s.content ?? {}) as Record<string, unknown>,
      }));
    } else {
      surveyOffer = await defaultSurveyOffer(hotel.id, session.room, session.checkIn);
    }
  }

  // A returning guest hitting the captive portal (`ll` present = not online yet) while still
  // holding a valid session cookie can be re-authenticated without the login form. This is
  // the path taken after the popup cron kicks them off the gateway. autoLoginGuest re-checks
  // the reservation server-side and refuses if the room has turned over.
  const canAutoLogin = !!portal && session?.room != null;
  // Logged unconditionally: when this is false the action never runs, so its own tracing
  // would stay silent and we could not tell "not attempted" from "attempted and refused".
  console.log('[auto-login] gate', { hotelSlug, hasPortal: !!portal, hasSessionRoom: session?.room != null, connected, canAutoLogin });

  // Per-hotel portal branding/content the admin composed and published (hotels.brand jsonb).
  const portalConfig = hotel ? withDefaults(parsePortalStore(hotel.brand).published, hotel.name) : null;

  // Real guest-facing events for this hotel (visible, not draft/cancelled).
  const events = hotel ? mapGuestEvents(await listGuestEvents(hotel.id)) : [];

  return (
    <GuestApp
      hotelSlug={hotelSlug}
      hotelName={hotel?.name ?? null}
      loginAction={loginAction}
      autoLoginAction={canAutoLogin ? autoLoginAction : undefined}
      staffLoginAction={staffLoginAction}
      registerForEventAction={registerForEventAction}
      portal={portal}
      startInApp={connected || (session !== null && !canAutoLogin)}
      session={session}
      surveyOffer={surveyOffer}
      initialDuePopups={initialDuePopups}
      onMarkPopupShown={markPopupShown}
      portalConfig={portalConfig}
      events={events}
    />
  );
}
