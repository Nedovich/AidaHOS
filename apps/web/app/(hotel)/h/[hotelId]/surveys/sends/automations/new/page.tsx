import { redirect } from 'next/navigation';
import { getHotelById, getPopupAutomations, listSurveys } from '@aidahos/db';
import { NewPopupAutomationForm } from '@/components/console/guests/new-popup-automation-form';
import { getLang } from '@/lib/i18n-server';
import { upsertPopupAutomationAction } from '../actions';

export default async function NewPopupAutomationPage({
  params,
}: {
  params: Promise<{ hotelId: string }>;
}) {
  const [{ hotelId }, lang] = await Promise.all([params, getLang()]);
  const hotel = await getHotelById(hotelId);

  if (!hotel) {
    redirect('/no-hotel');
  }

  const [surveys, existingAutomations] = await Promise.all([
    listSurveys(hotel.hotelGroupId),
    getPopupAutomations(hotelId),
  ]);
  const surveyOptions = surveys
    .filter((s) => s.status === 'published')
    .map((s) => ({ id: s.id, name: s.name }));

  return (
    <NewPopupAutomationForm
      hotelId={hotelId}
      lang={lang}
      surveys={surveyOptions}
      existingKinds={existingAutomations.map((a) => ({ id: a.id, kind: a.kind }))}
      onSave={async (input) => {
        'use server';
        return upsertPopupAutomationAction(hotelId, input);
      }}
    />
  );
}
