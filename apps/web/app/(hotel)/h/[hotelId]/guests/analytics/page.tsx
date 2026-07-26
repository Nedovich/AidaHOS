import { GuestAnalyticsClient } from '@/components/console/guests/guest-analytics-client';
import { getLang } from '@/lib/i18n-server';

export default async function GuestAnalyticsPage({
  params,
}: {
  params: Promise<{ hotelId: string }>;
}) {
  const [{ hotelId }, lang] = await Promise.all([params, getLang()]);
  return <GuestAnalyticsClient hotelId={hotelId} lang={lang} />;
}
