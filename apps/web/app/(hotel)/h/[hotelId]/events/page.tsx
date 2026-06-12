import Link from 'next/link';
import {
  ArrowRight,
  CalendarDays,
  Clock3,
  Dumbbell,
  Gift,
  MapPin,
  Music2,
  Play,
  Plus,
  Sparkles,
  Star,
  Ticket,
  TrendingUp,
  Users,
  UtensilsCrossed,
  Waves,
  type LucideIcon,
} from 'lucide-react';
import { Donut, Kpi, MiniBar } from '@/components/console/charts';
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

function StatusBadge({ status, lang }: { status: EventStatus; lang: Lang }) {
  return (
    <span className={`badge badge--${STATUS_CLASSES[status]}`}>
      <span className="ico-dot" />
      {L(STATUS_LABELS[status], lang)}
    </span>
  );
}

function TimelineRow({ event, lang }: { event: MockEvent; lang: Lang }) {
  const category = EVENT_CATEGORIES[event.category];
  const percentage = Math.round((event.registrations / event.capacity) * 100);
  const barColor = percentage >= 95 ? 'var(--warning)' : category.color;

  return (
    <div className="tline__row">
      <div className="tline__time">{event.time}</div>
      <div className="tline__bar" style={{ background: category.color }} />
      <div className="tline__body">
        <div className="tline__name">{localize(event.name, lang)}</div>
        <div className="tline__meta">
          <span>
            <span className="cat__dot" style={{ background: category.color }} />
            {localize(category.label, lang)}
          </span>
          <span>
            <MapPin />
            {localize(event.location, lang)}
          </span>
          <span>
            <Clock3 />
            {event.time}-{event.end}
          </span>
        </div>
      </div>
      <div className="tline__pct">
        <div className="events-tabular">
          {event.registrations}/{event.capacity}
        </div>
        <MiniBar pct={percentage} color={barColor} />
      </div>
    </div>
  );
}

function EventRow({ event, lang, ranked }: { event: MockEvent; lang: Lang; ranked?: number }) {
  const category = EVENT_CATEGORIES[event.category];
  const percentage = Math.round((event.registrations / event.capacity) * 100);

  return (
    <div className="poprow">
      {ranked ? <div className="poprow__rank">{ranked}</div> : null}
      <div className="poprow__ico" style={{ background: category.soft, color: category.color }}>
        <CategoryIcon category={event.category} />
      </div>
      <div className="poprow__b">
        <div className="events-row-title">{localize(event.name, lang)}</div>
        {ranked ? (
          <div className="events-pop-progress">
            <MiniBar pct={percentage} color={category.color} />
            <span className="cell-sub">
              {event.registrations} {L(['kayıt', 'regs'], lang)}
            </span>
          </div>
        ) : (
          <div className="cell-sub">
            {localize(event.date, lang)} · {event.time} · {localize(event.location, lang)}
          </div>
        )}
      </div>
      {ranked ? null : <StatusBadge status={event.status} lang={lang} />}
    </div>
  );
}

export default async function EventsOverview({ params }: { params: Promise<{ hotelId: string }> }) {
  const { hotelId } = await params;
  const lang = await getLang();
  const base = `/h/${hotelId}/events`;
  const today = MOCK_EVENTS.filter((event) => event.day === 12).sort((a, b) =>
    a.time.localeCompare(b.time),
  );
  const upcoming = MOCK_EVENTS.filter((event) => event.day > 12 && event.status !== 'draft')
    .sort((a, b) => a.day - b.day || a.time.localeCompare(b.time))
    .slice(0, 5);
  const popular = [...MOCK_EVENTS].sort((a, b) => b.registrations - a.registrations).slice(0, 5);

  const categoryTotals = Object.entries(EVENT_CATEGORIES).map(([id, category]) => ({
    id: id as EventCategory,
    label: localize(category.label, lang),
    color: category.color,
    value: MOCK_EVENTS.filter((event) => event.category === id).reduce(
      (sum, event) => sum + event.registrations,
      0,
    ),
  }));
  const totalRegistrations = categoryTotals.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="events-overview fade-in">
      <div className="page-hero events-hero">
        <div>
          <h1 className="page-hero__h">{L(['Etkinlikler', 'Events'], lang)}</h1>
          <p className="page-hero__sub">
            {L(
              [
                'Otelinizin tüm animasyon, etkinlik ve aktivite programını tek merkezden yönetin.',
                "Manage your hotel's entire animation, event and activity program from one place.",
              ],
              lang,
            )}
          </p>
        </div>
        <div className="page-hero__actions">
          <Link className="btn btn--ghost" href={`${base}/calendar`}>
            <CalendarDays />
            {L(['Takvim', 'Calendar'], lang)}
          </Link>
          <Link className="btn btn--primary" href={`${base}/new`}>
            <Plus />
            {L(['Yeni Etkinlik', 'New Event'], lang)}
          </Link>
        </div>
      </div>

      <EventsSubnav hotelId={hotelId} active="overview" lang={lang} />

      <div className="ai-insight events-insight">
        <div className="ai-insight__ico">
          <Sparkles size={20} />
        </div>
        <div className="events-insight__copy">
          <div className="ai-insight__label">{L(['AIDA Öngörüsü', 'AIDA Insight'], lang)}</div>
          <div className="ai-insight__text">
            {lang === 'tr' ? (
              <>
                <b>Türk Gecesi</b> ve <b>Gala Akşam Yemeği</b> bu hafta %90 kapasiteyi aşacak. Cuma
                günü için ikinci bir seans açmayı değerlendirin.
              </>
            ) : (
              <>
                <b>Turkish Night</b> and <b>Gala Dinner</b> will exceed 90% capacity this week -
                consider opening a second Friday session.
              </>
            )}
          </div>
        </div>
        <Link className="btn btn--sm btn--ghost events-insight__action" href={`${base}/ai`}>
          {L(['AI Asistan', 'AI Assistant'], lang)}
          <ArrowRight size={14} />
        </Link>
      </div>

      <div className="events-kpi-grid">
        <Kpi
          icon={<CalendarDays />}
          label={L(['Yaklaşan Etkinlikler', 'Upcoming Events'], lang)}
          value="24"
          delta={8}
          note={L(['geçen haftaya göre', 'vs last week'], lang)}
        />
        <Kpi
          icon={<Play />}
          label={L(['Bugünkü Etkinlikler', "Today's Events"], lang)}
          value="6"
          note={L(['3 canlı', '3 live'], lang)}
          live
        />
        <Kpi
          icon={<Ticket />}
          label={L(['Toplam Kayıt', 'Total Registrations'], lang)}
          value="3 482"
          delta={12.4}
          note={L(['geçen haftaya göre', 'vs last week'], lang)}
        />
        <Kpi
          icon={<Users />}
          label={L(['Ortalama Katılım', 'Avg Attendance'], lang)}
          value="87%"
          delta={2.1}
          note={L(['geçen haftaya göre', 'vs last week'], lang)}
        />
        <Kpi
          icon={<TrendingUp />}
          label={L(['Doluluk Oranı', 'Fill Rate'], lang)}
          value="78%"
          delta={5.6}
          note={L(['geçen haftaya göre', 'vs last week'], lang)}
        />
      </div>

      <div className="events-primary-grid">
        <section className="card">
          <div className="card__head">
            <div>
              <h2 className="card__title">{L(['Bugünkü Program', "Today's Program"], lang)}</h2>
              <div className="card__sub">
                {L(['12 Haziran · 6 etkinlik', 'June 12 · 6 events'], lang)}
              </div>
            </div>
            <Link className="btn btn--sm btn--subtle" href={`${base}/calendar`}>
              {L(['Takvimde Gör', 'View calendar'], lang)}
            </Link>
          </div>
          <div className="card__body events-card-body">
            <div className="tline">
              {today.map((event) => (
                <TimelineRow event={event} lang={lang} key={`${event.day}-${event.time}`} />
              ))}
            </div>
          </div>
        </section>

        <section className="card">
          <div className="card__head">
            <h2 className="card__title">{L(['Yaklaşan Etkinlikler', 'Upcoming Events'], lang)}</h2>
            <Link className="btn btn--sm btn--subtle" href={`${base}/list`}>
              {L(['Tümünü gör', 'View all'], lang)}
            </Link>
          </div>
          <div className="card__body events-card-body">
            {upcoming.map((event) => (
              <EventRow event={event} lang={lang} key={`${event.day}-${event.time}`} />
            ))}
          </div>
        </section>
      </div>

      <div className="events-secondary-grid">
        <section className="card">
          <div className="card__head">
            <h2 className="card__title">
              {L(['En Popüler Etkinlikler', 'Most Popular Events'], lang)}
            </h2>
            <span className="badge badge--accent">
              {L(['Kayıt sayısına göre', 'By registrations'], lang)}
            </span>
          </div>
          <div className="card__body events-card-body">
            {popular.map((event, index) => (
              <EventRow
                event={event}
                lang={lang}
                ranked={index + 1}
                key={`${event.day}-${event.time}`}
              />
            ))}
          </div>
        </section>

        <section className="card">
          <div className="card__head">
            <div>
              <h2 className="card__title">{L(['Kategori Dağılımı', 'Category Mix'], lang)}</h2>
              <div className="card__sub">
                {L(['Kayıtların kategori kırılımı', 'Registrations by category'], lang)}
              </div>
            </div>
          </div>
          <div className="card__body events-mix">
            <Donut
              segments={categoryTotals.map(({ label, value, color }) => ({ label, value, color }))}
              center={
                totalRegistrations >= 1000
                  ? `${(totalRegistrations / 1000).toFixed(1)}k`
                  : `${totalRegistrations}`
              }
              centerSub={L(['kayıt', 'regs'], lang)}
              size={158}
              stroke={18}
            />
            <div className="events-mix__legend">
              {categoryTotals.map((item) => (
                <div className="events-mix__row" key={item.id}>
                  <span className="legend__sw" style={{ background: item.color }} />
                  <span>{item.label}</span>
                  <strong>{Math.round((item.value / totalRegistrations) * 100)}%</strong>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
