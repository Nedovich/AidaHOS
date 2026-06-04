'use client';

import { Children, type ReactNode } from 'react';
import { L, useLang } from '@/lib/i18n';
import type { AidaEvent, Dining, ExploreCat, Experience, Spa } from '@/lib/data';
import { Icon, Ph } from './ui';

export function WeatherLine({ w }: { w: { temp: number; sea: number; cond: string } }) {
  const { t } = useLang();
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, color: 'var(--ink-2)', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', flexWrap: 'wrap' }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icon name="sun" size={15} color="var(--brand-accent)" /> {w.temp}° {t(w.cond)}</span>
      <span style={{ width: 3, height: 3, borderRadius: 99, background: 'var(--ink-3)' }} />
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icon name="waves" size={14} color="var(--brand-secondary)" /> {t('w_sea')} {w.sea}°</span>
    </span>
  );
}

export function RowHead({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '0 22px', marginBottom: 15 }}>
      <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 25, fontWeight: 600, color: 'var(--ink)', letterSpacing: '-.01em' }}>{title}</h3>
      {action && (
        <button onClick={onAction} style={{ background: 'none', border: 0, cursor: 'pointer', color: 'var(--ink-2)', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 3 }}>
          {action}<Icon name="chevR" size={14} stroke={2} />
        </button>
      )}
    </div>
  );
}

export function Rail({ children, peek = '78%' }: { children: ReactNode; peek?: string }) {
  return (
    <div className="no-scrollbar" style={{ display: 'flex', gap: 16, overflowX: 'auto', scrollSnapType: 'x mandatory', padding: '2px 22px 6px', scrollPaddingInline: '22px', WebkitOverflowScrolling: 'touch' }}>
      {Children.map(children, (c) => (
        <div style={{ scrollSnapAlign: 'start', flexShrink: 0, width: peek }}>{c}</div>
      ))}
      <div aria-hidden="true" style={{ flex: '0 0 6px' }} />
    </div>
  );
}

export function TonightHero({ item, onReserve }: { item: typeof import('@/lib/data').AIDA_TONIGHT; onReserve: () => void }) {
  const { lang, t } = useLang();
  return (
    <div style={{ padding: '0 22px', marginBottom: 34 }}>
      <button onClick={onReserve} style={{ all: 'unset', cursor: 'pointer', display: 'block', width: '100%' }}>
        <div style={{ position: 'relative', height: 420, borderRadius: 'var(--r-xl)', overflow: 'hidden', boxShadow: 'var(--sh-3)' }}>
          <Ph token={item.ph} photo={item.photo} w={1000} grad="linear-gradient(180deg, rgba(15,10,6,.12) 0%, rgba(15,10,6,.0) 32%, rgba(15,10,6,.78) 100%)" />
          <div style={{ position: 'absolute', left: 0, right: 0, top: 0, padding: '22px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', pointerEvents: 'none' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 800, letterSpacing: '.16em', textTransform: 'uppercase', color: '#fff', background: 'rgba(255,255,255,.16)', backdropFilter: 'blur(8px)', padding: '7px 13px', borderRadius: 99, border: '1px solid rgba(255,255,255,.3)' }}>
              <span style={{ width: 6, height: 6, borderRadius: 99, background: 'var(--brand-accent)' }} />{L(item.eyebrow, lang)}
            </span>
          </div>
          <div style={{ position: 'absolute', left: 24, right: 24, bottom: 24, pointerEvents: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600, color: 'var(--brand-accent)' }}>{item.time}</span>
              <span style={{ width: 4, height: 4, borderRadius: 99, background: 'rgba(255,255,255,.6)' }} />
              <span style={{ fontSize: 12.5, fontWeight: 700, color: 'rgba(255,255,255,.92)', display: 'flex', alignItems: 'center', gap: 4 }}><Icon name="pin" size={13} /> {L(item.place, lang)}</span>
            </div>
            <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 600, color: '#fff', lineHeight: 1.04, letterSpacing: '-.01em', textShadow: '0 2px 24px rgba(0,0,0,.5)' }}>{L(item.title, lang)}</h2>
            <p style={{ margin: '9px 0 16px', fontSize: 13.5, color: 'rgba(255,255,255,.86)', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{L(item.sub, lang)}</p>
            <span className="btn" style={{ background: '#fff', color: 'var(--ink)', pointerEvents: 'none', padding: '13px 22px' }}>
              {t('b_reserve_seat')} <Icon name="arrowR" size={17} stroke={2} />
            </span>
          </div>
        </div>
      </button>
    </div>
  );
}

export function DiningCard({ d, onOpen }: { d: Dining; onOpen: (d: Dining) => void }) {
  const { lang, t } = useLang();
  return (
    <button onClick={() => onOpen(d)} style={{ all: 'unset', cursor: 'pointer', display: 'block', width: '100%' }}>
      <div style={{ borderRadius: 'var(--r-lg)', overflow: 'hidden', background: 'var(--surface)', boxShadow: 'var(--sh-2)' }}>
        <div style={{ height: 200, position: 'relative' }}>
          <Ph token={d.ph} photo={d.photo} />
          <span style={{ position: 'absolute', top: 14, left: 14, fontSize: 11, fontWeight: 800, padding: '6px 11px', borderRadius: 99, color: '#fff', background: d.open ? 'rgba(60,110,75,.85)' : 'rgba(60,55,50,.78)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', gap: 6, border: '1px solid rgba(255,255,255,.25)' }}>
            <span style={{ width: 6, height: 6, borderRadius: 99, background: '#fff' }} />{d.open ? t('di_open') : t('di_closed')}
          </span>
        </div>
        <div style={{ padding: '16px 18px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
            <h4 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 600, color: 'var(--ink)', lineHeight: 1.05 }}>{d.name}</h4>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-3)', whiteSpace: 'nowrap' }}>{d.price}</span>
          </div>
          <div className="t-caption" style={{ marginTop: 5 }}>{L(d.cuisine, lang)}{d.open ? ` · ${t('di_until')} ${d.until}` : ''}</div>
        </div>
      </div>
    </button>
  );
}

export function SpaCard({ s, onOpen }: { s: Spa; onOpen: (s: Spa) => void }) {
  const { lang, t } = useLang();
  return (
    <button onClick={() => onOpen(s)} style={{ all: 'unset', cursor: 'pointer', display: 'block', width: '100%' }}>
      <div style={{ borderRadius: 'var(--r-lg)', overflow: 'hidden', background: 'var(--surface)', boxShadow: 'var(--sh-2)' }}>
        <div style={{ height: 190, position: 'relative' }}>
          <Ph token={s.ph} photo={s.photo} grad="linear-gradient(180deg, transparent 55%, rgba(15,10,6,.55) 100%)" />
          <span style={{ position: 'absolute', top: 14, left: 14, fontSize: 10.5, fontWeight: 800, letterSpacing: '.04em', padding: '6px 11px', borderRadius: 99, color: 'var(--ink)', background: 'rgba(255,255,255,.9)', backdropFilter: 'blur(6px)' }}>
            {s.kind === 'package' ? t('sp_packages') : t('sp_treatments')}
          </span>
          <div style={{ position: 'absolute', left: 16, right: 16, bottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', pointerEvents: 'none' }}>
            <span style={{ fontSize: 12.5, fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 5 }}><Icon name="clock" size={13} /> {s.min} {t('m_min')}</span>
            <span style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>{t('sp_from')} €{s.from}</span>
          </div>
        </div>
        <div style={{ padding: '15px 18px 17px' }}>
          <h4 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600, color: 'var(--ink)', lineHeight: 1.08 }}>{L(s.name, lang)}</h4>
          <p className="t-body" style={{ margin: '6px 0 0', fontSize: 13, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{L(s.desc, lang)}</p>
        </div>
      </div>
    </button>
  );
}

export function EventCard({ ev, onOpen, joined, onJoin, layout = 'rail' }: { ev: AidaEvent; onOpen: (e: AidaEvent) => void; joined?: boolean; onJoin?: (e: AidaEvent) => void; layout?: 'rail' | 'list' }) {
  const { lang } = useLang();
  return (
    <button onClick={() => onOpen(ev)} style={{ all: 'unset', cursor: 'pointer', display: 'block', width: '100%' }}>
      <div style={{ borderRadius: 'var(--r-lg)', overflow: 'hidden', background: 'var(--surface)', boxShadow: 'var(--sh-2)' }}>
        <div style={{ height: layout === 'list' ? 220 : 200, position: 'relative' }}>
          <Ph token={ev.ph} photo={ev.photo} grad="linear-gradient(180deg, transparent 45%, rgba(15,10,6,.7) 100%)" />
          <span style={{ position: 'absolute', top: 14, left: 14, fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 600, padding: '5px 13px', borderRadius: 99, color: 'var(--ink)', background: 'rgba(255,255,255,.92)', backdropFilter: 'blur(6px)' }}>{ev.time}</span>
          {onJoin && (
            <button onClick={(e) => { e.stopPropagation(); onJoin(ev); }} style={{ position: 'absolute', top: 12, right: 12, width: 38, height: 38, borderRadius: '50%', border: '1px solid rgba(255,255,255,.4)', background: joined ? 'var(--brand-primary)' : 'rgba(255,255,255,.18)', backdropFilter: 'blur(8px)', cursor: 'pointer', display: 'grid', placeItems: 'center', color: '#fff' }}>
              <Icon name={joined ? 'check' : 'plus'} size={18} stroke={2.2} />
            </button>
          )}
          <div style={{ position: 'absolute', left: 16, right: 16, bottom: 14, pointerEvents: 'none' }}>
            <h4 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 23, fontWeight: 600, color: '#fff', lineHeight: 1.06, textShadow: '0 2px 16px rgba(0,0,0,.4)' }}>{L(ev.title, lang)}</h4>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: 'rgba(255,255,255,.9)', marginTop: 5, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Icon name="pin" size={12} /> {L(ev.place, lang)}
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}

export function ExperienceCard({ x, onOpen }: { x: Experience; onOpen: (x: Experience) => void }) {
  const { lang } = useLang();
  return (
    <button onClick={() => onOpen(x)} style={{ all: 'unset', cursor: 'pointer', display: 'block', width: '100%' }}>
      <div style={{ position: 'relative', height: 300, borderRadius: 'var(--r-lg)', overflow: 'hidden', boxShadow: 'var(--sh-2)' }}>
        <Ph token="--ph-sand" photo={x.photo} grad="linear-gradient(180deg, rgba(15,10,6,.1) 30%, rgba(15,10,6,.72) 100%)" />
        <div style={{ position: 'absolute', left: 18, right: 18, bottom: 18, pointerEvents: 'none' }}>
          <span style={{ display: 'inline-block', fontSize: 10.5, fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--ink)', background: 'var(--brand-accent)', padding: '5px 11px', borderRadius: 99, marginBottom: 10 }}>{L(x.tag, lang)}</span>
          <h4 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 600, color: '#fff', lineHeight: 1.04, textShadow: '0 2px 18px rgba(0,0,0,.45)' }}>{L(x.title, lang)}</h4>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,.92)', marginTop: 6 }}>{L(x.meta, lang)}</div>
        </div>
      </div>
    </button>
  );
}

export function ExploreRow({ c, onOpen }: { c: ExploreCat; onOpen: (c: ExploreCat) => void }) {
  const { lang, t } = useLang();
  return (
    <button onClick={() => onOpen(c)} style={{ all: 'unset', cursor: 'pointer', display: 'block', width: '100%' }}>
      <div style={{ position: 'relative', height: 230, borderRadius: 'var(--r-lg)', overflow: 'hidden', boxShadow: 'var(--sh-2)' }}>
        <Ph token="--ph-sand" photo={c.photo} grad="linear-gradient(180deg, rgba(15,10,6,.05) 25%, rgba(15,10,6,.74) 100%)" />
        <div style={{ position: 'absolute', left: 20, right: 20, bottom: 20, pointerEvents: 'none' }}>
          <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 600, color: '#fff', lineHeight: 1, textShadow: '0 2px 18px rgba(0,0,0,.45)' }}>{t(c.tkey)}</h3>
          <p style={{ margin: '8px 0 0', fontSize: 13.5, color: 'rgba(255,255,255,.9)', lineHeight: 1.4, maxWidth: '94%' }}>{L(c.blurb, lang)}</p>
          <div style={{ marginTop: 8, fontSize: 12, fontWeight: 700, letterSpacing: '.04em', color: 'rgba(255,255,255,.78)', textTransform: 'uppercase' }}>{c.count} {t('ex_places')}</div>
        </div>
      </div>
    </button>
  );
}
