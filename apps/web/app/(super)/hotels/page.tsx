import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Building2, CheckCircle2, Hotel as HotelIcon, Plus, Wifi } from 'lucide-react';
import { listHotelsWithGroup } from '@aidahos/db';
import { getSession } from '@/lib/auth';
import { getLang } from '@/lib/i18n-server';
import { L } from '@/lib/i18n';
import { HotelsList, type HotelRow } from '@/components/console/hotels-list';

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

export default async function HotelsPage() {
  const session = await getSession();
  if (!session) redirect('/login');
  if (session.user.role !== 'super_admin') redirect('/');

  const lang = await getLang();
  const rows = (await listHotelsWithGroup()) as HotelRow[];
  const online = rows.filter((h) => h.status === 'active').length;
  const totalRooms = rows.reduce((s, h) => s + h.rooms, 0);
  const guestsOnline = rows.reduce((s, h) => s + h.guestsOnline, 0);

  return (
    <>
      <div className="page-hero">
        <div>
          <h1 className="page-hero__h">{L(['Oteller', 'Hotels'], lang)}</h1>
          <p className="page-hero__sub">{L(['Platformdaki tüm otellerin durumu, PMS entegrasyonu ve canlı misafir trafiği.', 'Status, PMS integration and live guest traffic for every hotel.'], lang)}</p>
        </div>
        <div className="page-hero__actions">
          <label className="search" style={{ width: 220 }}>
            <input placeholder={L(['Otel ara…', 'Search…'], lang)} />
          </label>
          <Link className="btn btn--primary" href="/hotels/new">
            <Plus size={16} /> {L(['Otel ekle', 'Add hotel'], lang)}
          </Link>
        </div>
      </div>

      <div className="grid grid--kpi" style={{ gridTemplateColumns: 'repeat(4,1fr)', marginBottom: 'var(--sp-5)' }}>
        <Kpi icon={<HotelIcon size={18} />} label={L(['Toplam otel', 'Total hotels'], lang)} value={rows.length} />
        <Kpi icon={<CheckCircle2 size={18} />} label={L(['Aktif', 'Online'], lang)} value={online} iconBg="var(--success-soft)" iconColor="var(--success)" />
        <Kpi icon={<Building2 size={18} />} label={L(['Toplam oda', 'Total rooms'], lang)} value={totalRooms.toLocaleString()} />
        <Kpi icon={<Wifi size={18} />} label={L(['Misafir çevrimiçi', 'Guests online'], lang)} value={guestsOnline.toLocaleString()} iconBg="var(--accent-soft)" iconColor="var(--accent)" />
      </div>

      <HotelsList hotels={rows} />
    </>
  );
}
