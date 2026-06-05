import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Activity, ArrowDownToLine, ArrowUpFromLine, ChevronLeft, Clock, UserRound, Wifi } from 'lucide-react';
import { getHotelById, getRadiusUser, listUserSessions } from '@aidahos/db';
import { getSession } from '@/lib/auth';
import { getLang } from '@/lib/i18n-server';
import { L } from '@/lib/i18n';
import { fmtBytes, fmtDateTime, fmtDuration } from '@/lib/format';

function Kpi({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="kpi">
      <div className="kpi__top">
        <div className="kpi__ico">{icon}</div>
        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-2)', fontWeight: 600 }}>{label}</span>
      </div>
      <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 600, letterSpacing: '-1px', fontVariantNumeric: 'tabular-nums' }}>{value}</div>
    </div>
  );
}

export default async function ConnectionDetail({
  params,
}: {
  params: Promise<{ id: string; username: string }>;
}) {
  const { id, username: raw } = await params;
  const username = decodeURIComponent(raw);
  const session = await getSession();
  if (!session) redirect('/login');
  if (session.user.role !== 'super_admin') redirect('/');

  const lang = await getLang();
  const hotel = await getHotelById(id);
  if (!hotel) redirect('/hotels');

  let user = null;
  let sessions: Awaited<ReturnType<typeof listUserSessions>> = [];
  try {
    [user, sessions] = await Promise.all([getRadiusUser(username), listUserSessions(username)]);
  } catch {
    /* RADIUS DB unavailable */
  }

  const totalIn = sessions.reduce((a, s) => a + s.inOctets, 0);
  const totalOut = sessions.reduce((a, s) => a + s.outOctets, 0);
  const online = sessions.some((s) => !s.stop);
  const lastSeen = sessions[0]?.start ?? null;
  const lastIp = sessions[0]?.framedIp ?? '—';

  return (
    <>
      <div className="header__crumb" style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 7 }}>
        <Link href="/hotels" className="row-link" style={{ color: 'var(--text-3)' }}>{L(['Oteller', 'Hotels'], lang)}</Link>
        <span>›</span>
        <Link href={`/hotels/${hotel.id}`} className="row-link" style={{ color: 'var(--text-3)' }}>{hotel.name}</Link>
        <span>›</span>
        <Link href={`/hotels/${hotel.id}?tab=connections`} className="row-link" style={{ color: 'var(--text-3)' }}>{L(['Bağlantılar', 'Connections'], lang)}</Link>
        <span>›</span>
        <span style={{ color: 'var(--text)' }}>{username}</span>
      </div>

      <div className="acct-detail-head">
        <div className="acct-detail-head__logo" style={{ background: 'linear-gradient(135deg, var(--text-3), var(--text-2))' }}>
          <UserRound size={26} />
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <h1 className="page-hero__h mono" style={{ fontSize: 'var(--text-2xl)' }}>{username}</h1>
            <span className={`badge badge--${online ? 'ok' : 'mute'}`}>
              <span className="ico-dot" />
              {online ? L(['Çevrimiçi', 'Online'], lang) : L(['Çevrimdışı', 'Offline'], lang)}
            </span>
          </div>
          <div className="cell-sub" style={{ marginTop: 5 }}>
            {user ? L(['RADIUS kullanıcısı', 'RADIUS user'], lang) : L(['Bu kullanıcı radcheck’te yok (yalnızca oturum kaydı).', 'Not in radcheck (sessions only).'], lang)}
            {' · '}{hotel.name}
          </div>
        </div>
        <Link className="btn btn--ghost btn--sm" href={`/hotels/${hotel.id}?tab=connections`}>
          <ChevronLeft size={15} /> {L(['Bağlantılar', 'Connections'], lang)}
        </Link>
      </div>

      <div className="grid grid--kpi" style={{ marginBottom: 'var(--sp-5)' }}>
        <Kpi icon={<Activity size={18} />} label={L(['Oturum', 'Sessions'], lang)} value={sessions.length} />
        <Kpi icon={<ArrowDownToLine size={18} />} label={L(['İndirilen', 'Download'], lang)} value={fmtBytes(totalOut)} />
        <Kpi icon={<ArrowUpFromLine size={18} />} label={L(['Yüklenen', 'Upload'], lang)} value={fmtBytes(totalIn)} />
        <Kpi icon={<Wifi size={18} />} label={L(['Son IP', 'Last IP'], lang)} value={lastIp} />
      </div>

      <div className="card">
        <div className="card__head">
          <div>
            <div className="card__title">{L(['Oturum geçmişi', 'Session history'], lang)}</div>
            <div className="card__sub">
              <Clock size={12} style={{ verticalAlign: '-2px' }} /> {L(['Son görülme', 'Last seen'], lang)}: {fmtDateTime(lastSeen)}
            </div>
          </div>
        </div>
        <div className="card__body" style={{ paddingTop: 6, overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>{L(['Başlangıç', 'Start'], lang)}</th>
                <th>{L(['Bitiş', 'Stop'], lang)}</th>
                <th>{L(['Süre', 'Duration'], lang)}</th>
                <th>MAC</th>
                <th>IP</th>
                <th>{L(['İndir', 'Down'], lang)}</th>
                <th>{L(['Yükle', 'Up'], lang)}</th>
                <th>{L(['Sebep', 'Cause'], lang)}</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s.id}>
                  <td className="mono">{fmtDateTime(s.start)}</td>
                  <td className="mono">
                    {s.stop ? (
                      fmtDateTime(s.stop)
                    ) : (
                      <span className="badge badge--ok"><span className="ico-dot" />{L(['Aktif', 'Active'], lang)}</span>
                    )}
                  </td>
                  <td>{fmtDuration(s.sessionTime)}</td>
                  <td className="mono cell-sub">{s.mac ?? '—'}</td>
                  <td className="mono cell-sub">{s.framedIp ?? '—'}</td>
                  <td className="mono">{fmtBytes(s.outOctets)}</td>
                  <td className="mono">{fmtBytes(s.inOctets)}</td>
                  <td className="cell-sub">{s.terminateCause ?? '—'}</td>
                </tr>
              ))}
              {sessions.length === 0 && (
                <tr>
                  <td colSpan={8} className="empty" style={{ color: 'var(--text-3)' }}>
                    {L(['Bu kullanıcı için oturum kaydı yok.', 'No session records for this user.'], lang)}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
