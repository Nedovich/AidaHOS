import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Clock, Plus, ShieldCheck, UserCog, Users as UsersIcon } from 'lucide-react';
import { listHotelGroupsWithStats, listUsersWithTenant } from '@aidahos/db';
import { getSession } from '@/lib/auth';
import { getLang } from '@/lib/i18n-server';
import { L } from '@/lib/i18n';
import { avatarColor } from '@/lib/avatar';
import { UsersList, type UserRow } from '@/components/console/users-list';

function Kpi({ icon, label, value, iconBg, iconColor }: { icon: React.ReactNode; label: string; value: string | number; iconBg?: string; iconColor?: string }) {
  return (
    <div className="kpi">
      <div className="kpi__top">
        <div className="kpi__ico" style={iconBg ? { background: iconBg, color: iconColor } : undefined}>{icon}</div>
        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-2)', fontWeight: 600 }}>{label}</span>
      </div>
      <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 600, letterSpacing: '-1px', fontVariantNumeric: 'tabular-nums' }}>{value}</div>
    </div>
  );
}

export default async function UsersPage() {
  const session = await getSession();
  if (!session) redirect('/login');
  if (session.user.role !== 'super_admin') redirect('/');

  const lang = await getLang();
  const [raw, groups] = await Promise.all([listUsersWithTenant(), listHotelGroupsWithStats()]);
  const hotelCountByGroup = new Map(groups.map((g) => [g.id, g.hotelCount]));

  const rows: UserRow[] = raw.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    banned: u.banned,
    accountName: u.groupName ?? null,
    accountColor: u.groupColor ?? '#5457D6',
    hotelsAccess: u.hotelName ? 1 : u.hotelGroupId ? (hotelCountByGroup.get(u.hotelGroupId) ?? 0) : 0,
    lastLogin: u.createdAt.toISOString().slice(0, 10),
    color: avatarColor(u.id),
  }));

  const active = rows.filter((u) => !u.banned).length;
  const admins = rows.filter((u) => u.role === 'admin').length;
  const supers = rows.filter((u) => u.role === 'super_admin').length;

  return (
    <>
      <div className="page-hero">
        <div>
          <h1 className="page-hero__h">{L(['Kullanıcılar', 'Users'], lang)}</h1>
          <p className="page-hero__sub">{L(['Tüm hesaplardaki kullanıcıları, rolleri ve güvenlik durumunu yönetin.', 'Manage every user, role and security state across all accounts.'], lang)}</p>
        </div>
        <div className="page-hero__actions">
          <label className="search" style={{ width: 220 }}>
            <input placeholder={L(['Kullanıcı ara…', 'Search…'], lang)} />
          </label>
          <Link className="btn btn--primary" href="/users/new">
            <Plus size={16} /> {L(['Kullanıcı ekle', 'Add user'], lang)}
          </Link>
        </div>
      </div>

      <div className="grid grid--kpi" style={{ gridTemplateColumns: 'repeat(4,1fr)', marginBottom: 'var(--sp-5)' }}>
        <Kpi icon={<UsersIcon size={18} />} label={L(['Toplam kullanıcı', 'Total users'], lang)} value={rows.length} />
        <Kpi icon={<ShieldCheck size={18} />} label={L(['Aktif', 'Active'], lang)} value={active} iconBg="var(--success-soft)" iconColor="var(--success)" />
        <Kpi icon={<UserCog size={18} />} label={L(['Adminler', 'Admins'], lang)} value={admins} />
        <Kpi icon={<Clock size={18} />} label={L(['Süper Admin', 'Super admins'], lang)} value={supers} iconBg="var(--info-soft)" iconColor="var(--info)" />
      </div>

      <UsersList users={rows} />
    </>
  );
}
