import type { CSSProperties } from 'react';

/* ============================================================
   Guest Portal Composer — state, design constants, reducer.
   Ported from the design handoff (assets/screens/portal.js → PORTAL.S).
   Mock data only; persistence to the hotel comes in a later pass.
   ============================================================ */

export type ScreenId = 'splash' | 'login' | 'home' | 'explore' | 'events';
export type InspTab = 'edit' | 'brand' | 'langs';
export type LangCode = 'en' | 'tr' | 'de' | 'ru';
export type SectionType =
  | 'greeting' | 'weather' | 'spotlight' | 'carousel'
  | 'banner' | 'feedback' | 'quickactions' | 'offer' | 'eventstrip';

export interface QuickItem { l: string; i: string }

export interface Section {
  id: string;
  type: SectionType;
  icon: string;
  name: string;
  on: boolean;
  locked?: boolean;
  kind?: 'dining' | 'spa' | 'exp';
  source?: string;
  name2?: string;
  showRoom?: boolean;
  kicker?: string;
  title?: string;
  time?: string;
  venue?: string;
  desc?: string;
  cta?: string;
  sub?: string;
  items?: QuickItem[];
}

export interface Brand {
  tenant: 'aida' | 'azure';
  primaryIdx: number;
  secondaryIdx: number;
  theme: 'warm' | 'cool' | 'editorial';
  evening: boolean;
  heading: 'serif' | 'sans';
  radius: number; // 0 | 1 | 2
  lang: LangCode;
}

export interface PortalState {
  screen: ScreenId;
  tab: InspTab;
  sel: string | null;
  libOpen: boolean;
  brand: Brand;
  langs: Record<LangCode, boolean>;
  login: { method: 'room' | 'email' | 'code'; privacy: boolean };
  splash: { name: string; sub: string; tag: string; enter: string };
  sections: Section[];
  eventsFilter: 'today' | 'upcoming' | 'all';
}

/* ---------------- design constants ---------------- */
export const PALETTES = {
  primary: [
    { name: 'Terracotta', c: '#BC6A3C' }, { name: 'Teal', c: '#2E7C92' },
    { name: 'Rose', c: '#B65A6E' }, { name: 'Olive', c: '#7C6A3A' }, { name: 'Deep Teal', c: '#235E59' },
  ],
  secondary: [
    { name: 'Forest', c: '#2F5D4E' }, { name: 'Amber', c: '#C2912F' },
    { name: 'Navy', c: '#3E5170' }, { name: 'Brick', c: '#9C4A38' }, { name: 'Mustard', c: '#CCA23C' },
  ],
} as const;

const THEMES = {
  warm: { bg: '#F6F0E6', surface: '#FFFDF8', text: '#2A2620', text2: '#6F675B', text3: '#9A9183' },
  cool: { bg: '#EDF1F0', surface: '#FFFFFF', text: '#1E2422', text2: '#5E6A66', text3: '#94A09B' },
  editorial: { bg: '#FBFAF7', surface: '#FFFFFF', text: '#1A1916', text2: '#615E57', text3: '#9B978D' },
  evening: { bg: '#15110C', surface: '#201B15', text: '#F3ECE0', text2: '#B3A892', text3: '#7E7461' },
} as const;

const RADII = [{ r: 8, pill: 12 }, { r: 16, pill: 99 }, { r: 24, pill: 99 }];

export const TENANTS: Record<Brand['tenant'], { name: string; sub: string; short: string; primary: number }> = {
  aida: { name: 'AIDA Bay', sub: 'RESORT & SPA', short: 'AB', primary: 0 },
  azure: { name: 'Azure Sands', sub: 'BEACH RESORT', short: 'AS', primary: 1 },
};

export function primaryColor(b: Brand) { return (PALETTES.primary[b.primaryIdx] ?? PALETTES.primary[0]).c; }
export function accentColor(b: Brand) { return (PALETTES.secondary[b.secondaryIdx] ?? PALETTES.secondary[0]).c; }

/** Computes the `--gp-*` brand vars applied inline on the phone `.gp-screen` (design gpStyle). */
export function gpStyleVars(b: Brand): CSSProperties {
  const th = THEMES[b.evening ? 'evening' : b.theme];
  const rad = RADII[b.radius] ?? RADII[1]!;
  const disp = b.heading === 'serif'
    ? 'var(--font-display, "Cormorant Garamond", Georgia, serif)'
    : 'var(--font-ui, "Manrope", system-ui, sans-serif)';
  return {
    '--gp-primary': primaryColor(b),
    '--gp-accent2': accentColor(b),
    '--gp-bg': th.bg,
    '--gp-surface': th.surface,
    '--gp-text': th.text,
    '--gp-text2': th.text2,
    '--gp-text3': th.text3,
    '--gp-statusink': th.text,
    '--gp-display': disp,
    '--gp-r': `${rad.r}px`,
    '--gp-rpill': `${rad.pill}px`,
    fontFamily: 'var(--font-ui, "Manrope", system-ui, sans-serif)',
  } as CSSProperties;
}

export function defaultSections(): Section[] {
  return [
    { id: 'greeting', type: 'greeting', icon: 'users', name: 'Greeting header', on: true, locked: true, name2: 'Elif', showRoom: true },
    { id: 'weather', type: 'weather', icon: 'sun', name: 'Weather strip', on: true },
    { id: 'spotlight', type: 'spotlight', icon: 'star', name: 'Tonight spotlight', on: true, source: 'event',
      kicker: 'Tonight at the resort', title: 'Sunset Jazz on the Terrace', time: '21:00', venue: 'Horizon Terrace',
      desc: 'A live quartet under the stars, with signature cocktails from our mixologist.', cta: 'Reserve your seat' },
    { id: 'dining', type: 'carousel', kind: 'dining', icon: 'utensils', name: 'Dining for you', on: true, title: 'Dining for you', source: 'dining' },
    { id: 'spa', type: 'carousel', kind: 'spa', icon: 'spa', name: 'Spa & wellness', on: true, title: 'Spa & wellness', source: 'spa' },
    { id: 'experiences', type: 'carousel', kind: 'exp', icon: 'sparkles', name: 'Experiences', on: true, title: 'Experiences', source: 'experiences' },
    { id: 'concierge', type: 'banner', icon: 'bell', name: 'Concierge banner', on: true, title: 'Your concierge', sub: 'Anything you need, a tap away' },
    { id: 'feedback', type: 'feedback', icon: 'heart', name: 'Feedback card', on: true, title: 'How is your stay so far?', sub: 'A moment of your time helps us perfect it.', cta: 'Share feedback' },
    { id: 'quick', type: 'quickactions', icon: 'bolt', name: 'Quick actions', on: false,
      items: [{ l: 'Room service', i: 'utensils' }, { l: 'Housekeeping', i: 'leaf' }, { l: 'Concierge', i: 'bell' }, { l: 'Spa', i: 'spa' }] },
    { id: 'offer', type: 'offer', icon: 'gift', name: 'Offer banner', on: false, title: '20% off Thalasso rituals', desc: 'This week only for Sea View guests.' },
    { id: 'events', type: 'eventstrip', icon: 'calendar', name: 'Upcoming events', on: false, title: 'This week', source: 'events' },
  ];
}

export function initialState(): PortalState {
  return {
    screen: 'home', tab: 'edit', sel: 'spotlight', libOpen: false,
    brand: { tenant: 'aida', primaryIdx: 0, secondaryIdx: 0, theme: 'warm', evening: false, heading: 'serif', radius: 1, lang: 'en' },
    langs: { en: true, tr: true, de: true, ru: false },
    login: { method: 'room', privacy: true },
    splash: { name: 'AIDA Bay', sub: 'RESORT & SPA', tag: 'Your stay, perfectly composed.', enter: 'Enter' },
    sections: defaultSections(),
    eventsFilter: 'today',
  };
}

export function typeLabel(t: SectionType, s?: Section): string {
  if (t === 'carousel') return ({ dining: 'Dining carousel', spa: 'Spa carousel', exp: 'Experiences' } as Record<string, string>)[(s && s.kind) || 'dining'] ?? 'Carousel';
  return ({
    greeting: 'Personalized header', weather: 'Live weather', spotlight: 'Featured event',
    quickactions: 'Action grid', offer: 'Promo banner', eventstrip: 'Event list',
    banner: 'Concierge banner', feedback: 'Feedback prompt',
  } as Record<string, string>)[t] || t;
}

/* ---------------- reducer ---------------- */
export type Action =
  | { t: 'screen'; screen: ScreenId }
  | { t: 'tab'; tab: InspTab }
  | { t: 'select'; id: string }
  | { t: 'toggleLib' }
  | { t: 'enable'; id: string }
  | { t: 'disable'; id: string }
  | { t: 'field'; id: string; key: keyof Section; val: string | boolean }
  | { t: 'toggleField'; id: string; key: keyof Section }
  | { t: 'splash'; key: keyof PortalState['splash']; val: string }
  | { t: 'login'; key: keyof PortalState['login']; val: string | boolean }
  | { t: 'brand'; key: keyof Brand; val: string | number | boolean }
  | { t: 'lang'; l: LangCode }
  | { t: 'defaultLang'; l: LangCode }
  | { t: 'eventsFilter'; f: PortalState['eventsFilter'] }
  | { t: 'quickItem'; id: string; idx: number; val: string }
  | { t: 'reorder'; fromId: string; toId: string; below: boolean };

const patchSec = (s: PortalState, id: string, patch: Partial<Section>): Section[] =>
  s.sections.map((sec) => (sec.id === id ? { ...sec, ...patch } : sec));

export function reducer(s: PortalState, a: Action): PortalState {
  switch (a.t) {
    case 'screen': return { ...s, screen: a.screen, tab: 'edit' };
    case 'tab': return { ...s, tab: a.tab };
    case 'select': return { ...s, sel: a.id, tab: 'edit' };
    case 'toggleLib': return { ...s, libOpen: !s.libOpen };
    case 'enable': return { ...s, sections: patchSec(s, a.id, { on: true }), sel: a.id, libOpen: false, tab: 'edit' };
    case 'disable': {
      const sec = s.sections.find((x) => x.id === a.id);
      if (!sec || sec.locked) return s;
      return { ...s, sections: patchSec(s, a.id, { on: false }), sel: s.sel === a.id ? null : s.sel };
    }
    case 'field': return { ...s, sections: patchSec(s, a.id, { [a.key]: a.val } as Partial<Section>) };
    case 'toggleField': {
      const sec = s.sections.find((x) => x.id === a.id);
      if (!sec) return s;
      return { ...s, sections: patchSec(s, a.id, { [a.key]: !sec[a.key] } as Partial<Section>) };
    }
    case 'splash': return { ...s, splash: { ...s.splash, [a.key]: a.val } };
    case 'login': return { ...s, login: { ...s.login, [a.key]: a.val } };
    case 'brand': {
      if (a.key === 'tenant') {
        const tn = TENANTS[a.val as Brand['tenant']];
        return { ...s, brand: { ...s.brand, tenant: a.val as Brand['tenant'], primaryIdx: tn.primary }, splash: { ...s.splash, name: tn.name, sub: tn.sub } };
      }
      return { ...s, brand: { ...s.brand, [a.key]: a.val } };
    }
    case 'lang': {
      const langs = { ...s.langs, [a.l]: !s.langs[a.l] };
      let lang = s.brand.lang;
      if (!langs[lang]) lang = (Object.keys(langs) as LangCode[]).find((k) => langs[k]) || 'en';
      return { ...s, langs, brand: { ...s.brand, lang } };
    }
    case 'defaultLang': return s.langs[a.l] ? { ...s, brand: { ...s.brand, lang: a.l } } : s;
    case 'eventsFilter': return { ...s, eventsFilter: a.f };
    case 'quickItem': {
      const sec = s.sections.find((x) => x.id === a.id);
      if (!sec || !sec.items) return s;
      const items = sec.items.map((it, i) => (i === a.idx ? { ...it, l: a.val } : it));
      return { ...s, sections: patchSec(s, a.id, { items }) };
    }
    case 'reorder': {
      const { fromId, toId, below } = a;
      if (fromId === toId) return s;
      const arr = [...s.sections];
      const from = arr.findIndex((x) => x.id === fromId);
      if (from < 0) return s;
      const [moved] = arr.splice(from, 1);
      if (!moved) return s;
      let to = arr.findIndex((x) => x.id === toId);
      if (below) to += 1;
      if (to < 1) to = 1; // never above the locked greeting
      arr.splice(to, 0, moved);
      return { ...s, sections: arr, sel: fromId };
    }
    default: return s;
  }
}
