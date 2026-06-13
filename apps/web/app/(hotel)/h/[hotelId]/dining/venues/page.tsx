import Link from 'next/link';
import {
  Coffee,
  Eye,
  Plus,
  Star,
  UtensilsCrossed,
  Waves,
  Wine,
  type LucideIcon,
} from 'lucide-react';
import { DiningSubnav } from '@/components/console/dining/dining-subnav';
import {
  DINING_VENUES,
  formatEuro,
  localize,
  type DiningVenue,
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

const VENUE_STATUS: Record<VenueStatus, { cls: string; label: readonly [string, string] }> = {
  open: { cls: 'ok', label: ['Açık', 'Open'] },
  limited: { cls: 'warn', label: ['Sınırlı', 'Limited'] },
  closed: { cls: 'mute', label: ['Kapalı', 'Closed'] },
};

function VenueIconMark({ venue, size = 19 }: { venue: DiningVenue; size?: number }) {
  const Icon = VENUE_ICONS[venue.icon];
  return <Icon size={size} />;
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

function VenueCard({ venue, lang, base }: { venue: DiningVenue; lang: Lang; base: string }) {
  const pct = Math.round((venue.occupancy / venue.capacity) * 100);
  const avgSpend = Math.round(venue.revenue / Math.max(venue.reservations, 1));

  return (
    <article className="rest-card">
      <Link
        className="rest-card__cover"
        href={`${base}/venues/${venue.id}`}
        style={{
          background: `linear-gradient(135deg, ${venue.color}, color-mix(in srgb, ${venue.color} 60%, #000))`,
        }}
      >
        <div className="rest-card__ico" style={{ color: venue.color }}>
          <VenueIconMark venue={venue} />
        </div>
        <div className="rest-card__name">{venue.name}</div>
        <div className="rest-card__type">{localize(venue.type, lang)}</div>
      </Link>
      <div className="rest-card__body">
        <div className="rest-card__status-row">
          <span className="cell-sub">{L(['Doluluk', 'Occupancy'], lang)}</span>
          <VenueBadge status={venue.status} lang={lang} />
        </div>
        <div className="rest-card__occ">
          <div className="minibar">
            <div className="minibar__f" style={{ width: `${pct}%`, background: venue.color }} />
          </div>
          <span className="rest-card__pct">{pct}%</span>
        </div>

        <div className="rest-card__stats">
          <div className="rest-stat">
            <div className="rest-stat__k">{L(['Kapasite', 'Capacity'], lang)}</div>
            <div className="rest-stat__v">
              {venue.occupancy}/{venue.capacity}
            </div>
          </div>
          <div className="rest-stat">
            <div className="rest-stat__k">{L(['Rezervasyon', 'Reservations'], lang)}</div>
            <div className="rest-stat__v">{venue.reservations}</div>
          </div>
          <div className="rest-stat">
            <div className="rest-stat__k">{L(['Bugünkü Gelir', 'Revenue'], lang)}</div>
            <div className="rest-stat__v">{formatEuro(venue.revenue)}</div>
          </div>
          <div className="rest-stat">
            <div className="rest-stat__k">{L(['Ort. Harcama', 'Avg Spend'], lang)}</div>
            <div className="rest-stat__v">€{avgSpend}</div>
          </div>
        </div>

        <div className="rest-card__meta">
          <span>{localize(venue.location, lang)}</span>
          <span>·</span>
          <span>{localize(venue.type, lang)}</span>
        </div>

        <Link
          className="btn btn--ghost btn--sm rest-card__button"
          href={`${base}/venues/${venue.id}`}
        >
          <Eye size={15} />
          {L(['Mekan Detayı', 'View Details'], lang)}
        </Link>
      </div>
    </article>
  );
}

export default async function DiningVenues({ params }: { params: Promise<{ hotelId: string }> }) {
  const { hotelId } = await params;
  const lang = await getLang();
  const base = `/h/${hotelId}/dining`;

  return (
    <div className="dining-venues fade-in">
      <div className="page-hero dining-hero">
        <div>
          <h1 className="page-hero__h">{L(['Mekanlar', 'Venues'], lang)}</h1>
          <p className="page-hero__sub">
            {L(
              [
                'Tüm restoran ve barların anlık durumu.',
                'Live status of all restaurants and bars.',
              ],
              lang,
            )}
          </p>
        </div>
        <div className="page-hero__actions">
          <Link className="btn btn--primary" href={`${base}/venues/new`}>
            <Plus />
            {L(['Mekan Ekle', 'Add Venue'], lang)}
          </Link>
        </div>
      </div>

      <DiningSubnav hotelId={hotelId} active="venues" lang={lang} />

      <div className="dining-venues-grid">
        {DINING_VENUES.map((venue) => (
          <VenueCard key={venue.id} venue={venue} lang={lang} base={base} />
        ))}
      </div>
    </div>
  );
}
