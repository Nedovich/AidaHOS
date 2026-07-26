import { GuestEmailsClient } from '@/components/console/guests/guest-emails-client';
import { getLang } from '@/lib/i18n-server';

export default async function GuestEmailsPage({
  params,
}: {
  params: Promise<{ hotelId: string }>;
}) {
  const [{ hotelId }, lang] = await Promise.all([params, getLang()]);
  return <GuestEmailsClient hotelId={hotelId} lang={lang} />;
}
