'use client';

import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Download,
  MoreHorizontal,
  Plus,
  Search,
  Star,
  UserRound,
  Wifi,
} from 'lucide-react';
import { Kpi } from '@/components/console/charts';
import { L, type Lang } from '@/lib/i18n';

export type StayStatus = 'inhouse' | 'checked-out';

export interface SerializedGuest {
  id: string;
  name: string;
  initials: string;
  color: string;
  room: string;
  checkin: string;
  checkout: string;
  status: StayStatus;
  phone: string;
  email: string;
  online: boolean;
  dataToday: string;
  country: string | null;
  roomType: string | null;
  agency: string | null;
  currency: string | null;
  createdAt: string;
}

const PAGE_SIZE = 10;

function csvCell(v: string) {
  return `"${v.replaceAll('"', '""')}"`;
}

function GuestActions({ guestId, hotelId, lang }: { guestId: string; hotelId: string; lang: Lang }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div
      className="rowact rowmenu guests-rowmenu"
      ref={ref}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        aria-label={L(['Misafir işlemleri', 'Guest actions'], lang)}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <MoreHorizontal />
      </button>
      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 49 }} onClick={() => setOpen(false)} />
          <div className="rowmenu__pop" style={{ zIndex: 50 }}>
            <Link className="rowmenu__item" href={`/h/${hotelId}/guests/${guestId}`} onClick={() => setOpen(false)}>
              <UserRound size={15} /> {L(['Detay', 'View Detail'], lang)}
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

export function GuestsClient({
  hotelId,
  lang,
  guests,
  avgData,
}: {
  hotelId: string;
  lang: Lang;
  guests: SerializedGuest[];
  avgData: string;
}) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<'all' | StayStatus>('all');
  const [connectionFilter, setConnectionFilter] = useState<'all' | 'online' | 'offline'>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const counts = useMemo(() => ({
    all: guests.length,
    inhouse: guests.filter((g) => g.status === 'inhouse').length,
    checkedOut: guests.filter((g) => g.status === 'checked-out').length,
    online: guests.filter((g) => g.online).length,
    offline: guests.filter((g) => !g.online).length,
  }), [guests]);

  const filtered = useMemo(() => {
    const q = search.trim().toLocaleLowerCase(lang === 'tr' ? 'tr-TR' : 'en-US');
    return guests.filter((g) => {
      if (statusFilter !== 'all' && g.status !== statusFilter) return false;
      if (connectionFilter === 'online' && !g.online) return false;
      if (connectionFilter === 'offline' && g.online) return false;
      if (!q) return true;
      return [g.name, g.room, g.email, g.phone].some((v) =>
        v.toLocaleLowerCase(lang === 'tr' ? 'tr-TR' : 'en-US').includes(q),
      );
    });
  }, [guests, statusFilter, connectionFilter, search, lang]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const first = filtered.length ? (currentPage - 1) * PAGE_SIZE + 1 : 0;
  const last = Math.min(currentPage * PAGE_SIZE, filtered.length);

  const downloadCsv = () => {
    const rows = [
      ['Guest', 'Room', 'Check-in', 'Check-out', 'Phone', 'Email', 'Status', 'Connection'],
      ...filtered.map((g) => [g.name, g.room, g.checkin, g.checkout, g.phone, g.email, g.status, g.online ? 'Online' : 'Offline']),
    ];
    const csv = rows.map((r) => r.map(csvCell).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'aida-guests.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="guests-page">
      <div className="page-hero guests-hero">
        <div>
          <h1 className="page-hero__h">{L(['Misafirler', 'Guests'], lang)}</h1>
          <p className="page-hero__sub">
            {L(['Misafir CRM: profiller, konaklamalar, bağlantılar, talepler ve notlar.', 'Guest CRM: profiles, stays, connections, tickets and notes.'], lang)}
          </p>
        </div>
        <div className="page-hero__actions">
          <button className="btn btn--ghost" type="button" onClick={downloadCsv}><Download size={16} />CSV</button>
          <button className="btn btn--primary" type="button" disabled>
            <Plus size={16} />{L(['Misafir Ekle', 'Add Guest'], lang)}
          </button>
        </div>
      </div>

      <nav className="tabbar guests-tabbar" aria-label={L(['Misafir bölümleri', 'Guest sections'], lang)}>
        <Link className="tab active" aria-current="page" href={`/h/${hotelId}/guests`}>{L(['Misafirler', 'Guests'], lang)}</Link>
        <Link className="tab" href={`/h/${hotelId}/guests/connections`}>{L(['Bağlantılar', 'Connections'], lang)}</Link>
        <Link className="tab" href={`/h/${hotelId}/guests/tickets`}>{L(['Talepler / Şikayetler', 'Tickets / Complaints'], lang)}</Link>
        <span className="tab" aria-disabled="true">{L(['Notlar', 'Notes'], lang)}</span>
        <Link className="tab" href={`/h/${hotelId}/guests/analytics`}>{L(['Analitik', 'Analytics'], lang)}</Link>
      </nav>

      <div className="grid grid--kpi guests-kpis">
        <Kpi icon={<UserRound />} label={L(['Toplam Misafir', 'Total Guests'], lang)} value={String(counts.all)} note={L(['portal üzerinden bağlanan', 'connected via portal'], lang)} />
        <Kpi icon={<Wifi />} label={L(['Şu An Bağlı', 'Connected Now'], lang)} value={String(counts.online)} note={L(['çevrimiçi', 'online right now'], lang)} live />
        <Kpi icon={<Download />} label={L(['Ort. Veri Kullanımı', 'Avg Data Usage'], lang)} value={avgData} note={L(['bağlı misafir başına', 'per connected guest'], lang)} />
        <Kpi icon={<Star />} label={L(['Otelde', 'In-House'], lang)} value={String(counts.inhouse)} note={L(['şu an konakluyor', 'currently staying'], lang)} />
      </div>

      <div className="guests-toolbar">
        <div className="guests-filter-groups">
          <div className="guests-chips" role="group" aria-label={L(['Konaklama durumu', 'Stay status'], lang)}>
            {([
              ['all', L(['Tümü', 'All'], lang), counts.all],
              ['inhouse', L(['Otelde', 'In-House'], lang), counts.inhouse],
              ['checked-out', L(['Çıkış Yaptı', 'Checked Out'], lang), counts.checkedOut],
            ] as const).map(([v, label, count]) => (
              <button
                key={v}
                type="button"
                className={`guests-chip${statusFilter === v ? ' active' : ''}`}
                onClick={() => { setStatusFilter(v); setPage(1); }}
              >
                {label}<span>{count}</span>
              </button>
            ))}
          </div>
          <div className="guests-chips" role="group" aria-label={L(['Bağlantı durumu', 'Connection status'], lang)}>
            {([
              ['all', L(['Tüm Bağlantılar', 'All Connections'], lang), counts.all],
              ['online', L(['Bağlı', 'Online'], lang), counts.online],
              ['offline', L(['Bağlı Değil', 'Offline'], lang), counts.offline],
            ] as const).map(([v, label, count]) => (
              <button
                key={v}
                type="button"
                className={`guests-chip${connectionFilter === v ? ' active' : ''}`}
                onClick={() => { setConnectionFilter(v); setPage(1); }}
              >
                {label}{v === 'all' ? null : <span>{count}</span>}
              </button>
            ))}
          </div>
        </div>
        <label className="searchmini guests-search">
          <Search size={15} />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder={L(['İsim, oda, e-posta ara…', 'Search name, room, email…'], lang)}
          />
        </label>
      </div>

      <section className="card guests-card">
        <div className="card__head">
          <div>
            <h2 className="card__title">{L(['Tüm Misafirler', 'All Guests'], lang)}</h2>
            <p className="card__sub">{filtered.length} {L(['misafir', 'guests'], lang)}</p>
          </div>
        </div>
        <div className="card__body guests-table-wrap">
          <table className="table guests-table">
            <thead>
              <tr>
                <th>{L(['Misafir', 'Guest'], lang)}</th>
                <th>Check-in / Check-out</th>
                <th>{L(['İletişim', 'Contact'], lang)}</th>
                <th>{L(['Bağlantı', 'Connection'], lang)}</th>
                <th>{L(['Durum', 'Status'], lang)}</th>
                <th>{L(['İşlemler', 'Actions'], lang)}</th>
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 ? (
                <tr><td className="guests-empty" colSpan={6}>{L(['Henüz portal üzerinden bağlanan misafir yok.', 'No guests have connected via the portal yet.'], lang)}</td></tr>
              ) : visible.map((g) => (
                <tr
                  key={g.id}
                  className="guests-row-link"
                  role="link"
                  tabIndex={0}
                  onClick={() => router.push(`/h/${hotelId}/guests/${g.id}`)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      router.push(`/h/${hotelId}/guests/${g.id}`);
                    }
                  }}
                >
                  <td>
                    <div className="set-mem">
                      <div className="set-mem__av" style={{ background: g.color }}>{g.initials}</div>
                      <div>
                        <div className="set-mem__n">{g.name}</div>
                        <div className="cell-sub">{L(['Oda', 'Room'], lang)} {g.room}</div>
                      </div>
                    </div>
                  </td>
                  <td className="cell-sub mono">{g.checkin}<br />{g.checkout}</td>
                  <td className="mono guests-contact">
                    {g.phone !== '—' ? g.phone : <span className="cell-sub">—</span>}
                    <br />
                    <span>{g.email !== '—' ? g.email : <span className="cell-sub">—</span>}</span>
                  </td>
                  <td>
                    {g.online ? (
                      <span className="badge badge--ok"><span className="ico-dot" />{L(['Bağlı', 'Online'], lang)}</span>
                    ) : (
                      <span className="badge badge--mute">{L(['Bağlı Değil', 'Offline'], lang)}</span>
                    )}
                  </td>
                  <td>
                    {g.status === 'inhouse' ? (
                      <span className="badge badge--ok"><span className="ico-dot" />{L(['Otelde', 'In-House'], lang)}</span>
                    ) : (
                      <span className="badge badge--mute">{L(['Çıkış Yaptı', 'Checked Out'], lang)}</span>
                    )}
                  </td>
                  <td><GuestActions guestId={g.id} hotelId={hotelId} lang={lang} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <div className="pager guests-pager">
            <p className="pager__info">
              {lang === 'tr' ? `${filtered.length} misafirden ${first}–${last} arası` : `Showing ${first}–${last} of ${filtered.length}`}
            </p>
            <div className="pager__nums">
              <button type="button" disabled={currentPage === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>{L(['Önceki', 'Prev'], lang)}</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <button key={n} type="button" className={currentPage === n ? 'on' : ''} onClick={() => setPage(n)}>{n}</button>
              ))}
              <button type="button" disabled={currentPage === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>{L(['Sonraki', 'Next'], lang)}</button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
