import { redirect } from 'next/navigation';
import { getHotelById, listHotelGroupsWithStats } from '@aidahos/db';
import { getSession } from '@/lib/auth';
import { getLang } from '@/lib/i18n-server';
import { HotelForm } from '@/components/console/hotel-form';
import { updateHotelAction } from '../../actions';

export default async function EditHotelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect('/login');
  if (session.user.role !== 'super_admin') redirect('/');

  const hotel = await getHotelById(id);
  if (!hotel) redirect('/hotels');
  const groups = await listHotelGroupsWithStats();

  return (
    <HotelForm
      mode="edit"
      action={updateHotelAction.bind(null, id)}
      groups={groups}
      defaults={{
        name: hotel.name,
        status: hotel.status,
        hotelGroupId: hotel.hotelGroupId,
        mikrotikIp: hotel.mikrotikIp,
        exitIp: hotel.exitIp,
        nasSecret: hotel.nasSecret,
      }}
      lang={await getLang()}
    />
  );
}
