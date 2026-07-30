import { GuestGroupNewClient } from '@/components/console/guests/guest-group-new-client';
import { getLang } from '@/lib/i18n-server';

export default async function NewGuestGroupPage({
  params,
}: {
  params: Promise<{ hotelId: string }>;
}) {
  const [{ hotelId }, lang] = await Promise.all([params, getLang()]);
  return <GuestGroupNewClient hotelId={hotelId} lang={lang} />;
}
