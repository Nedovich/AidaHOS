import { notFound, redirect } from 'next/navigation';
import { getHotelById, getPopupAutomations, listSurveys } from '@aidahos/db';
import { NewPopupAutomationForm } from '@/components/console/guests/new-popup-automation-form';
import { getLang } from '@/lib/i18n-server';
import { upsertPopupAutomationAction } from '../../actions';

export default async function EditPopupAutomationPage({
  params,
}: {
  params: Promise<{ hotelId: string; automationId: string }>;
}) {
  const [{ hotelId, automationId }, lang] = await Promise.all([params, getLang()]);
  const hotel = await getHotelById(hotelId);

  if (!hotel) {
    redirect('/no-hotel');
  }

  const [automations, surveys] = await Promise.all([
    getPopupAutomations(hotelId),
    listSurveys(hotel.hotelGroupId),
  ]);
  const automation = automations.find((a) => a.id === automationId);
  if (!automation) notFound();

  const surveyOptions = surveys
    .filter((s) => s.status === 'published')
    .map((s) => ({ id: s.id, name: s.name }));

  return (
    <NewPopupAutomationForm
      hotelId={hotelId}
      lang={lang}
      automation={automation}
      surveys={surveyOptions}
      onSave={async (input) => {
        'use server';
        return upsertPopupAutomationAction(hotelId, input);
      }}
    />
  );
}
