import { redirect } from 'next/navigation';
import { getHotelById, getCheckoutSurveyForHotel, listSurveySends } from '@aidahos/db';
import { getLang } from '@/lib/i18n-server';
import { GuestSurveySendsClient, type SerializedSurveySend } from '@/components/console/guests/guest-survey-sends-client';
import { setSurveyTriggerAction } from './actions';

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

function surveySendStatus(stay: { surveyTriggerAt: Date | null; surveyShownAt: Date | null }): 'scheduled' | 'sent' | 'completed' {
  if (!stay.surveyShownAt) return 'scheduled';
  return 'sent';
}

export default async function GuestSurveySendsPage({
  params,
}: {
  params: Promise<{ hotelId: string }>;
}) {
  const [{ hotelId }, lang] = await Promise.all([params, getLang()]);

  const hotel = await getHotelById(hotelId);
  if (!hotel) redirect('/no-hotel');

  const [stays, checkoutSurvey] = await Promise.all([
    listSurveySends(hotelId),
    getCheckoutSurveyForHotel(hotel.hotelGroupId),
  ]);

  const records: SerializedSurveySend[] = stays.map((s) => {
    const name = [s.firstName, s.lastName].filter(Boolean).join(' ') || `Oda ${s.roomNo}`;
    return {
      id: s.id,
      guest: {
        id: s.id,
        name,
        initials: initials(s.firstName, s.lastName),
        color: avatarColor(s.id),
        room: s.roomNo,
        hotel: hotel.name,
        email: s.email ?? null,
        phone: s.phone ?? null,
      },
      surveyName: checkoutSurvey?.name ?? null,
      triggerAt: s.surveyTriggerAt ? s.surveyTriggerAt.toISOString() : null,
      shownAt: s.surveyShownAt ? s.surveyShownAt.toISOString() : null,
      status: surveySendStatus(s),
    };
  });

  return (
    <GuestSurveySendsClient
      hotelId={hotelId}
      lang={lang}
      records={records}
      onSetTrigger={async (guestStayId, triggerAt) => {
        'use server';
        return setSurveyTriggerAction(hotelId, guestStayId, triggerAt);
      }}
    />
  );
}
