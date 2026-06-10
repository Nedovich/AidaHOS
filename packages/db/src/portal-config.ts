/**
 * Guest Portal configuration — shared between the admin composer (apps/web) and the guest
 * app (apps/guest). Persisted in `hotels.brand` jsonb as `{ draft, published }`. Localizable
 * text uses `Loc` objects ({en,tr,de,ru}); resolveLoc picks the guest's language with a
 * fallback to the portal default. No React/DB imports here so both apps can use it.
 */
export type PortalLang = 'en' | 'tr' | 'de' | 'ru';
export const PORTAL_LANGS: PortalLang[] = ['en', 'tr', 'de', 'ru'];
export type Loc = Partial<Record<PortalLang, string>>;

/** Pick a localized string: requested lang → portal default → first non-empty → ''. */
export function resolveLoc(loc: Loc | undefined, lang: PortalLang, def: PortalLang): string {
  if (!loc) return '';
  return loc[lang] ?? loc[def] ?? Object.values(loc).find((v) => v) ?? '';
}

/* ---------------- brand design constants (mirror the design handoff) ---------------- */
export const PORTAL_PALETTES = {
  primary: [
    { name: 'Terracotta', c: '#BC6A3C' }, { name: 'Teal', c: '#2E7C92' },
    { name: 'Rose', c: '#B65A6E' }, { name: 'Olive', c: '#7C6A3A' }, { name: 'Deep Teal', c: '#235E59' },
  ],
  secondary: [
    { name: 'Forest', c: '#2F5D4E' }, { name: 'Amber', c: '#C2912F' },
    { name: 'Navy', c: '#3E5170' }, { name: 'Brick', c: '#9C4A38' }, { name: 'Mustard', c: '#CCA23C' },
  ],
} as const;

const PORTAL_THEMES = {
  warm: { bg: '#F6F0E6', surface: '#FFFDF8', text: '#2A2620', text2: '#6F675B', text3: '#9A9183' },
  cool: { bg: '#EDF1F0', surface: '#FFFFFF', text: '#1E2422', text2: '#5E6A66', text3: '#94A09B' },
  editorial: { bg: '#FBFAF7', surface: '#FFFFFF', text: '#1A1916', text2: '#615E57', text3: '#9B978D' },
  evening: { bg: '#15110C', surface: '#201B15', text: '#F3ECE0', text2: '#B3A892', text3: '#7E7461' },
} as const;

const PORTAL_RADII = [{ r: 8, pill: 12 }, { r: 16, pill: 99 }, { r: 24, pill: 99 }];

export interface PortalBrand {
  primaryIdx: number;
  secondaryIdx: number;
  theme: 'warm' | 'cool' | 'editorial';
  evening: boolean;
  heading: 'serif' | 'sans';
  radius: number; // 0 | 1 | 2
}

export function portalPrimary(b: PortalBrand): string { return (PORTAL_PALETTES.primary[b.primaryIdx] ?? PORTAL_PALETTES.primary[0]).c; }
export function portalAccent(b: PortalBrand): string { return (PORTAL_PALETTES.secondary[b.secondaryIdx] ?? PORTAL_PALETTES.secondary[0]).c; }

/** The `--gp-*` brand variables for the phone surface (plain object; wrap as CSSProperties). */
export function portalCssVars(b: PortalBrand): Record<string, string> {
  const th = PORTAL_THEMES[b.evening ? 'evening' : b.theme] ?? PORTAL_THEMES.warm;
  const rad = PORTAL_RADII[b.radius] ?? PORTAL_RADII[1]!;
  const disp = b.heading === 'serif'
    ? 'var(--font-display, "Cormorant Garamond", Georgia, serif)'
    : 'var(--font-ui, "Manrope", system-ui, sans-serif)';
  return {
    '--gp-primary': portalPrimary(b),
    '--gp-accent2': portalAccent(b),
    '--gp-bg': th.bg,
    '--gp-surface': th.surface,
    '--gp-text': th.text,
    '--gp-text2': th.text2,
    '--gp-text3': th.text3,
    '--gp-statusink': th.text,
    '--gp-display': disp,
    '--gp-r': `${rad.r}px`,
    '--gp-rpill': `${rad.pill}px`,
  };
}

/* ---------------- config shape ---------------- */
export interface PortalLangs { enabled: PortalLang[]; default: PortalLang }
export interface PortalSplash {
  logoUrl: string | null;
  backgroundUrl: string | null;
  name: Loc;
  sub: Loc;
  tag: Loc;
  enter: Loc;
}
export interface PortalConfig {
  version: number;
  brand: PortalBrand;
  langs: PortalLangs;
  splash: PortalSplash;
}
export interface PortalStore { draft?: PortalConfig; published?: PortalConfig }

export function defaultPortalConfig(hotelName: string): PortalConfig {
  return {
    version: 1,
    brand: { primaryIdx: 0, secondaryIdx: 0, theme: 'warm', evening: false, heading: 'serif', radius: 1 },
    langs: { enabled: ['en', 'tr', 'de', 'ru'], default: 'en' },
    splash: {
      logoUrl: null,
      backgroundUrl: null,
      name: { en: hotelName || 'AIDA Bay' },
      sub: { en: 'RESORT & SPA' },
      tag: { en: 'Your stay, perfectly composed.', tr: 'Konaklamanız, kusursuz kurgulandı.' },
      enter: { en: 'Enter', tr: 'Giriş', de: 'Eintreten', ru: 'Войти' },
    },
  };
}

function isObj(v: unknown): v is Record<string, unknown> { return !!v && typeof v === 'object'; }

/** Safely read the `{draft, published}` store from a hotel's `brand` jsonb. */
export function parsePortalStore(brand: unknown): PortalStore {
  if (!isObj(brand)) return {};
  const store: PortalStore = {};
  if (isObj(brand.draft)) store.draft = brand.draft as unknown as PortalConfig;
  if (isObj(brand.published)) store.published = brand.published as unknown as PortalConfig;
  return store;
}

/** Resolve the config to use, filling any missing pieces from defaults (forward-compatible). */
export function withDefaults(cfg: Partial<PortalConfig> | undefined, hotelName: string): PortalConfig {
  const d = defaultPortalConfig(hotelName);
  if (!cfg) return d;
  return {
    version: cfg.version ?? d.version,
    brand: { ...d.brand, ...(cfg.brand ?? {}) },
    langs: { ...d.langs, ...(cfg.langs ?? {}) },
    splash: { ...d.splash, ...(cfg.splash ?? {}) },
  };
}
