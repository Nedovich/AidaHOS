/** Admin surfaces ship TR/EN; the guest portal adds DE/RU. */
export const ADMIN_LOCALES = ['tr', 'en'] as const;
export const GUEST_LOCALES = ['tr', 'en', 'de', 'ru'] as const;

export type AdminLocale = (typeof ADMIN_LOCALES)[number];
export type GuestLocale = (typeof GUEST_LOCALES)[number];

export const DEFAULT_ADMIN_LOCALE: AdminLocale = 'tr';
export const DEFAULT_GUEST_LOCALE: GuestLocale = 'en';

/** A localized string keyed by locale, mirroring the design prototype's L() helper. */
export type Localized<L extends string = GuestLocale> = Record<L, string>;

export function pick<L extends string>(value: Localized<L>, locale: L, fallback: L): string {
  return value[locale] ?? value[fallback];
}
