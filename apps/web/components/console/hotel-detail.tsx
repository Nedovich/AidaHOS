import Link from 'next/link';
import { Building2, Database, ExternalLink, Globe, MapPin, Pencil, Router, Shield, Sparkles, Wifi } from 'lucide-react';
import {
  getNas,
  getNasSessionStats,
  isRadiusConfigured,
  listRadiusUsers,
  nasShortname,
  type NasSessionStats,
  type RadiusUserSummary,
} from '@aidahos/db';
import { ConnectionsTable } from '@/components/console/connections-table';
import { L, type Lang } from '@/lib/i18n';
import { initials } from '@/lib/avatar';
import { HotelForm } from '@/components/console/hotel-form';

const STATUS: Record<string, [string, readonly [string, string]]> = {
  active: ['ok', ['Aktif', 'Active']],
  trial: ['info', ['Deneme', 'Trial']],
  suspended: ['warn', ['Askıda', 'Suspended']],
  archived: ['mute', ['Arşiv', 'Archived']],
};
const PMS_LABEL: Record<string, string> = {
  none: '—', mssql_generic: 'MSSQL', opera: 'Opera Cloud', protel: 'Protel', sis: 'SIS', elektraweb: 'Elektraweb',
};

function StatRow({ k, v, mono }: { k: string; v: React.ReactNode; mono?: boolean }) {
  return (
    <div className="stat-row">
      <span className="stat-row__k">{k}</span>
      <span className={`stat-row__v${mono ? ' mono' : ''}`}>{v}</span>
    </div>
  );
}
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
function Integ({ icon, name, sub, tone }: { icon: React.ReactNode; name: string; sub: string; tone: string }) {
  const map: Record<string, [string, string]> = {
    ok: ['ok', 'Aktif'], warn: ['warn', 'Kurulum'], err: ['err', 'Çevrimdışı'], mute: ['mute', '—'],
  };
  const [cls, label] = map[tone] ?? ['mute', '—'];
  return (
    <div className="integ">
      <div className="integ__ico">{icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="integ__name">{name}</div>
        <div className="cell-sub">{sub}</div>
      </div>
      <span className={`badge badge--${cls}`}><span className="ico-dot" />{label}</span>
    </div>
  );
}

type HotelLike = {
  id: string;
  name: string;
  slug: string;
  status: string;
  region: string | null;
  rooms: number;
  guestsOnline: number;
  color: string;
  pmsType: string;
  hotelGroupId: string;
  mikrotikIp: string | null;
  exitIp: string | null;
  nasSecret: string | null;
};

/**
 * Shared hotel detail surface. Identical for super-admin and group-admin —
 * only the link targets (`basePath`), the account link, and the edit action differ.
 */
export async function HotelDetailView({
  hotel,
  group,
  lang,
  tab,
  basePath,
  groups,
  editAction,
  groupHref,
  crumbHref,
  crumbLabel,
}: {
  hotel: HotelLike;
  group: { id: string; name: string } | null;
  lang: Lang;
  tab: string;
  basePath: string;
  groups: { id: string; name: string }[];
  editAction: (fd: FormData) => void;
  groupHref: string | null;
  crumbHref: string;
  crumbLabel: readonly [string, string];
}) {
  const st = STATUS[hotel.status] ?? ['mute', [hotel.status, hotel.status]];
  const pms = PMS_LABEL[hotel.pmsType] ?? hotel.pmsType;
  const hasMt = Boolean(hotel.mikrotikIp);

  let nas: Awaited<ReturnType<typeof getNas>> = null;
  try {
    if (isRadiusConfigured()) nas = await getNas(nasShortname(hotel.slug));
  } catch {
    nas = null;
  }
  const online = hotel.status === 'active';
  const itone = online ? 'ok' : hotel.status === 'trial' ? 'warn' : 'err';
  const occ = hotel.rooms ? Math.min(98, Math.round((hotel.guestsOnline / hotel.rooms) * 100)) : 0;
  const bars = online ? [62, 68, 71, 74, 80, 86, 91, 88, 84, 90, 93, Math.max(20, occ)] : Array(12).fill(4);

  const TABS: [string, readonly [string, string]][] = [
    ['overview', ['Genel Bakış', 'Overview']],
    ['network', ['Ağ & Cihazlar', 'Network & Devices']],
    ['connections', ['Bağlantılar', 'Connections']],
    ['edit', ['Düzenle', 'Edit']],
  ];

  let radiusUsers: RadiusUserSummary[] = [];
  if (tab === 'connections') {
    try {
      if (isRadiusConfigured()) radiusUsers = await listRadiusUsers();
    } catch {
      radiusUsers = [];
    }
  }

  let netStats: NasSessionStats = { active: 0, total: 0, users: 0 };
  const nasIp = hotel.exitIp ?? hotel.mikrotikIp;
  if (tab === 'network' && nasIp) {
    try {
      if (isRadiusConfigured()) netStats = await getNasSessionStats(nasIp);
    } catch {
      netStats = { active: 0, total: 0, users: 0 };
    }
  }
  const provisioned = Boolean(nas);

  return (
    <>
      <div className="header__crumb" style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 7 }}>
        <Link href={crumbHref} className="row-link" style={{ color: 'var(--text-3)' }}>{L(crumbLabel, lang)}</Link>
        <span>›</span>
        <span style={{ color: 'var(--text)' }}>{hotel.name}</span>
      </div>

      <div className="acct-detail-head">
        <div className="acct-detail-head__logo" style={{ background: `linear-gradient(135deg, ${hotel.color}, ${hotel.color}aa)` }}>
          {initials(hotel.name)}
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <h1 className="page-hero__h" style={{ fontSize: 'var(--text-2xl)' }}>{hotel.name}</h1>
            <span className={`badge badge--${st[0]}`}><span className="ico-dot" />{L(st[1], lang)}</span>
          </div>
          <div className="cell-sub" style={{ marginTop: 5, display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
            <MapPin size={14} /> {hotel.region ?? hotel.slug} · {hotel.rooms} {L(['oda', 'rooms'], lang)}
            {group && (
              <>
                {' · '}
                {groupHref ? (
                  <Link href={groupHref} className="row-link" style={{ color: 'var(--accent)' }}>{group.name}</Link>
                ) : (
                  <span style={{ color: 'var(--accent)' }}>{group.name}</span>
                )}
              </>
            )}
          </div>
        </div>
        <div className="page-hero__actions">
          <Link className="btn btn--ghost" href={crumbHref}><ExternalLink size={16} /> {L(['Portalı gör', 'View portal'], lang)}</Link>
          <Link className="btn btn--primary" href={`${basePath}/${hotel.id}?tab=edit`}><Pencil size={16} /> {L(['Düzenle', 'Edit'], lang)}</Link>
        </div>
      </div>

      <div className="tabbar">
        {TABS.map(([t, label]) => (
          <Link key={t} href={`${basePath}/${hotel.id}?tab=${t}`} className={`tab${t === tab ? ' active' : ''}`}>{L(label, lang)}</Link>
        ))}
      </div>

      {tab === 'edit' ? (
        <HotelForm
          mode="edit"
          embedded
          lang={lang}
          action={editAction}
          groups={groups}
          defaults={{ name: hotel.name, status: hotel.status, hotelGroupId: hotel.hotelGroupId, mikrotikIp: hotel.mikrotikIp, exitIp: hotel.exitIp, nasSecret: hotel.nasSecret }}
        />
      ) : tab === 'connections' ? (
        <ConnectionsTable users={radiusUsers} hotelId={hotel.id} lang={lang} basePath={basePath} />
      ) : tab === 'network' ? (
        <>
          <div className="grid grid--2" style={{ marginBottom: 'var(--sp-5)' }}>
            <div className="card">
              <div className="card__head"><div className="card__title">{L(['RADIUS realm', 'RADIUS realm'], lang)}</div></div>
              <div className="card__body" style={{ paddingTop: 6 }}>
                {hasMt ? (
                  <>
                    <StatRow k="NAS shortname" v={nas?.shortname ?? `mt-${hotel.slug}`} mono />
                    <StatRow k={L(['Çıkış IP', 'Exit IP'], lang)} v={hotel.exitIp ?? '—'} mono />
                    <StatRow
                      k={L(['Durum', 'Status'], lang)}
                      v={
                        <span className={`badge badge--${provisioned ? 'ok' : 'warn'}`}>
                          <span className="ico-dot" />
                          {provisioned ? L(['Hazır', 'Provisioned'], lang) : L(['Beklemede', 'Pending'], lang)}
                        </span>
                      }
                    />
                    <StatRow k={L(['Aktif oturum', 'Active sessions'], lang)} v={String(netStats.active)} />
                  </>
                ) : (
                  <div className="empty"><div style={{ color: 'var(--text-3)' }}>{L(['Bu otele atanmış RADIUS realm yok.', 'No RADIUS realm assigned to this hotel.'], lang)}</div></div>
                )}
              </div>
            </div>
            <div className="card">
              <div className="card__head"><div className="card__title">{L(['Ağ özeti', 'Network summary'], lang)}</div></div>
              <div className="card__body" style={{ paddingTop: 6 }}>
                <StatRow k={L(['MikroTik cihaz', 'MikroTik devices'], lang)} v={hasMt ? 1 : 0} />
                <StatRow k={L(['Ağ geçidi', 'Gateways'], lang)} v={provisioned ? 1 : 0} />
                <StatRow k={L(['Aktif oturum', 'Active sessions'], lang)} v={netStats.active} />
                <StatRow k={L(['Bağlı istemci', 'Connected clients'], lang)} v={netStats.active} />
                <StatRow k={L(['Toplam oturum', 'Total sessions'], lang)} v={netStats.total} />
              </div>
            </div>
          </div>
          <div className="card">
            <div className="card__head">
              <div>
                <div className="card__title">{L(['MikroTik cihazları', 'MikroTik devices'], lang)}</div>
                <div className="card__sub">{hasMt ? 1 : 0} {L(['cihaz', 'devices'], lang)}</div>
              </div>
            </div>
            <div className="card__body" style={{ paddingTop: 6, overflowX: 'auto' }}>
              {hasMt ? (
                <table className="table acct-table">
                  <thead>
                    <tr><th>{L(['Cihaz', 'Device'], lang)}</th><th>{L(['Rol', 'Role'], lang)}</th><th>IP</th><th>{L(['Durum', 'Status'], lang)}</th><th>{L(['İstemci', 'Clients'], lang)}</th></tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <div className="table__name">
                          <div className="table__logo" style={{ background: 'var(--purple-soft)', color: 'var(--purple)', borderColor: 'transparent' }}>
                            <Router size={16} />
                          </div>
                          <div style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{hotel.slug}-gw</div>
                        </div>
                      </td>
                      <td><span className="plan-tag"><span className="plan-dot" style={{ background: 'var(--purple)' }} />{L(['Ağ geçidi', 'Gateway'], lang)}</span></td>
                      <td className="mono">{hotel.mikrotikIp}</td>
                      <td>
                        <span className={`badge badge--${provisioned ? 'ok' : 'warn'}`}>
                          <span className="ico-dot" />
                          {provisioned ? L(['Hazır', 'Provisioned'], lang) : L(['Beklemede', 'Pending'], lang)}
                        </span>
                      </td>
                      <td style={{ fontVariantNumeric: 'tabular-nums' }}>{netStats.active}</td>
                    </tr>
                  </tbody>
                </table>
              ) : (
                <div className="empty"><div style={{ color: 'var(--text-3)' }}>{L(['Bu otelde cihaz yok. Düzenle’den MikroTik IP girin.', 'No devices. Add a MikroTik IP from Edit.'], lang)}</div></div>
              )}
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="grid grid--kpi" style={{ gridTemplateColumns: 'repeat(4,1fr)', marginBottom: 'var(--sp-5)' }}>
            <Kpi icon={<Building2 size={18} />} label={L(['Oda', 'Rooms'], lang)} value={hotel.rooms || '—'} />
            <Kpi icon={<Wifi size={18} />} label={L(['Misafir çevrimiçi', 'Guests online'], lang)} value={hotel.guestsOnline || '—'} iconBg="var(--accent-soft)" iconColor="var(--accent)" />
            <Kpi icon={<Router size={18} />} label={L(['MikroTik cihaz', 'MikroTik devices'], lang)} value={hasMt ? 1 : '—'} />
            <Kpi icon={<Database size={18} />} label="PMS" value={pms} />
          </div>

          <div className="grid grid--2">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-5)' }}>
              <div className="card">
                <div className="card__head"><div className="card__title">{L(['Tesis bilgileri', 'Property details'], lang)}</div></div>
                <div className="card__body" style={{ paddingTop: 6 }}>
                  <StatRow k={L(['Hesap', 'Account'], lang)} v={group?.name ?? '—'} />
                  <StatRow k={L(['Bölge', 'Region'], lang)} v={hotel.region ?? '—'} />
                  <StatRow k={L(['Oda sayısı', 'Total rooms'], lang)} v={hotel.rooms} />
                  <StatRow k={L(['Wi-Fi doluluk', 'Wi-Fi occupancy'], lang)} v={occ ? occ + '%' : '—'} />
                  <StatRow k={L(['PMS entegrasyonu', 'PMS integration'], lang)} v={hotel.pmsType === 'none' ? L(['Yok', 'None'], lang) : pms} />
                  <StatRow k={L(['Otel ID', 'Hotel ID'], lang)} v={`htl_${hotel.slug}`} mono />
                </div>
              </div>
              <div className="card">
                <div className="card__head">
                  <div>
                    <div className="card__title">{L(['30 günlük Wi-Fi trafiği', '30-day Wi-Fi traffic'], lang)}</div>
                    <div className="card__sub">{L(['Bağlı misafir / saat', 'Connected guests / hr'], lang)}</div>
                  </div>
                </div>
                <div className="card__body" style={{ paddingTop: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 120 }}>
                    {bars.map((b, i) => (
                      <div key={i} style={{ flex: 1, height: `${b}%`, background: 'var(--accent-soft)', borderTop: '2px solid var(--accent)', borderRadius: '4px 4px 0 0' }} />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card__head">
                <div>
                  <div className="card__title">{L(['Entegrasyon durumu', 'Integration status'], lang)}</div>
                  <div className="card__sub">{L(['Bağlı sistemler', 'Connected systems'], lang)}</div>
                </div>
              </div>
              <div className="card__body" style={{ paddingTop: 8, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <Integ icon={<Database size={18} />} name={hotel.pmsType === 'none' ? L(['PMS — bağlı değil', 'PMS — not connected'], lang) : pms + ' PMS'} sub={hotel.pmsType === 'none' ? L(['Senkron bekliyor', 'Awaiting sync'], lang) : L(['Son senkron · 4 dk önce', 'Last sync · 4 min ago'], lang)} tone={hotel.pmsType === 'none' ? 'mute' : itone} />
                <Integ icon={<Router size={18} />} name="MikroTik CHR" sub={hasMt ? `${hotel.mikrotikIp}` : L(['Ağ geçidi atanmadı', 'No gateway'], lang)} tone={hasMt ? itone : 'mute'} />
                <Integ
                  icon={<Shield size={18} />}
                  name="FreeRADIUS"
                  sub={
                    nas
                      ? `nas: ${nas.shortname} · ${nas.nasname}`
                      : hasMt
                        ? L(['Provisioning bekliyor', 'Awaiting provisioning'], lang)
                        : L(['Realm atanmadı', 'No realm'], lang)
                  }
                  tone={nas ? 'ok' : hasMt ? 'warn' : 'mute'}
                />
                <Integ icon={<Sparkles size={18} />} name="AIDA AI Concierge" sub={L(['GPT-4o · misafir asistanı', 'GPT-4o · guest assistant'], lang)} tone={online ? 'ok' : 'mute'} />
                <Integ icon={<Globe size={18} />} name={`${hotel.slug}.aida.cloud`} sub={L(['SSL aktif · özel domain', 'SSL active · custom domain'], lang)} tone={online ? 'ok' : 'mute'} />
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
