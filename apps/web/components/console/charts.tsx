import { ArrowDown, ArrowUp } from 'lucide-react';

/* ── lightweight SVG chart helpers, ported from the AIDA design (charts.js) ── */

function pts(data: number[], w: number, h: number, pad: number): [number, number][] {
  const max = Math.max(...data) * 1.12;
  const min = Math.min(...data) * 0.85;
  const span = max - min || 1;
  const iw = w - pad * 2;
  const ih = h - pad * 2;
  return data.map((v, i) => [pad + (i / (data.length - 1)) * iw, pad + ih - ((v - min) / span) * ih]);
}

function smooth(p: [number, number][]): string {
  if (p.length < 2) return '';
  let d = `M ${p[0]![0]},${p[0]![1]}`;
  for (let i = 0; i < p.length - 1; i++) {
    const c = p[i]!;
    const n = p[i + 1]!;
    const mx = (c[0] + n[0]) / 2;
    d += ` C ${mx},${c[1]} ${mx},${n[1]} ${n[0]},${n[1]}`;
  }
  return d;
}

/** Tiny no-axis sparkline with gradient fill. */
export function Sparkline({ data, color = 'var(--accent)', w = 86, h = 36 }: { data: number[]; color?: string; w?: number; h?: number }) {
  const p = pts(data, w, h, 3);
  const line = smooth(p);
  const area = `${line} L ${p[p.length - 1]![0]},${h} L ${p[0]![0]},${h} Z`;
  const id = `sg-${data.join('-').replace(/[^0-9]/g, '').slice(0, 8)}-${Math.round(data[0] ?? 0)}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} preserveAspectRatio="none" style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.22" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path d={line} fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </svg>
  );
}

export type DonutSeg = { label: string; value: number; color: string };

/** Donut chart with optional center label. */
export function Donut({ segments, size = 168, stroke = 18, center, centerSub }: { segments: DonutSeg[]; size?: number; stroke?: number; center?: string; centerSub?: string }) {
  const r = (size - stroke) / 2;
  const c = size / 2;
  const circ = 2 * Math.PI * r;
  const total = segments.reduce((a, s) => a + s.value, 0) || 1;
  let off = 0;
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
      <circle cx={c} cy={c} r={r} fill="none" stroke="var(--surface-3)" strokeWidth={stroke} />
      {segments.map((s, i) => {
        const len = (s.value / total) * circ;
        const el = (
          <circle
            key={i}
            cx={c}
            cy={c}
            r={r}
            fill="none"
            stroke={s.color}
            strokeWidth={stroke}
            strokeDasharray={`${len} ${circ - len}`}
            strokeDashoffset={-off}
            strokeLinecap="butt"
            transform={`rotate(-90 ${c} ${c})`}
          />
        );
        off += len;
        return el;
      })}
      {center ? (
        <>
          <text x={c} y={c - 2} textAnchor="middle" fontSize="26" fontWeight="600" fill="var(--text)" fontFamily="var(--font-ui)" style={{ letterSpacing: '-1px' }}>{center}</text>
          <text x={c} y={c + 16} textAnchor="middle" fontSize="11.5" fill="var(--text-3)" fontFamily="var(--font-ui)">{centerSub ?? ''}</text>
        </>
      ) : null}
    </svg>
  );
}

/** Responsive area chart with compact axes for dashboard detail cards. */
export function AreaChart({
  data,
  labels,
  color = 'var(--accent)',
  height = 220,
  max = Math.ceil(Math.max(...data, 1)),
}: {
  data: number[];
  labels: string[];
  color?: string;
  height?: number;
  max?: number;
}) {
  const w = 760;
  const h = height;
  const left = 38;
  const right = 12;
  const top = 12;
  const bottom = 28;
  const plotH = h - top - bottom;
  const plotW = w - left - right;
  const points: [number, number][] = data.map((value, index) => [
    left + (index / Math.max(1, data.length - 1)) * plotW,
    top + plotH - (value / Math.max(1, max)) * plotH,
  ]);
  const line = smooth(points);
  const area = `${line} L ${points.at(-1)?.[0] ?? left},${top + plotH} L ${left},${top + plotH} Z`;
  const gradientId = `area-${data.join('-').replace(/[^0-9]/g, '').slice(0, 20)}`;

  return (
    <svg
      className="area-chart"
      viewBox={`0 0 ${w} ${h}`}
      width="100%"
      height={height}
      preserveAspectRatio="none"
      aria-label="Area chart"
      role="img"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.18" />
          <stop offset="1" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {(() => {
        const STEPS = 5;
        const rawStep = max / STEPS;
        const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep || 1)));
        const step = Math.ceil(rawStep / magnitude) * magnitude || 1;
        const ticks: number[] = [];
        for (let v = 0; v <= max; v += step) ticks.push(v);
        return ticks.map((value) => {
          const y = top + plotH - (value / Math.max(1, max)) * plotH;
          return (
            <g key={value}>
              <line x1={left} x2={w - right} y1={y} y2={y} stroke="var(--border-faint)" strokeWidth="1" />
              <text x={left - 12} y={y + 4} textAnchor="end" fill="var(--text-3)" fontSize="10">{value}</text>
            </g>
          );
        });
      })()}
      <path d={area} fill={`url(#${gradientId})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      {points.map(([x, y], index) => (
        index === points.length - 1
          ? <circle key={index} cx={x} cy={y} r="3.5" fill="var(--surface)" stroke={color} strokeWidth="2.2" />
          : null
      ))}
      {labels.map((label, index) => (
        <text
          key={`${label}-${index}`}
          x={left + (index / Math.max(1, labels.length - 1)) * plotW}
          y={h - 7}
          textAnchor="middle"
          fill="var(--text-3)"
          fontSize="10"
        >
          {label}
        </text>
      ))}
    </svg>
  );
}

/** KPI card with delta + note + optional sparkline. */
export function Kpi({ icon, label, value, delta, unit = '%', note, spark, live }: { icon: React.ReactNode; label: React.ReactNode; value: React.ReactNode; delta?: number; unit?: string; note?: React.ReactNode; spark?: number[]; live?: boolean }) {
  const up = (delta ?? 0) >= 0;
  return (
    <div className="kpi">
      <div className="kpi__top">
        <div className="kpi__ico">{icon}</div>
        <div className="kpi__label">{label}</div>
        {live ? <span className="live" style={{ marginLeft: 'auto' }}><span className="live__pulse" /></span> : null}
      </div>
      <div className="kpi__row">
        <div>
          <div className="kpi__val">{value}</div>
          <div className="kpi__foot">
            {delta != null ? (
              <span className={`delta delta--${up ? 'up' : 'down'}`}>
                {up ? <ArrowUp size={13} /> : <ArrowDown size={13} />}
                {(up ? '+' : '') + delta + unit}
              </span>
            ) : null}
            {note != null ? <span className="delta__note">{note}</span> : null}
          </div>
        </div>
        {spark ? <div className="kpi__spark"><Sparkline data={spark} color={up ? 'var(--accent)' : 'var(--danger)'} /></div> : null}
      </div>
    </div>
  );
}

/** Compact horizontal progress bar. */
export function MiniBar({ pct, color = 'var(--accent)', maxWidth = 90 }: { pct: number; color?: string; maxWidth?: number | string }) {
  return (
    <div className="minibar" style={{ maxWidth }}>
      <div className="minibar__f" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

export type StatusKind = 'active' | 'setup' | 'paused' | 'online' | 'offline' | 'synced' | 'error' | 'live' | 'draft' | 'ok';

const STATUS_MAP: Record<StatusKind, [string, readonly [string, string]]> = {
  active: ['ok', ['Aktif', 'Active']],
  setup: ['info', ['Kurulumda', 'Setup']],
  paused: ['warn', ['Duraklatıldı', 'Paused']],
  online: ['ok', ['Çevrimiçi', 'Online']],
  offline: ['err', ['Çevrimdışı', 'Offline']],
  synced: ['ok', ['Senkron', 'Synced']],
  error: ['err', ['Hata', 'Error']],
  live: ['ok', ['Canlı', 'Live']],
  draft: ['mute', ['Taslak', 'Draft']],
  ok: ['ok', ['OK', 'OK']],
};

/** Status badge with localized label. `pick` resolves the [tr,en] pair. */
export function StatusBadge({ status, pick }: { status: StatusKind; pick: (p: readonly [string, string]) => string }) {
  const [cls, label] = STATUS_MAP[status];
  return (
    <span className={`badge badge--${cls}`}>
      <span className="ico-dot" />
      {pick(label)}
    </span>
  );
}
