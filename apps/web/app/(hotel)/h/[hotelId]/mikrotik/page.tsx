import { AlertTriangle, CheckCircle2, Router } from 'lucide-react';
import { getHotelById } from '@aidahos/db';
import { L } from '@/lib/i18n';
import { getLang } from '@/lib/i18n-server';
import { mikrotikClientFromHotel } from '@/lib/mikrotik';
import { ProfilesClient } from './profiles-client';

export default async function MikroTikPage({
  params,
}: {
  params: Promise<{ hotelId: string }>;
}) {
  const { hotelId } = await params;
  const lang = await getLang();
  const hotel = await getHotelById(hotelId);

  // Check if MikroTik is configured
  const isConfigured =
    !!hotel?.mikrotikIp && !!hotel?.mikrotikApiUser && !!hotel?.mikrotikApiPassword;

  let profiles: Awaited<ReturnType<ReturnType<typeof mikrotikClientFromHotel>['listHotspotProfiles']>> = [];
  let connectError: string | null = null;

  if (isConfigured && hotel) {
    try {
      const client = mikrotikClientFromHotel(hotel);
      profiles = await client.listHotspotProfiles();
    } catch (e) {
      connectError = e instanceof Error ? e.message : String(e);
      console.error('[MikroTik] connection failed:', connectError, 'host:', hotel.mikrotikIp, 'port:', hotel.mikrotikApiPort, 'user:', hotel.mikrotikApiUser);
    }
  }

  return (
    <div className="fade-in" style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <Router size={22} style={{ color: 'var(--accent)' }} />
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>
            {L(['MikroTik Yönetimi', 'MikroTik Management'], lang)}
          </h1>
        </div>
        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 14 }}>
          {L(
            ['Hotspot kullanıcı profillerini yönetin ve bağlantı durumunu izleyin.', 'Manage hotspot user profiles and monitor connection status.'],
            lang,
          )}
        </p>
      </div>

      {/* Connection status card */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px' }}>
        {!isConfigured ? (
          <>
            <AlertTriangle size={18} style={{ color: 'var(--warn, #f59e0b)', flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>
                {L(['API bilgileri eksik', 'API credentials missing'], lang)}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
                {L(
                  ['Otelin MikroTik IP, kullanıcı adı ve şifresini Otel Ayarları sayfasından girin.', 'Enter the hotel\'s MikroTik IP, username and password in Hotel Settings.'],
                  lang,
                )}
              </div>
            </div>
            <a href={`/h/${hotelId}/hotels`} className="btn btn--ghost btn--sm" style={{ marginLeft: 'auto', flexShrink: 0 }}>
              {L(['Ayarlara Git', 'Go to Settings'], lang)}
            </a>
          </>
        ) : connectError ? (
          <>
            <AlertTriangle size={18} style={{ color: 'var(--err)', flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>
                {L(['Bağlantı hatası', 'Connection error'], lang)}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{connectError}</div>
            </div>
          </>
        ) : (
          <>
            <CheckCircle2 size={18} style={{ color: 'var(--success, #22c55e)', flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>
                {L(['Bağlı', 'Connected'], lang)}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
                {hotel?.mikrotikIp}:{hotel?.mikrotikApiPort ?? 80}
              </div>
            </div>
            <span style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--text-muted)' }}>
              {profiles.length} {L(['profil', 'profiles'], lang)}
            </span>
          </>
        )}
      </div>

      {/* Profiles table */}
      {isConfigured && !connectError && (
        <ProfilesClient hotelId={hotelId} initial={profiles} />
      )}
    </div>
  );
}
