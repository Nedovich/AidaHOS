import { Download, Ticket, TrendingUp, Users, X } from 'lucide-react';
import { Donut, Kpi, MiniBar } from '@/components/console/charts';
import { EventsSubnav } from '@/components/console/events/events-subnav';
import { EVENT_CATEGORIES, localize, type EventCategory } from '@/lib/events-mock';
import { L, type Lang } from '@/lib/i18n';
import { getLang } from '@/lib/i18n-server';

const REGISTRATION_TREND = [120, 145, 138, 172, 190, 210, 198, 234, 256, 240, 278, 305];
const ATTENDANCE_BY_DAY = [82, 85, 84, 88, 91, 87, 90];
const CATEGORY_PERFORMANCE: Array<[EventCategory, number]> = [
  ['ent', 92],
  ['spec', 88],
  ['fnb', 84],
  ['well', 79],
  ['sport', 71],
  ['kids', 86],
];
const BREAKDOWN = [
  { label: ['Katıldı', 'Attended'] as const, value: 87, color: 'var(--success)' },
  { label: ['Gelmedi', 'No-show'] as const, value: 10, color: 'var(--warning)' },
  { label: ['İptal', 'Cancelled'] as const, value: 3, color: 'var(--danger)' },
];

function points(data: number[], width: number, height: number, pad: number): [number, number][] {
  const max = Math.max(...data) * 1.12;
  const min = Math.min(...data) * 0.85;
  const span = max - min || 1;
  const innerWidth = width - pad * 2;
  const innerHeight = height - pad * 2;

  return data.map((value, index) => [
    pad + (index / (data.length - 1)) * innerWidth,
    pad + innerHeight - ((value - min) / span) * innerHeight,
  ]);
}

function smoothPath(pathPoints: [number, number][]) {
  if (pathPoints.length < 2) return '';

  let path = `M ${pathPoints[0]![0]},${pathPoints[0]![1]}`;
  for (let index = 0; index < pathPoints.length - 1; index += 1) {
    const current = pathPoints[index]!;
    const next = pathPoints[index + 1]!;
    const middle = (current[0] + next[0]) / 2;
    path += ` C ${middle},${current[1]} ${middle},${next[1]} ${next[0]},${next[1]}`;
  }
  return path;
}

function RegistrationAreaChart() {
  const width = 680;
  const height = 252;
  const pad = 34;
  const chartPoints = points(REGISTRATION_TREND, width, height, pad);
  const line = smoothPath(chartPoints);
  const area = `${line} L ${chartPoints.at(-1)![0]},${height - pad} L ${chartPoints[0]![0]},${height - pad} Z`;
  const grid = [305, 229, 153, 76, 0];

  return (
    <svg
      aria-label="Registration trend chart"
      className="events-analytics-area"
      preserveAspectRatio="none"
      viewBox={`0 0 ${width} ${height}`}
    >
      <defs>
        <linearGradient id="events-registration-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="var(--accent)" stopOpacity="0.22" />
          <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {grid.map((label, index) => {
        const y = pad + (index / (grid.length - 1)) * (height - pad * 2);
        return (
          <g key={label}>
            <line x1={pad + 22} x2={width - pad} y1={y} y2={y} />
            <text x={pad - 4} y={y + 4}>
              {label}
            </text>
          </g>
        );
      })}
      <path d={area} fill="url(#events-registration-fill)" />
      <path className="events-analytics-area__line" d={line} />
      <circle cx={chartPoints.at(-1)![0]} cy={chartPoints.at(-1)![1]} r="4" />
    </svg>
  );
}

function WeeklyAttendanceChart({ lang }: { lang: Lang }) {
  const labels =
    lang === 'en'
      ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      : ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
  const guide = [91, 68, 46, 23, 0];

  return (
    <div className="events-analytics-bars" aria-label="Weekly attendance chart">
      <div className="events-analytics-bars__plot">
        {guide.map((label, index) => (
          <div
            className="events-analytics-bars__guide"
            key={label}
            style={{ top: `${index * 25}%` }}
          >
            <span>{label}</span>
          </div>
        ))}
        <div className="events-analytics-bars__columns">
          {ATTENDANCE_BY_DAY.map((value, index) => (
            <div className="events-analytics-bars__slot" key={labels[index]}>
              <span style={{ height: `${value}%` }} />
            </div>
          ))}
        </div>
      </div>
      <div className="events-analytics-bars__labels">
        {labels.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
    </div>
  );
}

function CategoryPerformance({ lang }: { lang: Lang }) {
  return (
    <div className="events-category-performance">
      {CATEGORY_PERFORMANCE.map(([id, value]) => {
        const category = EVENT_CATEGORIES[id];
        return (
          <div className="events-category-performance__row" key={id}>
            <div className="events-category-performance__label">
              <span className="cat__dot" style={{ background: category.color }} />
              {localize(category.label, lang)}
            </div>
            <MiniBar pct={value} color={category.color} maxWidth="100%" />
            <strong>{value}%</strong>
          </div>
        );
      })}
    </div>
  );
}

function BreakdownLegend({ lang }: { lang: Lang }) {
  return (
    <div className="events-breakdown-legend">
      {BREAKDOWN.map((item) => (
        <div className="events-breakdown-legend__row" key={item.value}>
          <span className="legend__sw" style={{ background: item.color }} />
          <span>{L(item.label, lang)}</span>
          <strong>{item.value}%</strong>
        </div>
      ))}
    </div>
  );
}

export default async function EventAnalyticsPage({
  params,
}: {
  params: Promise<{ hotelId: string }>;
}) {
  const { hotelId } = await params;
  const lang = await getLang();

  return (
    <div className="events-analytics fade-in">
      <div className="page-hero events-hero events-analytics-hero">
        <div>
          <h1 className="page-hero__h">{L(['Etkinlik Analitiği', 'Event Analytics'], lang)}</h1>
          <p className="page-hero__sub">
            {L(
              [
                'Katılım, doluluk ve kategori performansını analiz edin.',
                'Analyze attendance, fill rate and category performance.',
              ],
              lang,
            )}
          </p>
        </div>
        <div className="page-hero__actions">
          <div
            className="seg events-range-seg"
            aria-label={L(['Tarih aralığı', 'Date range'], lang)}
          >
            <button type="button">{L(['Son 7 gün', 'Last 7 days'], lang)}</button>
            <button className="on" type="button">
              {L(['Son 30 gün', 'Last 30 days'], lang)}
            </button>
            <button type="button">{L(['Bu yıl', 'This year'], lang)}</button>
          </div>
          <button className="btn btn--ghost" type="button">
            <Download />
            {L(['Rapor', 'Report'], lang)}
          </button>
        </div>
      </div>

      <EventsSubnav hotelId={hotelId} active="analytics" lang={lang} />

      <div className="events-analytics-kpis">
        <Kpi
          icon={<Ticket />}
          label={L(['Toplam Kayıt', 'Total Registrations'], lang)}
          value="3 482"
          delta={12.4}
          note={L(['geçen haftaya göre', 'vs last week'], lang)}
          spark={[240, 256, 240, 278, 290, 300, 305]}
        />
        <Kpi
          icon={<Users />}
          label={L(['Ortalama Katılım', 'Avg Attendance'], lang)}
          value="87%"
          delta={2.1}
          note={L(['geçen haftaya göre', 'vs last week'], lang)}
          spark={[82, 85, 84, 88, 86, 87, 87]}
        />
        <Kpi
          icon={<TrendingUp />}
          label={L(['Doluluk Oranı', 'Fill Rate'], lang)}
          value="78%"
          delta={5.6}
          note={L(['geçen haftaya göre', 'vs last week'], lang)}
          spark={[70, 72, 74, 75, 76, 77, 78]}
        />
        <Kpi
          icon={<X />}
          label={L(['No-show Oranı', 'No-show Rate'], lang)}
          value="9.8%"
          delta={-1.4}
          note={L(['geçen haftaya göre', 'vs last week'], lang)}
          spark={[13, 12, 11.5, 11, 10.5, 10, 9.8]}
        />
      </div>

      <div className="events-analytics-grid">
        <section className="card events-analytics-chart-card events-analytics-chart-card--wide">
          <div className="card__head">
            <div>
              <h2 className="card__title">{L(['Kayıt Trendi', 'Registration Trend'], lang)}</h2>
              <div className="card__sub">{L(['Son 12 hafta', 'Last 12 weeks'], lang)}</div>
            </div>
          </div>
          <div className="card__body events-analytics-chart-body">
            <RegistrationAreaChart />
          </div>
        </section>

        <section className="card events-analytics-chart-card">
          <div className="card__head">
            <div>
              <h2 className="card__title">{L(['Haftalık Katılım', 'Weekly Attendance'], lang)}</h2>
              <div className="card__sub">{L(['Gün bazında ortalama %', 'Avg % by day'], lang)}</div>
            </div>
          </div>
          <div className="card__body events-analytics-chart-body">
            <WeeklyAttendanceChart lang={lang} />
          </div>
        </section>
      </div>

      <div className="events-analytics-grid events-analytics-grid--bottom">
        <section className="card events-analytics-chart-card events-analytics-chart-card--wide">
          <div className="card__head">
            <h2 className="card__title">
              {L(['Kategori Performansı', 'Category Performance'], lang)}
            </h2>
            <span className="badge badge--mute">{L(['Doluluk %', 'Fill %'], lang)}</span>
          </div>
          <div className="card__body events-analytics-chart-body">
            <CategoryPerformance lang={lang} />
          </div>
        </section>

        <section className="card events-analytics-chart-card">
          <div className="card__head">
            <h2 className="card__title">{L(['Katılım Dağılımı', 'Attendance Breakdown'], lang)}</h2>
          </div>
          <div className="card__body events-breakdown">
            <Donut
              segments={BREAKDOWN.map((item) => ({
                label: L(item.label, lang),
                value: item.value,
                color: item.color,
              }))}
              center="87%"
              centerSub={L(['katılım', 'attended'], lang)}
              size={156}
              stroke={18}
            />
            <BreakdownLegend lang={lang} />
          </div>
        </section>
      </div>
    </div>
  );
}
