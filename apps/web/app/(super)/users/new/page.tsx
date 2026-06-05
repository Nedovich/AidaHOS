import { redirect } from 'next/navigation';
import { getAllHotels, listHotelGroupsWithStats } from '@aidahos/db';
import { getSession } from '@/lib/auth';
import { UserForm } from '@/components/console/user-form';
import { createUserAction } from '../actions';

export default async function NewUserPage() {
  const session = await getSession();
  if (!session) redirect('/login');
  if (session.user.role !== 'super_admin') redirect('/');

  const [groups, hotels] = await Promise.all([listHotelGroupsWithStats(), getAllHotels()]);

  return <UserForm mode="new" action={createUserAction} groups={groups} hotels={hotels} />;
}
