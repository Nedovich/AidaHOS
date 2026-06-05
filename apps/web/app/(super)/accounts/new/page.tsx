import { redirect } from 'next/navigation';
import { listAssignableUsers } from '@aidahos/db';
import { getSession } from '@/lib/auth';
import { getLang } from '@/lib/i18n-server';
import { AccountForm } from '@/components/console/account-form';
import { createAccount } from '../actions';

export default async function NewAccountPage() {
  const session = await getSession();
  if (!session) redirect('/login');
  if (session.user.role !== 'super_admin') redirect('/');
  const users = await listAssignableUsers();
  return <AccountForm mode="new" action={createAccount} lang={await getLang()} users={users} />;
}
