'use client';

import { useMemo, useState } from 'react';
import { Clock3, Search, UserRound, Wifi } from 'lucide-react';
import { Kpi } from '@/components/console/charts';
import { L, type Lang } from '@/lib/i18n';
import { RadiusSubnav } from './radius-subnav';

type AuthType = 'accept' | 'reject' | 'challenge';

export interface SerializedAuthLog {
  id: string;
  username: string;
  reply: string;
  nasName: string | null;
  authDateIso: string | null;
}

const TYPE_LABEL: Record<AuthType, string> = {
  accept: 'Access-Accept',
  reject: 'Access-Reject',
  challenge: 'Access-Challenge',
};

function replyToType(reply: string): AuthType {
  if (reply === 'Access-Accept') return 'accept';
  if (reply === 'Access-Challenge') return 'challenge';
  return 'reject';
}

function formatRelativeTime(isoString: string | null, lang: Lang): string {
  if (!isoString) return '—';
  const diff = Date.now() - new Date(isoString).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 10) return L(['şimdi', 'now'], lang);
  if (seconds < 60) return lang === 'tr' ? `${seconds}sn` : `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return lang === 'tr' ? `${minutes}dk` : `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  return lang === 'tr' ? `${hours}sa` : `${hours}h`;
}

function formatAvgSession(seconds: number, lang: Lang): string {
  if (seconds <= 0) return '—';
  const minutes = Math.round(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (hours > 0) return lang === 'tr' ? `${hours}sa ${remainder}dk` : `${hours}h ${remainder}m`;
  return lang === 'tr' ? `${minutes}dk` : `${minutes}m`;
}

export function AuthLogsClient({
  hotelId,
  lang,
  logs,
  dailyTotal,
  dailyAccept,
  dailyReject,
  activeDevices,
  avgSessionSeconds,
  error,
}: {
  hotelId: string;
  lang: Lang;
  logs: SerializedAuthLog[];
  dailyTotal: number;
  dailyAccept: number;
  dailyReject: number;
  activeDevices: number;
  avgSessionSeconds: number;
  error: string | null;
}) {
  const [filter, setFilter] = useState<'all' | AuthType>('all');
  const [search, setSearch] = useState('');

  const counts = useMemo(() => ({
    all: logs.length,
    accept: logs.filter((log) => replyToType(log.reply) === 'accept').length,
    reject: logs.filter((log) => replyToType(log.reply) === 'reject').length,
    challenge: logs.filter((log) => replyToType(log.reply) === 'challenge').length,
  }), [logs]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return logs.filter((log) => {
      const type = replyToType(log.reply);
      if (filter !== 'all' && type !== filter) return false;
      if (!query) return true;
      return [log.username, log.nasName ?? '', log.reply]
        .some((value) => value.toLowerCase().includes(query));
    });
  }, [filter, search, logs]);

  return (
    <div className="radius-page radius-auth-page">
      <div className="page-hero radius-hero">
        <div>
          <h1 className="page-hero__h">FreeRADIUS</h1>
          <p className="page-hero__sub">
            {L(['Kimlik doğrulama, oturumlar ve cihaz yönetimi.', 'Authentication, sessions and device management.'], lang)}
          </p>
        </div>
        <span className="live radius-live">
          {L(['Canlı', 'Live'], lang)}
          <span className="live__pulse" />
        </span>
      </div>

      <RadiusSubnav hotelId={hotelId} active="auth-logs" lang={lang} />

      {error ? (
        <div className="radius-error">{error}</div>
      ) : null}

      <div className="grid grid--kpi radius-kpis">
        <Kpi
          icon={<UserRound />}
          label={L(['Günlük Girişler', 'Daily Logins'], lang)}
          value={dailyTotal.toLocaleString('tr')}
        />
        <Kpi
          icon={<Wifi />}
          label={L(['Aktif Cihazlar', 'Active Devices'], lang)}
          value={activeDevices.toLocaleString('tr')}
          live
        />
        <Kpi
          icon={<Clock3 />}
          label={L(['Ort. Oturum', 'Avg Session'], lang)}
          value={formatAvgSession(avgSessionSeconds, lang)}
        />
      </div>

      <div className="radius-auth-toolbar">
        <div className="radius-chips" role="group" aria-label={L(['Kimlik sonucu filtresi', 'Authentication result filter'], lang)}>
          {([
            ['all', L(['Tümü', 'All'], lang), counts.all],
            ['accept', 'Access-Accept', counts.accept],
            ['reject', 'Access-Reject', counts.reject],
            ['challenge', 'Access-Challenge', counts.challenge],
          ] as const).map(([value, label, count]) => (
            <button
              type="button"
              className={`radius-chip${filter === value ? ' active' : ''}`}
              onClick={() => setFilter(value)}
              key={value}
            >
              {label} <span>{count}</span>
            </button>
          ))}
        </div>

        <label className="searchmini radius-search">
          <Search size={15} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={L(['Kullanıcı veya NAS ara…', 'Search user or NAS…'], lang)}
          />
        </label>
      </div>

      <section className="card radius-auth-card">
        <div className="card__head">
          <div>
            <h2 className="card__title">{L(['Kimlik Logları', 'Auth Logs'], lang)}</h2>
            <p className="card__sub">{filtered.length} {L(['kayıt', 'records'], lang)}</p>
          </div>
          <span className="live">{L(['canlı', 'live'], lang)}<span className="live__pulse" /></span>
        </div>

        <div className="card__body radius-auth-table-body">
          {logs.length === 0 && !error ? (
            <p className="radius-empty-state">{L(['Henüz kimlik doğrulama kaydı yok.', 'No authentication logs yet.'], lang)}</p>
          ) : (
            <div className="radius-table-wrap">
              <table className="table radius-auth-table">
                <thead>
                  <tr>
                    <th>{L(['Zaman', 'Time'], lang)}</th>
                    <th>{L(['Tür', 'Type'], lang)}</th>
                    <th>{L(['Kullanıcı', 'User'], lang)}</th>
                    <th>NAS</th>
                    <th>{L(['Sebep', 'Reason'], lang)}</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length ? filtered.map((log) => {
                    const type = replyToType(log.reply);
                    return (
                      <tr key={log.id}>
                        <td className="mono radius-auth-time">{formatRelativeTime(log.authDateIso, lang)}</td>
                        <td>
                          <span className={`radius-auth-badge ${type}`}>
                            <span />
                            {TYPE_LABEL[type]}
                          </span>
                        </td>
                        <td className="mono radius-table__user">{log.username}</td>
                        <td className="mono radius-table__muted">{log.nasName ?? '—'}</td>
                        <td>{log.reply}</td>
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td className="radius-empty" colSpan={5}>
                        {L(['Eşleşen kimlik kaydı bulunamadı.', 'No matching authentication logs found.'], lang)}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
