import { notFound } from 'next/navigation';
import { GuestWelcomeMessageDetailClient } from '@/components/console/guests/guest-welcome-message-detail-client';
import { getGuestWelcomeMessageRecord } from '@/components/console/guests/guest-welcome-message-data';
import { getLang } from '@/lib/i18n-server';

export default async function GuestWelcomeMessageDetailPage({
  params,
}: {
  params: Promise<{ hotelId: string; messageId: string }>;
}) {
  const [{ hotelId, messageId }, lang] = await Promise.all([params, getLang()]);
  const record = getGuestWelcomeMessageRecord(Number(messageId));

  if (!record) notFound();

  return (
    <GuestWelcomeMessageDetailClient
      record={record}
      hotelId={hotelId}
      lang={lang}
    />
  );
}
