import { GuestWelcomeMessagesClient } from '@/components/console/guests/guest-welcome-messages-client';
import { getLang } from '@/lib/i18n-server';

export default async function GuestWelcomeMessagesPage({
  params,
}: {
  params: Promise<{ hotelId: string }>;
}) {
  const [{ hotelId }, lang] = await Promise.all([params, getLang()]);
  return <GuestWelcomeMessagesClient hotelId={hotelId} lang={lang} />;
}
