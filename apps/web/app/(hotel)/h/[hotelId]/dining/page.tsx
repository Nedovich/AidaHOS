import Link from 'next/link';
import {
  ArrowRight,
  ClipboardList,
  CreditCard,
  Grid2X2,
  Plus,
  Table2,
  TrendingUp,
  Users,
  UtensilsCrossed,
  Wine,
  Coffee,
  Waves,
  Star,
  type LucideIcon,
} from 'lucide-react';
import { Donut, Kpi, MiniBar } from '@/components/console/charts';
import { DiningSubnav } from '@/components/console/dining/dining-subnav';
import {
  DINING_RESERVATIONS,
  DINING_VENUES,
  formatEuro,
  type DiningReservation,
  type DiningVenue,
  type ReservationStatus,
  type VenueIcon,
  type VenueStatus,
} from '@/lib/dining-mock';
import { L, type Lang } from '@/lib/i18n';
import { getLang } from '@/lib/i18n-server';

const VENUE_ICONS: Record<VenueIcon, LucideIcon> = {
  utensils: UtensilsCrossed,
  wine: Wine,
  coffee: Coffee,
  waves: Waves,
  star: Star,
};

const RES_STATUS: Record<ReservationStatus, { cls: string; label: readonly [string, string] }> = {
  confirmed: { cls: 'info', label: ['Onaylandı', 'Confirmed'] },
  seated: { cls: 'ok', label: ['Yerleşti', 'Seated'] },
  completed: { cls: 'mute', label: ['Tamamlandı', 'Completed'] },
  cancelled: { cls: 'err', label: ['İptal', 'Cancelled'] },
  noshow: { cls: 'warn', label: ['No-show', 'No-show'] },
};

const VENUE_STATUS: Record<VenueStatus, { cls: string; label: readonly [string, string] }> = {
  open: { cls: 'ok', label: ['Açık', 'Open'] },
  limited: { cls: 'warn', label: ['Sınırlı', 'Limited'] },
  closed: { cls: 'mute', label: ['Kapalı', 'Closed'] },
};

function VenueIcon({ venue, size = 16 }: { venue: DiningVenue; size?: number }) {
  const Icon = VENUE_ICONS[venue.icon];
  return <Icon size={size} />;
}

function ReservationBadge({ status, lang }: { status: ReservationStatus; lang: Lang }) {
  const meta = RES_STATUS[status];
  return (
    <span className={`badge badge--${meta.cls}`}>
      <span className="ico-dot" />
      {L(meta.label, lang)}
    </span>
  );
}

function VenueBadge({ status, lang }: { status: VenueStatus; lang: Lang }) {
  const meta = VENUE_STATUS[status];
  return (
    <span className={`badge badge--${meta.cls}`}>
      <span className="ico-dot" />
      {L(meta.label, lang)}
    </span>
  );
}

function reservationVenue(reservation: DiningReservation) {
  return DINING_VENUES.find((venue) => venue.id === reservation.venueId) ?? DINING_VENUES[0]!;
}

function ReservationRow({ reservation, lang }: { reservation: DiningReservation; lang: Lang }) {
  const venue = reservationVenue(reservation);
  return (
    <div className="tline__row">
      <div className="tline__time">{reservation.time}</div>
      <div className="tline__bar" style={{ background: venue.color }} />
      <div className="tline__body">
        <div className="tline__name">
          {reservation.guest}{' '}
          <span className="dining-muted">
            · {L(['Oda', 'Rm'], lang)} {reservation.room}
          </span>
        </div>
        <div className="tline__meta">
          <span>
            <UtensilsCrossed />
            {venue.name}
          </span>
          <span>
            <Users />
            {reservation.party} {L(['kişi', 'pax'], lang)}
          </span>
          <span>
            <Table2 />
            {reservation.table}
          </span>
        </div>
      </div>
      <div className="dining-row-status">
        <ReservationBadge status={reservation.status} lang={lang} />
      </div>
    </div>
  );
}

function LegendRows({ venues }: { venues: DiningVenue[] }) {
  return (
    <div className="dining-legend">
      {venues.map((venue) => (
        <div className="legend__i" key={venue.id}>
          <span className="legend__sw" style={{ background: venue.color }} />
          {venue.name}
          <span className="dining-legend__value">{formatEuro(venue.revenue)}</span>
        </div>
      ))}
    </div>
  );
}

function OccupancyRow({ venue, lang }: { venue: DiningVenue; lang: Lang }) {
  const pct = Math.round((venue.occupancy / venue.capacity) * 100);
  return (
    <div className="aspect dining-occupancy-row">
      <div className="aspect__l dining-venue-label">
        <span style={{ color: venue.color }}>
          <VenueIcon venue={venue} size={15} />
        </span>
        {venue.name}
      </div>
      <div className="aspect__bar">
        <div className="aspect__fill" style={{ width: `${pct}%`, background: venue.color }} />
      </div>
      <div className="aspect__v">
        {venue.occupancy}/{venue.capacity}
      </div>
      <VenueBadge status={venue.status} lang={lang} />
    </div>
  );
}

export default async function DiningOverview({ params }: { params: Promise<{ hotelId: string }> }) {
  const { hotelId } = await params;
  const lang = await getLang();
  const base = `/h/${hotelId}/dining`;
  const openVenues = DINING_VENUES.filter((venue) => venue.status === 'open');
  const venueTotal = openVenues.reduce((sum, venue) => sum + venue.revenue, 0);
  const servedGuests =
    DINING_RESERVATIONS.reduce((sum, reservation) => sum + reservation.party, 0) * 18;
  const occupiedTables = 38;
  const totalTables = 64;

  return (
    <div className="dining-overview fade-in">
      <div className="page-hero dining-hero">
        <div>
          <h1 className="page-hero__h">{L(['Restoran & Bar', 'Dining & Bars'], lang)}</h1>
          <p className="page-hero__sub">
            {L(
              [
                'Restoran, bar ve yeme-içme operasyonlarını yönetin.',
                'Manage restaurant, bar and dining operations.',
              ],
              lang,
            )}
          </p>
        </div>
        <div className="page-hero__actions">
          <Link className="btn btn--ghost" href={`${base}/tables`}>
            <Grid2X2 />
            {L(['Masa Planı', 'Floor Plan'], lang)}
          </Link>
          <Link className="btn btn--primary" href={`${base}/reservations/new`}>
            <Plus />
            {L(['Yeni Rezervasyon', 'New Reservation'], lang)}
          </Link>
        </div>
      </div>

      <DiningSubnav hotelId={hotelId} active="overview" lang={lang} />

      <div className="dining-kpi-grid">
        <Kpi
          icon={<UtensilsCrossed />}
          label={L(['Aktif Mekan', 'Active Venues'], lang)}
          value={String(openVenues.length)}
          note={L([`${DINING_VENUES.length} mekandan`, `of ${DINING_VENUES.length} venues`], lang)}
        />
        <Kpi
          icon={<ClipboardList />}
          label={L(['Bugünkü Rezervasyon', "Today's Reservations"], lang)}
          value="151"
          delta={8.4}
          note={L(['geçen haftaya göre', 'vs last week'], lang)}
        />
        <Kpi
          icon={<Table2 />}
          label={L(['Dolu Masa', 'Occupied Tables'], lang)}
          value={`${occupiedTables}/${totalTables}`}
          note={L(['%59 doluluk', '59% full'], lang)}
          live
        />
        <Kpi
          icon={<Users />}
          label={L(['Ağırlanan Misafir', 'Guests Served'], lang)}
          value={servedGuests.toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US')}
          delta={6.1}
          note={L(['geçen haftaya göre', 'vs last week'], lang)}
        />
        <Kpi
          icon={<CreditCard />}
          label={L(['Bugünkü Gelir', 'Revenue Today'], lang)}
          value={formatEuro(venueTotal)}
          delta={12.2}
          note={L(['geçen haftaya göre', 'vs last week'], lang)}
        />
        <Kpi
          icon={<TrendingUp />}
          label={L(['Ortalama Harcama', 'Average Spend'], lang)}
          value="€34"
          delta={3.1}
          note={L(['geçen haftaya göre', 'vs last week'], lang)}
        />
      </div>

      <div className="dining-primary-grid">
        <section className="card">
          <div className="card__head">
            <div>
              <h2 className="card__title">
                {L(['Bugünkü Rezervasyonlar', "Today's Reservations"], lang)}
              </h2>
              <div className="card__sub">{L(['151 rezervasyon', '151 reservations'], lang)}</div>
            </div>
            <Link className="btn btn--sm btn--subtle" href={`${base}/reservations`}>
              {L(['Tümünü gör', 'View all'], lang)}
            </Link>
          </div>
          <div className="card__body dining-card-body">
            <div className="tline">
              {DINING_RESERVATIONS.map((reservation) => (
                <ReservationRow key={reservation.id} reservation={reservation} lang={lang} />
              ))}
            </div>
          </div>
        </section>

        <div className="dining-side-stack">
          <section className="card">
            <div className="card__head">
              <h2 className="card__title">{L(['Mekan Geliri', 'Revenue by Venue'], lang)}</h2>
            </div>
            <div className="card__body dining-revenue-body">
              <Donut
                segments={openVenues.map((venue) => ({
                  label: venue.name,
                  value: venue.revenue,
                  color: venue.color,
                }))}
                center={formatEuro(venueTotal)}
                centerSub={L(['bugün', 'today'], lang)}
                size={140}
                stroke={16}
              />
              <LegendRows venues={openVenues} />
            </div>
          </section>

          <section className="card">
            <div className="card__head">
              <h2 className="card__title">{L(['Mekan Doluluğu', 'Venue Occupancy'], lang)}</h2>
              <Link className="btn btn--sm btn--subtle" href={`${base}/venues`}>
                {L(['Tümünü gör', 'View all'], lang)}
                <ArrowRight size={14} />
              </Link>
            </div>
            <div className="card__body dining-card-body">
              {DINING_VENUES.slice(0, 4).map((venue) => (
                <OccupancyRow key={venue.id} venue={venue} lang={lang} />
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
