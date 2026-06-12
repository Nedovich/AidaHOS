import { Building2, CreditCard, Download, Smile, TrendingUp } from 'lucide-react';
import { Donut, Kpi, MiniBar } from '@/components/console/charts';
import { L, type Lang } from '@/lib/i18n';
import { getLang } from '@/lib/i18n-server';

type Label = string | readonly [string, string];

const MONTHS = {
  tr: ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
};

const REVENUE = [420, 460, 510, 580, 640, 820, 980, 1020, 860, 720, 620, 560];
const OCCUPANCY = [62, 66, 70, 74, 80, 90, 95, 94, 88, 82, 76, 72].map((value) => value * 7);
const DEVICE_MIX = [
  { label: 'iOS', value: 52, color: 'var(--chart-1)' },
  { label: 'Android', value: 34, color: 'var(--chart-5)' },
  { label: ['Masaüstü', 'Desktop'] as const, value: 11, color: 'var(--chart-3)' },
  { label: ['Diğer', 'Other'] as const, value: 3, color: 'var(--chart-4)' },
] satisfies Array<{ label: Label; value: number; color: string }>;
const SATISFACTION = [
  ['Marenza Beach Club', '4.9', 98, 'var(--success)'],
  ['Lumera Resort & Spa', '4.8', 96, 'var(--success)'],
  ['Azure Bay Hotel', '4.6', 92, 'var(--accent)'],
  ['Celestia Grand', '4.5', 90, 'var(--accent)'],
  ['Solara Cove Suites', '4.2', 84, 'var(--warning)'],
] as const;
const CAMPAIGNS = [
  { sent: 820, converted: 142 },
  { sent: 640, converted: 98 },
  { sent: 910, converted: 168 },
  { sent: 430, converted: 64 },
  { sent: 1180, converted: 240 },
  { sent: 760, converted: 132 },
];

function chartPoints(
  data: number[],
  width: number,
  height: number,
  pad: number,
): [number, number][] {
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

function smooth(points: [number, number][]) {
  if (points.length < 2) return '';

  let path = `M ${points[0]![0]},${points[0]![1]}`;
  for (let index = 0; index < points.length - 1; index += 1) {
    const current = points[index]!;
    const next = points[index + 1]!;
    const middle = (current[0] + next[0]) / 2;
    path += ` C ${middle},${current[1]} ${middle},${next[1]} ${next[0]},${next[1]}`;
  }

  return path;
}

function RevenueOccupancyChart({ lang }: { lang: Lang }) {
  const width = 720;
  const height = 268;
  const pad = 34;
  const revenuePoints = chartPoints(REVENUE, width, height, pad);
  const occupancyPoints = chartPoints(OCCUPANCY, width, height, pad);
  const revenueLine = smooth(revenuePoints);
  const occupancyLine = smooth(occupancyPoints);
  const revenueArea = `${revenueLine} L ${revenuePoints.at(-1)![0]},${height - pad} L ${revenuePoints[0]![0]},${height - pad} Z`;
  const labels = lang === 'en' ? MONTHS.en : MONTHS.tr;
  const guide = [1000, 750, 500, 250, 0];

  return (
    <svg
      aria-label={L(['Gelir ve doluluk trend grafiği', 'Revenue and occupancy trend chart'], lang)}
      className="exec-analytics-area"
      preserveAspectRatio="none"
      viewBox={`0 0 ${width} ${height}`}
    >
      <defs>
        <linearGradient id="exec-revenue-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="var(--chart-1)" stopOpacity="0.22" />
          <stop offset="1" stopColor="var(--chart-1)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {guide.map((label, index) => {
        const y = pad + (index / (guide.length - 1)) * (height - pad * 2);
        return (
          <g key={label}>
            <line x1={pad + 20} x2={width - pad} y1={y} y2={y} />
            <text x={pad - 4} y={y + 4}>
              {label}
            </text>
          </g>
        );
      })}
      {labels.map((label, index) => {
        const x = pad + 20 + (index / (labels.length - 1)) * (width - pad * 2 - 20);
        return (
          <text className="exec-analytics-area__month" key={label} x={x} y={height - 5}>
            {label}
          </text>
        );
      })}
      <path d={revenueArea} fill="url(#exec-revenue-fill)" />
      <path
        className="exec-analytics-area__line exec-analytics-area__line--revenue"
        d={revenueLine}
      />
      <path
        className="exec-analytics-area__line exec-analytics-area__line--occupancy"
        d={occupancyLine}
      />
    </svg>
  );
}

function localLabel(label: Label, lang: Lang) {
  return typeof label === 'string' ? label : L(label, lang);
}

function DeviceLabel({ label, lang }: { label: Label; lang: Lang }) {
  return <>{localLabel(label, lang)}</>;
}

function DeviceLegend({ lang }: { lang: Lang }) {
  return (
    <div className="exec-analytics-legend">
      {DEVICE_MIX.map((item) => (
        <div className="exec-analytics-legend__row" key={item.value}>
          <span className="legend__sw" style={{ background: item.color }} />
          <span>
            <DeviceLabel label={item.label} lang={lang} />
          </span>
          <strong>{item.value}%</strong>
        </div>
      ))}
    </div>
  );
}

function SatisfactionBars() {
  return (
    <div className="exec-analytics-hbars">
      {SATISFACTION.map(([label, value, pct, color]) => (
        <div className="exec-analytics-hbars__row" key={label}>
          <div className="exec-analytics-hbars__label">{label}</div>
          <MiniBar pct={pct} color={color} maxWidth="100%" />
          <strong>{value}</strong>
        </div>
      ))}
    </div>
  );
}

function CampaignBars({ lang }: { lang: Lang }) {
  const labels =
    lang === 'en'
      ? ['SPA', 'Late-out', 'Dining', 'Transfer', 'Rebook', 'Events']
      : ['SPA', 'Geç çıkış', 'Restoran', 'Transfer', 'Tekrar rez.', 'Etkinlik'];
  const max = Math.max(...CAMPAIGNS.map((item) => item.sent));

  return (
    <div
      className="exec-campaign-bars"
      aria-label={L(['Kampanya dönüşüm grafiği', 'Campaign conversion chart'], lang)}
    >
      <div className="exec-campaign-bars__plot">
        {CAMPAIGNS.map((item, index) => (
          <div className="exec-campaign-bars__slot" key={labels[index]}>
            <span
              className="exec-campaign-bars__sent"
              style={{ height: `${Math.round((item.sent / max) * 100)}%` }}
            />
            <span
              className="exec-campaign-bars__converted"
              style={{ height: `${Math.round((item.converted / max) * 100)}%` }}
            />
          </div>
        ))}
      </div>
      <div className="exec-campaign-bars__labels">
        {labels.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
    </div>
  );
}

export default async function AnalyticsPage() {
  const lang = await getLang();

  return (
    <div className="exec-analytics fade-in">
      <div className="page-hero exec-analytics-hero">
        <div>
          <h1 className="page-hero__h">{L(['Yönetici Analitiği', 'Executive Analytics'], lang)}</h1>
          <p className="page-hero__sub">
            {L(
              [
                'Portföy geneli performans, gelir ve misafir öngörüleri.',
                'Portfolio-wide performance, revenue and guest insights.',
              ],
              lang,
            )}
          </p>
        </div>
        <div className="page-hero__actions">
          <div
            className="seg exec-analytics-range"
            aria-label={L(['Tarih aralığı', 'Date range'], lang)}
          >
            <button type="button">{L(['Son 7 gün', 'Last 7 days'], lang)}</button>
            <button type="button">{L(['Son 30 gün', 'Last 30 days'], lang)}</button>
            <button className="on" type="button">
              {L(['12 ay', '12 mo'], lang)}
            </button>
          </div>
          <button className="btn btn--ghost" type="button">
            <Download />
            {L(['Dışa Aktar', 'Export'], lang)}
          </button>
        </div>
      </div>

      <div className="exec-analytics-kpis">
        <Kpi
          icon={<Building2 />}
          label={L(['Ort. Doluluk', 'Avg Occupancy'], lang)}
          value="86%"
          delta={4.2}
          note={L(['geçen döneme göre', 'vs last period'], lang)}
          spark={[78, 80, 79, 82, 84, 85, 86]}
        />
        <Kpi
          icon={<TrendingUp />}
          label="RevPAR"
          value="€184"
          delta={9.1}
          note={L(['geçen döneme göre', 'vs last period'], lang)}
          spark={[150, 158, 162, 170, 176, 180, 184]}
        />
        <Kpi
          icon={<CreditCard />}
          label="ADR"
          value="€214"
          delta={3.4}
          note={L(['geçen döneme göre', 'vs last period'], lang)}
          spark={[196, 200, 202, 206, 209, 212, 214]}
        />
        <Kpi
          icon={<Smile />}
          label={L(['Memnuniyet', 'Satisfaction'], lang)}
          value="4.7"
          delta={2.1}
          note={L(['geçen döneme göre', 'vs last period'], lang)}
          spark={[4.4, 4.5, 4.5, 4.6, 4.6, 4.7, 4.7]}
        />
      </div>

      <div className="exec-analytics-grid">
        <section className="card exec-analytics-card exec-analytics-card--wide">
          <div className="card__head">
            <div>
              <h2 className="card__title">
                {L(['Gelir & Doluluk Trendi', 'Revenue & Occupancy Trend'], lang)}
              </h2>
              <div className="card__sub">
                {L(['12 aylık · portföy geneli', '12 months · portfolio-wide'], lang)}
              </div>
            </div>
            <div className="legend exec-analytics-card-legend">
              <div className="legend__i">
                <span className="legend__sw" style={{ background: 'var(--chart-1)' }} />
                {L(['Gelir (€k)', 'Revenue (€k)'], lang)}
              </div>
              <div className="legend__i">
                <span className="legend__sw" style={{ background: 'var(--chart-3)' }} />
                {L(['Doluluk %', 'Occupancy %'], lang)}
              </div>
            </div>
          </div>
          <div className="card__body exec-analytics-chart-body">
            <RevenueOccupancyChart lang={lang} />
          </div>
        </section>

        <section className="card exec-analytics-card">
          <div className="card__head">
            <div>
              <h2 className="card__title">{L(['WiFi Cihaz Dağılımı', 'WiFi Device Mix'], lang)}</h2>
              <div className="card__sub">{L(['Bu ay', 'This month'], lang)}</div>
            </div>
          </div>
          <div className="card__body exec-analytics-device">
            <Donut
              segments={DEVICE_MIX.map((item) => ({
                label: localLabel(item.label, lang),
                value: item.value,
                color: item.color,
              }))}
              center="1.4M"
              centerSub={L(['oturum', 'sessions'], lang)}
              size={168}
              stroke={19}
            />
            <DeviceLegend lang={lang} />
          </div>
        </section>
      </div>

      <div className="exec-analytics-grid exec-analytics-grid--bottom">
        <section className="card exec-analytics-card">
          <div className="card__head">
            <div>
              <h2 className="card__title">
                {L(['Otel Bazında Memnuniyet', 'Satisfaction by Hotel'], lang)}
              </h2>
              <div className="card__sub">CSAT · 5.0 {L(['üzerinden', 'scale'], lang)}</div>
            </div>
          </div>
          <div className="card__body exec-analytics-chart-body">
            <SatisfactionBars />
          </div>
        </section>

        <section className="card exec-analytics-card">
          <div className="card__head">
            <div>
              <h2 className="card__title">
                {L(['Kampanya Dönüşümleri', 'Campaign Conversions'], lang)}
              </h2>
              <div className="card__sub">
                {L(['Bildirim → rezervasyon', 'Notification → booking'], lang)}
              </div>
            </div>
          </div>
          <div className="card__body exec-analytics-chart-body">
            <CampaignBars lang={lang} />
            <div className="legend exec-campaign-legend">
              <div className="legend__i">
                <span className="legend__sw" style={{ background: 'var(--chart-1)' }} />
                {L(['Dönüşüm', 'Converted'], lang)}
              </div>
              <div className="legend__i">
                <span className="legend__sw" style={{ background: 'var(--surface-3)' }} />
                {L(['Gönderilen', 'Sent'], lang)}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
