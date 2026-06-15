import Link from 'next/link';
import type { ReactNode } from 'react';
import {
  CalendarDays,
  Check,
  ChevronDown,
  Download,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Users,
  UtensilsCrossed,
} from 'lucide-react';
import { DiningSubnav } from '@/components/console/dining/dining-subnav';
import { L, type Lang } from '@/lib/i18n';
import { getLang } from '@/lib/i18n-server';

type ReservationStatus = 'confirmed' | 'seated' | 'completed' | 'noshow' | 'cancelled';

const STATUS_META: Record<ReservationStatus, { cls: string; label: readonly [string, string] }> = {
  confirmed: { cls: 'confirmed', label: ['Onaylandı', 'Confirmed'] },
  seated: { cls: 'seated', label: ['Oturdu', 'Seated'] },
  completed: { cls: 'completed', label: ['Tamamlandı', 'Completed'] },
  noshow: { cls: 'noshow', label: ['Gelmedi', 'No-show'] },
  cancelled: { cls: 'cancelled', label: ['İptal', 'Cancelled'] },
};

const RESERVATIONS = [
  {
    initials: 'EJ',
    avatar: '#3564d4',
    guest: 'Eleanor James',
    room: '402',
    venue: "A'la Carte Restoran",
    date: '12 Haz',
    time: '20:00',
    guests: 2,
    table: 'A-12',
    status: 'confirmed',
  },
  {
    initials: 'FH',
    avatar: '#2f7f98',
    guest: 'Familie Hoffmann',
    room: '210',
    venue: 'Ana Restoran',
    date: '12 Haz',
    time: '19:30',
    guests: 5,
    table: 'M-08',
    status: 'seated',
  },
  {
    initials: 'MW',
    avatar: '#7c5ce0',
    guest: 'Marcus Webb',
    room: '1105',
    venue: 'Havuz Bar',
    date: '12 Haz',
    time: '13:00',
    guests: 1,
    table: 'P-03',
    status: 'completed',
  },
  {
    initials: 'DR',
    avatar: '#cc5062',
    guest: 'Davide Russo',
    room: '615',
    venue: "A'la Carte Restoran",
    date: '12 Haz',
    time: '21:00',
    guests: 3,
    table: 'A-05',
    status: 'confirmed',
  },
  {
    initials: 'SP',
    avatar: '#48a46f',
    guest: 'Sarah Palmer',
    room: '312',
    venue: 'Ana Restoran',
    date: '12 Haz',
    time: '20:30',
    guests: 2,
    table: '–',
    status: 'noshow',
  },
  {
    initials: 'LB',
    avatar: '#bf7a20',
    guest: 'Lena Bauer',
    room: '718',
    venue: 'Lobi Bar',
    date: '12 Haz',
    time: '18:00',
    guests: 4,
    table: 'L-02',
    status: 'cancelled',
  },
] as const satisfies readonly {
  initials: string;
  avatar: string;
  guest: string;
  room: string;
  venue: string;
  date: string;
  time: string;
  guests: number;
  table: string;
  status: ReservationStatus;
}[];

function FilterChip({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <button className="fchip dining-res-filter" type="button">
      {icon}
      {label}
      <ChevronDown />
    </button>
  );
}

function ReservationStatusBadge({ status, lang }: { status: ReservationStatus; lang: Lang }) {
  const meta = STATUS_META[status];
  return (
    <span className={`dining-res-status dining-res-status--${meta.cls}`}>
      <span className="ico-dot" />
      {L(meta.label, lang)}
    </span>
  );
}

function ReservationRow({
  reservation,
  lang,
  base,
}: {
  reservation: (typeof RESERVATIONS)[number];
  lang: Lang;
  base: string;
}) {
  return (
    <tr>
      <td>
        <div className="dining-res-guest">
          <span className="dining-res-avatar" style={{ background: reservation.avatar }}>
            {reservation.initials}
          </span>
          <div>
            <div className="dining-res-name">{reservation.guest}</div>
            <div className="dining-res-room">
              {L(['Oda', 'Room'], lang)} {reservation.room}
            </div>
          </div>
        </div>
      </td>
      <td>{reservation.venue}</td>
      <td className="dining-res-muted">{reservation.date}</td>
      <td className="mono dining-res-muted">{reservation.time}</td>
      <td>
        <span className="dining-res-pax">
          <Users size={15} />
          {reservation.guests}
        </span>
      </td>
      <td className="mono dining-res-table-code">{reservation.table}</td>
      <td>
        <ReservationStatusBadge status={reservation.status} lang={lang} />
      </td>
      <td>
        <div className="rowact dining-res-actions">
          <Link
            aria-label={L(['Rezervasyonu düzenle', 'Edit reservation'], lang)}
            href={`${base}/reservations/8842/edit`}
          >
            <Pencil />
          </Link>
          <button aria-label={L(['Daha fazla işlem', 'More actions'], lang)} type="button">
            <MoreHorizontal />
          </button>
        </div>
      </td>
    </tr>
  );
}

export default async function DiningReservations({
  params,
}: {
  params: Promise<{ hotelId: string }>;
}) {
  const { hotelId } = await params;
  const lang = await getLang();
  const base = `/h/${hotelId}/dining`;

  return (
    <div className="dining-reservations fade-in">
      <div className="page-hero dining-hero">
        <div>
          <h1 className="page-hero__h">{L(['Rezervasyonlar', 'Reservations'], lang)}</h1>
          <p className="page-hero__sub">
            {L(
              [
                'Tüm restoran rezervasyonlarını görüntüleyin ve yönetin.',
                'View and manage all restaurant reservations.',
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
          <Link className="btn btn--primary" href={`${base}/reservations/new`}>
            <Plus />
            {L(['Yeni Rezervasyon', 'New Reservation'], lang)}
          </Link>
        </div>
      </div>

      <DiningSubnav hotelId={hotelId} active="reservations" lang={lang} />

      <div className="filterbar dining-res-filterbar">
        <FilterChip
          icon={<UtensilsCrossed size={15} />}
          label={L(['Tüm Mekanlar', 'All Venues'], lang)}
        />
        <FilterChip icon={<CalendarDays size={15} />} label={L(['Bugün', 'Today'], lang)} />
        <FilterChip icon={<Check size={15} />} label={L(['Durum', 'Status'], lang)} />
        <div className="filterbar__spacer" />
        <label className="searchmini dining-res-search">
          <Search size={15} />
          <input placeholder={L(['Misafir veya oda ara…', 'Search guest or room…'], lang)} />
        </label>
      </div>

      <section className="card dining-res-card">
        <div className="card__body dining-res-table-wrap">
          <table className="dining-res-table table">
            <thead>
              <tr>
                <th>{L(['Misafir', 'Guest'], lang)}</th>
                <th>{L(['Mekan', 'Venue'], lang)}</th>
                <th>{L(['Tarih', 'Date'], lang)}</th>
                <th>{L(['Saat', 'Time'], lang)}</th>
                <th>{L(['Kişi', 'Guests'], lang)}</th>
                <th>{L(['Masa', 'Table'], lang)}</th>
                <th>{L(['Durum', 'Status'], lang)}</th>
                <th>{L(['İşlemler', 'Actions'], lang)}</th>
              </tr>
            </thead>
            <tbody>
              {RESERVATIONS.map((reservation) => (
                <ReservationRow
                  key={`${reservation.room}-${reservation.time}`}
                  reservation={reservation}
                  lang={lang}
                  base={base}
                />
              ))}
            </tbody>
          </table>
        </div>
        <div className="pager dining-res-pager">
          <div className="pager__info">
            {L(['151 rezervasyondan 1-6 arası', 'Showing 1-6 of 151'], lang)}
          </div>
          <div className="pager__nums">
            <button type="button">{L(['Önceki', 'Prev'], lang)}</button>
            <button className="on" type="button">
              1
            </button>
            <button type="button">2</button>
            <button type="button">3</button>
            <button type="button">{L(['Sonraki', 'Next'], lang)}</button>
          </div>
        </div>
      </section>
    </div>
  );
}
