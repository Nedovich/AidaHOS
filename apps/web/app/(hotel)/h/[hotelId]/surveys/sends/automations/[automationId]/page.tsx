import { notFound, redirect } from 'next/navigation';
import { getHotelById, getPopupAutomations } from '@aidahos/db';
import { PopupAutomationDetailClient } from '@/components/console/guests/popup-automation-detail-client';
import { getLang } from '@/lib/i18n-server';
import { deletePopupAutomationAction, togglePopupAutomationStatusAction } from '../actions';

export default async function PopupAutomationDetailPage({
  params,
}: {
  params: Promise<{ hotelId: string; automationId: string }>;
}) {
  const [{ hotelId, automationId }, lang] = await Promise.all([params, getLang()]);
  const hotel = await getHotelById(hotelId);
  if (!hotel) redirect('/no-hotel');

  const automations = await getPopupAutomations(hotelId);
  const automation = automations.find((item) => item.id === automationId);
  if (!automation) notFound();

  return (
    <PopupAutomationDetailClient
      hotelId={hotelId}
      lang={lang}
      initialAutomation={{
        id: automation.id,
        kind: automation.kind,
        timing: automation.timing,
        content: automation.content,
        status: automation.status,
        createdAt: automation.createdAt.toISOString(),
      }}
      onToggle={async () => {
        'use server';
        return togglePopupAutomationStatusAction(hotelId, automationId);
      }}
      onDelete={async () => {
        'use server';
        return deletePopupAutomationAction(hotelId, automationId);
      }}
    />
  );
}
