import { redirect } from 'next/navigation';
import { randomBytes } from 'node:crypto';
import { listHotelGroupsWithStats } from '@aidahos/db';
import { getSession } from '@/lib/auth';
import { getLang } from '@/lib/i18n-server';
import { HotelForm } from '@/components/console/hotel-form';
import { createHotelAction } from '../actions';

export default async function NewHotelPage() {
  const session = await getSession();
  if (!session) redirect('/login');
  if (session.user.role !== 'super_admin') redirect('/');

  const groups = await listHotelGroupsWithStats();
  const nasSecret = randomBytes(24).toString('hex');

  return (
    <HotelForm
      mode="new"
      action={createHotelAction}
      groups={groups}
      defaults={{ nasSecret }}
      lang={await getLang()}
    />
  );
}
