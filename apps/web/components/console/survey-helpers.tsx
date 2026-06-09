import Link from 'next/link';
import { ChevronLeft, Star } from 'lucide-react';

/* ── ported verbatim from the AIDA design (assets/screens/survey.js) ── */

const AV = ['#0E7490', '#7C5CE0', '#0E9F6E', '#B8740A', '#2563C9', '#D5485A'];

export function surveyAvatarColor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return AV[h % AV.length]!;
}

export function surveyInitials(name: string): string {
  const p = name
    .replace(/[^A-Za-zÇĞİÖŞÜçğıöşü\s.]/g, '')
    .trim()
    .split(/[\s.]+/)
    .filter(Boolean);
  return ((p[0] || '')[0] || '') + ((p[1] || '')[0] || '');
}

/** Guest avatar (deterministic color + initials). */
export function GAvatar({ name, size }: { name: string; size?: number }) {
  const c = surveyAvatarColor(name);
  return (
    <span className="gavatar" style={{ background: c, ...(size ? { width: size, height: size } : {}) }}>
      {surveyInitials(name).toUpperCase()}
    </span>
  );
}

/** Compact score chip (hi/mid/lo). */
export function ScoreChip({ v }: { v: number }) {
  const cls = v >= 4.5 ? 'hi' : v >= 3.5 ? 'mid' : 'lo';
  return (
    <span className={`scorechip scorechip--${cls}`}>
      {v.toFixed(1)} <Star size={12} fill="currentColor" strokeWidth={0} />
    </span>
  );
}

/** Star rating row (filled up to score, then outlined) + numeric. */
export function Stars({ score, max = 5 }: { score: number; max?: number }) {
  const r = Math.round(score);
  return (
    <span className="stars">
      {Array.from({ length: max }).map((_, i) => (
        <span key={i} className={i < r ? '' : 'off'}>
          <Star size={16} fill={i < r ? 'currentColor' : 'none'} strokeWidth={i < r ? 0 : 1.6} />
        </span>
      ))}
      <span className="stars__num">{score.toFixed(1)}</span>
    </span>
  );
}

/** Deterministic decorative QR (matches the design's pseudo-QR). */
export function QrSvg({ seed = 'aida' }: { seed?: string }) {
  let s = 0;
  for (let i = 0; i < seed.length; i++) s = (s * 131 + seed.charCodeAt(i)) >>> 0;
  const rnd = () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
  const N = 25;
  const m: number[][] = [];
  for (let y = 0; y < N; y++) {
    m[y] = [];
    for (let x = 0; x < N; x++) m[y]![x] = rnd() > 0.52 ? 1 : 0;
  }
  const finder = (ox: number, oy: number) => {
    for (let y = 0; y < 7; y++)
      for (let x = 0; x < 7; x++) {
        const border = x === 0 || x === 6 || y === 0 || y === 6;
        const core = x >= 2 && x <= 4 && y >= 2 && y <= 4;
        m[oy + y]![ox + x] = border || core ? 1 : 0;
      }
    for (let i = -1; i <= 7; i++) if (oy - 1 >= 0 && ox + i >= 0 && ox + i < N && m[oy - 1]) m[oy - 1]![ox + i] = 0;
  };
  finder(0, 0);
  finder(N - 7, 0);
  finder(0, N - 7);
  const rects: React.ReactNode[] = [];
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (m[y]![x]) rects.push(<rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} />);
  return (
    <svg viewBox={`0 0 ${N} ${N}`} shapeRendering="crispEdges">
      <rect width={N} height={N} fill="#fff" />
      <g fill="#0C1A1F">{rects}</g>
    </svg>
  );
}

/** Sub-page hero: back button + title (+pill) + optional sub/crumb + actions. */
export function Subhero({
  backHref,
  crumb,
  title,
  pill,
  sub,
  actions,
}: {
  backHref: string;
  crumb?: React.ReactNode;
  title: React.ReactNode;
  pill?: React.ReactNode;
  sub?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="subhero">
      <Link className="back-btn" href={backHref} aria-label="Back">
        <ChevronLeft size={18} />
      </Link>
      <div>
        {crumb ? <div className="crumbline">{crumb}</div> : null}
        <div className="subhero__title">
          {title}
          {pill}
        </div>
        {sub ? <div className="subhero__sub">{sub}</div> : null}
      </div>
      <div className="subhero__spacer" />
      {actions}
    </div>
  );
}
