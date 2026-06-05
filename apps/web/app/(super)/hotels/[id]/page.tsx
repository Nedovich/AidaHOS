import { redirect } from 'next/navigation';
import { getHotelById, getHotelGroupById, listHotelGroupsWithStats } from '@aidahos/db';
import { getSession } from '@/lib/auth';
import { getLang } from '@/lib/i18n-server';
import { type Lang } from '@/lib/i18n';
import { HotelDetailView } from '@/components/console/hotel-detail';
import { updateHotelAction } from '../actions';

export default async function HotelDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab = 'overview' } = await searchParams;
  const session = await getSession();
  if (!session) redirect('/login');
  if (session.user.role !== 'super_admin') redirect('/');

  const lang: Lang = await getLang();
  const hotel = await getHotelById(id);
  if (!hotel) redirect('/hotels');
  const group = await getHotelGroupById(hotel.hotelGroupId);

  return (
    <HotelDetailView
      hotel={hotel}
      group={group}
      lang={lang}
      tab={tab}
      basePath="/hotels"
      groups={await listHotelGroupsWithStats()}
      editAction={updateHotelAction.bind(null, hotel.id)}
      groupHref={group ? `/accounts/${group.id}` : null}
      crumbHref="/hotels"
      crumbLabel={['Oteller', 'Hotels']}
    />
  );
}
