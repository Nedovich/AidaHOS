import { notFound, redirect } from 'next/navigation';
import { getHotelById, getGuestPopupSendById } from '@aidahos/db';
import { getLang } from '@/lib/i18n-server';
import { GuestPopupSendDetailClient, type SerializedPopupSendDetail } from '@/components/console/guests/guest-popup-send-detail-client';
import { markPopupSendShownAction } from '../actions';

function initials(first: string | null, last: string | null): string {
  const f = (first ?? '').trim()[0] ?? '';
  const l = (last ?? '').trim()[0] ?? '';
  return (f + l).toUpperCase() || '?';
}

function avatarColor(seed: string): string {
  const COLORS = ['#0E7490', '#7C5CE0', '#0E9F6E', '#B8740A', '#2563C9', '#D5485A'];
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return COLORS[h % COLORS.length]!;
}

export default async function SurveySendDetailPage({
  params,
}: {
  params: Promise<{ hotelId: string; sendId: string }>;
}) {
  const [{ hotelId, sendId }, lang] = await Promise.all([params, getLang()]);

  const [hotel, send] = await Promise.all([
    getHotelById(hotelId),
    getGuestPopupSendById(sendId),
  ]);

  if (!hotel) redirect('/no-hotel');
  if (!send) notFound();

  const name = [send.firstName, send.lastName].filter(Boolean).join(' ') || `Oda ${send.roomNo}`;
  const localized = send.content?.[lang] ?? send.content?.en ?? send.content?.tr ?? null;

  const detail: SerializedPopupSendDetail = {
    id: send.id,
    guest: {
      name,
      initials: initials(send.firstName, send.lastName),
      color: avatarColor(send.guestStayId),
      room: send.roomNo,
      hotel: hotel.name,
      email: send.email ?? null,
      phone: send.phone ?? null,
    },
    popupType: send.popupType,
    popupTitle: localized?.title ?? null,
    triggerAt: send.triggerAt.toISOString(),
    kickedAt: send.kickedAt ? send.kickedAt.toISOString() : null,
    shownAt: send.shownAt ? send.shownAt.toISOString() : null,
    status: send.shownAt ? 'completed' : send.kickedAt ? 'sent' : 'scheduled',
  };

  return (
    <GuestPopupSendDetailClient
      detail={detail}
      hotelId={hotelId}
      lang={lang}
      basePath={`/h/${hotelId}/surveys/sends`}
      onMarkShown={async (id) => {
        'use server';
        return markPopupSendShownAction(hotelId, id);
      }}
    />
  );
}
