import { notFound, redirect } from 'next/navigation';
import { getHotelById, getGuestPopupSendById } from '@aidahos/db';
import { getLang } from '@/lib/i18n-server';
import { PopupSendEditForm } from '@/components/console/guests/popup-send-edit-form';
import { updatePopupSendTriggerAction } from '../../actions';

export default async function EditPopupSendPage({
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

  if (send.shownAt) {
    redirect(`/h/${hotelId}/surveys/sends/${sendId}`);
  }

  const name = [send.firstName, send.lastName].filter(Boolean).join(' ') || `Oda ${send.roomNo}`;
  const localized = send.content?.[lang] ?? send.content?.en ?? send.content?.tr ?? null;

  return (
    <PopupSendEditForm
      hotelId={hotelId}
      popupSendId={sendId}
      lang={lang}
      popupTitle={localized?.title ?? null}
      guestName={name}
      triggerAt={send.triggerAt.toISOString()}
      basePath={`/h/${hotelId}/surveys/sends`}
      onSave={async (triggerAt) => {
        'use server';
        return updatePopupSendTriggerAction(hotelId, sendId, triggerAt);
      }}
    />
  );
}
