import { redirect } from 'next/navigation';
import { Wifi, Server, Database, Activity } from 'lucide-react';
import { getHotelById } from '@aidahos/db';
import { getSession } from '@/lib/auth';
import { getLang } from '@/lib/i18n-server';
import { L } from '@/lib/i18n';
import { SignOutButton } from '@/components/sign-out-button';

export default async function HotelDashboard({ params }: { params: Promise<{ hotelId: string }> }) {
  const { hotelId } = await params;
  const session = await getSession();
  if (!session) redirect('/login');

  const lang = await getLang();
  const hotel = await getHotelById(hotelId);
  if (!hotel) redirect('/no-hotel');

  const pms = hotel.pmsType !== 'none' ? hotel.pmsType : L(['Bağlı değil', 'Not connected'], lang);
  const mikrotik = hotel.mikrotikIp ?? L(['Tanımsız', 'Not set'], lang);

  const kpis = [
    { icon: Activity, label: L(['Durum', 'Status'], lang), value: hotel.status },
    { icon: Database, label: 'PMS', value: pms },
    { icon: Server, label: 'MikroTik', value: mikrotik },
  ];

  return (
    <>
      <div className="page-hero">
        <div>
          <h1 className="page-hero__h">
            {hotel.name} <span className="accent-serif">{L(['paneli', 'console'], lang)}</span>
          </h1>
          <p className="page-hero__sub">{L(['Otel operasyonu, misafir deneyimi ve bağlantı yönetimi.', 'Hotel operations, guest experience and connectivity.'], lang)}</p>
        </div>
        <div className="page-hero__actions">
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-3)' }}>{session.user.email}</span>
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
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-2)', fontWeight: 600 }}>{k.label}</span>
              </div>
              <div style={{ fontSize: 'var(--text-xl)', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{k.value}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid--2 mt-6">
        <div className="card">
          <div className="card__head">
            <div>
              <div className="card__title">{L(['Tesis bilgileri', 'Property info'], lang)}</div>
              <div className="card__sub">{L(['Otel ve ağ yapılandırması', 'Hotel and network configuration'], lang)}</div>
            </div>
          </div>
          <div className="card__body">
            <table className="table">
              <tbody>
                {[
                  [L(['Otel', 'Hotel'], lang), hotel.name],
                  ['Slug', hotel.slug],
                  [L(['Durum', 'Status'], lang), hotel.status],
                  ['PMS', pms],
                  ['MikroTik IP', mikrotik],
                  [L(['Çıkış IP', 'Exit IP'], lang), hotel.exitIp ?? '—'],
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
              <div className="card__title">{L(['Modüller', 'Modules'], lang)}</div>
              <div className="card__sub">{L(['Yakında açılacak', 'Coming soon'], lang)}</div>
            </div>
          </div>
          <div className="card__body">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9 }}>
              {['Analitik', 'Misafir Portalı', 'PMS', 'Radius', 'Mikrotik', 'Anketler', 'Etkinlikler', 'Spa', 'Restoran'].map((m) => (
                <span key={m} className="chip">
                  {m}
                </span>
              ))}
            </div>
            <p style={{ marginTop: 16, fontSize: 'var(--text-sm)', color: 'var(--text-3)' }}>
              {L(['Bu modüller Faz 2 ve sonrasında bu panele eklenecek.', 'These modules will be added in Phase 2 and beyond.'], lang)}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
