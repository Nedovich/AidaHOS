import { GuestTicketsClient } from '@/components/console/guests/guest-tickets-client';
import { getLang } from '@/lib/i18n-server';

export default async function GuestTicketsPage({
  params,
}: {
  params: Promise<{ hotelId: string }>;
}) {
  const [{ hotelId }, lang] = await Promise.all([params, getLang()]);
  return <GuestTicketsClient hotelId={hotelId} lang={lang} />;
}
