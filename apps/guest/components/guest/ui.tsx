'use client';

import { Children, useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { AIDA_LANGS, L, useLang, type Lang } from '@/lib/i18n';
import { IMG } from '@/lib/data';

const ICONS: Record<string, string> = {
  home: 'M3 11.2 12 4l9 7.2M5 9.8V20h5v-5.5h4V20h5V9.8',
  explore: 'M12 12 9.5 9.5M12 12l6-3-3 6-6 3 3-6ZM12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z',
  events: 'M4 6.5h16v14H4zM4 10h16M8 3.5v4M16 3.5v4M8.5 14h2m3 0h2',
  messages: 'M5 5h14a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H9l-4 3.5V6a1 1 0 0 1 1-1Z',
  profile: 'M12 12.5a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM5 20c.8-3.5 3.6-5.5 7-5.5s6.2 2 7 5.5',
  spa: 'M12 21c0-4-2.5-6.5-2.5-6.5M12 21c0-4 2.5-6.5 2.5-6.5M12 14.5C9 11 12 4.5 12 4.5s3 6.5 0 10ZM6 13c2.5.5 4 2 4 2M18 13c-2.5.5-4 2-4 2',
  dining: 'M7 3v8M5 3v5a2 2 0 0 0 2 2 2 2 0 0 0 2-2V3M7 11v10M17 3c-1.5 0-2.5 2-2.5 5s1 4 2.5 4m0-9c1.5 0 2.5 2 2.5 5s-1 4-2.5 4m0 0v8',
  bell: 'M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6ZM10 20a2 2 0 0 0 4 0',
  chevR: 'M9 5l7 7-7 7', chevL: 'M15 5l-7 7 7 7', chevD: 'M5 9l7 7 7-7',
  star: 'M12 3.5l2.6 5.6 6 .7-4.4 4.1 1.2 6L12 17.1 6.6 20l1.2-6L3.4 9.8l6-.7Z',
  plus: 'M12 5v14M5 12h14', check: 'M5 12.5l4.5 4.5L19 7',
  wind: 'M3 8h11a2.5 2.5 0 1 0-2.5-2.5M3 12h16a2.5 2.5 0 1 1-2.5 2.5M3 16h9',
  droplet: 'M12 3.5s6 6 6 10a6 6 0 1 1-12 0c0-4 6-10 6-10Z',
  waves: 'M2 7c2-1.5 3.5-1.5 5 0s3 1.5 5 0 3.5-1.5 5 0 3.5 1.5 5 0M2 13c2-1.5 3.5-1.5 5 0s3 1.5 5 0 3.5-1.5 5 0 3.5 1.5 5 0M2 19c2-1.5 3.5-1.5 5 0s3 1.5 5 0 3.5-1.5 5 0 3.5 1.5 5 0',
  sun: 'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10ZM12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M19.1 4.9l-1.8 1.8M6.7 17.3l-1.8 1.8',
  globe: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM3 12h18M12 3c2.5 2.4 3.8 5.6 3.8 9S14.5 18.6 12 21c-2.5-2.4-3.8-5.6-3.8-9S9.5 5.4 12 3Z',
  pin: 'M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11ZM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 7.5V12l3 2',
  close: 'M6 6l12 12M18 6 6 18', arrowR: 'M5 12h14M13 6l6 6-6 6',
  sparkle: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8ZM18 14l.8 2.2L21 17l-2.2.8L18 20l-.8-2.2L15 17l2.2-.8Z',
  sail: 'M12 3v15M12 4c4 1 7 5 8 11H4c1-3 4-5 8-7M5 21h14',
  calPlus: 'M4 6.5h16v14H4zM4 10h16M8 3.5v4M16 3.5v4M12 13v5M9.5 15.5h5',
  heart: 'M12 20s-7-4.3-7-9.3A3.7 3.7 0 0 1 12 8a3.7 3.7 0 0 1 7-2.3c0 5-7 14.3-7 14.3Z',
  shield: 'M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3Z',
  flame: 'M12 21a6 6 0 0 0 6-6c0-4-3-5-3-8 0 0-4 2-4 6 0-1-2-2-2-2s-3 2-3 5a6 6 0 0 0 6 5Z',
  leaf: 'M5 19c0-8 6-14 14-14 0 8-6 14-14 14ZM5 19c3-3 6-5 9-6',
};

export function Icon({
  name, size = 22, stroke = 1.6, fill = false, color = 'currentColor', style,
}: {
  name: string; size?: number; stroke?: number; fill?: boolean; color?: string; style?: CSSProperties;
}) {
  const d = ICONS[name] ?? '';
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill ? color : 'none'}
      stroke={fill ? 'none' : color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d={d} />
    </svg>
  );
}

export function Ph({
  token = '--ph-sand', photo = null, w = 900, children, className = '', style = {}, h, grad = null,
}: {
  token?: string; photo?: string | null; w?: number; children?: ReactNode;
  className?: string; style?: CSSProperties; h?: number | string; grad?: string | null;
}) {
  const src = photo ? IMG(photo, w) : null;
  return (
    <div className={`ph ${className}`} style={{ background: `var(${token})`, height: h ?? '100%', borderRadius: 'inherit', overflow: 'hidden', ...style }}>
      {src && <img src={src} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', borderRadius: 'inherit' }} />}
      {grad && <div style={{ position: 'absolute', inset: 0, background: grad, pointerEvents: 'none' }} />}
      {children}
    </div>
  );
}

export function Button({
  variant = 'primary', block, children, onClick, icon, style, disabled,
}: {
  variant?: 'primary' | 'ghost' | 'secondary'; block?: boolean; children?: ReactNode;
  onClick?: () => void; icon?: string; style?: CSSProperties; disabled?: boolean;
}) {
  return (
    <button className={`btn btn-${variant} ${block ? 'btn-block' : ''}`} onClick={onClick} disabled={disabled}
      style={{ opacity: disabled ? 0.5 : 1, ...style }}>
      {icon && <Icon name={icon} size={18} />}
      {children}
    </button>
  );
}

export function Stars({ value, onChange, size = 34 }: { value: number; onChange?: (n: number) => void; size?: number }) {
  return (
    <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} onClick={() => onChange?.(n)} style={{ background: 'none', border: 0, cursor: 'pointer', padding: 2, lineHeight: 0 }}>
          <Icon name="star" size={size} fill={n <= value} color={n <= value ? 'var(--brand-accent)' : 'var(--line-2)'} />
        </button>
      ))}
    </div>
  );
}

export function Sheet({ open, onClose, children, maxH = '86%' }: { open: boolean; onClose: () => void; children: ReactNode; maxH?: string }) {
  const [mounted, setMounted] = useState(open);
  useEffect(() => { if (open) setMounted(true); }, [open]);
  if (!mounted) return null;
  return (
    <div onClick={onClose} style={{ position: 'absolute', inset: 0, zIndex: 60, display: 'flex', alignItems: 'flex-end' }}>
      <div className="anim-in" style={{ position: 'absolute', inset: 0, background: 'rgba(20,12,6,.42)', backdropFilter: 'blur(2px)', opacity: open ? 1 : 0, transition: 'opacity .3s' }}
        onAnimationEnd={() => { if (!open) setMounted(false); }} />
      <div onClick={(e) => e.stopPropagation()} className="no-scrollbar"
        style={{ position: 'relative', width: '100%', maxHeight: maxH, overflowY: 'auto', background: 'var(--surface)', borderTopLeftRadius: 'var(--r-xl)', borderTopRightRadius: 'var(--r-xl)', boxShadow: 'var(--sh-3)', transform: open ? 'translateY(0)' : 'translateY(100%)', transition: 'transform .34s cubic-bezier(.2,.8,.2,1)', paddingBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
          <div style={{ width: 42, height: 5, borderRadius: 99, background: 'var(--line-2)' }} />
        </div>
        {children}
      </div>
    </div>
  );
}

export function BottomNav({ active, onNav, unread = 0 }: { active: string; onNav: (id: string) => void; unread?: number }) {
  const { t } = useLang();
  const tabs = [
    { id: 'home', icon: 'home', label: t('nav_home'), badge: 0 },
    { id: 'explore', icon: 'explore', label: t('nav_explore'), badge: 0 },
    { id: 'events', icon: 'events', label: t('nav_events'), badge: 0 },
    { id: 'messages', icon: 'messages', label: t('nav_messages'), badge: unread },
    { id: 'profile', icon: 'profile', label: t('nav_profile'), badge: 0 },
  ];
  return (
    <nav style={{ position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 40, pointerEvents: 'none', display: 'flex', justifyContent: 'center', padding: '0 16px', paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 14px)' }}>
      <div style={{ pointerEvents: 'auto', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'color-mix(in srgb, var(--surface) 90%, transparent)', backdropFilter: 'blur(22px) saturate(1.5)', WebkitBackdropFilter: 'blur(22px) saturate(1.5)', border: '1px solid color-mix(in srgb, var(--line) 75%, transparent)', borderRadius: 'var(--r-pill)', boxShadow: '0 20px 44px -16px rgba(48,30,14,.40), 0 8px 18px -10px rgba(48,30,14,.22), 0 1px 0 rgba(255,255,255,.6) inset', padding: '8px 12px' }}>
        {tabs.map((tab) => {
          const on = active === tab.id;
          return (
            <button key={tab.id} onClick={() => onNav(tab.id)} aria-label={tab.label} title={tab.label}
              style={{ background: 'none', border: 0, cursor: 'pointer', position: 'relative', flexShrink: 0, width: 48, height: 48, borderRadius: '50%', display: 'grid', placeItems: 'center' }}>
              {on && <span aria-hidden="true" style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'var(--brand-primary)', boxShadow: '0 10px 20px -6px color-mix(in srgb, var(--brand-primary) 65%, transparent), 0 0 22px -2px color-mix(in srgb, var(--brand-primary) 45%, transparent)', animation: 'fadeIn .25s ease both' }} />}
              <span style={{ position: 'relative', display: 'grid', placeItems: 'center', transition: 'transform .2s cubic-bezier(.2,.8,.2,1)', transform: on ? 'translateY(-.5px)' : 'none' }}>
                <Icon name={tab.icon} size={22} stroke={on ? 2 : 1.7} color={on ? '#fff' : 'var(--ink-3)'} />
                {tab.badge > 0 && <span style={{ position: 'absolute', top: -8, right: -10, minWidth: 16, height: 16, padding: '0 4px', borderRadius: 99, background: 'var(--brand-secondary)', color: '#fff', fontSize: 9.5, fontWeight: 800, display: 'grid', placeItems: 'center', border: '2px solid var(--surface)' }}>{tab.badge}</span>}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// Real phones / the captive browser already show their own status bar (time, signal,
// battery), so the in-app mock status bar would be a redundant double bar. Render a
// thin spacer instead to preserve top breathing room.
export function StatusBar(_props: { light?: boolean }) {
  return <div style={{ height: 12, flexShrink: 0 }} />;
}

export function LangSwitch({ light = false, compact = false, langs }: { light?: boolean; compact?: boolean; langs?: string[] }) {
  const { lang, setLang } = useLang();
  const list = langs && langs.length ? AIDA_LANGS.filter((l) => langs.includes(l.code)) : AIDA_LANGS;
  return (
    <div style={{ display: 'flex', gap: 6, background: light ? 'rgba(255,255,255,.14)' : 'var(--surface-2)', padding: 5, borderRadius: 99, border: '1px solid ' + (light ? 'rgba(255,255,255,.25)' : 'var(--line)') }}>
      {list.map((l) => {
        const on = l.code === lang;
        return (
          <button key={l.code} onClick={() => setLang(l.code as Lang)}
            style={{ border: 0, cursor: 'pointer', borderRadius: 99, padding: compact ? '5px 9px' : '6px 12px', fontSize: 12, fontWeight: 800, letterSpacing: '.04em', transition: 'all .18s', background: on ? (light ? '#fff' : 'var(--brand-primary)') : 'transparent', color: on ? (light ? 'var(--brand-primary)' : '#fff') : (light ? 'rgba(255,255,255,.85)' : 'var(--ink-2)') }}>
            {l.flag}
          </button>
        );
      })}
    </div>
  );
}

export { Children, L };
