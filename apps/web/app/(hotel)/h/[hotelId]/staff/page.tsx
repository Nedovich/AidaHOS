import Link from 'next/link';
import {
  Clock3,
  Download,
  Plus,
  Power,
  Users,
  Wifi,
} from 'lucide-react';
import { getHotelById, listStaffAccounts, listStaffUsersRadiusStats } from '@aidahos/db';
import { Kpi } from '@/components/console/charts';
import { StaffSubnav } from '@/components/console/staff/staff-subnav';
import { L, type Lang } from '@/lib/i18n';
import { getLang } from '@/lib/i18n-server';
import { StaffUsersClient } from '@/components/console/staff/staff-users-client';
import type { StaffAccount } from '@aidahos/db';

export default async function StaffUsersPage({ params }: { params: Promise<{ hotelId: string }> }) {
  const { hotelId } = await params;
  const lang = await getLang();
  const base = `/h/${hotelId}/staff`;

  const hotel = await getHotelById(hotelId);
  let users: StaffAccount[] = [];
  let error: string | null = null;

  try {
    const radiusStats = hotel?.slug ? await listStaffUsersRadiusStats(hotel.slug) : [];
    users = await listStaffAccounts(hotelId, radiusStats);
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  const online = users.filter((u) => u.online).length;

  return (
    <>
      <div className="page-hero staff-hero">
        <div>
          <h1 className="page-hero__h">{L(['Personel İnternet Hesapları', 'Staff Internet Accounts'], lang)}</h1>
          <p className="page-hero__sub">
            {L(['Otel çalışanları için ağ erişim hesaplarını yönetin.', 'Manage network access accounts for hotel employees.'], lang)}
          </p>
        </div>
        <div className="page-hero__actions">
          <button type="button" className="btn btn--ghost"><Download size={16} />CSV</button>
          <Link className="btn btn--primary" href={`${base}/new`}><Plus size={16} />{L(['Yeni Hesap', 'New Account'], lang)}</Link>
        </div>
      </div>

      <StaffSubnav hotelId={hotelId} active="users" lang={lang} />

      <div className="grid grid--kpi staff-kpi-grid">
        <Kpi icon={<Users />} label={L(['Toplam Hesap', 'Total Accounts'], lang)} value={String(users.length)} note={L(['bu otelde', 'at this hotel'], lang)} spark={[0, 0, 0, 0, 0, 0, users.length]} />
        <Kpi icon={<Wifi />} label={L(['Şu An Bağlı', 'Connected Now'], lang)} value={String(online)} note={L(['aktif oturum', 'active session'], lang)} spark={[0, 0, 0, 0, 0, 0, online]} live />
        <Kpi icon={<Clock3 />} label={L(['Gruplar', 'Groups'], lang)} value={String(new Set(users.map((u) => u.mikrotikGroup).filter(Boolean)).size)} note={L(['farklı profil', 'distinct profiles'], lang)} spark={[0, 0, 0, 0, 0, 0, 0]} />
        <Kpi icon={<Power />} label={L(['FreeRADIUS', 'FreeRADIUS'], lang)} value={error ? 'ERR' : 'OK'} note={error ? L(['bağlantı hatası', 'connection error'], lang) : L(['bağlı', 'connected'], lang)} spark={[1, 1, 1, 1, 1, 1, error ? 0 : 1]} />
      </div>

      <StaffUsersClient hotelId={hotelId} lang={lang} users={users} error={error} base={base} />
    </>
  );
}
