import { notFound } from 'next/navigation';
import { GuestCommsEditForm } from '@/components/console/guests/guest-comms-edit-form';
import { getGuestEmailRecord } from '@/components/console/guests/guest-email-data';
import { getLang } from '@/lib/i18n-server';

export default async function EditGuestEmailPage({
  params,
}: {
  params: Promise<{ hotelId: string; emailId: string }>;
}) {
  const [{ hotelId, emailId }, lang] = await Promise.all([params, getLang()]);
  const record = getGuestEmailRecord(Number(emailId));

  if (!record) notFound();

  return <GuestCommsEditForm hotelId={hotelId} kind="email" lang={lang} record={record} />;
}
