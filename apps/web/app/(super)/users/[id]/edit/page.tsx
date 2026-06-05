import { redirect } from 'next/navigation';
import { getAllHotels, getUserById, getUserMemberships, listHotelGroupsWithStats } from '@aidahos/db';
import { getSession } from '@/lib/auth';
import { UserForm } from '@/components/console/user-form';
import { updateUserAction } from '../../actions';

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect('/login');
  if (session.user.role !== 'super_admin') redirect('/');

  const user = await getUserById(id);
  if (!user) redirect('/users');
  const [mems, groups, hotels] = await Promise.all([
    getUserMemberships(id),
    listHotelGroupsWithStats(),
    getAllHotels(),
  ]);
  const m = mems[0];

  return (
    <UserForm
      mode="edit"
      action={updateUserAction.bind(null, id)}
      groups={groups}
      hotels={hotels}
      defaults={{
        name: user.name,
        email: user.email,
        role: user.role,
        banned: user.banned,
        hotelGroupId: m?.hotelGroupId ?? null,
        hotelId: m?.hotelId ?? null,
      }}
    />
  );
}
