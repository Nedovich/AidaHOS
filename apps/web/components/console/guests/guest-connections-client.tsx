'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Download,
  Monitor,
  Plus,
  Search,
  Star,
  UserRound,
  Wifi,
} from 'lucide-react';
import { Kpi } from '@/components/console/charts';
import { L, type Lang } from '@/lib/i18n';
import {
  INITIAL_GUESTS,
  type ConnectionStatus,
  type Guest,
} from './guest-data';

const PAGE_SIZE = 10;

function csvCell(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

function offlineLastSeen(guest: Guest, lang: Lang) {
  if (guest.id === 0) return L(['Dün', 'Yesterday'], lang);
  const day = Math.max(1, 25 - guest.id);
  return `${String(day).padStart(2, '0')}.07.2026`;
}

export function GuestConnectionsClient({
  hotelId,
  lang,
}: {
  hotelId: string;
  lang: Lang;
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<'all' | ConnectionStatus>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [notice, setNotice] = useState('');

  const counts = useMemo(() => ({
    all: INITIAL_GUESTS.length,
    online: INITIAL_GUESTS.filter((guest) => guest.connection === 'online').length,
    offline: INITIAL_GUESTS.filter((guest) => guest.connection === 'offline').length,
    vip: INITIAL_GUESTS.filter((guest) => guest.vip !== 'none').length,
  }), []);

  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase(lang === 'tr' ? 'tr-TR' : 'en-US');
    return INITIAL_GUESTS.filter((guest) => {
      if (filter !== 'all' && guest.connection !== filter) return false;
      if (!query) return true;
      const primaryConnection = guest.connections[0];
      return [
        guest.name,
        guest.room,
        guest.hotel,
        primaryConnection?.mac ?? '',
        primaryConnection?.ip ?? '',
      ].some((value) => value.toLocaleLowerCase(lang === 'tr' ? 'tr-TR' : 'en-US').includes(query));
    });
  }, [filter, lang, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const first = filtered.length ? (currentPage - 1) * PAGE_SIZE + 1 : 0;
  const last = Math.min(currentPage * PAGE_SIZE, filtered.length);

  const selectFilter = (value: 'all' | ConnectionStatus) => {
    setFilter(value);
    setPage(1);
  };

  const downloadCsv = () => {
    const rows = [
      ['Guest', 'Room', 'Hotel', 'Device', 'MAC', 'IP', 'Last Seen', 'Status'],
      ...filtered.map((guest) => {
        const connection = guest.connections[0];
        return [
          guest.name,
          guest.room,
          guest.hotel,
          'iPad Air',
          connection?.mac ?? '—',
          guest.connection === 'online' ? connection?.ip ?? '—' : '—',
          guest.connection === 'online' ? 'now' : offlineLastSeen(guest, 'en'),
          guest.connection,
        ];
      }),
    ];
    const csv = rows.map((row) => row.map(csvCell).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'aida-guest-connections.csv';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="guests-page guest-connections-page">
      <div className="page-hero guests-hero">
        <div>
          <h1 className="page-hero__h">{L(['Misafirler', 'Guests'], lang)}</h1>
          <p className="page-hero__sub">
            {L(['Misafir CRM: profiller, konaklamalar, bağlantılar, talepler ve notlar.', 'Guest CRM: profiles, stays, connections, tickets and notes.'], lang)}
          </p>
        </div>
        <div className="page-hero__actions">
          <button className="btn btn--ghost" type="button" onClick={downloadCsv}><Download />CSV</button>
          <button className="btn btn--primary" type="button" onClick={() => setNotice(L(['Misafir ekleme sayfası sonraki aşamada bağlanacak.', 'The Add Guest page will be connected in the next step.'], lang))}>
            <Plus />{L(['Misafir Ekle', 'Add Guest'], lang)}
          </button>
        </div>
      </div>

      <nav className="tabbar guests-tabbar" aria-label={L(['Misafir bölümleri', 'Guest sections'], lang)}>
        <Link className="tab" href={`/h/${hotelId}/guests`}>{L(['Misafirler', 'Guests'], lang)}</Link>
        <Link className="tab active" aria-current="page" href={`/h/${hotelId}/guests/connections`}>{L(['Bağlantılar', 'Connections'], lang)}</Link>
        <Link className="tab" href={`/h/${hotelId}/guests/tickets`}>{L(['Talepler / Şikayetler', 'Tickets / Complaints'], lang)}</Link>
        <span className="tab" aria-disabled="true">{L(['Notlar', 'Notes'], lang)}</span>
        <Link className="tab" href={`/h/${hotelId}/guests/analytics`}>{L(['Analitik', 'Analytics'], lang)}</Link>
      </nav>

      {notice ? (
        <div className="guests-notice" role="status">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice('')} aria-label={L(['Bildirimi kapat', 'Dismiss notification'], lang)}>×</button>
        </div>
      ) : null}

      <div className="grid grid--kpi guests-kpis">
        <Kpi icon={<UserRound />} label={L(['Toplam Misafir', 'Total Guests'], lang)} value={String(counts.all)} note={L(['tüm oteller', 'all hotels'], lang)} />
        <Kpi icon={<Wifi />} label={L(['Şu An Bağlı', 'Connected Now'], lang)} value={String(counts.online)} note={L(['çevrimiçi', 'online right now'], lang)} live />
        <Kpi icon={<Download />} label={L(['Ort. Veri Kullanımı', 'Avg Data Usage'], lang)} value="786 MB" note={L(['bağlı misafir başına', 'per connected guest'], lang)} />
        <Kpi icon={<Star />} label={L(['VIP Misafir', 'VIP Guests'], lang)} value={String(counts.vip)} note={L(['sadakat programı', 'loyalty program'], lang)} />
      </div>

      <div className="guests-toolbar guest-connections-toolbar">
        <div className="guests-chips" role="group" aria-label={L(['Bağlantı durumu', 'Connection status'], lang)}>
          {([
            ['all', L(['Tümü', 'All'], lang), counts.all],
            ['online', L(['Bağlı', 'Online'], lang), counts.online],
            ['offline', L(['Bağlı Değil', 'Offline'], lang), counts.offline],
          ] as const).map(([value, label, count]) => (
            <button className={`guests-chip${filter === value ? ' active' : ''}`} type="button" onClick={() => selectFilter(value)} key={value}>
              {label}<span>{count}</span>
            </button>
          ))}
        </div>
        <label className="searchmini guests-search">
          <Search />
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder={L(['Misafir ara…', 'Search guest…'], lang)}
          />
        </label>
      </div>

      <section className="card guests-card guest-connections-card">
        <div className="card__head">
          <div>
            <h2 className="card__title">{L(['Misafir Bağlantıları', 'Guest Connections'], lang)}</h2>
            <p className="card__sub">{filtered.length} {L(['misafir', 'guests'], lang)}</p>
          </div>
          <span className="live">{L(['canlı', 'live'], lang)}<span className="live__pulse" /></span>
        </div>
        <div className="card__body guests-table-wrap">
          <table className="table guest-connections-table">
            <thead>
              <tr>
                <th>{L(['Misafir', 'Guest'], lang)}</th>
                <th>{L(['Cihaz', 'Device'], lang)}</th>
                <th>MAC</th>
                <th>IP</th>
                <th>{L(['Son Görülme', 'Last Seen'], lang)}</th>
                <th>{L(['Durum', 'Status'], lang)}</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((guest) => {
                const primaryConnection = guest.connections[0];
                return (
                  <tr
                    className="guests-row-link"
                    role="link"
                    tabIndex={0}
                    key={guest.id}
                    onClick={() => router.push(`/h/${hotelId}/guests/${guest.id}`)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        router.push(`/h/${hotelId}/guests/${guest.id}`);
                      }
                    }}
                  >
                    <td>
                      <div className="set-mem">
                        <div className="set-mem__av" style={{ background: guest.color }}>{guest.initials}</div>
                        <div>
                          <div className="set-mem__n">{guest.name}</div>
                          <div className="cell-sub">{L(['Oda', 'Room'], lang)} {guest.room} · {guest.hotel}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className="guest-connections-device"><Monitor />iPad Air</span></td>
                    <td className="mono cell-sub">{primaryConnection?.mac ?? '—'}</td>
                    <td className="mono cell-sub">{guest.connection === 'online' ? primaryConnection?.ip ?? '—' : '—'}</td>
                    <td className="cell-sub">{guest.connection === 'online' ? L(['şimdi', 'now'], lang) : offlineLastSeen(guest, lang)}</td>
                    <td>
                      {guest.connection === 'online' ? (
                        <span className="badge badge--ok"><span className="ico-dot" />{L(['Bağlı', 'Online'], lang)}</span>
                      ) : (
                        <span className="badge badge--mute">{L(['Bağlı Değil', 'Offline'], lang)}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {!visible.length ? (
                <tr><td className="guests-empty" colSpan={6}>{L(['Sonuç bulunamadı.', 'No results found.'], lang)}</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
        {filtered.length ? (
          <div className="pager guests-pager">
            <p className="pager__info">
              {lang === 'tr' ? `${filtered.length} misafirden ${first}-${last} arası` : `Showing ${first}-${last} of ${filtered.length}`}
            </p>
            <div className="pager__nums">
              <button type="button" disabled={currentPage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>{L(['Önceki', 'Prev'], lang)}</button>
              {Array.from({ length: totalPages }, (_, index) => index + 1).map((number) => (
                <button type="button" className={currentPage === number ? 'on' : ''} onClick={() => setPage(number)} key={number}>{number}</button>
              ))}
              <button type="button" disabled={currentPage === totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>{L(['Sonraki', 'Next'], lang)}</button>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
