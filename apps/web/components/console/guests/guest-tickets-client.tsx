'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Download,
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
} from './guest-data';
import {
  GUEST_TICKET_RECORDS,
  type TicketPriority,
} from './guest-ticket-data';

type TicketFilter = 'all' | 'open' | 'closed';

function csvCell(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

function priorityLabel(priority: TicketPriority, lang: Lang) {
  if (priority === 'medium') return L(['Orta', 'Medium'], lang);
  if (priority === 'high') return L(['Yüksek', 'High'], lang);
  return L(['Düşük', 'Low'], lang);
}

export function GuestTicketsClient({
  hotelId,
  lang,
}: {
  hotelId: string;
  lang: Lang;
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<TicketFilter>('all');
  const [search, setSearch] = useState('');
  const [notice, setNotice] = useState('');

  const guestCounts = useMemo(() => ({
    all: INITIAL_GUESTS.length,
    online: INITIAL_GUESTS.filter((guest) => guest.connection === 'online').length,
    vip: INITIAL_GUESTS.filter((guest) => guest.vip !== 'none').length,
  }), []);

  const ticketCounts = useMemo(() => ({
    all: GUEST_TICKET_RECORDS.length,
    open: GUEST_TICKET_RECORDS.filter((record) => record.ticket.status === 'open').length,
    closed: GUEST_TICKET_RECORDS.filter((record) => record.ticket.status === 'closed').length,
  }), []);

  const filtered = useMemo(() => {
    const locale = lang === 'tr' ? 'tr-TR' : 'en-US';
    const query = search.trim().toLocaleLowerCase(locale);
    return GUEST_TICKET_RECORDS.filter((record) => {
      if (filter !== 'all' && record.ticket.status !== filter) return false;
      if (!query) return true;
      return [
        record.guest.name,
        L(record.ticket.subject, lang),
        record.ticket.date,
      ].some((value) => value.toLocaleLowerCase(locale).includes(query));
    });
  }, [filter, lang, search]);

  const downloadCsv = () => {
    const rows = [
      ['Guest', 'Subject', 'Priority', 'Date', 'Status'],
      ...filtered.map((record) => [
        record.guest.name,
        L(record.ticket.subject, 'en'),
        record.priority,
        record.ticket.date,
        record.ticket.status,
      ]),
    ];
    const csv = rows.map((row) => row.map(csvCell).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'aida-guest-tickets.csv';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="guests-page guest-tickets-page">
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
        <Link className="tab" href={`/h/${hotelId}/guests/connections`}>{L(['Bağlantılar', 'Connections'], lang)}</Link>
        <Link className="tab active" aria-current="page" href={`/h/${hotelId}/guests/tickets`}>{L(['Talepler / Şikayetler', 'Tickets / Complaints'], lang)}</Link>
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
        <Kpi icon={<UserRound />} label={L(['Toplam Misafir', 'Total Guests'], lang)} value={String(guestCounts.all)} note={L(['tüm oteller', 'all hotels'], lang)} />
        <Kpi icon={<Wifi />} label={L(['Şu An Bağlı', 'Connected Now'], lang)} value={String(guestCounts.online)} note={L(['çevrimiçi', 'online right now'], lang)} live />
        <Kpi icon={<Download />} label={L(['Ort. Veri Kullanımı', 'Avg Data Usage'], lang)} value="786 MB" note={L(['bağlı misafir başına', 'per connected guest'], lang)} />
        <Kpi icon={<Star />} label={L(['VIP Misafir', 'VIP Guests'], lang)} value={String(guestCounts.vip)} note={L(['sadakat programı', 'loyalty program'], lang)} />
      </div>

      <div className="guests-toolbar guest-tickets-toolbar">
        <div className="guests-chips" role="group" aria-label={L(['Talep durumu', 'Ticket status'], lang)}>
          {([
            ['all', L(['Tümü', 'All'], lang), ticketCounts.all],
            ['open', L(['Açık', 'Open'], lang), ticketCounts.open],
            ['closed', L(['Kapalı', 'Closed'], lang), ticketCounts.closed],
          ] as const).map(([value, label, count]) => (
            <button className={`guests-chip${filter === value ? ' active' : ''}`} type="button" onClick={() => setFilter(value)} key={value}>
              {label}<span>{count}</span>
            </button>
          ))}
        </div>
        <label className="searchmini guests-search">
          <Search />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={L(['Misafir veya konu ara…', 'Search guest or subject…'], lang)} />
        </label>
      </div>

      <section className="card guests-card guest-tickets-card">
        <div className="card__head">
          <div>
            <h2 className="card__title">{L(['Talepler / Şikayetler', 'Tickets / Complaints'], lang)}</h2>
            <p className="card__sub">{filtered.length} {L(['kayıt', 'records'], lang)}</p>
          </div>
        </div>
        <div className="card__body guests-table-wrap">
          <table className="table guest-tickets-table">
            <thead>
              <tr>
                <th>{L(['Misafir', 'Guest'], lang)}</th>
                <th>{L(['Konu', 'Subject'], lang)}</th>
                <th>{L(['Öncelik', 'Priority'], lang)}</th>
                <th>{L(['Tarih', 'Date'], lang)}</th>
                <th>{L(['Durum', 'Status'], lang)}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((record) => (
                <tr
                  className="guests-row-link"
                  role="link"
                  tabIndex={0}
                  key={record.id}
                  onClick={() => router.push(`/h/${hotelId}/guests/tickets/${record.id}`)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      router.push(`/h/${hotelId}/guests/tickets/${record.id}`);
                    }
                  }}
                >
                  <td>
                    <div className="set-mem">
                      <div className="set-mem__av" style={{ background: record.guest.color }}>{record.guest.initials}</div>
                      <div className="set-mem__n">{record.guest.name}</div>
                    </div>
                  </td>
                  <td className="guest-ticket-subject">{L(record.ticket.subject, lang)}</td>
                  <td><span className={`badge guest-ticket-priority priority-${record.priority}`}>{priorityLabel(record.priority, lang)}</span></td>
                  <td className="mono cell-sub">{record.ticket.date}</td>
                  <td>
                    <span className={`badge ${record.ticket.status === 'open' ? 'badge--warn' : 'badge--mute'}`}>
                      {record.ticket.status === 'open' ? L(['Açık', 'Open'], lang) : L(['Kapalı', 'Closed'], lang)}
                    </span>
                  </td>
                </tr>
              ))}
              {!filtered.length ? (
                <tr><td className="guests-empty" colSpan={5}>{L(['Kayıt bulunamadı.', 'No records found.'], lang)}</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
