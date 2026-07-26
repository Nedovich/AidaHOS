import { notFound } from 'next/navigation';
import { GuestTicketDetailClient } from '@/components/console/guests/guest-ticket-detail-client';
import { getGuestTicketRecord } from '@/components/console/guests/guest-ticket-data';
import { getLang } from '@/lib/i18n-server';

export default async function GuestTicketDetailPage({
  params,
}: {
  params: Promise<{ hotelId: string; ticketId: string }>;
}) {
  const [{ hotelId, ticketId }, lang] = await Promise.all([params, getLang()]);
  const parsedId = Number.parseInt(ticketId, 10);
  const record = Number.isNaN(parsedId) ? undefined : getGuestTicketRecord(parsedId);

  if (!record) notFound();

  return <GuestTicketDetailClient record={record} hotelId={hotelId} lang={lang} />;
}
