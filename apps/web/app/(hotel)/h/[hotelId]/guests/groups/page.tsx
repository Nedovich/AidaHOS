import { GuestGroupsClient } from '@/components/console/guests/guest-groups-client';
import { getLang } from '@/lib/i18n-server';

export default async function GuestGroupsPage({
  params,
}: {
  params: Promise<{ hotelId: string }>;
}) {
  const [{ hotelId }, lang] = await Promise.all([params, getLang()]);
  return <GuestGroupsClient hotelId={hotelId} lang={lang} />;
}
