import { redirect } from 'next/navigation';
import { getHotelById, listGuestStays, listSurveys, listEvents, type Loc } from '@aidahos/db';
import { getLang } from '@/lib/i18n-server';
import { NewPopupSendForm } from '@/components/console/guests/new-popup-send-form';
import { createPopupSendAction } from '../actions';

export default async function NewPopupSendPage({
  params,
}: {
  params: Promise<{ hotelId: string }>;
}) {
  const [{ hotelId }, lang] = await Promise.all([params, getLang()]);

  const hotel = await getHotelById(hotelId);
  if (!hotel) redirect('/no-hotel');

  const [stays, surveys, events] = await Promise.all([
    listGuestStays(hotelId),
    listSurveys(hotel.hotelGroupId),
    listEvents(hotel.hotelGroupId, { hotelId }),
  ]);

  const guests = stays.map((s) => ({
    id: s.id,
    name: [s.firstName, s.lastName].filter(Boolean).join(' ') || `Oda ${s.roomNo}`,
    room: s.roomNo,
    checkOut: s.checkOut ? s.checkOut.toISOString() : null,
    hasTrigger: false,
  }));

  const surveyOptions = surveys
    .filter((s) => s.status === 'published')
    .map((s) => ({ id: s.id, name: s.name }));

  const eventOptions = events
    .filter((e) => e.status !== 'draft' && e.status !== 'cancelled')
    .map((e) => ({
      id: e.id,
      name: (e.name ?? {}) as Loc,
      description: (e.description ?? {}) as Loc,
      startsAt: e.startsAt ? e.startsAt.toISOString() : null,
    }));

  return (
    <NewPopupSendForm
      hotelId={hotelId}
      lang={lang}
      guests={guests}
      surveys={surveyOptions}
      events={eventOptions}
      basePath={`/h/${hotelId}/surveys/sends`}
      onSave={async (payload) => {
        'use server';
        return createPopupSendAction(hotelId, payload);
      }}
    />
  );
}
