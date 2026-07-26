import { notFound } from 'next/navigation';
import { GuestCommsEditForm } from '@/components/console/guests/guest-comms-edit-form';
import { getGuestWelcomeMessageRecord } from '@/components/console/guests/guest-welcome-message-data';
import { getLang } from '@/lib/i18n-server';

export default async function EditGuestWelcomeMessagePage({
  params,
}: {
  params: Promise<{ hotelId: string; messageId: string }>;
}) {
  const [{ hotelId, messageId }, lang] = await Promise.all([params, getLang()]);
  const record = getGuestWelcomeMessageRecord(Number(messageId));

  if (!record) notFound();

  return <GuestCommsEditForm hotelId={hotelId} kind="message" lang={lang} record={record} />;
}
