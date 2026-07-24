'use client';

import Link from 'next/link';
import {
  ChevronRight,
  Clock3,
  Download,
  Monitor,
  Power,
  RefreshCw,
  Search,
  Wifi,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { AreaChart, Kpi } from '@/components/console/charts';
import { L, type Lang } from '@/lib/i18n';

type HistoryStatus = 'active' | 'ended';

interface SessionDetail {
  id: string;
  username: string;
  ip: string;
  nas: string;
  durationSeconds: number;
  bytes: number;
}

export interface SerializedHistoryRow {
  id: string;
  mac: string;
  ip: string;
  startIso: string | null;
  stopIso: string | null;
  sessionSeconds: number | null;
  inBytes: number;
  outBytes: number;
  terminateCause: string | null;
}

interface HistoryRow {
  id: string;
  mac: string;
  ip: string;
  date: string;
  time: string;
  duration: string;
  data: string;
  status: HistoryStatus;
}

function formatBytes(bytes: number) {
  if (bytes >= 1_000_000_000) return `${(bytes / 1_000_000_000).toFixed(1)} GB`;
  if (bytes >= 1_000_000) return `${Math.max(1, Math.round(bytes / 1_000_000))} MB`;
  if (bytes >= 1_000) return `${Math.max(1, Math.round(bytes / 1_000))} KB`;
  return `${Math.max(0, bytes)} B`;
}

function formatDuration(seconds: number, lang: Lang) {
  if (seconds <= 0) return '—';
  const minutes = Math.round(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (hours > 0) return lang === 'tr' ? `${hours}sa ${remainder}dk` : `${hours}h ${remainder}m`;
  return lang === 'tr' ? `${minutes}dk` : `${minutes}m`;
}

function initials(username: string) {
  const base = username.split('@')[0] ?? username;
  const parts = base.split(/[._-]+/).filter(Boolean);
  if (parts.length > 1) return `${parts[0]?.[0] ?? ''}${parts[1]?.[0] ?? ''}`.toUpperCase();
  return base.slice(0, 2).toUpperCase();
}

function parseHistoryRows(raw: SerializedHistoryRow[], sessionId: string, currentIp: string, lang: Lang): HistoryRow[] {
  return raw.map((r) => {
    const isActive = r.stopIso === null;
    const startDate = r.startIso ? new Date(r.startIso) : null;
    const date = startDate
      ? startDate.toLocaleDateString('sv') // YYYY-MM-DD
      : '—';
    const time = startDate
      ? startDate.toLocaleTimeString('tr', { hour: '2-digit', minute: '2-digit', hour12: false })
      : '—';
    const totalBytes = r.inBytes + r.outBytes;
    const inMb = Math.max(0, Math.round(r.inBytes / 1_000_000));
    const outMb = Math.max(0, Math.round(r.outBytes / 1_000_000));
    return {
      id: r.id,
      mac: r.mac,
      ip: r.ip,
      date,
      time,
      duration: isActive
        ? L(['devam ediyor', 'ongoing'], lang)
        : r.sessionSeconds != null
          ? formatDuration(r.sessionSeconds, lang)
          : '—',
      data: totalBytes > 0 ? `${inMb}/${outMb} MB` : '—',
      status: (r.id === sessionId || isActive) ? 'active' : 'ended',
    };
  });
}

export function SessionDetailClient({
  hotelId,
  lang,
  session,
  history: rawHistory,
  dailyBytesLast7,
  lastLoginIso,
  activeDevices,
}: {
  hotelId: string;
  lang: Lang;
  session: SessionDetail;
  history: SerializedHistoryRow[];
  dailyBytesLast7: number[] | null;
  lastLoginIso: string | null;
  activeDevices: number | null;
}) {
  const [status, setStatus] = useState<HistoryStatus>('active');
  const [filter, setFilter] = useState<'all' | HistoryStatus>('all');
  const [query, setQuery] = useState('');
  const [notice, setNotice] = useState('');

  const history = parseHistoryRows(rawHistory, session.id, session.ip, lang);

  const effectiveHistory = history.map((row) =>
    row.id === session.id ? { ...row, status } : row,
  );

  const counts = {
    all: effectiveHistory.length,
    active: effectiveHistory.filter((row) => row.status === 'active').length,
    ended: effectiveHistory.filter((row) => row.status === 'ended').length,
  };
  const normalizedQuery = query.trim().toLowerCase();
  const filteredHistory = effectiveHistory.filter((row) => {
    if (filter !== 'all' && row.status !== filter) return false;
    if (!normalizedQuery) return true;
    return `${row.mac} ${row.ip} ${row.date} ${row.time}`.toLowerCase().includes(normalizedQuery);
  });

  const labels = lang === 'tr'
    ? ['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz']
    : ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

  const chartByteValues = dailyBytesLast7 ?? [0, 0, 0, 0, 0, 0, session.bytes];
  const chartMbValues = chartByteValues.map((b) => Math.max(0, Math.round(b / 1_000_000)));
  const chartMax = Math.max(10, ...chartMbValues);

  const lastLoginLabel = lastLoginIso
    ? new Date(lastLoginIso).toLocaleTimeString('tr', { hour: '2-digit', minute: '2-digit', hour12: false })
    : '—';

  const reauthenticate = () => {
    setStatus('active');
    setNotice(L(['Yeniden kimlik doğrulama isteği gönderildi.', 'Re-authentication request sent.'], lang));
  };

  const disconnect = () => {
    setStatus('ended');
    setNotice(L(['Demo oturumu bağlantısı kesildi.', 'Demo session disconnected.'], lang));
  };

  return (
    <div className="radius-session-detail">
      <div className="radius-detail-breadcrumb">
        <Link href={`/h/${hotelId}/radius`}>{L(['Aktif Oturumlar', 'Active Sessions'], lang)}</Link>
        <ChevronRight size={14} />
        <span>{session.username}</span>
      </div>

      <div className="acct-detail-head radius-detail-head">
        <div className="acct-detail-head__logo radius-detail-avatar">{initials(session.username)}</div>
        <div className="radius-detail-identity">
          <div className="radius-detail-title-row">
            <h1 className="page-hero__h">{session.username}</h1>
            {status === 'active' ? (
              <span className="badge badge--ok"><span className="ico-dot" />{L(['Aktif', 'Active'], lang)}</span>
            ) : (
              <span className="badge badge--mute">{L(['Sonlandı', 'Ended'], lang)}</span>
            )}
            <span className="badge badge--mute mono">{session.nas}</span>
          </div>
          <div className="cell-sub radius-detail-subtitle">
            <Wifi size={14} />
            <span className="mono">{session.ip}</span>
            <span>·</span>
            <span>{L(['Misafir hesabı', 'Guest account'], lang)}</span>
          </div>
        </div>
        <div className="page-hero__actions radius-detail-actions">
          <button className="btn btn--ghost" type="button" onClick={reauthenticate}>
            <RefreshCw size={16} />{L(['Yeniden Kimlik Doğrula', 'Re-authenticate'], lang)}
          </button>
          <button className="btn btn--dangerghost" type="button" onClick={disconnect} disabled={status === 'ended'}>
            <X size={16} />{L(['Bağlantıyı Kes', 'Disconnect'], lang)}
          </button>
        </div>
      </div>

      {notice ? (
        <div className={`radius-detail-notice ${status}`} role="status">
          {notice}
        </div>
      ) : null}

      <div className="grid grid--kpi radius-detail-kpis">
        <Kpi icon={<Download />} label={L(['Bugünkü Veri', 'Data Used Today'], lang)} value={formatBytes(session.bytes)} />
        <Kpi icon={<Clock3 />} label={L(['Ort. Oturum Süresi', 'Avg Session Length'], lang)} value={formatDuration(session.durationSeconds, lang)} />
        <Kpi icon={<Monitor />} label={L(['Aktif Bağlantı', 'Active Connections'], lang)} value={activeDevices != null ? String(activeDevices) : (status === 'active' ? '1' : '0')} />
        <Kpi icon={<Power />} label={L(['Son Giriş', 'Last Login'], lang)} value={lastLoginLabel} />
      </div>

      <section className="card radius-detail-chart-card">
        <div className="card__head">
          <h2 className="card__title">{L(['Günlük Veri Kullanımı', 'Daily Data Usage'], lang)}</h2>
          <p className="card__sub">{L(['Son 7 gün · MB', 'Last 7 days · MB'], lang)}</p>
        </div>
        <div className="card__body radius-detail-chart">
          <AreaChart data={chartMbValues} labels={labels} max={chartMax} height={220} />
        </div>
      </section>

      <div className="radius-detail-toolbar">
        <div className="radius-chips" role="group" aria-label={L(['Bağlantı durumu filtresi', 'Connection status filter'], lang)}>
          {(['all', 'active', 'ended'] as const).map((value) => (
            <button
              type="button"
              className={`radius-chip${filter === value ? ' active' : ''}`}
              onClick={() => setFilter(value)}
              key={value}
            >
              {value === 'all' ? L(['Tümü', 'All'], lang) : value === 'active' ? L(['Aktif', 'Active'], lang) : L(['Sonlandı', 'Ended'], lang)}
              <span>{counts[value]}</span>
            </button>
          ))}
        </div>
        <label className="searchmini radius-detail-search">
          <Search size={15} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={L(['Bağlantı ara…', 'Search connections…'], lang)} />
        </label>
      </div>

      <section className="card radius-detail-history-card">
        <div className="card__head">
          <div>
            <h2 className="card__title">{L(['Bağlantı Geçmişi', 'Connection History'], lang)}</h2>
            <p className="card__sub">{filteredHistory.length} {L(['kayıt', 'records'], lang)}</p>
          </div>
        </div>
        <div className="card__body radius-detail-history-wrap">
          {history.length === 0 ? (
            <p className="radius-detail-empty">{L(['Henüz bağlantı kaydı yok.', 'No connection history yet.'], lang)}</p>
          ) : (
            <table className="table radius-detail-history-table">
              <thead>
                <tr>
                  <th>MAC</th>
                  <th>IP</th>
                  <th>{L(['Gün / Saat', 'Day / Time'], lang)}</th>
                  <th>{L(['Süre', 'Duration'], lang)}</th>
                  <th>{L(['Veri (İn/Çık)', 'Data (In/Out)'], lang)}</th>
                  <th>{L(['Durum', 'Status'], lang)}</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map((row) => (
                  <tr key={row.id}>
                    <td className="mono radius-table__muted">{row.mac}</td>
                    <td className="mono">{row.ip}</td>
                    <td><span className="cell-sub">{row.date}</span><br />{row.time}</td>
                    <td className="mono">{row.duration}</td>
                    <td className="mono">{row.data}</td>
                    <td>
                      {row.status === 'active' ? (
                        <span className="badge badge--ok"><span className="ico-dot" />{L(['Aktif', 'Active'], lang)}</span>
                      ) : (
                        <span className="badge badge--mute">{L(['Sonlandı', 'Ended'], lang)}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {history.length > 0 && filteredHistory.length === 0 ? (
            <p className="radius-detail-empty">{L(['Sonuç bulunamadı.', 'No results found.'], lang)}</p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
