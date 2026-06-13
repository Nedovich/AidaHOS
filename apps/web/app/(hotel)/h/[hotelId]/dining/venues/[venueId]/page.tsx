import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  CalendarDays,
  ChevronRight,
  Download,
  Edit3,
  LayoutGrid,
  Layers3,
  MapPin,
  Phone,
  Plus,
  Star,
  Table2,
  TicketCheck,
  TrendingUp,
  UtensilsCrossed,
  Users,
} from 'lucide-react';
import { Kpi } from '@/components/console/charts';
import { Subhero } from '@/components/console/survey-helpers';
import {
  DINING_RESERVATIONS,
  DINING_VENUES,
  formatEuro,
  localize,
  type DiningReservation,
  type ReservationStatus,
} from '@/lib/dining-mock';
import { L, type Lang } from '@/lib/i18n';
import { getLang } from '@/lib/i18n-server';

const RESERVATION_STATUS: Record<
  ReservationStatus,
  { cls: string; label: readonly [string, string] }
> = {
  confirmed: { cls: 'info', label: ['Onaylandı', 'Confirmed'] },
  seated: { cls: 'ok', label: ['Masada', 'Seated'] },
  completed: { cls: 'ok', label: ['Tamamlandı', 'Completed'] },
  cancelled: { cls: 'err', label: ['İptal', 'Cancelled'] },
  noshow: { cls: 'warn', label: ['Gelmedi', 'No-show'] },
};

const TABLES = [
  ['A-01', 2, 'full'],
  ['A-02', 4, 'busy'],
  ['A-03', 2, 'open'],
  ['A-04', 4, 'busy'],
  ['A-05', 6, 'open'],
  ['A-06', 2, 'busy'],
  ['A-07', 2, 'full'],
  ['A-08', 4, 'open'],
  ['A-09', 6, 'busy'],
  ['A-10', 2, 'open'],
  ['A-11', 4, 'open'],
  ['A-12', 2, 'busy'],
] as const;

const TOP_ITEMS = [
  { name: 'Izgara Levrek', orders: 32, price: '€32' },
  { name: 'Adana Kebap', orders: 28, price: '€24' },
  { name: 'Karides Linguine', orders: 21, price: '€28' },
  { name: 'Baklava Tabağı', orders: 18, price: '€9' },
];

function ReservationBadge({ status, lang }: { status: ReservationStatus; lang: Lang }) {
  const meta = RESERVATION_STATUS[status];
  return (
    <span className={`badge badge--${meta.cls}`}>
      <span className="ico-dot" />
      {L(meta.label, lang)}
    </span>
  );
}

function ReservationRow({ reservation, lang }: { reservation: DiningReservation; lang: Lang }) {
  return (
    <div className="tline__row">
      <div className="tline__time">{reservation.time}</div>
      <div className="tline__bar" style={{ background: 'var(--accent)' }} />
      <div className="tline__body">
        <div className="tline__name">
          {reservation.guest}{' '}
          <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>· Rm {reservation.room}</span>
        </div>
        <div className="tline__meta">
          <span>
            <Users size={12} />
            {reservation.party}
          </span>
          <span>
            <LayoutGrid size={12} />
            {reservation.table}
          </span>
        </div>
      </div>
      <ReservationBadge status={reservation.status} lang={lang} />
    </div>
  );
}

function TableTile({
  label,
  seats,
  state,
}: {
  label: string;
  seats: number;
  state: 'open' | 'busy' | 'full';
}) {
  const color =
    state === 'open' ? 'var(--success)' : state === 'busy' ? 'var(--accent)' : 'var(--warning)';
  return (
    <div className="vtile" style={{ borderTopColor: color }}>
      <div className="vtile__name">{label}</div>
      <div className="vtile__meta">
        <Users size={11} />
        {seats}
      </div>
    </div>
  );
}

export default async function DiningVenueDetail({
  params,
}: {
  params: Promise<{ hotelId: string; venueId: string }>;
}) {
  const { hotelId, venueId } = await params;
  const lang = await getLang();
  const base = `/h/${hotelId}/dining`;
  const venue = DINING_VENUES.find((item) => item.id === venueId);

  if (!venue) notFound();

  const pct = Math.round((venue.occupancy / venue.capacity) * 100);
  const avgSpend = Math.round(venue.revenue / Math.max(venue.reservations, 1));
  const reservations = DINING_RESERVATIONS.filter(
    (reservation) => reservation.venueId === venue.id,
  );

  return (
    <div className="dining-venue-detail fade-in">
      <Subhero
        backHref={`${base}/venues`}
        crumb={
          <>
            <Link href={`${base}/venues`}>{L(['Mekanlar', 'Venues'], lang)}</Link>
            <ChevronRight size={15} />
            <b>{venue.name}</b>
          </>
        }
        title={venue.name}
        pill={
          <span className="badge badge--info" style={{ marginLeft: 12 }}>
            <span className="ico-dot" />
            {L(['Restoran', 'Restaurant'], lang)}
          </span>
        }
        sub={
          <>
            {localize(venue.type, lang)} · 19:00 - 23:30 ·{' '}
            {L(['Şef Andrea Ricci', 'Chef Andrea Ricci'], lang)}
          </>
        }
        actions={
          <div className="page-hero__actions">
            <Link className="btn btn--ghost" href={`${base}/tables`}>
              <LayoutGrid />
              {L(['Floor Plan', 'Floor Plan'], lang)}
            </Link>
            <Link className="btn btn--ghost" href={`${base}/menu`}>
              <Layers3 />
              {L(['Menü', 'Menu'], lang)}
            </Link>
            <Link className="btn btn--primary" href={`${base}/reservations/new`}>
              <Plus />
              {L(['Yeni Rezervasyon', 'New Reservation'], lang)}
            </Link>
          </div>
        }
      />

      <div className="dining-detail-kpis">
        <Kpi
          icon={<Table2 size={20} />}
          label={L(['Bugünkü Doluluk', "Today's Occupancy"], lang)}
          value={`${venue.occupancy}/${venue.capacity}`}
          note={`${pct}%`}
          live
        />
        <Kpi
          icon={<CalendarDays size={20} />}
          label={L(['Rezervasyonlar', 'Reservations'], lang)}
          value={venue.reservations}
          delta={12.5}
          note={L(['geçen haftaya göre', 'vs last week'], lang)}
        />
        <Kpi
          icon={<TrendingUp size={20} />}
          label={L(['Bugünkü Gelir', 'Revenue Today'], lang)}
          value={formatEuro(venue.revenue)}
          delta={8.2}
          note={L(['geçen haftaya göre', 'vs last week'], lang)}
        />
        <Kpi
          icon={<TicketCheck size={20} />}
          label={L(['Ort. Harcama', 'Avg Spend'], lang)}
          value={`€${avgSpend}`}
          delta={3.1}
          note={L(['geçen haftaya göre', 'vs last week'], lang)}
        />
      </div>

      <div className="dining-detail-grid">
        <div className="dining-detail-stack">
          <section className="card">
            <div className="card__head">
              <div>
                <div className="card__title">
                  {L(['Bugünkü Rezervasyonlar', "Today's Reservations"], lang)}
                </div>
                <div className="card__sub">
                  {venue.reservations} {L(['rezervasyon', 'reservations'], lang)}
                </div>
              </div>
              <Link className="btn btn--sm btn--subtle" href={`${base}/reservations`}>
                {L(['Tümünü Gör', 'View all'], lang)}
              </Link>
            </div>
            <div className="card__body dining-detail-card-body">
              <div className="tline">
                {reservations.length > 0 ? (
                  reservations.map((reservation) => (
                    <ReservationRow key={reservation.id} reservation={reservation} lang={lang} />
                  ))
                ) : (
                  <div className="empty-line">
                    {L(['Bugün için rezervasyon bulunmuyor.', 'No reservations for today.'], lang)}
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="card">
            <div className="card__head">
              <div className="card__title">
                {L(['Masa Planı (Önizleme)', 'Floor Plan (Preview)'], lang)}
              </div>
              <Link className="btn btn--sm btn--subtle" href={`${base}/tables`}>
                {L(['Tam Görünüm', 'Open full view'], lang)}
              </Link>
            </div>
            <div className="card__body dining-detail-card-body">
              <div className="vgrid">
                {TABLES.map(([label, seats, state]) => (
                  <TableTile key={label} label={label} seats={seats} state={state} />
                ))}
              </div>
            </div>
          </section>

          <section className="card">
            <div className="card__head">
              <div className="card__title">
                {L(['En Çok Satan Ürünler', 'Top Selling Items'], lang)}
              </div>
              <Link className="btn btn--sm btn--subtle" href={`${base}/menu`}>
                {L(['Menüyü Aç', 'Open menu'], lang)}
              </Link>
            </div>
            <div className="card__body dining-detail-card-body">
              {TOP_ITEMS.map((item) => (
                <div className="aspect dining-menu-aspect" key={item.name}>
                  <div className="aspect__l dining-menu-aspect__label">
                    <span className="mini-av" style={{ background: venue.color }}>
                      <UtensilsCrossed size={13} />
                    </span>
                    {item.name}
                  </div>
                  <div className="aspect__bar">
                    <div
                      className="aspect__fill"
                      style={{ width: `${item.orders * 2.7}%`, background: venue.color }}
                    />
                  </div>
                  <div className="aspect__v">
                    {item.orders}x <span>{item.price}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="dining-detail-side">
          <section className="card">
            <div className="card__body dining-detail-side-body">
              <div className="card__title dining-side-title">
                {L(['Mekan Bilgileri', 'Venue Info'], lang)}
              </div>
              <div className="stat-row">
                <span className="stat-row__k">
                  <Layers3 size={15} />
                  {L(['Mutfak', 'Cuisine'], lang)}
                </span>
                <span className="stat-row__v">{localize(venue.type, lang)}</span>
              </div>
              <div className="stat-row">
                <span className="stat-row__k">
                  <CalendarDays size={15} />
                  {L(['Çalışma Saati', 'Hours'], lang)}
                </span>
                <span className="stat-row__v">19:00 - 23:30</span>
              </div>
              <div className="stat-row">
                <span className="stat-row__k">
                  <Users size={15} />
                  {L(['Kapasite', 'Capacity'], lang)}
                </span>
                <span className="stat-row__v">
                  {venue.capacity} {L(['kişi', 'seats'], lang)}
                </span>
              </div>
              <div className="stat-row">
                <span className="stat-row__k">
                  <LayoutGrid size={15} />
                  {L(['Masa Sayısı', 'Tables'], lang)}
                </span>
                <span className="stat-row__v">12</span>
              </div>
              <div className="stat-row">
                <span className="stat-row__k">
                  <MapPin size={15} />
                  {L(['Lokasyon', 'Location'], lang)}
                </span>
                <span className="stat-row__v">{localize(venue.location, lang)}</span>
              </div>
              <div className="divider" />
              <div className="stat-row">
                <span className="stat-row__k">
                  <Users size={15} />
                  {L(['Müdür', 'Manager'], lang)}
                </span>
                <span className="stat-row__v">Lara Conti</span>
              </div>
              <div className="stat-row">
                <span className="stat-row__k">
                  <Phone size={15} />
                  {L(['Dahili', 'Extension'], lang)}
                </span>
                <span className="stat-row__v mono">2401</span>
              </div>
            </div>
          </section>

          <section className="card">
            <div className="card__body dining-detail-side-body">
              <div className="card__title dining-side-title">
                {L(['Durum & İşlemler', 'Status & Actions'], lang)}
              </div>
              <label className="flabel">{L(['Mekan Durumu', 'Venue Status'], lang)}</label>
              <div className="fselect dining-status-select">
                <span>
                  <span className="ico-dot" />
                  {L(['Açık', 'Open'], lang)}
                </span>
                <ChevronRight size={16} />
              </div>
              <div className="optrow">
                <div>
                  <div className="optrow__t">
                    {L(['Rezervasyon kabul et', 'Accept reservations'], lang)}
                  </div>
                </div>
                <span className="switch on" />
              </div>
              <div className="optrow">
                <div>
                  <div className="optrow__t">{L(['Online sipariş', 'Online ordering'], lang)}</div>
                </div>
                <span className="switch on" />
              </div>
              <div className="optrow">
                <div>
                  <div className="optrow__t">
                    {L(['Misafir portalında göster', 'Show on guest portal'], lang)}
                  </div>
                </div>
                <span className="switch on" />
              </div>
              <div className="divider" />
              <div className="dining-detail-actions">
                <Link className="btn btn--ghost" href={`${base}/venues/${venue.id}/edit`}>
                  <Edit3 />
                  {L(['Mekanı Düzenle', 'Edit Venue'], lang)}
                </Link>
                <button className="btn btn--subtle" type="button">
                  <Download />
                  {L(['Rapor İndir', 'Download Report'], lang)}
                </button>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
