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

/** Localized content for a single guest popup send (survey/event/announcement). */
export interface PopupContent {
  title: string;
  description: string;
  buttonLabel: string;
}
export type PopupContentMap = Partial<Record<PortalLang, PopupContent>>;

/** Pick localized popup content the same way resolveLoc picks a string. */
export function resolvePopupContent(map: PopupContentMap | undefined, lang: PortalLang, def: PortalLang): PopupContent {
  const empty: PopupContent = { title: '', description: '', buttonLabel: '' };
  if (!map) return empty;
  return map[lang] ?? map[def] ?? Object.values(map).find((v) => v) ?? empty;
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
/** One titled section of the user agreement (heading + body), each localized. */
export interface PortalAgreementSection { heading: Loc; body: Loc }
/** The multilingual user agreement the hotel can author/update. When omitted, the guest
 * app falls back to its built-in default agreement. */
export interface PortalAgreement {
  title: Loc;
  updated: Loc; // free-text "Updated …" line per language
  intro: Loc;
  sections: PortalAgreementSection[];
}

/** Sign-in screen. "Guest" mode (room + DOB) is always available and is the real system;
 * "User" and "Free Wi-Fi" tabs are optional mock modes the hotel can show. */
export interface PortalLogin {
  userMode: boolean;
  freeMode: boolean;
  privacy: boolean; // show the "data stays private" footer
  help: Loc; // "Need help signing in?" link text (empty = hidden)
  agreement?: PortalAgreement; // custom multilingual TOS; omitted = built-in default
}

/** A starting-point agreement the admin can load and edit (EN/TR seeded; translate the rest). */
export const DEFAULT_AGREEMENT: PortalAgreement = {
  title: { en: 'User Agreement', tr: 'Kullanıcı Sözleşmesi', de: 'Nutzungsvereinbarung', ru: 'Пользовательское соглашение' },
  updated: { en: 'Last updated June 2026', tr: 'Son güncelleme: Haziran 2026' },
  intro: {
    en: 'By accessing the application and the resort’s network, you agree to use the service responsibly and in accordance with the terms below.',
    tr: 'Uygulamaya ve resort ağına erişerek, hizmeti sorumlu bir şekilde ve aşağıdaki koşullara uygun olarak kullanmayı kabul edersiniz.',
  },
  sections: [
    {
      heading: { en: '1 · Use of Service', tr: '1 · Hizmetin Kullanımı' },
      body: {
        en: 'The network and app are provided for the personal use of in-house guests during their stay. Access may be limited to the reservation period.',
        tr: 'Ağ ve uygulama, misafirlerin konaklamaları süresince kişisel kullanımı için sunulur. Erişim, rezervasyon süresiyle sınırlı olabilir.',
      },
    },
    {
      heading: { en: '2 · Privacy', tr: '2 · Gizlilik' },
      body: {
        en: 'The information you provide at sign-in is used only to verify your stay and deliver the service. It is handled in line with the hotel’s privacy policy.',
        tr: 'Girişte verdiğiniz bilgiler yalnızca konaklamanızı doğrulamak ve hizmeti sunmak için kullanılır ve otelin gizlilik politikasına uygun olarak işlenir.',
      },
    },
    {
      heading: { en: '3 · Acceptable Conduct', tr: '3 · Kabul Edilebilir Kullanım' },
      body: {
        en: 'You agree not to use the network for unlawful activity, to disrupt other guests, or to attempt unauthorised access to resort systems.',
        tr: 'Ağı yasa dışı faaliyetler için kullanmamayı, diğer misafirleri rahatsız etmemeyi veya resort sistemlerine yetkisiz erişim girişiminde bulunmamayı kabul edersiniz.',
      },
    },
    {
      heading: { en: '4 · Liability', tr: '4 · Sorumluluk' },
      body: {
        en: 'The service is provided on a best-effort basis. The resort is not liable for interruptions, data loss, or third-party content accessed through the network.',
        tr: 'Hizmet, mümkün olan en iyi çaba esasına göre sunulur. Resort; kesintilerden, veri kaybından veya ağ üzerinden erişilen üçüncü taraf içeriklerinden sorumlu değildir.',
      },
    },
  ],
};
export interface PortalConfig {
  version: number;
  brand: PortalBrand;
  langs: PortalLangs;
  splash: PortalSplash;
  login: PortalLogin;
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
    login: {
      userMode: true,
      freeMode: true,
      privacy: true,
      help: { en: 'Need help signing in?', tr: 'Giriş için yardım ister misiniz?' },
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
    login: { ...d.login, ...(cfg.login ?? {}) },
  };
}
