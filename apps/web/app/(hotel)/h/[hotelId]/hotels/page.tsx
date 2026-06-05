import { redirect } from 'next/navigation';
import { Building2, CheckCircle2, Hotel as HotelIcon, Lock, Wifi } from 'lucide-react';
import { getHotelById, getHotelGroupById, getHotelsForGroup } from '@aidahos/db';
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

export default async function AdminHotelsPage({ params }: { params: Promise<{ hotelId: string }> }) {
  const { hotelId } = await params;
  const session = await getSession();
  if (!session) redirect('/login');
  if (session.user.role !== 'admin') redirect(`/h/${hotelId}/dashboard`);

  const lang = await getLang();
  const current = await getHotelById(hotelId);
  if (!current) redirect('/no-hotel');

  const [hotels, group] = await Promise.all([
    getHotelsForGroup(current.hotelGroupId),
    getHotelGroupById(current.hotelGroupId),
  ]);

  const rows: HotelRow[] = hotels.map((h) => ({
    id: h.id,
    name: h.name,
    slug: h.slug,
    status: h.status,
    region: h.region,
    rooms: h.rooms,
    guestsOnline: h.guestsOnline,
    color: h.color,
    pmsType: h.pmsType,
    groupName: group?.name ?? '—',
    groupColor: group?.color ?? '#2F6E78',
  }));

  const online = rows.filter((h) => h.status === 'active').length;
  const totalRooms = rows.reduce((s, h) => s + h.rooms, 0);
  const guestsOnline = rows.reduce((s, h) => s + h.guestsOnline, 0);

  return (
    <>
      <div className="page-hero">
        <div>
          <h1 className="page-hero__h">
            {L(['Oteller', 'Hotels'], lang)} <span className="accent-serif">/ {L(['Grubunuz', 'Your group'], lang)}</span>
          </h1>
          <p className="page-hero__sub">{L(['Grubunuzdaki tüm tesislerin durumu, PMS entegrasyonu ve canlı misafir trafiği.', 'Status, PMS integration and live guest traffic for every hotel in your group.'], lang)}</p>
        </div>
        <div className="page-hero__actions">
          <label className="search" style={{ width: 220 }}>
            <input placeholder={L(['Otel ara…', 'Search…'], lang)} />
          </label>
          <button className="btn btn--subtle" disabled title={L(['Paket & ödeme ile açılacak', 'Opens with billing'], lang)} style={{ opacity: 0.7, cursor: 'not-allowed' }}>
            <Lock size={15} /> {L(['Yeni otel', 'New hotel'], lang)}
          </button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 'var(--sp-5)', borderColor: 'var(--accent-line)', background: 'var(--accent-soft)' }}>
        <div className="card__body" style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--accent)' }}>
          <Lock size={16} />
          <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>
            {L(
              ['Yeni otel ekleme, paket & ödeme sistemi etkinleştiğinde açılacak (ücretler otel başına belirlenir).',
                'Adding a new hotel unlocks once the billing system is enabled (pricing is per hotel).'],
              lang,
            )}
          </span>
        </div>
      </div>

      <div className="grid grid--kpi" style={{ gridTemplateColumns: 'repeat(4,1fr)', marginBottom: 'var(--sp-5)' }}>
        <Kpi icon={<HotelIcon size={18} />} label={L(['Toplam otel', 'Total hotels'], lang)} value={rows.length} />
        <Kpi icon={<CheckCircle2 size={18} />} label={L(['Aktif', 'Online'], lang)} value={online} iconBg="var(--success-soft)" iconColor="var(--success)" />
        <Kpi icon={<Building2 size={18} />} label={L(['Toplam oda', 'Total rooms'], lang)} value={totalRooms.toLocaleString()} />
        <Kpi icon={<Wifi size={18} />} label={L(['Misafir çevrimiçi', 'Guests online'], lang)} value={guestsOnline.toLocaleString()} iconBg="var(--accent-soft)" iconColor="var(--accent)" />
      </div>

      <HotelsList hotels={rows} basePath={`/h/${hotelId}/hotels`} />
    </>
  );
}
