import { GuestCommsComposeForm } from '@/components/console/guests/guest-comms-compose-form';
import { getLang } from '@/lib/i18n-server';

export default async function NewGuestEmailPage({
  params,
}: {
  params: Promise<{ hotelId: string }>;
}) {
  const [{ hotelId }, lang] = await Promise.all([params, getLang()]);
  return <GuestCommsComposeForm hotelId={hotelId} kind="email" lang={lang} />;
}
