import Link from 'next/link';
import {
  Building2,
  CalendarDays,
  Check,
  ChevronDown,
  Download,
  Eye,
  Layers3,
  MapPin,
  Megaphone,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
} from 'lucide-react';
import {
  getHotelById,
  listEventCategories,
  listEvents,
  listGroupEventLocations,
  resolveLoc,
  type Loc,
} from '@aidahos/db';
import { MiniBar } from '@/components/console/charts';
import { ClickableEventRow } from '@/components/console/events/clickable-event-row';
import { EventsSubnav } from '@/components/console/events/events-subnav';
import { L, type Lang } from '@/lib/i18n';
import { getLang } from '@/lib/i18n-server';

type EventStatus = 'draft' | 'scheduled' | 'live' | 'full' | 'completed' | 'cancelled';
const STATUS_LABELS: Record<EventStatus, readonly [string, string]> = {
  scheduled: ['Planlandı', 'Scheduled'],
  live: ['Devam Ediyor', 'Live'],
  full: ['Dolu', 'Full'],
  completed: ['Tamamlandı', 'Completed'],
  draft: ['Taslak', 'Draft'],
  cancelled: ['İptal', 'Cancelled'],
};
const STATUS_CLASSES: Record<EventStatus, string> = {
  scheduled: 'info',
  live: 'ok',
  full: 'warn',
  completed: 'mute',
  draft: 'mute',
  cancelled: 'err',
};

function FilterChip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button className="fchip events-filter-chip" type="button">
      {icon}
      {label}
      <span className="chev">
        <ChevronDown size={14} />
      </span>
    </button>
  );
}

function fmtDate(d: Date | null, lang: Lang): string {
  if (!d) return '—';
  return new Intl.DateTimeFormat(lang === 'tr' ? 'tr-TR' : 'en-US', {
    day: '2-digit',
    month: 'short',
  }).format(d);
}
function fmtTime(d: Date | null): string {
  if (!d) return '';
  return new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' }).format(d);
}

export default async function EventsListPage({ params }: { params: Promise<{ hotelId: string }> }) {
  const { hotelId } = await params;
  const lang = await getLang();
  const base = `/h/${hotelId}/events`;
  const rl = (l: Loc) => resolveLoc(l, lang === 'tr' ? 'tr' : 'en', 'en');

  const hotel = await getHotelById(hotelId);
  const groupId = hotel?.hotelGroupId ?? '';
  const [rows, cats, locs] = groupId
    ? await Promise.all([
        listEvents(groupId),
        listEventCategories(groupId),
        listGroupEventLocations(groupId),
      ])
    : [[], [], []];
  const catById = new Map(cats.map((c) => [c.id, { name: c.name as Loc, color: c.color }]));
  const locById = new Map(locs.map((l) => [l.id, l.name as Loc]));

  return (
    <div className="events-list fade-in">
      <div className="page-hero events-hero">
        <div>
          <h1 className="page-hero__h">{L(['Etkinlikler', 'Events'], lang)}</h1>
          <p className="page-hero__sub">
            {L(
              [
                'Tüm etkinlikleri görüntüleyin, filtreleyin ve yönetin.',
                'View, filter and manage all events.',
              ],
              lang,
            )}
          </p>
        </div>
        <div className="page-hero__actions">
          <button className="btn btn--ghost" type="button">
            <Download />
            {L(['Dışa Aktar', 'Export'], lang)}
          </button>
          <Link className="btn btn--primary" href={`${base}/new`}>
            <Plus />
            {L(['Yeni Etkinlik', 'New Event'], lang)}
          </Link>
        </div>
      </div>

      <EventsSubnav hotelId={hotelId} active="list" lang={lang} />

      <div className="filterbar events-filterbar">
        <FilterChip icon={<Building2 size={15} />} label={L(['Tüm Oteller', 'All Hotels'], lang)} />
        <FilterChip icon={<CalendarDays size={15} />} label={L(['Bu Hafta', 'This Week'], lang)} />
        <FilterChip icon={<Layers3 size={15} />} label={L(['Kategori', 'Category'], lang)} />
        <FilterChip icon={<Check size={15} />} label={L(['Durum', 'Status'], lang)} />
        <FilterChip icon={<MapPin size={15} />} label={L(['Lokasyon', 'Location'], lang)} />
        <div className="filterbar__spacer" />
        <label className="searchmini events-search">
          <Search size={15} />
          <input placeholder={L(['Etkinlik ara…', 'Search events…'], lang)} />
        </label>
      </div>

      <section className="card events-list-card">
        <div className="card__body events-table-wrap">
          <table className="events-table table">
            <thead>
              <tr>
                <th>{L(['Etkinlik', 'Event'], lang)}</th>
                <th>{L(['Kategori', 'Category'], lang)}</th>
                <th>{L(['Tarih', 'Date'], lang)}</th>
                <th>{L(['Saat', 'Time'], lang)}</th>
                <th>{L(['Kapasite / Kayıt', 'Capacity / Reg'], lang)}</th>
                <th>{L(['Durum', 'Status'], lang)}</th>
                <th>{L(['İşlemler', 'Actions'], lang)}</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    style={{ color: 'var(--text-3)', padding: '24px 4px', textAlign: 'center' }}
                  >
                    {L(
                      [
                        'Henüz etkinlik yok. “Yeni Etkinlik” ile ekleyin.',
                        'No events yet. Use “New Event” to add one.',
                      ],
                      lang,
                    )}
                  </td>
                </tr>
              ) : (
                rows.map((ev) => {
                  const cat = ev.categoryId ? catById.get(ev.categoryId) : undefined;
                  const loc = ev.locationId ? locById.get(ev.locationId) : undefined;
                  const start = ev.startsAt ? new Date(ev.startsAt) : null;
                  const endD = ev.endsAt ? new Date(ev.endsAt) : null;
                  const status = ev.status as EventStatus;
                  const color = cat?.color ?? 'var(--accent)';
                  return (
                    <ClickableEventRow href={`${base}/${ev.id}`} key={ev.id}>
                      <td>
                        <Link
                          className="table__name events-table__event events-table__event-link"
                          href={`${base}/${ev.id}`}
                        >
                          <div
                            className="events-table__icon"
                            style={{
                              background: `color-mix(in srgb, ${color} 16%, transparent)`,
                              color,
                            }}
                          >
                            <CalendarDays size={17} />
                          </div>
                          <div className="events-table__namecopy">
                            <div className="events-table__title">
                              {rl(ev.name as Loc) || L(['(adsız)', '(untitled)'], lang)}
                            </div>
                            {loc ? <div className="cell-sub">{rl(loc)}</div> : null}
                          </div>
                        </Link>
                      </td>
                      <td>
                        {cat ? (
                          <span className="cat">
                            <span className="cat__dot" style={{ background: color }} />
                            {rl(cat.name)}
                          </span>
                        ) : (
                          <span className="cell-sub">—</span>
                        )}
                      </td>
                      <td className="events-table__muted">{fmtDate(start, lang)}</td>
                      <td className="mono events-table__muted">
                        {start ? `${fmtTime(start)}${endD ? `–${fmtTime(endD)}` : ''}` : '—'}
                      </td>
                      <td>
                        <div className="events-capacity">
                          <MiniBar pct={0} color={color} maxWidth={64} />
                          <span>0/{ev.capacity}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`badge badge--${STATUS_CLASSES[status]}`}>
                          <span className="ico-dot" />
                          {L(STATUS_LABELS[status], lang)}
                        </span>
                      </td>
                      <td>
                        <div className="rowact events-row-actions">
                          <Link
                            href={`${base}/${ev.id}`}
                            aria-label={L(['Görüntüle', 'View'], lang)}
                          >
                            <Eye />
                          </Link>
                          <Link
                            href={`${base}/${ev.id}/edit`}
                            aria-label={L(['Düzenle', 'Edit'], lang)}
                          >
                            <Pencil />
                          </Link>
                          <Link
                            href={`${base}/notify`}
                            aria-label={L(['Bildirim gönder', 'Send notification'], lang)}
                          >
                            <Megaphone />
                          </Link>
                          <button
                            type="button"
                            aria-label={L(['Diğer işlemler', 'More actions'], lang)}
                          >
                            <MoreHorizontal />
                          </button>
                        </div>
                      </td>
                    </ClickableEventRow>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="pager events-pager">
          <div className="pager__info">
            {L([`${rows.length} etkinlik`, `${rows.length} events`], lang)}
          </div>
          <div className="pager__nums">
            <button type="button">{L(['Önceki', 'Prev'], lang)}</button>
            <button className="on" type="button">
              1
            </button>
            <button type="button">{L(['Sonraki', 'Next'], lang)}</button>
          </div>
        </div>
      </section>
    </div>
  );
}
