import { redirect } from 'next/navigation';
import { Wifi, Server, Database, Activity } from 'lucide-react';
import { getHotelById } from '@aidahos/db';
import { getSession } from '@/lib/auth';
import { SignOutButton } from '@/components/sign-out-button';

export default async function HotelDashboard({
  params,
}: {
  params: Promise<{ hotelId: string }>;
}) {
  const { hotelId } = await params;
  const session = await getSession();
  if (!session) redirect('/login');

  const hotel = await getHotelById(hotelId);
  if (!hotel) redirect('/no-hotel');

  const pms = hotel.pmsType !== 'none' ? hotel.pmsType : 'Bağlı değil';
  const mikrotik = hotel.mikrotikIp ?? 'Tanımsız';

  const kpis = [
    { icon: Activity, label: 'Durum', value: hotel.status },
    { icon: Database, label: 'PMS', value: pms },
    { icon: Server, label: 'MikroTik', value: mikrotik },
  ];

  return (
    <>
      <div className="page-hero">
        <div>
          <h1 className="page-hero__h">
            {hotel.name} <span className="accent-serif">paneli</span>
          </h1>
          <p className="page-hero__sub">Otel operasyonu, misafir deneyimi ve bağlantı yönetimi.</p>
        </div>
        <div className="page-hero__actions">
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-3)' }}>
            {session.user.email}
          </span>
          <SignOutButton />
        </div>
      </div>

      <div className="grid grid--kpi">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <div className="kpi" key={k.label}>
              <div className="kpi__top">
                <div className="kpi__ico">
                  <Icon size={18} />
                </div>
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-2)', fontWeight: 600 }}>
                  {k.label}
                </span>
              </div>
              <div
                style={{
                  fontSize: 'var(--text-xl)',
                  fontWeight: 600,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {k.value}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid--2 mt-6">
        <div className="card">
          <div className="card__head">
            <div>
              <div className="card__title">Tesis bilgileri</div>
              <div className="card__sub">Otel ve ağ yapılandırması</div>
            </div>
          </div>
          <div className="card__body">
            <table className="table">
              <tbody>
                {[
                  ['Otel', hotel.name],
                  ['Slug', hotel.slug],
                  ['Durum', hotel.status],
                  ['PMS', pms],
                  ['MikroTik IP', mikrotik],
                  ['Çıkış IP', hotel.exitIp ?? '—'],
                  ['Tailscale', hotel.tailscaleHost ?? '—'],
                ].map(([k, v]) => (
                  <tr key={k}>
                    <td style={{ color: 'var(--text-3)', width: 160 }}>{k}</td>
                    <td style={{ fontWeight: 500 }}>{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card__head">
            <div>
              <div className="card__title">Modüller</div>
              <div className="card__sub">Yakında açılacak</div>
            </div>
          </div>
          <div className="card__body">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9 }}>
              {['Analitik', 'Misafir Portalı', 'PMS', 'Radius', 'Mikrotik', 'Anketler', 'Etkinlikler', 'Spa', 'Restoran'].map(
                (m) => (
                  <span key={m} className="chip">
                    {m}
                  </span>
                ),
              )}
            </div>
            <p style={{ marginTop: 16, fontSize: 'var(--text-sm)', color: 'var(--text-3)' }}>
              Bu modüller Faz 2 ve sonrasında bu panele eklenecek.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
