import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { CSSProperties, ReactNode } from 'react';
import {
  Building2,
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  Copy,
  Download,
  Eye,
  Globe2,
  Layers3,
  MapPin,
  Megaphone,
  Pencil,
  Play,
  Plus,
  Share2,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import {
  getEventById,
  getHotelById,
  listEventCategories,
  listEventRegistrations,
  listGroupEventLocations,
  resolveLoc,
  type Loc,
} from '@aidahos/db';
import { MiniBar } from '@/components/console/charts';
import { Subhero } from '@/components/console/survey-helpers';
import { L, type Lang } from '@/lib/i18n';
import { getLang } from '@/lib/i18n-server';

const LANG_LABELS: Record<string, string> = { tr: 'TR', en: 'EN', de: 'DE', ru: 'RU' };
const LANG_ORDER = ['tr', 'en', 'de', 'ru'] as const;

type EventStatus = 'draft' | 'scheduled' | 'live' | 'full' | 'completed' | 'cancelled';

const STATUS_LABELS: Record<EventStatus, readonly [string, string]> = {
  scheduled: ['Planlandı', 'Scheduled'],
  live: ['Devam Ediyor', 'Live'],
  full: ['Dolu', 'Full'],
  completed: ['Tamamlandı', 'Completed'],
  draft: ['Taslak', 'Draft'],
  cancelled: ['İptal Edildi', 'Cancelled'],
};

const STATUS_CLASSES: Record<EventStatus, string> = {
  scheduled: 'info',
  live: 'ok',
  full: 'warn',
  completed: 'mute',
  draft: 'mute',
  cancelled: 'err',
};

function fmtDate(d: Date | null, lang: Lang): string {
  if (!d) return '—';
  return new Intl.DateTimeFormat(lang === 'tr' ? 'tr-TR' : 'en-US', {
    day: '2-digit',
    month: 'short',
  }).format(d);
}

function fmtWeekday(d: Date | null, lang: Lang): string {
  if (!d) return '';
  return new Intl.DateTimeFormat(lang === 'tr' ? 'tr-TR' : 'en-US', { weekday: 'long' }).format(d);
}

function fmtTime(d: Date | null): string {
  if (!d) return '';
  return new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' }).format(d);
}

function fmtDateTime(d: Date | null, lang: Lang): string {
  if (!d) return '—';
  return new Intl.DateTimeFormat(lang === 'tr' ? 'tr-TR' : 'en-US', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d);
}

function durationLabel(start: Date | null, end: Date | null, lang: Lang): string {
  if (!start || !end) return '—';
  const minutes = Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000));
  if (minutes % 60 === 0) {
    const hours = minutes / 60;
    return lang === 'tr' ? `${hours} saat` : `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
  }
  return lang === 'tr' ? `${minutes} dk` : `${minutes} min`;
}

function StatusBadge({ status, lang }: { status: EventStatus; lang: Lang }) {
  return (
    <span className={`badge badge--${STATUS_CLASSES[status]}`}>
      <span className="ico-dot" />
      {L(STATUS_LABELS[status], lang)}
    </span>
  );
}

function FactRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="stat-row events-detail-fact">
      <span className="stat-row__k">
        {icon}
        {label}
      </span>
      <span className="stat-row__v">{value}</span>
    </div>
  );
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ hotelId: string; eventId: string }>;
}) {
  const { hotelId, eventId } = await params;
  const lang = await getLang();
  const base = `/h/${hotelId}/events`;
  const rl = (l: Loc | null | undefined) =>
    l ? resolveLoc(l, lang === 'tr' ? 'tr' : 'en', 'en') : '';

  const hotel = await getHotelById(hotelId);
  const groupId = hotel?.hotelGroupId ?? '';
  const ev = await getEventById(eventId);
  if (!ev || !groupId || ev.hotelGroupId !== groupId) notFound();

  const [cats, locs, registrations] = await Promise.all([
    listEventCategories(groupId),
    listGroupEventLocations(groupId),
    listEventRegistrations(eventId),
  ]);
  const cat = ev.categoryId ? cats.find((item) => item.id === ev.categoryId) : undefined;
  const loc = ev.locationId ? locs.find((item) => item.id === ev.locationId) : undefined;
  const start = ev.startsAt ? new Date(ev.startsAt) : null;
  const end = ev.endsAt ? new Date(ev.endsAt) : null;
  const createdAt = ev.createdAt ? new Date(ev.createdAt) : null;
  const updatedAt = ev.updatedAt ? new Date(ev.updatedAt) : null;
  const name = rl(ev.name as Loc) || L(['(adsız)', '(untitled)'], lang);
  const description = rl(ev.description as Loc);
  const categoryName = cat ? rl(cat.name as Loc) : '';
  const locationName = loc ? rl(loc.name as Loc) : '';
  const categoryColor = cat?.color ?? 'var(--accent)';
  const categorySoft = `color-mix(in srgb, ${categoryColor} 14%, transparent)`;
  const eventStatus = ev.status as EventStatus;

  const capacity = ev.capacity ?? 0;
  const registered = registrations.length;
  const percentage = capacity > 0 ? Math.round((registered / capacity) * 100) : 0;
  const remaining = Math.max(0, capacity - registered);

  const date = fmtDate(start, lang);
  const weekday = fmtWeekday(start, lang);
  const time = fmtTime(start);
  const endTime = fmtTime(end);
  const timeRange = start
    ? `${time}${end ? `–${endTime}` : ''}`
    : L(['Saat belirlenmedi', 'No time set'], lang);

  // Languages the event is actually authored in (keys present in the name Loc).
  const nameLoc = (ev.name ?? {}) as Loc;
  const langList = LANG_ORDER.filter((k) => {
    const v = nameLoc[k];
    return typeof v === 'string' && v.trim().length > 0;
  }).map((k) => LANG_LABELS[k]);
  const languagesValue = langList.length ? langList.join(' · ') : '—';

  const visibilityValue =
    ev.visibility === 'guest_portal' || !ev.visibility
      ? L(['Misafir Portalı', 'Guest Portal'], lang)
      : ev.visibility === 'staff'
        ? L(['Sadece Ekip', 'Staff Only'], lang)
        : ev.visibility;

  const facts = [
    {
      label: L(['Tarih', 'Date'], lang),
      value: start ? `${date}${weekday ? ` · ${weekday}` : ''}` : '—',
      icon: <CalendarDays size={15} />,
    },
    {
      label: L(['Saat', 'Time'], lang),
      value: start ? (end ? `${time} – ${endTime}` : time) : '—',
      icon: <Clock3 size={15} />,
    },
    {
      label: L(['Süre', 'Duration'], lang),
      value: durationLabel(start, end, lang),
      icon: <Play size={15} />,
    },
    {
      label: L(['Lokasyon', 'Location'], lang),
      value: locationName || '—',
      icon: <MapPin size={15} />,
    },
    {
      label: L(['Otel', 'Hotel'], lang),
      value: hotel?.name ?? '—',
      icon: <Building2 size={15} />,
    },
    {
      label: L(['Kategori', 'Category'], lang),
      value: categoryName || '—',
      icon: <Layers3 size={15} />,
    },
    { label: L(['Diller', 'Languages'], lang), value: languagesValue, icon: <Globe2 size={15} /> },
    {
      label: L(['Görünürlük', 'Visibility'], lang),
      value: visibilityValue,
      icon: <Eye size={15} />,
    },
  ];

  // Real audit trail from the row's timestamps.
  const activity = [
    updatedAt && createdAt && updatedAt.getTime() - createdAt.getTime() > 1000
      ? {
          icon: <Pencil size={13} />,
          color: 'var(--text-3)',
          title: L(['Etkinlik güncellendi', 'Event updated'], lang),
          when: fmtDateTime(updatedAt, lang),
        }
      : null,
    createdAt
      ? {
          icon: <Plus size={13} />,
          color: 'var(--text-3)',
          title: L(['Etkinlik oluşturuldu', 'Event created'], lang),
          when: fmtDateTime(createdAt, lang),
        }
      : null,
  ].filter((item): item is NonNullable<typeof item> => item !== null);

  return (
    <div className="events-detail fade-in">
      <Subhero
        backHref={`${base}/list`}
        crumb={
          <>
            <Link href={`${base}/list`}>{L(['Etkinlikler', 'Events'], lang)}</Link>
            <ChevronRight size={13} />
            <b>{name}</b>
          </>
        }
        title={name}
        pill={
          <>
            {cat ? (
              <span
                className="catbadge events-detail-category-pill"
                style={{ background: categorySoft, color: categoryColor }}
              >
                <span className="ico-dot" style={{ background: categoryColor }} />
                {categoryName}
              </span>
            ) : null}
            <StatusBadge status={eventStatus} lang={lang} />
          </>
        }
        sub={[date, timeRange, locationName].filter(Boolean).join(' · ')}
        actions={
          <>
            <Link className="btn btn--ghost" href={`${base}/notify`}>
              <Megaphone />
              {L(['Bildir', 'Notify'], lang)}
            </Link>
            <Link className="btn btn--ghost" href={`${base}/${eventId}/edit`}>
              <Pencil />
              {L(['Düzenle', 'Edit'], lang)}
            </Link>
            <button className="btn btn--dangerghost" type="button">
              <Trash2 />
              {L(['Sil', 'Delete'], lang)}
            </button>
          </>
        }
      />

      <section
        className="events-detail-cover"
        style={
          {
            '--event-color': categoryColor,
            ...(ev.coverUrl
              ? { backgroundImage: `url(${ev.coverUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
              : {}),
          } as CSSProperties
        }
      >
        <div className="events-detail-cover__dots" />
        <div className="events-detail-cover__shade" />
        <div className="events-detail-cover__chips">
          {cat ? (
            <span className="catbadge">
              <Layers3 size={13} />
              {categoryName}
            </span>
          ) : null}
          {eventStatus === 'live' ? (
            <span className="catbadge">
              <span className="ico-dot" />
              {L(['Canlı', 'Live now'], lang)}
            </span>
          ) : (
            <StatusBadge status={eventStatus} lang={lang} />
          )}
        </div>
        <div className="events-detail-cover__bottom">
          <div>
            <h2>{name}</h2>
            <div className="events-detail-cover__meta">
              <span>
                <CalendarDays size={14} />
                {date}
              </span>
              <span>
                <Clock3 size={14} />
                {timeRange}
              </span>
              {locationName ? (
                <span>
                  <MapPin size={14} />
                  {locationName}
                </span>
              ) : null}
            </div>
          </div>
          <div className="events-detail-cover__rate">
            <strong>{percentage}%</strong>
            <span>
              {registered}/{capacity} {L(['kayıt', 'registered'], lang)}
            </span>
          </div>
        </div>
      </section>

      <div className="events-detail-grid">
        <div className="events-detail-main">
          <section className="card">
            <div className="card__body">
              <div className="card__title events-detail-card-title">
                {L(['Etkinlik Açıklaması', 'About this event'], lang)}
              </div>
              <p className="events-detail-description">
                {description || (
                  <span style={{ color: 'var(--text-3)' }}>
                    {L(['Açıklama eklenmedi.', 'No description added.'], lang)}
                  </span>
                )}
              </p>
            </div>
          </section>

          <section className="card">
            <div className="card__head">
              <div className="card__title">{L(['Etkinlik Detayları', 'Event Details'], lang)}</div>
            </div>
            <div className="card__body events-detail-facts">
              {facts.map((fact) => (
                <FactRow icon={fact.icon} label={fact.label} value={fact.value} key={fact.label} />
              ))}
            </div>
          </section>

          <section className="card">
            <div className="card__head">
              <div>
                <div className="card__title">
                  {L(['Son Kayıtlar', 'Recent Registrations'], lang)}
                </div>
                <div className="card__sub">
                  {registered} {L(['toplam kayıt', 'total registrations'], lang)}
                </div>
              </div>
              <Link className="btn btn--sm btn--subtle" href={`${base}/participants`}>
                {L(['Tümünü gör', 'View all'], lang)}
                <ChevronRight size={14} />
              </Link>
            </div>
            <div className="card__body events-detail-recent">
              {registrations.length === 0 ? (
                <div style={{ color: 'var(--text-3)', padding: '20px 4px', textAlign: 'center', fontSize: 13 }}>
                  {L(['Henüz kayıt yok.', 'No registrations yet.'], lang)}
                </div>
              ) : (
                <table className="table" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th>{L(['Misafir', 'Guest'], lang)}</th>
                      <th>{L(['Oda', 'Room'], lang)}</th>
                      <th>{L(['Kayıt Tarihi', 'Registered'], lang)}</th>
                      <th>{L(['Durum', 'Status'], lang)}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registrations.slice(0, 8).map((reg) => (
                      <tr key={reg.id}>
                        <td>
                          <div className="table__name">
                            <span className="events-avatar" style={{ background: 'var(--accent)', fontSize: 12 }}>
                              {(reg.guestName ?? '?').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
                            </span>
                            <strong>{reg.guestName ?? '—'}</strong>
                          </div>
                        </td>
                        <td className="mono">{reg.roomNo ?? '—'}</td>
                        <td style={{ fontSize: 13, color: 'var(--text-2)' }}>
                          {new Intl.DateTimeFormat(lang === 'tr' ? 'tr-TR' : 'en-US', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(reg.createdAt))}
                        </td>
                        <td>
                          <span className="badge badge--info">
                            <span className="ico-dot" />
                            {reg.status === 'pending' ? L(['Bekliyor', 'Pending'], lang) : reg.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        </div>

        <aside className="events-detail-side">
          <section className="card">
            <div className="card__body">
              <div className="card__title events-detail-card-title">
                {L(['Kapasite', 'Capacity'], lang)}
              </div>
              <div className="events-detail-cap-head">
                <div>
                  <strong>
                    {registered}
                    <span>/{capacity}</span>
                  </strong>
                  <div className="cell-sub">
                    {L(['kayıtlı misafir', 'registered guests'], lang)}
                  </div>
                </div>
                <div>
                  <b style={{ color: percentage >= 95 ? 'var(--warning)' : categoryColor }}>
                    {percentage}%
                  </b>
                  <div className="cell-sub">{L(['doluluk', 'fill rate'], lang)}</div>
                </div>
              </div>
              <MiniBar
                pct={percentage}
                color={percentage >= 95 ? 'var(--warning)' : categoryColor}
                maxWidth={999}
              />
              <div className="divider" />
              <FactRow
                icon={<Check size={15} />}
                label={L(['Kayıtlı', 'Registered'], lang)}
                value={`${registered}`}
              />
              <FactRow
                icon={<Plus size={15} />}
                label={L(['Kalan', 'Remaining'], lang)}
                value={`${remaining}`}
              />
              <FactRow
                icon={<Clock3 size={15} />}
                label={L(['Bekleme listesi', 'Waitlist'], lang)}
                value="0"
              />
              <Link
                className="btn btn--primary events-detail-side-action"
                href={`${base}/participants`}
              >
                <Users size={16} />
                {L(['Katılımcıları Yönet', 'Manage Participants'], lang)}
              </Link>
            </div>
          </section>

          <section className="card">
            <div className="card__body">
              <div className="card__title events-detail-card-title">
                {L(['Hızlı Eylemler', 'Quick Actions'], lang)}
              </div>
              <div className="events-detail-action-list">
                <Link className="btn btn--subtle" href={`${base}/${eventId}/edit`}>
                  <Pencil size={15} />
                  {L(['Etkinliği Düzenle', 'Edit Event'], lang)}
                </Link>
                <Link className="btn btn--subtle" href={`${base}/notify`}>
                  <Megaphone size={15} />
                  {L(['Bildirim Gönder', 'Send Notification'], lang)}
                </Link>
                <button className="btn btn--subtle" type="button">
                  <Copy size={15} />
                  {L(['Etkinliği Çoğalt', 'Duplicate Event'], lang)}
                </button>
                <button className="btn btn--subtle" type="button">
                  <Download size={15} />
                  {L(['Katılımcıları Dışa Aktar', 'Export Participants'], lang)}
                </button>
                <button className="btn btn--subtle" type="button">
                  <Share2 size={15} />
                  {L(['Bağlantıyı Paylaş', 'Share Link'], lang)}
                </button>
              </div>
            </div>
          </section>

          <section className="card">
            <div className="card__body">
              <div className="card__title events-detail-card-title">
                {L(['Aktivite Geçmişi', 'Activity'], lang)}
              </div>
              <div className="events-detail-activity">
                {activity.map((item, index) => (
                  <div className="events-detail-activity-item" key={`${item.title}-${item.when}`}>
                    <span
                      className="events-detail-activity-icon"
                      style={
                        {
                          '--activity-color': item.color,
                        } as CSSProperties
                      }
                    >
                      {item.icon}
                    </span>
                    {index < activity.length - 1 ? (
                      <span className="events-detail-activity-line" />
                    ) : null}
                    <div>
                      <strong>{item.title}</strong>
                      <span>{item.when}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="card set-danger events-detail-danger">
            <div className="card__body">
              <div className="set-sec__title">{L(['Tehlikeli Bölge', 'Danger Zone'], lang)}</div>
              <p>
                {L(
                  [
                    'Bu etkinliği silmek tüm kayıtları, katılımcı verilerini ve bildirim geçmişini kalıcı olarak kaldırır.',
                    'Deleting this event permanently removes all registrations, participant data and notification history.',
                  ],
                  lang,
                )}
              </p>
              <div>
                <button className="btn btn--subtle btn--sm" type="button">
                  <X size={14} />
                  {L(['Etkinliği İptal Et', 'Cancel Event'], lang)}
                </button>
                <button className="btn btn--dangerghost btn--sm" type="button">
                  <Trash2 size={14} />
                  {L(['Sil', 'Delete'], lang)}
                </button>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
