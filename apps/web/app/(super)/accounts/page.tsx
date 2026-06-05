import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Plus } from 'lucide-react';
import { listHotelGroupsWithStats } from '@aidahos/db';
import { getSession } from '@/lib/auth';
import { getLang } from '@/lib/i18n-server';
import { L } from '@/lib/i18n';
import { AccountsList } from '@/components/console/accounts-list';

export default async function AccountsPage() {
  const session = await getSession();
  if (!session) redirect('/login');
  if (session.user.role !== 'super_admin') redirect('/');

  const lang = await getLang();
  const groups = await listHotelGroupsWithStats();

  return (
    <>
      <div className="page-hero">
        <div>
          <h1 className="page-hero__h">
            {L(['Hesaplar', 'Accounts'], lang)} <span className="accent-serif">/ {L(['Gruplar', 'Groups'], lang)}</span>
          </h1>
          <p className="page-hero__sub">{L(['Platformdaki tüm otel grubu hesaplarını görüntüleyin ve yönetin.', 'View and manage every hotel-group account.'], lang)}</p>
        </div>
        <div className="page-hero__actions">
          <label className="search" style={{ width: 220 }}>
            <input placeholder={L(['Hesap ara…', 'Search…'], lang)} />
          </label>
          <Link className="btn btn--primary" href="/accounts/new">
            <Plus size={16} /> {L(['Yeni hesap', 'New account'], lang)}
          </Link>
        </div>
      </div>

      <AccountsList groups={groups} />
    </>
  );
}
