import { redirect } from 'next/navigation';
import { getGroupOwner, getHotelGroupById, listAssignableUsers } from '@aidahos/db';
import { getSession } from '@/lib/auth';
import { getLang } from '@/lib/i18n-server';
import { AccountForm } from '@/components/console/account-form';
import { updateAccountAction } from '../../actions';

export default async function EditAccountPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect('/login');
  if (session.user.role !== 'super_admin') redirect('/');

  const group = await getHotelGroupById(id);
  if (!group) redirect('/accounts');
  const [users, owner] = await Promise.all([listAssignableUsers(), getGroupOwner(id)]);

  return (
    <AccountForm
      mode="edit"
      action={updateAccountAction.bind(null, id)}
      defaults={{
        name: group.name,
        slug: group.slug,
        status: group.status,
        ownerUserId: owner?.id ?? null,
        region: group.region,
        plan: group.plan,
      }}
      lang={await getLang()}
      users={users}
    />
  );
}
