'use client';

import Link from 'next/link';
import { useMemo, useRef, useState } from 'react';
import {
  CalendarDays,
  Check,
  ChevronDown,
  Eye,
  Layers3,
  MapPin,
  Megaphone,
  MoreHorizontal,
  Pencil,
  Search,
  X,
} from 'lucide-react';
import { MiniBar } from '@/components/console/charts';
import { ClickableEventRow } from './clickable-event-row';
import { L, type Lang } from '@/lib/i18n';

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

export interface SerializedEvent {
  id: string;
  name: string;
  categoryId: string | null;
  categoryName: string;
  categoryColor: string;
  locationId: string | null;
  locationName: string;
  startsAt: string | null;
  endsAt: string | null;
  capacity: number;
  status: EventStatus;
  registered: number;
  href: string;
  editHref: string;
  notifyHref: string;
}

export interface SerializedCategory {
  id: string;
  name: string;
  color: string;
}

export interface SerializedLocation {
  id: string;
  name: string;
}

function fmtDate(iso: string | null, lang: Lang): string {
  if (!iso) return '—';
  return new Intl.DateTimeFormat(lang === 'tr' ? 'tr-TR' : 'en-US', {
    day: '2-digit',
    month: 'short',
  }).format(new Date(iso));
}

function fmtTime(iso: string | null): string {
  if (!iso) return '';
  return new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
}

const PAGE_SIZE = 20;

function Dropdown({
  label,
  icon,
  options,
  value,
  onChange,
  allLabel,
}: {
  label: string;
  icon: React.ReactNode;
  options: { id: string; name: string; color?: string }[];
  value: string;
  onChange: (v: string) => void;
  allLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.id === value);
  const active = !!value;

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        className="fchip events-filter-chip"
        type="button"
        onClick={() => setOpen((p) => !p)}
        style={active ? { background: 'var(--accent-soft)', borderColor: 'var(--accent)', color: 'var(--accent)' } : {}}
      >
        {icon}
        {active ? selected?.name ?? label : label}
        {active
          ? <X size={13} onClick={(e) => { e.stopPropagation(); onChange(''); setOpen(false); }} style={{ marginLeft: 2, cursor: 'pointer' }} />
          : <span className="chev"><ChevronDown size={14} /></span>}
      </button>
      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 49 }} onClick={() => setOpen(false)} />
          <div style={{
            position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 50,
            background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--r-md)',
            boxShadow: 'var(--sh-3)', minWidth: 180, overflow: 'hidden',
          }}>
            <button
              type="button"
              onClick={() => { onChange(''); setOpen(false); }}
              style={{
                display: 'block', width: '100%', textAlign: 'left', padding: '9px 14px',
                border: 0, background: !value ? 'var(--surface-2)' : 'transparent',
                cursor: 'pointer', fontSize: 13, fontWeight: !value ? 700 : 500, color: 'var(--text-1)',
              }}
            >
              {allLabel}
            </button>
            {options.map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => { onChange(o.id); setOpen(false); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, width: '100%', textAlign: 'left',
                  padding: '9px 14px', border: 0,
                  background: value === o.id ? 'var(--surface-2)' : 'transparent',
                  cursor: 'pointer', fontSize: 13, fontWeight: value === o.id ? 700 : 500, color: 'var(--text-1)',
                }}
              >
                {o.color && <span style={{ width: 8, height: 8, borderRadius: '50%', background: o.color, flexShrink: 0 }} />}
                {o.name}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function EventsListClient({
  events,
  categories,
  locations,
  lang,
  hotelName,
}: {
  events: SerializedEvent[];
  categories: SerializedCategory[];
  locations: SerializedLocation[];
  lang: Lang;
  hotelName: string;
}) {
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [locFilter, setLocFilter] = useState('');
  const [page, setPage] = useState(1);

  const statuses = [
    { id: 'live', name: L(['Devam Ediyor', 'Live'], lang) },
    { id: 'scheduled', name: L(['Planlandı', 'Scheduled'], lang) },
    { id: 'completed', name: L(['Tamamlandı', 'Completed'], lang) },
    { id: 'draft', name: L(['Taslak', 'Draft'], lang) },
    { id: 'cancelled', name: L(['İptal', 'Cancelled'], lang) },
    { id: 'full', name: L(['Dolu', 'Full'], lang) },
  ];

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return events.filter((ev) => {
      if (q && !ev.name.toLowerCase().includes(q) && !ev.locationName.toLowerCase().includes(q) && !ev.categoryName.toLowerCase().includes(q)) return false;
      if (catFilter && ev.categoryId !== catFilter) return false;
      if (statusFilter && ev.status !== statusFilter) return false;
      if (locFilter && ev.locationId !== locFilter) return false;
      return true;
    });
  }, [events, search, catFilter, statusFilter, locFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const resetPage = () => setPage(1);

  const hasFilters = !!(search || catFilter || statusFilter || locFilter);

  return (
    <>
      <div className="filterbar events-filterbar">
        {/* Hotel chip — always shows the current hotel name, not interactive */}
        <button className="fchip events-filter-chip" type="button" style={{ opacity: 0.7, cursor: 'default' }}>
          <CalendarDays size={15} />
          {hotelName}
        </button>

        <Dropdown
          label={L(['Kategori', 'Category'], lang)}
          icon={<Layers3 size={15} />}
          options={categories}
          value={catFilter}
          onChange={(v) => { setCatFilter(v); resetPage(); }}
          allLabel={L(['Tüm Kategoriler', 'All Categories'], lang)}
        />

        <Dropdown
          label={L(['Durum', 'Status'], lang)}
          icon={<Check size={15} />}
          options={statuses}
          value={statusFilter}
          onChange={(v) => { setStatusFilter(v); resetPage(); }}
          allLabel={L(['Tüm Durumlar', 'All Statuses'], lang)}
        />

        <Dropdown
          label={L(['Lokasyon', 'Location'], lang)}
          icon={<MapPin size={15} />}
          options={locations}
          value={locFilter}
          onChange={(v) => { setLocFilter(v); resetPage(); }}
          allLabel={L(['Tüm Lokasyonlar', 'All Locations'], lang)}
        />

        {hasFilters && (
          <button
            type="button"
            onClick={() => { setSearch(''); setCatFilter(''); setStatusFilter(''); setLocFilter(''); resetPage(); }}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 'var(--r-pill)', border: '1px solid var(--line)', background: 'transparent', color: 'var(--text-2)', fontSize: 13, cursor: 'pointer' }}
          >
            <X size={13} />
            {L(['Temizle', 'Clear'], lang)}
          </button>
        )}

        <div className="filterbar__spacer" />

        <label className="searchmini events-search">
          <Search size={15} />
          <input
            placeholder={L(['Etkinlik ara…', 'Search events…'], lang)}
            value={search}
            onChange={(e) => { setSearch(e.target.value); resetPage(); }}
          />
          {search && (
            <button type="button" onClick={() => { setSearch(''); resetPage(); }} style={{ all: 'unset', cursor: 'pointer', display: 'flex', color: 'var(--text-3)' }}>
              <X size={13} />
            </button>
          )}
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
              {pageRows.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ color: 'var(--text-3)', padding: '24px 4px', textAlign: 'center' }}>
                    {hasFilters
                      ? L(['Filtre sonucu bulunamadı.', 'No events match the current filters.'], lang)
                      : L(['Henüz etkinlik yok. "Yeni Etkinlik" ile ekleyin.', 'No events yet. Use "New Event" to add one.'], lang)}
                  </td>
                </tr>
              ) : (
                pageRows.map((ev) => {
                  const color = ev.categoryColor || 'var(--accent)';
                  const pct = ev.capacity > 0 ? Math.round((ev.registered / ev.capacity) * 100) : 0;
                  return (
                    <ClickableEventRow href={ev.href} key={ev.id} actions={
                      <div className="rowact events-row-actions">
                        <Link href={ev.href} aria-label={L(['Görüntüle', 'View'], lang)}><Eye /></Link>
                        <Link href={ev.editHref} aria-label={L(['Düzenle', 'Edit'], lang)}><Pencil /></Link>
                        <Link href={ev.notifyHref} aria-label={L(['Bildirim gönder', 'Send notification'], lang)}><Megaphone /></Link>
                        <button type="button" aria-label={L(['Diğer işlemler', 'More actions'], lang)}><MoreHorizontal /></button>
                      </div>
                    }>
                      <td>
                        <Link className="table__name events-table__event events-table__event-link" href={ev.href}>
                          <div className="events-table__icon" style={{ background: `color-mix(in srgb, ${color} 16%, transparent)`, color }}>
                            <CalendarDays size={17} />
                          </div>
                          <div className="events-table__namecopy">
                            <div className="events-table__title">{ev.name || L(['(adsız)', '(untitled)'], lang)}</div>
                            {ev.locationName ? <div className="cell-sub">{ev.locationName}</div> : null}
                          </div>
                        </Link>
                      </td>
                      <td>
                        {ev.categoryName ? (
                          <span className="cat">
                            <span className="cat__dot" style={{ background: color }} />
                            {ev.categoryName}
                          </span>
                        ) : (
                          <span className="cell-sub">—</span>
                        )}
                      </td>
                      <td className="events-table__muted">{fmtDate(ev.startsAt, lang)}</td>
                      <td className="mono events-table__muted">
                        {ev.startsAt ? `${fmtTime(ev.startsAt)}${ev.endsAt ? `–${fmtTime(ev.endsAt)}` : ''}` : '—'}
                      </td>
                      <td>
                        <div className="events-capacity">
                          <MiniBar pct={pct} color={color} maxWidth={64} />
                          <span>{ev.registered}/{ev.capacity}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`badge badge--${STATUS_CLASSES[ev.status]}`}>
                          <span className="ico-dot" />
                          {L(STATUS_LABELS[ev.status], lang)}
                        </span>
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
            {filtered.length === events.length
              ? L([`${events.length} etkinlik`, `${events.length} events`], lang)
              : L([`${filtered.length} / ${events.length} etkinlik`, `${filtered.length} of ${events.length} events`], lang)}
          </div>
          {totalPages > 1 && (
            <div className="pager__nums">
              <button type="button" disabled={safePage === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                {L(['Önceki', 'Prev'], lang)}
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <button key={n} type="button" className={n === safePage ? 'on' : ''} onClick={() => setPage(n)}>
                  {n}
                </button>
              ))}
              <button type="button" disabled={safePage === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                {L(['Sonraki', 'Next'], lang)}
              </button>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
