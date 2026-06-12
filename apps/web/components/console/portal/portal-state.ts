import type { CSSProperties } from 'react';
import {
  DEFAULT_AGREEMENT, PORTAL_LANGS, PORTAL_PALETTES, portalCssVars,
  type Loc, type PortalAgreement, type PortalBrand, type PortalConfig, type PortalLang, type PortalLogin, type PortalSplash,
} from '@aidahos/db/portal-config';

/* ============================================================
   Guest Portal Composer — working UI state + reducer.
   Persisted shape lives in @aidahos/db (PortalConfig); this adds editor-only UI fields
   (selected screen/section, active edit language, library open) and maps to/from it.
   ============================================================ */

export type ScreenId = 'splash' | 'login' | 'home' | 'explore' | 'events';
export type InspTab = 'edit' | 'brand' | 'langs';
export type SectionType =
  | 'greeting' | 'weather' | 'spotlight' | 'carousel'
  | 'banner' | 'feedback' | 'quickactions' | 'offer' | 'eventstrip';

export type { PortalLang, Loc };
export const PALETTES = PORTAL_PALETTES;

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

export interface PortalState {
  screen: ScreenId;
  tab: InspTab;
  sel: string | null;
  libOpen: boolean;
  /** Language currently being edited / previewed (NOT the portal default). */
  editLang: PortalLang;
  brand: PortalBrand;
  langs: { enabled: Record<PortalLang, boolean>; default: PortalLang };
  login: PortalLogin;
  splash: PortalSplash;
  sections: Section[];
  eventsFilter: 'today' | 'upcoming' | 'all';
}

/** Wraps the shared `--gp-*` vars as React CSSProperties for the phone surface. */
export function gpStyleVars(b: PortalBrand): CSSProperties {
  return { ...portalCssVars(b), fontFamily: 'var(--font-ui, "Manrope", system-ui, sans-serif)' } as CSSProperties;
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

/** Build editor state from a persisted config (the admin draft). */
export function stateFromConfig(cfg: PortalConfig): PortalState {
  const enabled = Object.fromEntries(PORTAL_LANGS.map((l) => [l, cfg.langs.enabled.includes(l)])) as Record<PortalLang, boolean>;
  return {
    screen: 'splash', tab: 'edit', sel: 'spotlight', libOpen: false,
    editLang: cfg.langs.default,
    brand: { ...cfg.brand },
    langs: { enabled, default: cfg.langs.default },
    login: { ...cfg.login },
    splash: { ...cfg.splash },
    sections: defaultSections(),
    eventsFilter: 'today',
  };
}

/** Extract the persisted config from editor state (UI-only fields dropped). */
export function configFromState(s: PortalState): PortalConfig {
  const enabled = PORTAL_LANGS.filter((l) => s.langs.enabled[l]);
  return {
    version: 1,
    brand: { ...s.brand },
    langs: { enabled: enabled.length ? enabled : ['en'], default: s.langs.default },
    splash: { ...s.splash },
    login: { ...s.login },
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
  | { t: 'editLang'; lang: PortalLang }
  | { t: 'splashText'; key: 'name' | 'sub' | 'tag' | 'enter'; val: string }
  | { t: 'splashUrl'; key: 'logoUrl' | 'backgroundUrl'; val: string }
  | { t: 'loginToggle'; key: 'userMode' | 'freeMode' | 'privacy' }
  | { t: 'loginHelp'; val: string }
  | { t: 'agreeLoad' }
  | { t: 'agreeClear' }
  | { t: 'agreeField'; field: 'title' | 'updated' | 'intro'; val: string }
  | { t: 'agreeSection'; idx: number; field: 'heading' | 'body'; val: string }
  | { t: 'agreeAdd' }
  | { t: 'agreeRemove'; idx: number }
  | { t: 'brand'; key: keyof PortalBrand; val: string | number | boolean }
  | { t: 'lang'; l: PortalLang }
  | { t: 'defaultLang'; l: PortalLang }
  | { t: 'eventsFilter'; f: PortalState['eventsFilter'] }
  | { t: 'quickItem'; id: string; idx: number; val: string }
  | { t: 'reorder'; fromId: string; toId: string; below: boolean }
  | { t: 'replace'; state: PortalState };

const patchSec = (s: PortalState, id: string, patch: Partial<Section>): Section[] =>
  s.sections.map((sec) => (sec.id === id ? { ...sec, ...patch } : sec));

export function reducer(s: PortalState, a: Action): PortalState {
  switch (a.t) {
    case 'replace': return a.state;
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
    case 'editLang': return { ...s, editLang: a.lang };
    case 'splashText': return { ...s, splash: { ...s.splash, [a.key]: { ...s.splash[a.key], [s.editLang]: a.val } } };
    case 'splashUrl': return { ...s, splash: { ...s.splash, [a.key]: a.val || null } };
    case 'loginToggle': return { ...s, login: { ...s.login, [a.key]: !s.login[a.key] } };
    case 'loginHelp': return { ...s, login: { ...s.login, help: { ...s.login.help, [s.editLang]: a.val } } };
    case 'agreeLoad': return { ...s, login: { ...s.login, agreement: JSON.parse(JSON.stringify(DEFAULT_AGREEMENT)) as PortalAgreement } };
    case 'agreeClear': return { ...s, login: { ...s.login, agreement: undefined } };
    case 'agreeField': {
      const ag = s.login.agreement;
      if (!ag) return s;
      return { ...s, login: { ...s.login, agreement: { ...ag, [a.field]: { ...ag[a.field], [s.editLang]: a.val } } } };
    }
    case 'agreeSection': {
      const ag = s.login.agreement;
      if (!ag) return s;
      const sections = ag.sections.map((sec, i) => (i === a.idx ? { ...sec, [a.field]: { ...sec[a.field], [s.editLang]: a.val } } : sec));
      return { ...s, login: { ...s.login, agreement: { ...ag, sections } } };
    }
    case 'agreeAdd': {
      const ag = s.login.agreement;
      if (!ag) return s;
      return { ...s, login: { ...s.login, agreement: { ...ag, sections: [...ag.sections, { heading: {}, body: {} }] } } };
    }
    case 'agreeRemove': {
      const ag = s.login.agreement;
      if (!ag) return s;
      return { ...s, login: { ...s.login, agreement: { ...ag, sections: ag.sections.filter((_, i) => i !== a.idx) } } };
    }
    case 'brand': return { ...s, brand: { ...s.brand, [a.key]: a.val } };
    case 'lang': {
      const enabled = { ...s.langs.enabled, [a.l]: !s.langs.enabled[a.l] };
      let def = s.langs.default;
      let editLang = s.editLang;
      if (!enabled[def]) def = PORTAL_LANGS.find((k) => enabled[k]) || 'en';
      if (!enabled[editLang]) editLang = def;
      return { ...s, langs: { enabled, default: def }, editLang };
    }
    case 'defaultLang': return s.langs.enabled[a.l] ? { ...s, langs: { ...s.langs, default: a.l } } : s;
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
      if (to < 1) to = 1;
      arr.splice(to, 0, moved);
      return { ...s, sections: arr, sel: fromId };
    }
    default: return s;
  }
}
