import { notFound } from 'next/navigation';
import { GuestEmailDetailClient } from '@/components/console/guests/guest-email-detail-client';
import { getGuestEmailRecord } from '@/components/console/guests/guest-email-data';
import { getLang } from '@/lib/i18n-server';

export default async function GuestEmailDetailPage({
  params,
}: {
  params: Promise<{ hotelId: string; emailId: string }>;
}) {
  const [{ hotelId, emailId }, lang] = await Promise.all([params, getLang()]);
  const parsedId = Number.parseInt(emailId, 10);
  const record = Number.isNaN(parsedId) ? undefined : getGuestEmailRecord(parsedId);

  if (!record) notFound();

  return <GuestEmailDetailClient record={record} hotelId={hotelId} lang={lang} />;
}
