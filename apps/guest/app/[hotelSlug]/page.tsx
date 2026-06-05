import { cookies } from 'next/headers';
import { findHotelBySlug } from '@aidahos/db';
import { GuestApp, type GuestSession } from '@/components/guest/guest-app';
import { GUEST_COOKIE } from '@/lib/constants';
import { loginGuest } from './actions';

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
      const active = !s.checkOut || new Date(s.checkOut).getTime() > Date.now();
      if (s.hotelSlug === hotelSlug && active) {
        session = { room: s.room ?? null, name: s.name ?? null, checkIn: s.checkIn ?? null, checkOut: s.checkOut ?? null };
      }
    }
  } catch {
    session = null;
  }

  return (
    <GuestApp
      hotelSlug={hotelSlug}
      hotelName={hotel?.name ?? null}
      loginAction={loginAction}
      portal={portal}
      startInApp={connected || session !== null}
      session={session}
    />
  );
}
