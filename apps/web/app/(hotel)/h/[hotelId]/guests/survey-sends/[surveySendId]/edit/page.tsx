import { notFound, redirect } from 'next/navigation';
import { getHotelById, getGuestStayById, getCheckoutSurveyForHotel } from '@aidahos/db';
import { getLang } from '@/lib/i18n-server';
import { SurveySendEditForm } from '@/components/console/guests/survey-send-edit-form';
import { setSurveyTriggerAction } from '../../actions';

export default async function EditGuestSurveySendPage({
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

  return (
    <SurveySendEditForm
      hotelId={hotelId}
      surveySendId={surveySendId}
      lang={lang}
      surveyName={checkoutSurvey?.name ?? null}
      guestName={name}
      triggerAt={stay.surveyTriggerAt.toISOString()}
      onSave={async (triggerAt) => {
        'use server';
        return setSurveyTriggerAction(hotelId, surveySendId, triggerAt);
      }}
    />
  );
}
