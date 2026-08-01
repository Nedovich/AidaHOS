import { notFound } from 'next/navigation';
import { getHotelById, getGuestStayById, getCheckoutSurveyForHotel, guestUsername, isRadiusConfigured, listPopupSendsForStay, listUserSessions } from '@aidahos/db';
import { getLang } from '@/lib/i18n-server';
import { GuestDetailClient, type SerializedGuestDetail, type SerializedSession } from '@/components/console/guests/guest-detail-client';
import { setGuestPopupSendAction } from './actions';

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

function fmtDuration(seconds: number | null): string {
  if (!seconds || seconds <= 0) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}s ${m}dk`;
  return `${m}dk`;
}

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

function parseBirthDate(ddmmyyyy: string): string {
  if (ddmmyyyy.length !== 8) return ddmmyyyy;
  return `${ddmmyyyy.slice(0, 2)}.${ddmmyyyy.slice(2, 4)}.${ddmmyyyy.slice(4)}`;
}

export default async function GuestDetailPage({
  params,
}: {
  params: Promise<{ hotelId: string; guestId: string }>;
}) {
  const [{ hotelId, guestId }, lang] = await Promise.all([params, getLang()]);

  const [hotel, stay] = await Promise.all([
    getHotelById(hotelId),
    getGuestStayById(guestId),
  ]);

  if (!stay || !hotel) notFound();

  const [surveySends, checkoutSurvey] = await Promise.all([
    listPopupSendsForStay(stay.id),
    getCheckoutSurveyForHotel(hotel.hotelGroupId),
  ]);

  // Most recent send for the KPI card (newest triggerAt).
  const latestSend = surveySends.length > 0
    ? surveySends.reduce((a, b) => a.triggerAt > b.triggerAt ? a : b)
    : null;

  // RADIUS bağlantı geçmişi
  const username = guestUsername(hotel.slug, stay.roomNo, stay.id);
  let sessions: SerializedSession[] = [];
  let online = false;
  let dataToday = '—';
  let activeDevices = 0;

  if (isRadiusConfigured()) {
    try {
      const rawSessions = await listUserSessions(username, 50);
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      let todayBytes = 0;
      for (const s of rawSessions) {
        if (s.stop === null) {
          online = true;
          activeDevices++;
        }
        if (s.start && s.start >= todayStart) {
          todayBytes += s.inOctets + s.outOctets;
        }
      }
      dataToday = fmtBytes(todayBytes);

      sessions = rawSessions.map((s) => ({
        id: s.id,
        mac: s.mac ?? '—',
        ip: s.framedIp ?? '—',
        start: s.start ? s.start.toISOString() : null,
        stop: s.stop ? s.stop.toISOString() : null,
        duration: fmtDuration(s.sessionTime),
        data: fmtBytes(s.inOctets + s.outOctets),
        active: s.stop === null,
      }));
    } catch {
      // RADIUS erişilemez
    }
  }

  const name = [stay.firstName, stay.lastName].filter(Boolean).join(' ') || `Oda ${stay.roomNo}`;
  const isInhouse = stay.checkOut ? stay.checkOut > new Date() : false;

  const guest: SerializedGuestDetail = {
    id: stay.id,
    name,
    initials: initials(stay.firstName, stay.lastName),
    color: avatarColor(stay.id),
    room: stay.roomNo,
    hotelName: hotel.name,
    checkin: fmtDate(stay.checkIn),
    checkout: fmtDate(stay.checkOut),
    status: isInhouse ? 'inhouse' : 'checked-out',
    phone: stay.phone ?? null,
    email: stay.email ?? null,
    country: stay.country ?? null,
    roomType: stay.roomType ?? null,
    agency: stay.agency ?? null,
    currency: stay.currency ?? null,
    birthDate: parseBirthDate(stay.birthDate),
    createdAt: fmtDate(stay.createdAt),
    online,
    dataToday,
    activeDevices,
    sessions,
    // KPI card shows the latest popup send from guest_popup_sends table.
    surveyTriggerAt: latestSend ? latestSend.triggerAt.toISOString() : null,
    surveyShownAt: latestSend ? (latestSend.shownAt?.toISOString() ?? null) : null,
    latestSurveySendId: latestSend?.id ?? null,
  };

  return (
    <GuestDetailClient
      guest={guest}
      hotelId={hotelId}
      lang={lang}
      onSetSurveyTrigger={async (guestStayId, triggerAt) => {
        'use server';
        return setGuestPopupSendAction(hotelId, guestStayId, triggerAt, hotel.hotelGroupId, checkoutSurvey?.id ?? null, checkoutSurvey?.name ?? null);
      }}
    />
  );
}
