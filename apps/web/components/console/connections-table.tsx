import Link from 'next/link';
import { ChevronRight, UserRound } from 'lucide-react';
import type { RadiusUserSummary } from '@aidahos/db';
import { L, type Lang } from '@/lib/i18n';
import { fmtBytes, fmtDateTime } from '@/lib/format';

export function ConnectionsTable({
  users,
  hotelId,
  lang,
  basePath = '/hotels',
}: {
  users: RadiusUserSummary[];
  hotelId: string;
  lang: Lang;
  basePath?: string;
}) {
  return (
    <div className="card">
      <div className="card__head">
        <div>
          <div className="card__title">{L(['Bağlantılar', 'Connections'], lang)}</div>
          <div className="card__sub">{L(['Erişim verilmiş kullanıcılar (FreeRADIUS)', 'Access-granted users (FreeRADIUS)'], lang)}</div>
        </div>
      </div>
      <div className="card__body" style={{ paddingTop: 6, overflowX: 'auto' }}>
        <table className="table">
          <thead>
            <tr>
              <th>{L(['Kullanıcı', 'User'], lang)}</th>
              <th>{L(['Durum', 'Status'], lang)}</th>
              <th>{L(['Oturum', 'Sessions'], lang)}</th>
              <th>{L(['Veri', 'Data'], lang)}</th>
              <th>{L(['Son görülme', 'Last seen'], lang)}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.username} className="row-link">
                <td>
                  <Link href={`${basePath}/${hotelId}/connections/${encodeURIComponent(u.username)}`} className="table__name">
                    <div className="table__logo" style={{ background: 'var(--surface-3)', color: 'var(--text-2)' }}>
                      <UserRound size={15} />
                    </div>
                    <b className="mono">{u.username}</b>
                  </Link>
                </td>
                <td>
                  <span className={`badge badge--${u.online ? 'ok' : 'mute'}`}>
                    <span className="ico-dot" />
                    {u.online ? L(['Çevrimiçi', 'Online'], lang) : L(['Çevrimdışı', 'Offline'], lang)}
                  </span>
                </td>
                <td style={{ fontVariantNumeric: 'tabular-nums' }}>{u.sessions}</td>
                <td className="mono">{fmtBytes(u.bytes)}</td>
                <td className="cell-sub">{fmtDateTime(u.lastSeen)}</td>
                <td>
                  <div className="rowact">
                    <Link href={`${basePath}/${hotelId}/connections/${encodeURIComponent(u.username)}`} title={L(['Aç', 'Open'], lang)}>
                      <ChevronRight size={15} />
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={6} className="empty" style={{ color: 'var(--text-3)' }}>
                  {L(['Erişim verilmiş kullanıcı yok.', 'No access-granted users.'], lang)}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
