import { redirect } from 'next/navigation';
import { getHotelById, getHotelGroupById } from '@aidahos/db';
import { getSession } from '@/lib/auth';
import { getLang } from '@/lib/i18n-server';
import { type Lang } from '@/lib/i18n';
import { HotelDetailView } from '@/components/console/hotel-detail';
import { updateGroupHotel } from '../actions';

export default async function AdminHotelDetail({
  params,
  searchParams,
}: {
  params: Promise<{ hotelId: string; targetId: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { hotelId, targetId } = await params;
  const { tab = 'overview' } = await searchParams;
  const session = await getSession();
  if (!session) redirect('/login');
  if (session.user.role !== 'admin') redirect(`/h/${hotelId}/dashboard`);

  const lang: Lang = await getLang();
  const current = await getHotelById(hotelId);
  if (!current) redirect('/no-hotel');

  const hotel = await getHotelById(targetId);
  // Security: the target hotel must belong to the admin's group.
  if (!hotel || hotel.hotelGroupId !== current.hotelGroupId) redirect(`/h/${hotelId}/hotels`);
  const group = await getHotelGroupById(hotel.hotelGroupId);

  return (
    <HotelDetailView
      hotel={hotel}
      group={group}
      lang={lang}
      tab={tab}
      basePath={`/h/${hotelId}/hotels`}
      groups={group ? [{ id: group.id, name: group.name }] : []}
      editAction={updateGroupHotel.bind(null, hotelId, hotel.id)}
      groupHref={null}
      crumbHref={`/h/${hotelId}/hotels`}
      crumbLabel={['Oteller', 'Hotels']}
    />
  );
}
