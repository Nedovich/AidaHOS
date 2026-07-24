'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock3,
  Download,
  Search,
  UserRound,
  Wifi,
} from 'lucide-react';
import { Kpi } from '@/components/console/charts';
import { L, type Lang } from '@/lib/i18n';
import { RadiusSubnav } from './radius-subnav';

type AccountingStatus = 'active' | 'closed';

export interface SerializedAccountingRecord {
  id: string;
  sessionId: string | null;
  username: string;
  nasName: string | null;
  startIso: string | null;
  sessionSeconds: number | null;
  inOctets: number;
  outOctets: number;
  terminateCause: string | null;
  active: boolean;
}

const PAGE_SIZE = 20;

function formatBytes(bytes: number): string {
  if (bytes >= 1_000_000_000) return `${(bytes / 1_000_000_000).toFixed(1)} GB`;
  if (bytes >= 1_000_000) return `${Math.max(1, Math.round(bytes / 1_000_000))} MB`;
  if (bytes >= 1_000) return `${Math.max(1, Math.round(bytes / 1_000))} KB`;
  return `${bytes} B`;
}

function formatDuration(seconds: number | null, lang: Lang): string {
  if (seconds == null || seconds <= 0) return '—';
  const minutes = Math.round(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (hours > 0) return lang === 'tr' ? `${hours}sa ${remainder}dk` : `${hours}h ${remainder}m`;
  return lang === 'tr' ? `${minutes}dk` : `${minutes}m`;
}

function formatAvgSession(seconds: number, lang: Lang): string {
  if (seconds <= 0) return '—';
  return formatDuration(seconds, lang);
}

function formatStart(isoString: string | null, lang: Lang): string {
  if (!isoString) return '—';
  const date = new Date(isoString);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) {
    return date.toLocaleTimeString('tr', { hour: '2-digit', minute: '2-digit', hour12: false });
  }
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return L(['dün', 'yesterday'], lang);
  }
  return date.toLocaleDateString('sv'); // YYYY-MM-DD
}

function csvCell(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

export function AccountingClient({
  hotelId,
  lang,
  records,
  dailyLogins,
  activeDevices,
  avgSessionSeconds,
  todayRecords,
  todayBytes,
  error,
}: {
  hotelId: string;
  lang: Lang;
  records: SerializedAccountingRecord[];
  dailyLogins: number;
  activeDevices: number;
  avgSessionSeconds: number;
  todayRecords: number;
  todayBytes: number;
  error: string | null;
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<'all' | AccountingStatus>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const openDetail = (r: SerializedAccountingRecord) => {
    const query = new URLSearchParams({
      username: r.username,
      ip: '—',
      nas: r.nasName ?? '—',
      duration: String(r.sessionSeconds ?? 0),
      bytes: String(r.inOctets + r.outOctets),
    });
    router.push(`/h/${hotelId}/radius/sessions/${encodeURIComponent(r.id)}?${query.toString()}`);
  };

  const counts = useMemo(() => ({
    all: records.length,
    active: records.filter((r) => r.active).length,
    closed: records.filter((r) => !r.active).length,
  }), [records]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return records.filter((r) => {
      const status: AccountingStatus = r.active ? 'active' : 'closed';
      if (filter !== 'all' && status !== filter) return false;
      if (!query) return true;
      return [r.sessionId ?? '', r.username, r.nasName ?? '', r.terminateCause ?? '']
        .some((v) => v.toLowerCase().includes(query));
    });
  }, [filter, search, records]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const first = filtered.length ? (currentPage - 1) * PAGE_SIZE + 1 : 0;
  const last = Math.min(currentPage * PAGE_SIZE, filtered.length);

  const chooseFilter = (value: 'all' | AccountingStatus) => {
    setFilter(value);
    setPage(1);
  };

  const downloadCsv = () => {
    const rows = [
      ['Session ID', 'User', 'NAS', 'Start', 'Duration', 'Input', 'Output', 'Terminate Cause', 'Status'],
      ...filtered.map((r) => [
        r.sessionId ?? r.id,
        r.username,
        r.nasName ?? '—',
        formatStart(r.startIso, lang),
        formatDuration(r.sessionSeconds, lang),
        formatBytes(r.inOctets),
        formatBytes(r.outOctets),
        r.terminateCause ?? '—',
        r.active ? 'active' : 'closed',
      ]),
    ];
    const csv = rows.map((row) => row.map(csvCell).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'freeradius-accounting.csv';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="radius-page radius-accounting-page">
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

      <RadiusSubnav hotelId={hotelId} active="accounting" lang={lang} />

      {error ? <div className="radius-error">{error}</div> : null}

      <div className="grid grid--kpi radius-kpis">
        <Kpi
          icon={<UserRound />}
          label={L(['Günlük Girişler', 'Daily Logins'], lang)}
          value={dailyLogins.toLocaleString('tr')}
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

      <div className="grid grid--kpi radius-accounting-kpis">
        <Kpi
          icon={<ClipboardList />}
          label={L(['Toplam Kayıt', 'Total Records'], lang)}
          value={todayRecords.toLocaleString('tr')}
          note={L(['bugün', 'today'], lang)}
        />
        <Kpi
          icon={<Wifi />}
          label={L(['Aktif Oturum', 'Active Sessions'], lang)}
          value={activeDevices.toLocaleString('tr')}
          note={L(['şu an', 'right now'], lang)}
          live
        />
        <Kpi
          icon={<Download />}
          label={L(['Toplam Veri', 'Total Data'], lang)}
          value={formatBytes(todayBytes)}
          note={L(['bugün', 'today'], lang)}
        />
      </div>

      <div className="radius-accounting-toolbar">
        <div className="radius-chips" role="group" aria-label={L(['Accounting durumu filtresi', 'Accounting status filter'], lang)}>
          {([
            ['all', L(['Tümü', 'All'], lang), counts.all],
            ['active', L(['Aktif', 'Active'], lang), counts.active],
            ['closed', L(['Kapandı', 'Closed'], lang), counts.closed],
          ] as const).map(([value, label, count]) => (
            <button
              type="button"
              className={`radius-chip${filter === value ? ' active' : ''}`}
              onClick={() => chooseFilter(value)}
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
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder={L(['Kullanıcı ara…', 'Search user…'], lang)}
          />
        </label>
      </div>

      <section className="card radius-accounting-card">
        <div className="card__head">
          <div>
            <h2 className="card__title">{L(['Hesaplama Kayıtları', 'Accounting Records'], lang)}</h2>
            <p className="card__sub">{filtered.length} {L(['kayıt', 'records'], lang)}</p>
          </div>
          <button className="btn btn--sm btn--subtle" type="button" onClick={downloadCsv}>
            <Download size={14} />CSV
          </button>
        </div>

        <div className="card__body radius-accounting-table-wrap">
          {records.length === 0 && !error ? (
            <p className="radius-empty-state">{L(['Henüz accounting kaydı yok.', 'No accounting records yet.'], lang)}</p>
          ) : (
            <table className="table radius-accounting-table">
              <thead>
                <tr>
                  <th>Session ID</th>
                  <th>{L(['Kullanıcı', 'User'], lang)}</th>
                  <th>NAS</th>
                  <th>{L(['Başlangıç', 'Start'], lang)}</th>
                  <th>{L(['Süre', 'Duration'], lang)}</th>
                  <th>{L(['Veri (İn/Çık)', 'Data (In/Out)'], lang)}</th>
                  <th>{L(['Sonlanma Nedeni', 'Terminate Cause'], lang)}</th>
                  <th>{L(['Durum', 'Status'], lang)}</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((r) => (
                  <tr key={r.id} className="radius-session-row" onClick={() => openDetail(r)}>
                    <td className="mono radius-table__muted">{(r.sessionId ?? r.id).slice(0, 8).toUpperCase()}</td>
                    <td className="mono radius-table__user">{r.username}</td>
                    <td className="mono radius-table__muted">{r.nasName ?? '—'}</td>
                    <td className="cell-sub mono">{formatStart(r.startIso, lang)}</td>
                    <td className="mono">{formatDuration(r.sessionSeconds, lang)}</td>
                    <td className="mono">{formatBytes(r.inOctets)} / {formatBytes(r.outOctets)}</td>
                    <td className="cell-sub">{r.terminateCause ?? '—'}</td>
                    <td>
                      {r.active ? (
                        <span className="badge badge--ok"><span className="ico-dot" />{L(['Aktif', 'Active'], lang)}</span>
                      ) : (
                        <span className="badge badge--mute">{L(['Kapandı', 'Closed'], lang)}</span>
                      )}
                    </td>
                  </tr>
                ))}
                {!visible.length ? (
                  <tr><td className="radius-empty" colSpan={8}>{L(['Eşleşen kayıt bulunamadı.', 'No matching records found.'], lang)}</td></tr>
                ) : null}
              </tbody>
            </table>
          )}
        </div>

        {filtered.length > PAGE_SIZE ? (
          <div className="pager radius-accounting-pager">
            <p className="pager__info">
              {lang === 'tr' ? `${filtered.length} kayıttan ${first}-${last} arası` : `Showing ${first}-${last} of ${filtered.length}`}
            </p>
            <div className="pager__nums">
              <button type="button" disabled={currentPage === 1} onClick={() => setPage((v) => Math.max(1, v - 1))}>
                <ChevronLeft size={14} />{L(['Önceki', 'Prev'], lang)}
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <button type="button" className={currentPage === n ? 'on' : ''} onClick={() => setPage(n)} key={n}>
                  {n}
                </button>
              ))}
              <button type="button" disabled={currentPage === totalPages} onClick={() => setPage((v) => Math.min(totalPages, v + 1))}>
                {L(['Sonraki', 'Next'], lang)}<ChevronRight size={14} />
              </button>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
