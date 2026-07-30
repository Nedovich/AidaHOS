import { getHotelById, listGuestStays } from '@aidahos/db';
import { listRadiusUsers, isRadiusConfigured } from '@aidahos/db';
import { GuestsClient, type SerializedGuest } from '@/components/console/guests/guests-client';
import { getLang } from '@/lib/i18n-server';
import { disconnectRouterAction, disconnectRadiusAction } from './actions';

function avatarColor(seed: string): string {
  const COLORS = ['#0E7490', '#7C5CE0', '#0E9F6E', '#B8740A', '#2563C9', '#D5485A'];
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return COLORS[h % COLORS.length]!;
}

function initials(first: string | null, last: string | null): string {
  const f = (first ?? '').trim()[0] ?? '';
  const l = (last ?? '').trim()[0] ?? '';
  return (f + l).toUpperCase() || '?';
}

function fmtDate(d: Date | null): string {
  if (!d) return '—';
  return d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function fmtBytes(bytes: number): string {
  if (bytes === 0) return '—';
  if (bytes >= 1_073_741_824) return `${(bytes / 1_073_741_824).toFixed(1)} GB`;
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(0)} MB`;
  return `${(bytes / 1024).toFixed(0)} KB`;
}

export default async function GuestsPage({
  params,
}: {
  params: Promise<{ hotelId: string }>;
}) {
  const [{ hotelId }, lang] = await Promise.all([params, getLang()]);

  const hotel = await getHotelById(hotelId);
  const stays = hotel ? await listGuestStays(hotelId) : [];

  // RADIUS: online/device/data bilgisi (opsiyonel — yapılandırılmamışsa skip)
  const radiusMap = new Map<string, { online: boolean; bytes: number; sessions: number }>();
  if (hotel?.slug && isRadiusConfigured()) {
    try {
      const radiusUsers = await listRadiusUsers(hotel.slug);
      for (const u of radiusUsers) {
        // username format: {slug}-{roomNo}
        const room = u.username.slice(hotel.slug.length + 1);
        radiusMap.set(room, { online: u.online, bytes: u.bytes, sessions: u.sessions });
      }
    } catch {
      // RADIUS erişilemez — sessizce devam et
    }
  }

  const now = new Date();

  const guests: SerializedGuest[] = stays.map((s) => {
    const name = [s.firstName, s.lastName].filter(Boolean).join(' ') || `Oda ${s.roomNo}`;
    const radius = radiusMap.get(s.roomNo);
    const isInhouse = s.checkOut ? s.checkOut > now : false;
    return {
      id: s.id,
      name,
      initials: initials(s.firstName, s.lastName),
      color: avatarColor(s.id),
      room: s.roomNo,
      checkin: fmtDate(s.checkIn),
      checkout: fmtDate(s.checkOut),
      status: isInhouse ? 'inhouse' : 'checked-out',
      phone: s.phone ?? '—',
      email: s.email ?? '—',
      online: radius?.online ?? false,
      dataToday: fmtBytes(radius?.bytes ?? 0),
      country: s.country ?? null,
      roomType: s.roomType ?? null,
      agency: s.agency ?? null,
      currency: s.currency ?? null,
      createdAt: fmtDate(s.createdAt),
    };
  });

  // KPI: connected now + avg data
  const onlineGuests = guests.filter((g) => g.online);
  const totalBytes = [...radiusMap.values()].reduce((sum, r) => sum + r.bytes, 0);
  const avgData = onlineGuests.length > 0
    ? fmtBytes(Math.round(totalBytes / onlineGuests.length))
    : '—';

  return (
    <GuestsClient
      hotelId={hotelId}
      lang={lang}
      guests={guests}
      avgData={avgData}
      onDisconnectRouter={async (id) => {
        'use server';
        return disconnectRouterAction(hotelId, id);
      }}
      onDisconnectRadius={async (id) => {
        'use server';
        return disconnectRadiusAction(hotelId, id);
      }}
    />
  );
}
