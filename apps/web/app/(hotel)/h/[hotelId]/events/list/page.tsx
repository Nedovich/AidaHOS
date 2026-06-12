import Link from 'next/link';
import {
  Building2,
  CalendarDays,
  Check,
  ChevronDown,
  Download,
  Dumbbell,
  Gift,
  Layers3,
  MapPin,
  Megaphone,
  MoreHorizontal,
  Music2,
  Pencil,
  Plus,
  Search,
  Star,
  UtensilsCrossed,
  Waves,
  type LucideIcon,
} from 'lucide-react';
import { MiniBar } from '@/components/console/charts';
import { EventsSubnav } from '@/components/console/events/events-subnav';
import {
  EVENT_CATEGORIES,
  MOCK_EVENTS,
  localize,
  type EventCategory,
  type EventStatus,
  type MockEvent,
} from '@/lib/events-mock';
import { L, type Lang } from '@/lib/i18n';
import { getLang } from '@/lib/i18n-server';

const CATEGORY_ICONS: Record<EventCategory, LucideIcon> = {
  ent: Music2,
  kids: Gift,
  sport: Dumbbell,
  well: Waves,
  fnb: UtensilsCrossed,
  spec: Star,
};

const STATUS_LABELS: Record<EventStatus, readonly [string, string]> = {
  scheduled: ['Planlandı', 'Scheduled'],
  live: ['Devam Ediyor', 'Live'],
  full: ['Dolu', 'Full'],
  completed: ['Tamamlandı', 'Completed'],
  draft: ['Taslak', 'Draft'],
};

const STATUS_CLASSES: Record<EventStatus, string> = {
  scheduled: 'info',
  live: 'ok',
  full: 'warn',
  completed: 'mute',
  draft: 'mute',
};

function CategoryIcon({ category, size = 17 }: { category: EventCategory; size?: number }) {
  const Icon = CATEGORY_ICONS[category];
  return <Icon size={size} />;
}

function CategoryLabel({ category, lang }: { category: EventCategory; lang: Lang }) {
  const item = EVENT_CATEGORIES[category];
  return (
    <span className="cat">
      <span className="cat__dot" style={{ background: item.color }} />
      {localize(item.label, lang)}
    </span>
  );
}

function StatusBadge({ status, lang }: { status: EventStatus; lang: Lang }) {
  return (
    <span className={`badge badge--${STATUS_CLASSES[status]}`}>
      <span className="ico-dot" />
      {L(STATUS_LABELS[status], lang)}
    </span>
  );
}

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

function EventTableRow({ event, lang, base }: { event: MockEvent; lang: Lang; base: string }) {
  const category = EVENT_CATEGORIES[event.category];
  const percentage = Math.round((event.registrations / event.capacity) * 100);
  const barColor = percentage >= 95 ? 'var(--warning)' : category.color;

  return (
    <tr>
      <td>
        <div className="table__name events-table__event">
          <div
            className="events-table__icon"
            style={{ background: category.soft, color: category.color }}
          >
            <CategoryIcon category={event.category} />
          </div>
          <div className="events-table__namecopy">
            <div className="events-table__title">{localize(event.name, lang)}</div>
            <div className="cell-sub">{localize(event.location, lang)}</div>
          </div>
        </div>
      </td>
      <td>
        <CategoryLabel category={event.category} lang={lang} />
      </td>
      <td className="events-table__muted">{localize(event.date, lang)}</td>
      <td className="mono events-table__muted">
        {event.time}–{event.end}
      </td>
      <td>
        <div className="events-capacity">
          <MiniBar pct={percentage} color={barColor} maxWidth={64} />
          <span>
            {event.registrations}/{event.capacity}
          </span>
        </div>
      </td>
      <td>
        <StatusBadge status={event.status} lang={lang} />
      </td>
      <td>
        <div className="rowact events-row-actions">
          <Link href={`${base}/new`} aria-label={L(['Düzenle', 'Edit'], lang)}>
            <Pencil />
          </Link>
          <Link
            href={`${base}/notify`}
            aria-label={L(['Bildirim gönder', 'Send notification'], lang)}
          >
            <Megaphone />
          </Link>
          <button type="button" aria-label={L(['Diğer işlemler', 'More actions'], lang)}>
            <MoreHorizontal />
          </button>
        </div>
      </td>
    </tr>
  );
}

export default async function EventsListPage({ params }: { params: Promise<{ hotelId: string }> }) {
  const { hotelId } = await params;
  const lang = await getLang();
  const base = `/h/${hotelId}/events`;

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
              {MOCK_EVENTS.map((event) => (
                <EventTableRow
                  base={base}
                  event={event}
                  lang={lang}
                  key={`${event.day}-${event.time}-${event.category}`}
                />
              ))}
            </tbody>
          </table>
        </div>
        <div className="pager events-pager">
          <div className="pager__info">
            {L(['9 etkinlikten 1-9 arası', 'Showing 1-9 of 9 events'], lang)}
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
