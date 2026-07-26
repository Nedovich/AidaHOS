import { notFound, redirect } from 'next/navigation';
import { getHotelById, getGuestStayById, getCheckoutSurveyForHotel } from '@aidahos/db';
import { getLang } from '@/lib/i18n-server';
import { GuestSurveySendDetailClient, type SerializedSurveySendDetail } from '@/components/console/guests/guest-survey-send-detail-client';
import { markSurveyShownAction } from '../actions';

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

export default async function GuestSurveySendDetailPage({
  params,
}: {
  params: Promise<{ hotelId: string; surveySendId: string }>;
}) {
  const [{ hotelId, surveySendId }, lang] = await Promise.all([params, getLang()]);

  const [hotel, stay] = await Promise.all([
    getHotelById(hotelId),
    getGuestStayById(surveySendId),
  ]);

  if (!hotel) redirect('/no-hotel');
  if (!stay || !stay.surveyTriggerAt) notFound();

  const checkoutSurvey = await getCheckoutSurveyForHotel(hotel.hotelGroupId);

  const name = [stay.firstName, stay.lastName].filter(Boolean).join(' ') || `Oda ${stay.roomNo}`;

  const detail: SerializedSurveySendDetail = {
    id: stay.id,
    guest: {
      name,
      initials: initials(stay.firstName, stay.lastName),
      color: avatarColor(stay.id),
      room: stay.roomNo,
      hotel: hotel.name,
      email: stay.email ?? null,
      phone: stay.phone ?? null,
    },
    surveyName: checkoutSurvey?.name ?? null,
    triggerAt: stay.surveyTriggerAt.toISOString(),
    shownAt: stay.surveyShownAt ? stay.surveyShownAt.toISOString() : null,
    status: stay.surveyShownAt ? 'sent' : 'scheduled',
  };

  return (
    <GuestSurveySendDetailClient
      detail={detail}
      hotelId={hotelId}
      lang={lang}
      onMarkShown={async (id) => {
        'use server';
        return markSurveyShownAction(hotelId, id);
      }}
    />
  );
}
