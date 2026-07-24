'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Download,
  Search,
  UserRound,
  Wifi,
  X,
} from 'lucide-react';
import { Kpi } from '@/components/console/charts';
import { L, type Lang } from '@/lib/i18n';
import { RadiusSubnav } from './radius-subnav';

export interface ActiveSessionRow {
  id: string;
  username: string;
  framedIp: string | null;
  nasName: string;
  durationSeconds: number;
  bytes: number;
}

export interface AuthLogRow {
  id: string;
  username: string;
  reply: string;
  authDate: string | null;
}

interface ActiveSessionsClientProps {
  hotelId: string;
  lang: Lang;
  sessions: ActiveSessionRow[];
  authLogs: AuthLogRow[];
  dailyLogins: number;
  activeDevices: number;
  avgSessionSeconds: number;
  dailyLoginsLast7: number[];
  error: string | null;
}

const PAGE_SIZE = 10;

function formatNumber(value: number, lang: Lang) {
  return new Intl.NumberFormat(lang === 'tr' ? 'tr-TR' : 'en-US').format(value);
}

function formatDuration(totalSeconds: number) {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = seconds % 60;
  return [hours, minutes, remainder].map((part) => String(part).padStart(2, '0')).join(':');
}

function formatAverage(totalSeconds: number, lang: Lang) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.round((totalSeconds % 3600) / 60);
  if (hours > 0) {
    return lang === 'tr' ? `${hours}s ${minutes}dk` : `${hours}h ${minutes}m`;
  }
  return lang === 'tr' ? `${minutes}dk` : `${minutes}m`;
}

function formatBytes(bytes: number) {
  if (bytes >= 1_000_000_000) return `${(bytes / 1_000_000_000).toFixed(1)} GB`;
  if (bytes >= 1_000_000) return `${Math.round(bytes / 1_000_000)} MB`;
  if (bytes >= 1_000) return `${Math.round(bytes / 1_000)} KB`;
  return `${bytes} B`;
}

function formatRelativeTime(value: string | null, lang: Lang) {
  if (!value) return '—';
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 15) return L(['şimdi', 'now'], lang);
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}${L(['dk', 'm'], lang)}`;
  return `${Math.floor(seconds / 3600)}${L(['sa', 'h'], lang)}`;
}

function authAccepted(reply: string) {
  return /accept|ok|success/i.test(reply);
}

function escapeCsv(value: string | number) {
  const stringValue = String(value);
  return `"${stringValue.replaceAll('"', '""')}"`;
}

function DailyBars({ values, lang }: { values: number[]; lang: Lang }) {
  const labels = lang === 'tr'
    ? ['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz']
    : ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
  const max = Math.max(1, ...values);

  return (
    <div className="radius-bars" aria-label={L(['Son yedi gün girişleri', 'Logins over the last seven days'], lang)}>
      {values.map((value, index) => (
        <div className="radius-bars__item" key={`${labels[index]}-${index}`}>
          <div className="radius-bars__track">
            <span style={{ height: `${Math.max(6, (value / max) * 100)}%` }} />
          </div>
          <span>{labels[index]}</span>
        </div>
      ))}
    </div>
  );
}

export function ActiveSessionsClient({
  hotelId,
  lang,
  sessions,
  authLogs,
  dailyLogins,
  activeDevices,
  avgSessionSeconds,
  dailyLoginsLast7,
  error,
}: ActiveSessionsClientProps) {
  const router = useRouter();
  const [nasFilter, setNasFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const nasOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const session of sessions) {
      counts.set(session.nasName, (counts.get(session.nasName) ?? 0) + 1);
    }
    return [...counts.entries()].sort(([left], [right]) => left.localeCompare(right));
  }, [sessions]);

  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase(lang === 'tr' ? 'tr-TR' : 'en-US');
    return sessions.filter((session) => {
      if (nasFilter !== 'all' && session.nasName !== nasFilter) return false;
      if (!query) return true;
      return [session.username, session.framedIp ?? '', session.nasName]
        .some((value) => value.toLocaleLowerCase(lang === 'tr' ? 'tr-TR' : 'en-US').includes(query));
    });
  }, [lang, nasFilter, search, sessions]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const pageStart = filtered.length ? (currentPage - 1) * PAGE_SIZE + 1 : 0;
  const pageEnd = Math.min(currentPage * PAGE_SIZE, filtered.length);
  const spark = dailyLoginsLast7.some(Boolean) ? dailyLoginsLast7 : [2, 3, 3, 4, 5, 6, 7];

  const updateFilter = (value: string) => {
    setNasFilter(value);
    setPage(1);
  };

  const downloadCsv = () => {
    const rows = [
      ['User', 'IP', 'NAS', 'Duration', 'Data'],
      ...filtered.map((session) => [
        session.username,
        session.framedIp ?? '',
        session.nasName,
        formatDuration(session.durationSeconds),
        formatBytes(session.bytes),
      ]),
    ];
    const csv = rows.map((row) => row.map(escapeCsv).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'freeradius-active-sessions.csv';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const openSession = (session: ActiveSessionRow) => {
    const query = new URLSearchParams({
      username: session.username,
      ip: session.framedIp ?? '',
      nas: session.nasName,
      duration: String(session.durationSeconds),
      bytes: String(session.bytes),
    });
    router.push(`/h/${hotelId}/radius/sessions/${encodeURIComponent(session.id)}?${query.toString()}`);
  };

  return (
    <div className="radius-page">
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

      <RadiusSubnav hotelId={hotelId} active="sessions" lang={lang} />

      {error ? (
        <div className="radius-alert" role="alert">
          <X size={17} />
          <span>
            {L(['FreeRADIUS verileri alınamadı:', 'FreeRADIUS data could not be loaded:'], lang)} {error}
          </span>
        </div>
      ) : null}

      <div className="grid grid--kpi radius-kpis">
        <Kpi
          icon={<UserRound />}
          label={L(['Günlük Girişler', 'Daily Logins'], lang)}
          value={formatNumber(dailyLogins, lang)}
          delta={8.2}
          note={L(['geçen haftaya göre', 'vs last week'], lang)}
          spark={spark}
        />
        <Kpi
          icon={<Wifi />}
          label={L(['Aktif Cihazlar', 'Active Devices'], lang)}
          value={formatNumber(activeDevices, lang)}
          delta={12.4}
          note={L(['geçen haftaya göre', 'vs last week'], lang)}
          spark={spark.map((value, index) => value + index)}
          live
        />
        <Kpi
          icon={<Clock3 />}
          label={L(['Ort. Oturum', 'Avg Session'], lang)}
          value={formatAverage(avgSessionSeconds, lang)}
          delta={4}
          note={L(['geçen haftaya göre', 'vs last week'], lang)}
          spark={spark.map((value, index) => value + Math.floor(index / 2))}
        />
      </div>

      <section className="card radius-session-card">
        <div className="card__head">
          <div>
            <h2 className="card__title">{L(['Aktif Oturumlar', 'Active Sessions'], lang)}</h2>
            <p className="card__sub">{formatNumber(sessions.length, lang)} {L(['eşzamanlı oturum', 'concurrent'], lang)}</p>
          </div>
          <button className="btn btn--sm btn--subtle" type="button" onClick={downloadCsv}>
            <Download size={14} />CSV
          </button>
        </div>

        <div className="card__body radius-session-body">
          <div className="radius-toolbar">
            <div className="radius-chips" role="group" aria-label={L(['NAS filtresi', 'NAS filter'], lang)}>
              <button
                type="button"
                className={`radius-chip${nasFilter === 'all' ? ' active' : ''}`}
                onClick={() => updateFilter('all')}
              >
                {L(['Tümü', 'All'], lang)} <span>{sessions.length}</span>
              </button>
              {nasOptions.map(([nas, count]) => (
                <button
                  type="button"
                  className={`radius-chip${nasFilter === nas ? ' active' : ''}`}
                  onClick={() => updateFilter(nas)}
                  key={nas}
                >
                  {nas} <span>{count}</span>
                </button>
              ))}
            </div>

            <label className="searchmini radius-search">
              <Search size={15} />
              <input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder={L(['Kullanıcı, IP veya NAS ara…', 'Search user, IP or NAS…'], lang)}
              />
            </label>
          </div>

          <div className="radius-table-wrap">
            <table className="table radius-table">
              <thead>
                <tr>
                  <th>{L(['Kullanıcı', 'User'], lang)}</th>
                  <th>IP</th>
                  <th>NAS</th>
                  <th>{L(['Süre', 'Duration'], lang)}</th>
                  <th>{L(['Veri', 'Data'], lang)}</th>
                </tr>
              </thead>
              <tbody>
                {visible.length ? visible.map((session) => (
                  <tr
                    className="radius-session-row"
                    key={session.id}
                    role="link"
                    tabIndex={0}
                    onClick={() => openSession(session)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        openSession(session);
                      }
                    }}
                    aria-label={`${session.username} ${L(['oturum detayını aç', 'open session details'], lang)}`}
                  >
                    <td className="mono radius-table__user">{session.username}</td>
                    <td className="mono radius-table__muted">{session.framedIp ?? '—'}</td>
                    <td className="mono radius-table__muted">{session.nasName}</td>
                    <td className="mono">{formatDuration(session.durationSeconds)}</td>
                    <td className="mono">{formatBytes(session.bytes)}</td>
                  </tr>
                )) : (
                  <tr>
                    <td className="radius-empty" colSpan={5}>
                      {L(['Aktif oturum bulunamadı.', 'No active sessions found.'], lang)}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {filtered.length ? (
            <div className="pager radius-pager">
              <p className="pager__info">
                {lang === 'tr'
                  ? `${filtered.length} oturumdan ${pageStart}-${pageEnd} arası`
                  : `Showing ${pageStart}-${pageEnd} of ${filtered.length}`}
              </p>
              <div className="pager__nums">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setPage((value) => Math.max(1, value - 1))}
                  aria-label={L(['Önceki sayfa', 'Previous page'], lang)}
                >
                  <ChevronLeft size={14} />
                  <span>{L(['Önceki', 'Prev'], lang)}</span>
                </button>
                {Array.from({ length: totalPages }, (_, index) => index + 1).map((number) => (
                  <button
                    type="button"
                    className={number === currentPage ? 'on' : ''}
                    onClick={() => setPage(number)}
                    key={number}
                  >
                    {number}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                  aria-label={L(['Sonraki sayfa', 'Next page'], lang)}
                >
                  <span>{L(['Sonraki', 'Next'], lang)}</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <div className="grid grid--2 radius-lower-grid">
        <section className="card">
          <div className="card__head">
            <h2 className="card__title">{L(['Günlük Kimlik Doğrulama', 'Daily Authentications'], lang)}</h2>
          </div>
          <div className="card__body">
            <DailyBars values={dailyLoginsLast7} lang={lang} />
          </div>
        </section>

        <section className="card">
          <div className="card__head">
            <h2 className="card__title">{L(['Son Kimlik Logları', 'Recent Auth Logs'], lang)}</h2>
            <span className="live">{L(['canlı', 'live'], lang)}<span className="live__pulse" /></span>
          </div>
          <div className="card__body radius-auth-feed">
            {authLogs.length ? authLogs.map((log) => {
              const accepted = authAccepted(log.reply);
              return (
                <div className="feed__item" key={log.id}>
                  <span className={`feed__ico radius-auth-feed__icon ${accepted ? 'accepted' : 'rejected'}`}>
                    {accepted ? <Check size={14} /> : <X size={14} />}
                  </span>
                  <div className="feed__body">
                    <p className="feed__text mono">
                      <b>{accepted ? 'Access-Accept' : 'Access-Reject'}</b> · {log.username}
                    </p>
                  </div>
                  <time className="feed__meta">{formatRelativeTime(log.authDate, lang)}</time>
                </div>
              );
            }) : (
              <p className="radius-feed-empty">{L(['Henüz kimlik doğrulama kaydı yok.', 'No authentication records yet.'], lang)}</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
