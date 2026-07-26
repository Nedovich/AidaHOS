import { GuestConnectionsClient } from '@/components/console/guests/guest-connections-client';
import { getLang } from '@/lib/i18n-server';

export default async function GuestConnectionsPage({
  params,
}: {
  params: Promise<{ hotelId: string }>;
}) {
  const [{ hotelId }, lang] = await Promise.all([params, getLang()]);
  return <GuestConnectionsClient hotelId={hotelId} lang={lang} />;
}
