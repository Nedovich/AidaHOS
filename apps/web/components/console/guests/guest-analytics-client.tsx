'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  CalendarDays,
  Download,
  Plus,
  Smile,
  Star,
  UserRound,
  Users,
  Wifi,
} from 'lucide-react';
import { AreaChart, Donut, Kpi, type DonutSeg } from '@/components/console/charts';
import { L, type Lang } from '@/lib/i18n';
import { INITIAL_GUESTS, type LocalizedText } from './guest-data';
import { GUEST_TICKET_RECORDS } from './guest-ticket-data';

const MONTHS: Record<Lang, string[]> = {
  tr: ['Ağu', 'Eyl', 'Eki', 'Kas', 'Ara', 'Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem'],
  en: ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
};

const CHART_COLORS = [
  'var(--chart-1)',
  'var(--chart-3)',
  'var(--chart-5)',
  'var(--chart-4)',
  'var(--chart-2)',
  'var(--purple)',
] as const;

const ROOM_TYPES: LocalizedText[] = [
  ['Standart Oda', 'Standard Room'],
  ['Deluxe Oda', 'Deluxe Room'],
  ['Süit', 'Suite'],
  ['Deniz Manzaralı Oda', 'Sea View Room'],
  ['Aile Odası', 'Family Room'],
];

function parseDate(value: string) {
  const [day, month, year] = value.split('.').map(Number);
  return new Date(year ?? 2026, (month ?? 1) - 1, day ?? 1);
}

function countBy<T>(values: T[], getKey: (value: T) => string) {
  return values.reduce<Record<string, number>>((counts, value) => {
    const key = getKey(value);
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});
}

function ChartLegend({ segments }: { segments: DonutSeg[] }) {
  return (
    <div className="guest-analytics-legend">
      {segments.map((segment) => (
        <div className="guest-analytics-legend__row" key={segment.label}>
          <span className="guest-analytics-legend__dot" style={{ background: segment.color }} />
          <span>{segment.label}</span>
          <strong>{segment.value}</strong>
        </div>
      ))}
    </div>
  );
}

function DistributionBars({
  rows,
}: {
  rows: Array<{ label: string; value: number; color: string }>;
}) {
  const max = Math.max(...rows.map((row) => row.value), 1);
  return (
    <div className="guest-analytics-bars">
      {rows.map((row) => (
        <div className="guest-analytics-bar" key={row.label}>
          <span title={row.label}>{row.label}</span>
          <div className="minibar">
            <div className="minibar__f" style={{ width: `${Math.round((row.value / max) * 100)}%`, background: row.color }} />
          </div>
          <strong>{row.value}</strong>
        </div>
      ))}
    </div>
  );
}

function RoomPopularityChart({
  rows,
}: {
  rows: Array<{ label: string; shortLabel: string; value: number }>;
}) {
  const max = Math.max(...rows.map((row) => row.value), 1);
  return (
    <div className="guest-room-chart" role="img" aria-label="Room type popularity">
      <div className="guest-room-chart__grid" aria-hidden="true">
        <span /><span /><span /><span />
      </div>
      <div className="guest-room-chart__bars">
        {rows.map((row) => (
          <div className="guest-room-chart__item" key={row.label} title={`${row.label}: ${row.value}`}>
            <span className="guest-room-chart__value">{row.value}</span>
            <span className="guest-room-chart__column" style={{ height: `${Math.max(8, (row.value / max) * 100)}%` }} />
            <span className="guest-room-chart__label">{row.shortLabel}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function GuestAnalyticsClient({
  hotelId,
  lang,
}: {
  hotelId: string;
  lang: Lang;
}) {
  const [notice, setNotice] = useState('');

  const analytics = useMemo(() => {
    const total = INITIAL_GUESTS.length;
    const online = INITIAL_GUESTS.filter((guest) => guest.connection === 'online').length;
    const vip = INITIAL_GUESTS.filter((guest) => guest.vip !== 'none').length;
    const avgNights = INITIAL_GUESTS.reduce((sum, guest) => {
      const nights = Math.round((parseDate(guest.checkout).getTime() - parseDate(guest.checkin).getTime()) / 86_400_000);
      return sum + nights;
    }, 0) / Math.max(1, total);
    const surveyScores = INITIAL_GUESTS.flatMap((guest) => guest.surveys.map((survey) => survey.score));
    const avgSurvey = surveyScores.reduce((sum, score) => sum + score, 0) / Math.max(1, surveyScores.length);
    const repeatRate = Math.round((INITIAL_GUESTS.filter((guest) => guest.stays.length > 1).length / Math.max(1, total)) * 100);

    const arrivals = Array.from({ length: 12 }, () => 0);
    const startMonthKey = 2025 * 12 + 7;
    INITIAL_GUESTS.forEach((guest) => {
      [guest.checkin, ...guest.stays.map((stay) => stay.checkin)].forEach((dateValue) => {
        const date = parseDate(dateValue);
        const index = date.getFullYear() * 12 + date.getMonth() - startMonthKey;
        if (index >= 0 && index < arrivals.length) arrivals[index] = (arrivals[index] ?? 0) + 1;
      });
    });

    const vipCounts = countBy(INITIAL_GUESTS, (guest) => guest.vip);
    const loyaltySegments: DonutSeg[] = [
      { label: L(['Standart', 'Standard'], lang), value: vipCounts.none ?? 0, color: 'var(--surface-3)' },
      { label: L(['Gümüş', 'Silver'], lang), value: vipCounts.silver ?? 0, color: 'var(--text-2)' },
      { label: L(['Altın', 'Gold'], lang), value: vipCounts.gold ?? 0, color: 'var(--warning)' },
      { label: L(['Platin', 'Platinum'], lang), value: vipCounts.platinum ?? 0, color: 'var(--purple)' },
    ];

    const countryCounts = countBy(INITIAL_GUESTS, (guest) => L(guest.country, lang));
    const countries = Object.entries(countryCounts)
      .sort((first, second) => second[1] - first[1])
      .slice(0, 6)
      .map(([label, value], index) => ({ label, value, color: CHART_COLORS[index % CHART_COLORS.length]! }));

    const agencyCounts = countBy(INITIAL_GUESTS, (guest) => guest.agency);
    const agencySegments: DonutSeg[] = Object.entries(agencyCounts).map(([label, value], index) => ({
      label,
      value,
      color: CHART_COLORS[index % CHART_COLORS.length]!,
    }));

    const roomRows = ROOM_TYPES.map((roomType) => {
      const label = L(roomType, lang);
      return {
        label,
        shortLabel: label.split(' ')[0] ?? label,
        value: INITIAL_GUESTS.filter((guest) => L(guest.roomType, lang) === label).length,
      };
    });

    const openTickets = GUEST_TICKET_RECORDS.filter((record) => record.ticket.status === 'open').length;
    const ticketSegments: DonutSeg[] = [
      { label: L(['Açık', 'Open'], lang), value: openTickets, color: 'var(--warning)' },
      { label: L(['Kapalı', 'Closed'], lang), value: GUEST_TICKET_RECORDS.length - openTickets, color: 'var(--success)' },
    ];

    return {
      total,
      online,
      vip,
      avgNights: avgNights.toFixed(1),
      avgSurvey: avgSurvey.toFixed(1),
      repeatRate,
      arrivals,
      loyaltySegments,
      countries,
      agencySegments,
      roomRows,
      ticketSegments,
    };
  }, [lang]);

  const downloadCsv = () => {
    const rows = [
      ['Metric', 'Value'],
      ['Total Guests', analytics.total],
      ['Connected Now', analytics.online],
      ['VIP Guests', analytics.vip],
      ['Average Stay Length', analytics.avgNights],
      ['Average Survey Score', analytics.avgSurvey],
      ['Repeat Guest Rate', `${analytics.repeatRate}%`],
    ];
    const csv = rows.map((row) => row.join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'aida-guest-analytics.csv';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="guests-page guest-analytics-page">
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
        <Link className="tab" href={`/h/${hotelId}/guests/tickets`}>{L(['Talepler / Şikayetler', 'Tickets / Complaints'], lang)}</Link>
        <span className="tab" aria-disabled="true">{L(['Notlar', 'Notes'], lang)}</span>
        <Link className="tab active" aria-current="page" href={`/h/${hotelId}/guests/analytics`}>{L(['Analitik', 'Analytics'], lang)}</Link>
      </nav>

      {notice ? (
        <div className="guests-notice" role="status">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice('')} aria-label={L(['Bildirimi kapat', 'Dismiss notification'], lang)}>×</button>
        </div>
      ) : null}

      <div className="grid grid--kpi guests-kpis">
        <Kpi icon={<UserRound />} label={L(['Toplam Misafir', 'Total Guests'], lang)} value={String(analytics.total)} note={L(['tüm oteller', 'all hotels'], lang)} />
        <Kpi icon={<Wifi />} label={L(['Şu An Bağlı', 'Connected Now'], lang)} value={String(analytics.online)} note={L(['çevrimiçi', 'online right now'], lang)} live />
        <Kpi icon={<Download />} label={L(['Ort. Veri Kullanımı', 'Avg Data Usage'], lang)} value="786 MB" note={L(['bağlı misafir başına', 'per connected guest'], lang)} />
        <Kpi icon={<Star />} label={L(['VIP Misafir', 'VIP Guests'], lang)} value={String(analytics.vip)} note={L(['sadakat programı', 'loyalty program'], lang)} />
      </div>

      <div className="grid grid--kpi guest-analytics-summary">
        <Kpi icon={<CalendarDays />} label={L(['Ort. Konaklama', 'Avg Stay Length'], lang)} value={`${analytics.avgNights} ${L(['gece', 'nights'], lang)}`} />
        <Kpi icon={<Smile />} label={L(['Ort. Anket Skoru', 'Avg Survey Score'], lang)} value={`${analytics.avgSurvey} / 5`} />
        <Kpi icon={<Users />} label={L(['Tekrar Misafir Oranı', 'Repeat Guest Rate'], lang)} value={`${analytics.repeatRate}%`} note={L(['birden fazla konaklama', 'more than one stay'], lang)} />
      </div>

      <div className="guest-analytics-grid">
        <section className="card guest-analytics-card guest-analytics-card--wide">
          <div className="card__head">
            <div>
              <h2 className="card__title">{L(['Misafir Girişi Trendi', 'Guest Arrivals Trend'], lang)}</h2>
              <p className="card__sub">{L(['Son 12 ay', 'Last 12 months'], lang)}</p>
            </div>
          </div>
          <div className="card__body guest-analytics-area">
            <AreaChart data={analytics.arrivals} labels={MONTHS[lang]} height={230} />
          </div>
        </section>

        <section className="card guest-analytics-card">
          <div className="card__head">
            <div>
              <h2 className="card__title">{L(['Sadakat Seviyesi Dağılımı', 'Loyalty Tier Distribution'], lang)}</h2>
              <p className="card__sub">{L(['Aktif misafirler', 'Active guests'], lang)}</p>
            </div>
          </div>
          <div className="card__body guest-analytics-donut">
            <Donut segments={analytics.loyaltySegments} center={String(analytics.total)} centerSub={L(['misafir', 'guests'], lang)} />
            <ChartLegend segments={analytics.loyaltySegments} />
          </div>
        </section>

        <section className="card guest-analytics-card guest-analytics-card--wide">
          <div className="card__head">
            <div>
              <h2 className="card__title">{L(['Ülkelere Göre Misafirler', 'Guests by Country'], lang)}</h2>
              <p className="card__sub">{L(['En çok görülen 6 ülke', 'Top 6 countries'], lang)}</p>
            </div>
          </div>
          <div className="card__body">
            <DistributionBars rows={analytics.countries} />
          </div>
        </section>

        <section className="card guest-analytics-card">
          <div className="card__head">
            <div>
              <h2 className="card__title">{L(['Rezervasyon Kanalı', 'Booking Channel'], lang)}</h2>
              <p className="card__sub">{L(['Acenta bazında', 'By agency'], lang)}</p>
            </div>
          </div>
          <div className="card__body guest-analytics-donut">
            <Donut segments={analytics.agencySegments} center={String(analytics.total)} centerSub={L(['misafir', 'guests'], lang)} />
            <ChartLegend segments={analytics.agencySegments} />
          </div>
        </section>

        <section className="card guest-analytics-card guest-analytics-card--wide">
          <div className="card__head">
            <div>
              <h2 className="card__title">{L(['Oda Tipi Popülerliği', 'Room Type Popularity'], lang)}</h2>
              <p className="card__sub">{L(['Aktif konaklamalar', 'Active stays'], lang)}</p>
            </div>
          </div>
          <div className="card__body">
            <RoomPopularityChart rows={analytics.roomRows} />
          </div>
        </section>

        <section className="card guest-analytics-card">
          <div className="card__head">
            <div>
              <h2 className="card__title">{L(['Talep Durumu', 'Ticket Status'], lang)}</h2>
              <p className="card__sub">{L(['Tüm talepler / şikayetler', 'All tickets / complaints'], lang)}</p>
            </div>
          </div>
          <div className="card__body guest-analytics-donut">
            <Donut
              segments={analytics.ticketSegments}
              size={150}
              stroke={17}
              center={String(GUEST_TICKET_RECORDS.length)}
              centerSub={L(['talep', 'tickets'], lang)}
            />
            <ChartLegend segments={analytics.ticketSegments} />
          </div>
        </section>
      </div>
    </div>
  );
}
