import { notFound } from 'next/navigation';
import { GuestGroupDetailClient } from '@/components/console/guests/guest-group-detail-client';
import { getGuestGroupRecord } from '@/components/console/guests/guest-group-data';
import { getLang } from '@/lib/i18n-server';

export default async function GuestGroupDetailPage({
  params,
}: {
  params: Promise<{ hotelId: string; groupId: string }>;
}) {
  const [{ hotelId, groupId }, lang] = await Promise.all([params, getLang()]);
  const group = getGuestGroupRecord(Number(groupId));

  if (!group) notFound();

  return <GuestGroupDetailClient group={group} hotelId={hotelId} lang={lang} />;
}
