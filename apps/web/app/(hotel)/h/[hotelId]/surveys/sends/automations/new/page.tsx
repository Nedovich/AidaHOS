import { redirect } from 'next/navigation';
import { getHotelById, listSurveys } from '@aidahos/db';
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

  const surveys = await listSurveys(hotel.hotelGroupId);
  const surveyOptions = surveys
    .filter((s) => s.status === 'published')
    .map((s) => ({ id: s.id, name: s.name }));

  return (
    <NewPopupAutomationForm
      hotelId={hotelId}
      lang={lang}
      surveys={surveyOptions}
      onSave={async (input) => {
        'use server';
        return upsertPopupAutomationAction(hotelId, input);
      }}
    />
  );
}
