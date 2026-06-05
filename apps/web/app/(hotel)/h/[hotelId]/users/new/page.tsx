import { redirect } from 'next/navigation';
import { getHotelById, getHotelsForGroup } from '@aidahos/db';
import { getSession } from '@/lib/auth';
import { UserForm } from '@/components/console/user-form';
import { createSubUser } from '../actions';

export default async function AdminNewUserPage({ params }: { params: Promise<{ hotelId: string }> }) {
  const { hotelId } = await params;
  const session = await getSession();
  if (!session) redirect('/login');
  if (session.user.role !== 'admin') redirect(`/h/${hotelId}/dashboard`);

  const current = await getHotelById(hotelId);
  if (!current) redirect('/no-hotel');
  const hotels = await getHotelsForGroup(current.hotelGroupId);

  return (
    <UserForm
      mode="new"
      action={createSubUser.bind(null, hotelId)}
      groups={[]}
      hotels={hotels.map((h) => ({ id: h.id, name: h.name }))}
      roles={['user']}
      backHref={`/h/${hotelId}/users`}
    />
  );
}
